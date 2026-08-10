#!/usr/bin/env node
// scripts/reconcile-fotos.mjs
//
// Relatório read-only (por padrão) comparando os buckets fotos-servico /
// fotos-finais com as tabelas fotos_servico / fotos_finais no banco.
//
// Contexto completo em /home/joaosousa/.claude/plans/preciso-realizar-uma-an-lise-curious-raccoon.md
// (Fase E). Categorias reportadas:
//
//   ORPHAN_OBJECT     objeto no bucket sem linha correspondente no banco
//   MISSING_OBJECT    storage_path da linha aponta para um objeto inexistente
//   DUPLICATE_PATH    duas ou mais linhas apontam para o mesmo storage_path
//   EMPTY_PATH        storage_path em branco
//   PREFIX_MISMATCH   storage_path não começa com o owner_id esperado da linha
//
// Uso:
//   node --env-file=.env.local scripts/reconcile-fotos.mjs                              # só relatório
//   node --env-file=.env.local scripts/reconcile-fotos.mjs --table=fotos_servico
//   node --env-file=.env.local scripts/reconcile-fotos.mjs \
//        --delete-orphans --yes-i-am-sure --older-than-days=30                          # exclusão real
//
// A exclusão exige as TRÊS flags juntas. `--older-than-days` tem padrão 7 e
// mínimo 1 — um objeto recém-enviado cujo insert ainda está em voo é
// indistinguível de um órfão, então nunca é seguro excluir "idade 0".
// Antes de excluir, cada candidato é re-checado no banco; se qualquer
// MISSING_OBJECT ou DUPLICATE_PATH persistir, a exclusão inteira é abortada.

import { createClient } from "@supabase/supabase-js";
import { mkdirSync, appendFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// ─── CLI args ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
function flag(name, def = false) {
  return args.includes(`--${name}`) ? true : def;
}
function opt(name, def) {
  const prefix = `--${name}=`;
  const found = args.find((a) => a.startsWith(prefix));
  return found ? found.slice(prefix.length) : def;
}

const ONLY_TABLE = opt("table", null);
const LOG_DIR = opt("log-dir", "./.migracao-logs");
const DELETE_ORPHANS = flag("delete-orphans", false);
const CONFIRMED = flag("yes-i-am-sure", false);
const OLDER_THAN_DAYS = Math.max(1, parseInt(opt("older-than-days", "7"), 10) || 7);

const WILL_DELETE = DELETE_ORPHANS && CONFIRMED;
if (DELETE_ORPHANS && !CONFIRMED) {
  console.error("--delete-orphans exige também --yes-i-am-sure. Nada será excluído.");
  process.exit(1);
}

// ─── Setup ───────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ex.: node --env-file=.env.local ...).\n" +
      "NUNCA commite a service_role key.",
  );
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const RUN_ID = new Date().toISOString().replace(/[:.]/g, "-");
mkdirSync(LOG_DIR, { recursive: true });
const ndjsonPath = join(LOG_DIR, `reconcile-${RUN_ID}.ndjson`);
const summaryPath = join(LOG_DIR, `reconcile-${RUN_ID}.summary.json`);

function logEntry(entry) {
  appendFileSync(ndjsonPath, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + "\n");
}

const TABLES = [
  { table: "fotos_servico", bucket: "fotos-servico", owner: "servico_id" },
  { table: "fotos_finais", bucket: "fotos-finais", owner: "ocorrencia_id" },
].filter((t) => !ONLY_TABLE || t.table === ONLY_TABLE);

// ─── Listagem recursiva do bucket ─────────────────────────────────────────────
// storage.list() não é recursivo: pastas vêm como entradas com id === null.
// sortBy é obrigatório para paginação por offset ser estável.

