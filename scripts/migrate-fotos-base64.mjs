#!/usr/bin/env node
// scripts/migrate-fotos-base64.mjs
//
// Backfill de imagens: resgata base64 legado de fotos_servico.url /
// fotos_finais.url para o Supabase Storage e zera a coluna `url`.
//
// Contexto completo em /home/joaosousa/.claude/plans/preciso-realizar-uma-an-lise-curious-raccoon.md
// (Fase D). Resumo do algoritmo por linha:
//
//   1. Se storage_path parece válido ("owner/kind/arquivo") e o objeto existe
//      no bucket -> classe NULL_ONLY: só zera `url`, sem upload (evita duplicar).
//   2. Caso contrário -> classe NEEDS_UPLOAD: o base64 é a única cópia.
//      a. decodifica o dataURL, identifica o mime por magic bytes (nunca
//         confia no prefixo declarado)
//      b. calcula sha256 dos bytes e monta uma chave content-addressed
//         DENTRO do prefixo do owner (nunca global — evita colisão entre
//         ocorrências/serviços diferentes, que têm ON DELETE CASCADE próprios)
//      c. faz upload (upsert:false; 409/Duplicate é tratado como sucesso,
//         o que torna o script idempotente e resumível)
//      d. verifica que o objeto existe (e, com --deep-verify, que o sha256
//         bate) ANTES de tocar no banco
//      e. só então faz um único UPDATE atômico: storage_path novo + url=NULL
//
// Nunca escreve `url = NULL` sem antes confirmar a cópia no Storage.
//
// Uso:
//   node --env-file=.env.local scripts/migrate-fotos-base64.mjs                    # dry-run
//   node --env-file=.env.local scripts/migrate-fotos-base64.mjs --apply --log-payload
//
// Variáveis de ambiente obrigatórias: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
// NUNCA commitar a service_role key — use .env.local (já no .gitignore).
//
// Flags:
//   --apply              sem esta flag, nada é escrito (padrão: dry-run)
//   --table=NOME          roda só fotos_servico ou fotos_finais
//   --batch=N             tamanho do lote de leitura (padrão 25)
//   --limit=N              processa no máximo N linhas (para teste)
//   --deep-verify          baixa o objeto após upload e compara sha256
//   --log-payload           grava cada imagem decodificada em disco (backup de rollback)
//   --log-dir=PATH        padrão ./.migracao-logs/
//
// Exit codes: 0 = limpo · 1 = erro fatal · 2 = concluído com SKIP_* (revisar log)

import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
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

const APPLY = flag("apply", false);
const ONLY_TABLE = opt("table", null);
const BATCH = Math.max(1, parseInt(opt("batch", "25"), 10) || 25);
const LIMIT = opt("limit", null) ? parseInt(opt("limit", "0"), 10) : Infinity;
const DEEP_VERIFY = flag("deep-verify", false);
const LOG_PAYLOAD = flag("log-payload", false);
const LOG_DIR = opt("log-dir", "./.migracao-logs");

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
const ndjsonPath = join(LOG_DIR, `migrate-${RUN_ID}.ndjson`);
const summaryPath = join(LOG_DIR, `migrate-${RUN_ID}.summary.json`);

function logRow(entry) {
  appendFileSync(ndjsonPath, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + "\n");
}

// ─── Tabelas ─────────────────────────────────────────────────────────────────

const TABLES = [
  { table: "fotos_servico", bucket: "fotos-servico", owner: "servico_id", kind: "tipo_foto" },
  { table: "fotos_finais", bucket: "fotos-finais", owner: "ocorrencia_id", kind: "categoria" },
].filter((t) => !ONLY_TABLE || t.table === ONLY_TABLE);

// ─── Sniffing por magic bytes (nunca confiar no prefixo do dataURL) ──────────

const MAGIC = [
  {
    mime: "image/jpeg",
    ext: "jpg",
    test: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    mime: "image/png",
    ext: "png",
    test: (b) =>
      b.length >= 8 &&
      b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    mime: "image/gif",
    ext: "gif",
    test: (b) => b.length >= 6 && /^GIF8[79]a$/.test(b.subarray(0, 6).toString("latin1")),
  },
  {
    mime: "image/webp",
    ext: "webp",
    test: (b) =>
      b.length >= 12 &&
      b.subarray(0, 4).toString("latin1") === "RIFF" &&
      b.subarray(8, 12).toString("latin1") === "WEBP",
  },
  {
    mime: "image/heic",
    ext: "heic",
    test: (b) =>
      b.length >= 12 &&
      b.subarray(4, 8).toString("latin1") === "ftyp" &&
      /hei[cx]|mif1|msf1/.test(b.subarray(8, 12).toString("latin1")),
  },
];

