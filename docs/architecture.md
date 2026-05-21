# Arquitetura do Sistema

## Stack Tecnológica

| Camada | Tecnologia | Versão | Motivo da escolha |
|--------|-----------|--------|-------------------|
| UI Framework | React | 19.2 | Ecosistema maduro, Server Components futuros |
| Linguagem | TypeScript | 5.8 | Tipagem estática, DX superior |
| Roteamento | TanStack Router | 1.168 | File-based routing, type-safe navigation |
| State Server | TanStack Query | 5.83 | Cache de dados servidor, stale-while-revalidate |
| Banco de dados | Supabase (PostgreSQL) | 2.103 | Auth + DB + Storage + Realtime num único serviço |
| Estilização | Tailwind CSS | 4.2 | Utility-first, zero-runtime |
| Componentes | shadcn/ui (Radix) | latest | Headless, acessível, customizável |
| Formulários | React Hook Form + Zod | 7.x / 3.x | Performance + validação declarativa |
| Build | Vite | 7.3 | HMR rápido, ESM nativo, code splitting |
| Deploy | Vercel | edge | CDN global, preview branches, CI/CD automático |
| Monitoramento | Sentry | 10.x | Error tracking em produção |

## Diagrama de Camadas

```
┌─────────────────────────────────────────────────────┐
│                    BROWSER                          │
├──────────────────────────┬──────────────────────────┤
│      UI Layer            │     Routing Layer        │
│  React Components        │  TanStack Router         │
│  shadcn/ui + Tailwind    │  File-based (src/routes) │
├──────────────────────────┴──────────────────────────┤
│                   State Layer                       │
│  AuthContext  │  DataContext  │  LogContext          │
│  TanStack Query (cache / server state)              │
├─────────────────────────────────────────────────────┤
│                  Service Layer                      │
│  profiles.service  │  ocorrencias.service           │
│  equipes.service   │  fotos.service                 │
│  materiais.service │  tiposServico.service           │
├─────────────────────────────────────────────────────┤
│                   Lib Layer                         │
│  supabase.ts (client)  │  storage.ts  │  utils.ts   │
├─────────────────────────────────────────────────────┤
│                  SUPABASE (BaaS)                    │
│  PostgreSQL  │  Auth  │  Storage  │  Realtime       │
└─────────────────────────────────────────────────────┘
```

## Padrões de Organização

### File-based Routing (TanStack Router)

Cada arquivo em `src/routes/` vira uma rota:

```
src/routes/
├── __root.tsx              → layout raiz com providers
├── index.tsx               → / (redirect para /dashboard ou /login)
├── login.tsx               → /login
├── dashboard.tsx           → /dashboard
├── ocorrencias.index.tsx   → /ocorrencias
├── ocorrencias.$id.index.tsx  → /ocorrencias/:id
├── ocorrencias.$id.relatorio.tsx → /ocorrencias/:id/relatorio
├── usuarios.tsx            → /usuarios (admin only)
├── equipes.tsx             → /equipes
├── tipos-servico.tsx       → /tipos-servico
├── materiais.tsx           → /materiais
├── logs.tsx                → /logs
├── documentacao.tsx        → /documentacao (admin only)
└── importar-csv.tsx        → /importar-csv
```

`routeTree.gen.ts` é gerado automaticamente pelo plugin `@tanstack/router-plugin` ao iniciar o dev server.

### Context Architecture

**AuthContext** — Singleton, carrega no root:
- Lê sessão do Supabase Auth
- Busca perfil em `profiles` após login
- Expõe `user`, `isAdmin`, `isSupervisor`, `isOperador` e permissões derivadas
- Escuta realtime para sync de perfil entre abas

**DataContext** — Centraliza todos os dados operacionais:
- CRUD para cada entidade via hooks customizados
- Lazy loading para entidades pesadas (fotos)
- Único ponto de mutação de estado em toda a aplicação

**LogContext** — Auditoria assíncrona:
- Todas as ações do sistema passam por `addLog()`
- Escreve na tabela `logs` do Supabase
- Não bloqueia fluxo principal (fire-and-forget)

### Service Layer

Cada service encapsula as queries Supabase da entidade:

```typescript
// Padrão de um service
export async function fetchOcorrencias(equipeId?: string) {
  let q = supabase.from('ocorrencias').select('*')
  if (equipeId) q = q.eq('equipe_id', equipeId)
  const { data, error } = await q
  if (error) throw error
  return data
}
```

Services NÃO conhecem React. São funções puras async.

## Decisões de Arquitetura

### Por que TanStack Router e não React Router?

TanStack Router oferece type-safety end-to-end: ao navegar com `navigate({ to: '/usuarios' })`, o TypeScript valida o path. Além disso, o file-based routing reduz boilerplate de configuração.

### Por que Context e não Zustand/Redux?

O estado global é simples (um usuário, listas de entidades). Contexts com `useMemo` são suficientes e eliminam dependência de biblioteca de estado. Se crescer, migrar para Zustand seria cirúrgico: apenas trocar o provider.

### Por que não Server Components?

O projeto usa TanStack Start que suporta SSR/RSC, mas optamos por CSR puro por:
1. Simplicidade operacional
2. Supabase Auth funciona melhor client-side
3. Time de dev familiarizado com SPA

### Code Splitting e Performance

`vite.config.ts` divide o bundle em chunks:
- `vendor` — React, React DOM
- `supabase` — cliente Supabase
- `charts` — Recharts
- Cada rota é um chunk separado (lazy por padrão no TanStack Router)

Resultado: o bundle inicial é pequeno (~200 KB gzip). A documentação e relatórios carregam sob demanda.

## Realtime

O sistema usa Supabase Realtime apenas para sync do perfil do usuário logado:

```typescript
supabase
  .channel('profile-changes')
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, handleProfileUpdate)
  .subscribe()
```

Isso garante que mudanças de role ou desativação de conta propagam sem necessidade de re-login.
