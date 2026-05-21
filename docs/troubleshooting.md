# Troubleshooting Técnico

## Problemas Comuns de Desenvolvimento

### O dev server não inicia

```bash
# Verificar se há processo na porta 5173
lsof -ti:5173 | xargs kill -9

# Reinstalar dependências
rm -rf node_modules
npm install   # ou bun install

# Iniciar novamente
npm run dev
```

### `routeTree.gen.ts` desatualizado

O arquivo é gerado automaticamente pelo `@tanstack/router-plugin`. Se rotas novas não aparecem:

```bash
# Reiniciar o dev server — ele regenera o arquivo na inicialização
npm run dev
```

Nunca edite `routeTree.gen.ts` manualmente de forma permanente — será sobrescrito.

### Erro de TypeScript em rotas

```
Type '"nova-rota"' is not assignable to type 'ValidRoutes'
```

Significa que `routeTree.gen.ts` ainda não foi regenerado com a nova rota. Reiniciar o dev server resolve.

---

## Supabase

### Erro `JWT expired`

A sessão do usuário expirou. O `AuthContext` trata isso automaticamente com `onAuthStateChange`. Se persistir:

1. Verificar se `supabase.auth.getSession()` retorna sessão válida
2. Verificar se `SESSION_MAX_AGE_MS` não está expirado
3. Usuário deve fazer login novamente

### Erro `row-level security policy violation`

O usuário está tentando acessar dados que sua role não permite. Verifique:

1. As policies RLS na tabela afetada (Supabase Dashboard → Table Editor → RLS)
2. Se o `role` do usuário está correto na tabela `profiles`
3. Se o usuário está autenticado (não é sessão expirada)

### Erro `storage/object-not-found`

Foto ou arquivo não encontrado no Storage. Causas:

1. Arquivo deletado manualmente no painel Supabase
2. Path incorreto no banco vs. path real no bucket
3. Bucket não criado

Verificar: Supabase Dashboard → Storage → Buckets → `fotos-servicos` / `fotos-finais`

### Upload de fotos falha em produção

1. Verificar se os buckets existem no projeto de produção
2. Verificar se as policies do bucket permitem upload autenticado
3. Verificar CORS nas configurações do bucket
4. Verificar tamanho do arquivo (limite configurado no bucket)

### Realtime não sincroniza

Se mudanças de role não propagam:

1. Verificar se Realtime está habilitado na tabela `profiles` (Supabase → Database → Replication)
2. Verificar se o canal está inscrito corretamente no `AuthContext`
3. Network tab do browser para verificar conexão WebSocket

---

## Build e Deploy

### Build falha com erro de TypeScript

```bash
# Verificar erros antes do build
npx tsc --noEmit

# Build com mais detalhes
npm run build 2>&1 | head -50
```

### Bundle muito grande

Verificar com:

```bash
npm run build
# Analisar output — Vite mostra tamanho dos chunks
```

Chunks problemáticos comuns:
- `recharts` — importar só o necessário
- Fotos em `public/` — otimizar com ferramentas externas

### Deploy na Vercel falha

1. Verificar se todas as `VITE_*` vars estão configuradas no painel Vercel
2. Verificar se o comando de build está correto (`vite build`)
3. Ver os logs de build em Vercel → Deployments → [deploy] → Build Logs

---

## Performance

### Carregamento lento na primeira abertura

Normal em planos free do Supabase (cold start do DB). Em produção pro, usar connection pooling.

### DataContext lento em listas grandes

O `DataContext` carrega todos os dados na inicialização. Para listas grandes (>500 ocorrências):
1. Implementar paginação no service layer
2. Usar TanStack Query com `keepPreviousData`
3. Filtros server-side ao invés de client-side

### Geração de PDF lenta

`jspdf` + `html2canvas` renderiza o DOM para canvas. Para ocorrências com muitas fotos:
- Otimizar fotos antes do upload (resolver no upload via compressão)
- Considerar geração de PDF no servidor (Edge Function)

---

## Logs de Debug

### Habilitar logs do cliente Supabase

```typescript
// src/lib/supabase.ts — apenas em desenvolvimento
const supabase = createClient(url, key, {
  global: {
    fetch: (url, options) => {
      if (import.meta.env.DEV) console.log('[Supabase]', url);
      return fetch(url, options);
    }
  }
});
```

### Verificar estado da sessão

```typescript
// No console do browser
const { data } = await supabase.auth.getSession();
console.log(data.session);
```

### Verificar perfil atual

```typescript
const { data } = await supabase.from('profiles').select('*').eq('id', data.session.user.id).single();
console.log(data);
```

---

## Onboarding de Novo Desenvolvedor

1. Clonar o repositório
2. Copiar `.env.example` para `.env` e preencher com credenciais do Supabase dev
3. `npm install` (ou `bun install`)
4. `npm run dev`
5. Acessar `http://localhost:5173`
6. Criar usuário admin via Supabase Dashboard → Authentication → Users
7. Inserir perfil manualmente em `profiles` com `role = 'admin'`

Documentação técnica completa neste diretório `docs/`.