function sniff(buf) {
  return MAGIC.find((m) => {
    try {
      return m.test(buf);
    } catch {
      return false;
    }
  }) ?? null;
}

function parseDataUrl(s) {
  if (typeof s !== "string") return null;
  const m = /^data:([^;,]*)((?:;[^;,]*)*?)(;base64)?,/.exec(s);
  if (!m || !m[3]) return null; // sem ";base64" -> não tratamos (percent-encoded etc)
  try {
    return { declared: m[1] || null, bytes: Buffer.from(s.slice(m[0].length), "base64") };
  } catch {
    return null;
  }
}

// ─── Helpers de Storage ───────────────────────────────────────────────────────

function splitPath(path) {
  const idx = path.lastIndexOf("/");
  return idx >= 0 ? { dir: path.slice(0, idx), name: path.slice(idx + 1) } : { dir: "", name: path };
}

async function statObject(bucket, path) {
  const { dir, name } = splitPath(path);
  const { data, error } = await db.storage.from(bucket).list(dir, { search: name, limit: 100 });
  if (error) return null;
  const entry = (data ?? []).find((e) => e.name === name && e.id !== null);
  if (!entry) return null;
  return { size: entry.metadata?.size ?? null };
}

async function verifyUpload(bucket, path, expectedBytes, expectedSha) {
  if (DEEP_VERIFY) {
    const { data, error } = await db.storage.from(bucket).download(path);
    if (error || !data) return false;
    const buf = Buffer.from(await data.arrayBuffer());
    return createHash("sha256").update(buf).digest("hex") === expectedSha;
  }
  const stat = await statObject(bucket, path);
  return stat !== null && (stat.size === null || stat.size === expectedBytes.length);
}

// ─── Contadores ────────────────────────────────────────────────────────────────

const counts = {
  NULL_ONLY: 0,
  UPLOADED: 0,
  DUPLICATE_ALREADY_UPLOADED: 0,
  SKIP_NOT_BASE64: 0,
  SKIP_UNKNOWN_MIME: 0,
  SKIP_UPLOAD_REJECTED: 0,
  SKIP_VERIFY_FAILED: 0,
  ERROR: 0,
};

let processed = 0;

// ─── Loop principal ────────────────────────────────────────────────────────────

