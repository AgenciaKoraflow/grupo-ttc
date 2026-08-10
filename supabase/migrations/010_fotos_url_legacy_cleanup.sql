-- ═══════════════════════════════════════════════════════════════════════════
-- 010: Limpeza do campo legado `url` em fotos_servico / fotos_finais
--
-- Contexto: `url` guardava thumbnails base64 inline (até ~200 KB/linha),
-- inflando o TOAST das tabelas. O app NUNCA lê esse valor — os fetchers em
-- src/services/fotos.service.ts sempre substituem por um signed URL fresco
-- gerado em runtime a partir de storage_path (src/lib/storage.ts).
--
-- A coluna é MANTIDA (não dropada) como rede de segurança. O backfill
-- (scripts/migrate-fotos-base64.mjs) sobe ao Storage tudo que só existia em
-- base64 (storage_path vazio/inválido) e zera o restante (base64 duplicado).
--
-- Numeração: 009 foi criada e depois revertida (commits 770108e / 1472ff6),
-- por isso o próximo arquivo é 010.
-- ═══════════════════════════════════════════════════════════════════════════

COMMENT ON COLUMN fotos_servico.url IS
  'LEGADO / NÃO USAR. Deve permanecer NULL. A URL de exibição é um signed URL '
  'gerado em runtime a partir de storage_path (src/lib/storage.ts). '
  'Guardar base64 aqui é proibido — ver constraint fotos_servico_url_sem_base64.';

COMMENT ON COLUMN fotos_finais.url IS
  'LEGADO / NÃO USAR. Deve permanecer NULL. A URL de exibição é um signed URL '
  'gerado em runtime a partir de storage_path (src/lib/storage.ts). '
  'Guardar base64 aqui é proibido — ver constraint fotos_finais_url_sem_base64.';

-- ── Barreira contra regressão ────────────────────────────────────────────────
-- NOT VALID: não varre as linhas existentes, então pode ser aplicado ANTES de
-- o backfill terminar. Valida apenas INSERT/UPDATE novos a partir de agora.
-- Rode o VALIDATE (bloco comentado abaixo) só depois que o backfill reportar
-- zero pendências (etapa 8 do rollout no plano de otimização de imagens).

ALTER TABLE fotos_servico
  DROP CONSTRAINT IF EXISTS fotos_servico_url_sem_base64;
ALTER TABLE fotos_servico
  ADD CONSTRAINT fotos_servico_url_sem_base64
  CHECK (url IS NULL OR url NOT LIKE 'data:%') NOT VALID;

ALTER TABLE fotos_finais
  DROP CONSTRAINT IF EXISTS fotos_finais_url_sem_base64;
ALTER TABLE fotos_finais
  ADD CONSTRAINT fotos_finais_url_sem_base64
  CHECK (url IS NULL OR url NOT LIKE 'data:%') NOT VALID;

-- ── Executar SOMENTE após o backfill confirmar zero linhas com url LIKE 'data:%' ──
-- ALTER TABLE fotos_servico VALIDATE CONSTRAINT fotos_servico_url_sem_base64;
-- ALTER TABLE fotos_finais  VALIDATE CONSTRAINT fotos_finais_url_sem_base64;