async function listAll(bucket, prefix = "") {
  const out = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await db.storage
      .from(bucket)
      .list(prefix, { limit: 1000, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw new Error(`list(${bucket}, "${prefix}"): ${error.message}`);
    if (!data || data.length === 0) break;
    for (const e of data) {
      const full = prefix ? `${prefix}/${e.name}` : e.name;
      if (e.id === null) {
        out.push(...(await listAll(bucket, full)));
      } else {
        out.push({ path: full, size: e.metadata?.size ?? null, createdAt: e.created_at ?? null });
      }
    }
    if (data.length < 1000) break;
  }
  return out;
}

// ─── Leitura do banco (keyset) ──────────────────────────────────────────────

async function fetchAllRows(table, owner) {
  const rows = [];
  let cursor = "00000000-0000-0000-0000-000000000000";
  for (;;) {
    const { data, error } = await db
      .from(table)
      .select(`id, storage_path, ${owner}`)
      .gt("id", cursor)
      .order("id", { ascending: true })
      .limit(1000);
    if (error) throw new Error(`select ${table}: ${error.message}`);
    if (!data || data.length === 0) break;
    rows.push(...data);
    cursor = data[data.length - 1].id;
    if (data.length < 1000) break;
  }
  return rows;
}

// ─── Reconciliação por tabela ────────────────────────────────────────────────

const report = {
  ORPHAN_OBJECT: [],
  MISSING_OBJECT: [],
  DUPLICATE_PATH: [],
  EMPTY_PATH: [],
  PREFIX_MISMATCH: [],
};

async function reconcileTable({ table, bucket, owner }) {
  console.log(`\n=== ${table} (bucket ${bucket}) ===`);

  const [objects, rows] = await Promise.all([listAll(bucket), fetchAllRows(table, owner)]);

  const objectSet = new Map(objects.map((o) => [o.path, o]));
  const pathToIds = new Map();

  for (const row of rows) {
    const path = row.storage_path ?? "";

    if (path.trim() === "") {
      report.EMPTY_PATH.push({ table, id: row.id });
      logEntry({ table, id: row.id, category: "EMPTY_PATH" });
      continue;
    }

    if (!path.startsWith(`${row[owner]}/`)) {
      report.PREFIX_MISMATCH.push({ table, id: row.id, path, expectedOwner: row[owner] });
      logEntry({ table, id: row.id, category: "PREFIX_MISMATCH", path });
    }

    if (!objectSet.has(path)) {
      report.MISSING_OBJECT.push({ table, id: row.id, path });
      logEntry({ table, id: row.id, category: "MISSING_OBJECT", path });
    }

    if (!pathToIds.has(path)) pathToIds.set(path, []);
    pathToIds.get(path).push(row.id);
  }

  for (const [path, ids] of pathToIds) {
    if (ids.length > 1) {
      report.DUPLICATE_PATH.push({ table, path, ids });
      logEntry({ table, category: "DUPLICATE_PATH", path, ids });
    }
  }

  const referencedPaths = new Set(rows.map((r) => r.storage_path).filter(Boolean));
  for (const obj of objects) {
    if (!referencedPaths.has(obj.path)) {
      report.ORPHAN_OBJECT.push({ table, bucket, path: obj.path, size: obj.size, createdAt: obj.createdAt });
      logEntry({ table, category: "ORPHAN_OBJECT", bucket, path: obj.path, createdAt: obj.createdAt });
    }
  }
}

for (const t of TABLES) {
  await reconcileTable(t);
}

// ─── Resumo ────────────────────────────────────────────────────────────────────

console.log("\n=== Resumo ===");
for (const [category, items] of Object.entries(report)) {
  console.log(`${category}: ${items.length}`);
}

writeFileSync(summaryPath, JSON.stringify(report, null, 2));
console.log(`\nLog: ${ndjsonPath}`);
console.log(`Resumo: ${summaryPath}`);

// ─── Exclusão de órfãos (opcional, guardada) ──────────────────────────────────

if (!WILL_DELETE) {
  if (report.ORPHAN_OBJECT.length > 0) {
    console.log(
      `\n${report.ORPHAN_OBJECT.length} objeto(s) órfão(s) encontrados. Para excluir: ` +
        `--delete-orphans --yes-i-am-sure --older-than-days=${OLDER_THAN_DAYS}`,
    );
  }
  process.exit(report.MISSING_OBJECT.length > 0 || report.DUPLICATE_PATH.length > 0 ? 2 : 0);
}

// Condição de aborto global: nunca excluir enquanto houver referências quebradas
// ou paths duplicados pendentes — um dos dois pode significar que a análise de
// órfãos está incompleta ou inconsistente.
if (report.MISSING_OBJECT.length > 0 || report.DUPLICATE_PATH.length > 0) {
  console.error(
    "\nABORTADO: existem MISSING_OBJECT ou DUPLICATE_PATH pendentes. " +
      "Resolva-os antes de excluir órfãos.",
  );
  process.exit(1);
}

const cutoff = Date.now() - OLDER_THAN_DAYS * 24 * 60 * 60 * 1000;
const candidates = report.ORPHAN_OBJECT.filter((o) => o.createdAt && new Date(o.createdAt).getTime() < cutoff);
const tooRecent = report.ORPHAN_OBJECT.length - candidates.length;

console.log(
  `\n${candidates.length} objeto(s) órfão(s) com mais de ${OLDER_THAN_DAYS} dia(s) serão excluídos ` +
    `(${tooRecent} descartado(s) por serem recentes demais ou sem data).`,
);

for (const c of candidates) {
  // Re-checagem final: garante que nenhuma linha nova passou a referenciar
  // este path entre a listagem e a exclusão.
  const { data: stillReferenced, error } = await db
    .from(c.table)
    .select("id")
    .eq("storage_path", c.path)
    .limit(1);
  if (error) {
    console.error(`[${c.table}] erro ao re-checar ${c.path}, pulando:`, error.message);
    continue;
  }
  if (stillReferenced && stillReferenced.length > 0) {
    console.warn(`[${c.table}] ${c.path} passou a ter referência — pulando exclusão.`);
    continue;
  }

  const { error: removeError } = await db.storage.from(c.bucket).remove([c.path]);
  if (removeError) {
    console.error(`[${c.bucket}] falha ao excluir ${c.path}:`, removeError.message);
    logEntry({ category: "DELETE_FAILED", bucket: c.bucket, path: c.path, error: removeError.message });
  } else {
    console.log(`[${c.bucket}] excluído: ${c.path}`);
    logEntry({ category: "DELETED", bucket: c.bucket, path: c.path });
  }
}

process.exit(0);