async function processTable({ table, bucket, owner, kind }) {
  console.log(`\n=== ${table} (bucket ${bucket}) — ${APPLY ? "APLICANDO" : "DRY-RUN"} ===`);

  let cursor = "00000000-0000-0000-0000-000000000000";
  let more = true;

  while (more && processed < LIMIT) {
    const { data: rows, error } = await db
      .from(table)
      .select(`id, storage_path, mime_type, file_name, ${owner}, ${kind}`)
      .not("url", "is", null)
      .gt("id", cursor)
      .order("id", { ascending: true })
      .limit(BATCH);

    if (error) {
      console.error(`[${table}] erro ao ler lote:`, error);
      counts.ERROR++;
      break;
    }
    if (!rows || rows.length === 0) {
      more = false;
      break;
    }

    const nullOnlyIds = [];

    for (const row of rows) {
      if (processed >= LIMIT) break;
      processed++;
      cursor = row.id;

      const path = row.storage_path ?? "";
      const plausible = /^[^/]+\/[^/]+\/.+$/.test(path);

      if (plausible) {
        const stat = await statObject(bucket, path);
        if (stat !== null) {
          counts.NULL_ONLY++;
          nullOnlyIds.push(row.id);
          logRow({ table, id: row.id, class: "NULL_ONLY", path, action: APPLY ? "url=NULL" : "dry-run" });
          continue;
        }
      }

      // NEEDS_UPLOAD: buscar o base64 desta linha (uma por vez, nunca em lote)
      const { data: urlRow, error: urlErr } = await db.from(table).select("url").eq("id", row.id).single();
      if (urlErr || !urlRow?.url) {
        counts.ERROR++;
        logRow({ table, id: row.id, class: "ERROR", error: urlErr?.message ?? "url vazio" });
        continue;
      }

      const parsed = parseDataUrl(urlRow.url);
      if (!parsed) {
        counts.SKIP_NOT_BASE64++;
        logRow({ table, id: row.id, class: "SKIP_NOT_BASE64" });
        continue;
      }

      const kindInfo = sniff(parsed.bytes);
      if (!kindInfo) {
        counts.SKIP_UNKNOWN_MIME++;
        logRow({ table, id: row.id, class: "SKIP_UNKNOWN_MIME", declared: parsed.declared });
        continue;
      }

      const sha = createHash("sha256").update(parsed.bytes).digest("hex");
      const newPath = `${row[owner]}/${row[kind]}/legacy-${sha.slice(0, 32)}.${kindInfo.ext}`;

      if (LOG_PAYLOAD) {
        const payloadDir = join(LOG_DIR, "payload", table);
        mkdirSync(payloadDir, { recursive: true });
        writeFileSync(join(payloadDir, `${row.id}.${kindInfo.ext}`), parsed.bytes);
      }

      if (!APPLY) {
        counts.UPLOADED++;
        logRow({
          table,
          id: row.id,
          class: "NEEDS_UPLOAD",
          newPath,
          sha256: sha,
          bytes: parsed.bytes.length,
          action: "dry-run",
        });
        continue;
      }

      const { error: uploadError } = await db.storage
        .from(bucket)
        .upload(newPath, parsed.bytes, { contentType: kindInfo.mime, upsert: false });

      const isDuplicate =
        uploadError &&
        (String(uploadError.message ?? "").toLowerCase().includes("duplicate") ||
          String(uploadError.statusCode ?? "") === "409");

      if (uploadError && !isDuplicate) {
        counts.SKIP_UPLOAD_REJECTED++;
        logRow({ table, id: row.id, class: "SKIP_UPLOAD_REJECTED", newPath, error: uploadError.message });
        continue;
      }
      if (isDuplicate) counts.DUPLICATE_ALREADY_UPLOADED++;

      const ok = await verifyUpload(bucket, newPath, parsed.bytes, sha);
      if (!ok) {
        counts.SKIP_VERIFY_FAILED++;
        logRow({ table, id: row.id, class: "SKIP_VERIFY_FAILED", newPath });
        continue;
      }

      // UPDATE atômico: só agora, com o objeto confirmado, tocamos no banco.
      const { error: updateError } = await db
        .from(table)
        .update({
          storage_path: newPath,
          mime_type: row.mime_type ?? kindInfo.mime,
          file_name: row.file_name ?? `legacy-${sha.slice(0, 8)}.${kindInfo.ext}`,
          url: null,
        })
        .eq("id", row.id);

      if (updateError) {
        counts.ERROR++;
        logRow({ table, id: row.id, class: "ERROR", newPath, error: updateError.message });
        continue;
      }

      counts.UPLOADED++;
      logRow({
        table,
        id: row.id,
        class: "UPLOADED",
        newPath,
        sha256: sha,
        bytes: parsed.bytes.length,
        action: "storage_path+url=NULL",
      });
    }

    if (APPLY && nullOnlyIds.length > 0) {
      const { error: nullErr } = await db.from(table).update({ url: null }).in("id", nullOnlyIds);
      if (nullErr) console.error(`[${table}] erro ao zerar url em lote NULL_ONLY:`, nullErr);
    }

    if (rows.length < BATCH) more = false;
  }
}

for (const t of TABLES) {
  await processTable(t);
}

// ─── Resumo ────────────────────────────────────────────────────────────────────

const summary = { runId: RUN_ID, apply: APPLY, deepVerify: DEEP_VERIFY, tables: TABLES.map((t) => t.table), processed, counts };
writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

console.log(`\n=== Resumo (${APPLY ? "APLICADO" : "DRY-RUN"}) ===`);
console.table(counts);
console.log(`Log: ${ndjsonPath}`);
console.log(`Resumo: ${summaryPath}`);

const hasSkips =
  counts.SKIP_NOT_BASE64 > 0 ||
  counts.SKIP_UNKNOWN_MIME > 0 ||
  counts.SKIP_UPLOAD_REJECTED > 0 ||
  counts.SKIP_VERIFY_FAILED > 0;
const hasErrors = counts.ERROR > 0;

if (hasErrors) {
  console.error("\nHouve erros fatais em algumas linhas. Revise o log antes de prosseguir.");
  process.exit(1);
}
if (hasSkips) {
  console.warn("\nConcluído com linhas puladas (SKIP_*). Revise o log antes de validar a constraint.");
  process.exit(2);
}
process.exit(0);
