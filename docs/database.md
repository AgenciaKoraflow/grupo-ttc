# Banco de Dados

> **Segurança:** Nunca comite este arquivo com credenciais reais. Use variáveis de ambiente.

## Plataforma

**Supabase** (PostgreSQL 15) — banco, auth, storage e realtime num único serviço.

## Tabelas Principais

### `profiles`
Extensão da tabela `auth.users` do Supabase Auth.

| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | uuid (PK) | FK → `auth.users.id` |
| `nome` | text | Nome completo |
| `email` | text | Único |
| `role` | text | `admin` / `supervisor` / `operador` |
| `equipe_id` | uuid (FK) | Nullable — vínculo com equipe |
| `must_change_password` | boolean | Força troca no próximo login |
| `ativo` | boolean | Controle de acesso (soft delete) |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `equipes`

| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | uuid (PK) | |
| `nome` | text | Nome da equipe |
| `created_at` | timestamptz | |

### `ocorrencias`

| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | uuid (PK) | |
| `titulo` | text | Identificação da ocorrência |
| `status` | text | `PENDENTE` / `EM_ANDAMENTO` / `FINALIZADA` |
| `equipe_id` | uuid (FK) | Equipe responsável |
| `equipe_atribuida_at` | timestamptz | Quando a equipe foi vinculada |
| `tipo_servico_id` | uuid (FK) | |
| `data_ocorrencia` | date | Data do registro |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |
| `finalizada_at` | timestamptz | Nullable |

### `tipos_servico`

| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | uuid (PK) | |
| `nome` | text | Ex: "Manutenção Preventiva" |
| `created_at` | timestamptz | |

### `servicos_ocorrencia`
Serviços executados dentro de uma ocorrência.

| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | uuid (PK) | |
| `ocorrencia_id` | uuid (FK) | |
| `descricao` | text | |
| `data_execucao` | date | |
| `created_at` | timestamptz | |

### `materiais` (catálogo)

| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | uuid (PK) | |
| `nome` | text | |
| `unidade` | text | Ex: "un", "m", "kg" |
| `created_at` | timestamptz | |

### `ocorrencia_materiais`
Materiais utilizados em serviços específicos.

| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | uuid (PK) | |
| `servico_id` | uuid (FK) | |
| `material_id` | uuid (FK) | |
| `quantidade` | numeric | |

### `fotos_servico`

| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | uuid (PK) | |
| `servico_id` | uuid (FK) | |
| `storage_path` | text | Caminho no Supabase Storage |
| `created_at` | timestamptz | |

### `fotos_ocorrencia_final`
Fotos da conclusão da ocorrência.

| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | uuid (PK) | |
| `ocorrencia_id` | uuid (FK) | |
| `storage_path` | text | |
| `created_at` | timestamptz | |

### `logs`
Auditoria de todas as ações do sistema.

| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | uuid (PK) | |
| `user_id` | uuid | ID do usuário que executou |
| `user_nome` | text | Nome (snapshot) |
| `user_role` | text | Role no momento da ação |
| `tipo` | text | `LOGIN`, `LOGOUT`, `CRIACAO`, `ATUALIZACAO`, `EXCLUSAO`, `FINALIZACAO`, `REABERTURA`, `RESET_SENHA`, `VINCULACAO` |
| `categoria` | text | `OCORRENCIA`, `USUARIO`, `EQUIPE`, `TIPO_SERVICO`, `AUTENTICACAO` |
| `entidade_id` | uuid | ID do registro afetado |
| `entidade_nome` | text | Nome do registro (snapshot) |
| `detalhes` | text | Descrição da ação |
| `created_at` | timestamptz | |

## Row Level Security (RLS)

Todas as tabelas possuem RLS habilitado. As policies seguem a lógica de roles:

- **Admin:** leitura e escrita em todas as tabelas
- **Supervisor:** leitura e escrita em entidades operacionais; sem acesso a `profiles`
- **Operador:** leitura/escrita restrita às ocorrências da própria equipe

> Detalhes das policies estão nas migrations em `supabase/migrations/`.

## Storage

Buckets configurados no Supabase Storage:

| Bucket | Uso | Acesso |
|--------|-----|--------|
| `fotos-servicos` | Fotos por serviço de ocorrência | Privado (signed URLs) |
| `fotos-finais` | Fotos de conclusão | Privado (signed URLs) |

## Migrations

Gerenciadas via Supabase CLI. Arquivos em `supabase/migrations/`.

```bash
# Aplicar migrations em produção
supabase db push

# Gerar nova migration após mudança no schema
supabase db diff --use-migra -f nome_da_migration
```

## Backup e Recuperação

O Supabase oferece backup automático (PITR — Point in Time Recovery) nos planos pagos. Para o plano free, exportar periodicamente via:

```bash
supabase db dump -f backup_$(date +%Y%m%d).sql
```
