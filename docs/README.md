# Documentação Técnica — Grupo TTC

> **Acesso restrito:** este diretório contém documentação técnica interna do projeto.
> Não expor publicamente. Não comitar secrets, tokens ou credenciais reais.

## Índice

| Documento                                  | Conteúdo                                          |
| ------------------------------------------ | ------------------------------------------------- |
| [architecture.md](./architecture.md)       | Arquitetura do sistema, stack, decisões técnicas  |
| [database.md](./database.md)               | Schema do banco, tabelas, RLS, migrations         |
| [deploy.md](./deploy.md)                   | Processo de deploy, Vercel, variáveis de ambiente |
| [security.md](./security.md)               | Autenticação, RBAC, sessões, auditoria            |
| [troubleshooting.md](./troubleshooting.md) | Diagnóstico e resolução de problemas técnicos     |

## Visão Geral

**Projeto:** Grupo TTC — Gestão de Preventivas  
**Stack:** React 19 + TypeScript + Supabase + Tailwind CSS 4 + Vite + TanStack Router  
**Deploy:** Vercel (produção) + Supabase (banco + storage + auth)  
**Versão:** 2.1.0

## Estrutura do Repositório

```
grupo-ttc/
├── src/
│   ├── components/        # Componentes reutilizáveis (AppLayout, AppSidebar, UI)
│   ├── contexts/          # AuthContext, DataContext, LogContext
│   ├── hooks/             # Hooks customizados (useOcorrencias, useEquipes, etc.)
│   ├── lib/               # Clientes externos (supabase, sentry, storage, utils)
│   ├── routes/            # Páginas (file-based routing via TanStack Router)
│   ├── services/          # Camada de acesso a dados (Supabase queries)
│   ├── types/             # TypeScript interfaces globais
│   └── styles.css         # Estilos globais (Tailwind + CSS custom)
├── supabase/              # Migrations e configurações do Supabase CLI
├── docs/                  # ← Esta pasta (documentação técnica interna)
├── public/                # Assets estáticos (logo, favicon)
├── vite.config.ts
├── vercel.json
└── package.json
```

## Contato Técnico

**KoraFlow** — contato@koraflow.com.br
