# Deploy e Infraestrutura

## Visão Geral

| Serviço | Função | Plano |
|---------|--------|-------|
| **Vercel** | Hosting do frontend | Hobby / Pro |
| **Supabase** | Banco + Auth + Storage | Free / Pro |

## Vercel

### Configuração

O arquivo `vercel.json` na raiz define:
- **Rewrites:** todas as rotas redirecionam para `index.html` (SPA routing)
- **Headers:** CSP, HSTS, X-Frame-Options e outros headers de segurança

### Deploy automático

Push na branch `main` → build automático na Vercel.

**Branches de preview:** qualquer branch gera um URL de preview isolado.

### Variáveis de ambiente

Configurar no painel Vercel (Settings → Environment Variables):

```
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=[sua-anon-key]
VITE_SENTRY_DSN=[seu-dsn-sentry]        # opcional
```

> **Nunca** comitar o arquivo `.env` no repositório. Use `.env.example` como referência.

### Build

```bash
# Produção
npm run build

# Preview local do build
npm run preview
```

Output em `dist/`. Vite gera chunks separados conforme configuração em `vite.config.ts`.

## Supabase

### Configuração inicial

```bash
# Instalar CLI
npm install -g supabase

# Login
supabase login

# Vincular projeto existente
supabase link --project-ref [project-ref]

# Aplicar migrations
supabase db push
```

### Variáveis necessárias

Obter em: Supabase Dashboard → Project Settings → API

- `VITE_SUPABASE_URL` — URL do projeto
- `VITE_SUPABASE_ANON_KEY` — chave pública (anon key)

> A `service_role` key NUNCA deve ser exposta no frontend.

### Storage

Buckets devem ser criados via Migration ou manualmente no painel:
- `fotos-servicos` — privado
- `fotos-finais` — privado

### Auth Settings

Em Supabase → Authentication → Settings:
- **Site URL:** URL da Vercel em produção
- **Redirect URLs:** adicionar `http://localhost:5173` para dev local
- **Email confirmation:** pode ser desabilitado (senhas são geradas pelo admin)

## Processo de Deploy Manual (se necessário)

```bash
# 1. Garantir que o build passa
npm run build

# 2. Verificar variáveis de ambiente
cat .env.example

# 3. Deploy via CLI da Vercel
npx vercel --prod
```

## Monitoramento

**Sentry** — configurado em `src/lib/sentry.ts`. Captura exceções não tratadas em produção.

Para verificar erros: acesse o painel Sentry vinculado ao projeto.

## Rollback

Em caso de problema:
1. Acesse Vercel → Deployments
2. Localize o deploy anterior funcional
3. Clique em "Promote to Production"

O rollback não afeta o banco de dados — migrations aplicadas permanecem.
