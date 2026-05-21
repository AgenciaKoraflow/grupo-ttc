# Segurança

## Autenticação

### Fluxo de Login

1. Usuário submete e-mail + senha
2. `supabase.auth.signInWithPassword()` autentica
3. Sessão JWT armazenada no localStorage pelo cliente Supabase
4. `fetchProfile()` busca perfil na tabela `profiles`
5. Se `must_change_password = true`, força troca antes de qualquer acesso
6. Sessão expira após **24 horas** (verificado no `AuthContext`)

### Gestão de Sessão

```typescript
// Verificação de expiração no AuthContext
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24h

function isSessionExpired(session: AuthSession): boolean {
  const lastSignIn = session.user.last_sign_in_at;
  if (!lastSignIn) return false;
  return Date.now() - new Date(lastSignIn).getTime() > SESSION_MAX_AGE_MS;
}
```

Supabase também gerencia refresh tokens automaticamente dentro do período de validade.

### Sincronização Realtime de Perfil

O sistema escuta mudanças na tabela `profiles` para o usuário logado. Se um admin desativar a conta ou mudar a role, o usuário é deslogado automaticamente na próxima verificação.

## Controle de Acesso (RBAC)

### Roles

| Role | Código | Descrição |
|------|--------|-----------|
| Administrador | `admin` | Acesso total |
| Supervisor | `supervisor` | Acesso operacional |
| Operador | `operador` | Acesso restrito |

### Permissões Derivadas

Calculadas no `AuthContext` a partir do role:

```typescript
canDelete:      isAdmin || isSupervisor
canCreate:      isAdmin || isSupervisor || isOperador
canEdit:        isAdmin || isSupervisor || isOperador
canReopen:      isAdmin || isSupervisor || isOperador
canManageUsers: isAdmin
canViewLogs:    isAdmin || isSupervisor
```

### Proteção de Rotas

Feita no lado do componente (não no router):

```typescript
// Padrão em rotas admin-only
const { isAdmin } = useAuth();
const navigate = useNavigate();

useEffect(() => {
  if (!isAdmin) navigate({ to: '/dashboard' });
}, [isAdmin, navigate]);
```

### Row Level Security (RLS) no Supabase

Segunda camada de proteção no banco. Mesmo que um usuário contorne o frontend, as policies RLS bloqueiam acesso indevido.

Exemplo de policy para operadores:
```sql
-- Operadores só veem ocorrências da própria equipe
CREATE POLICY "operador_own_team" ON ocorrencias
  FOR SELECT TO authenticated
  USING (
    equipe_id = (SELECT equipe_id FROM profiles WHERE id = auth.uid())
    OR
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'supervisor')
  );
```

## Gestão de Senhas

- Senhas iniciais são geradas aleatoriamente pelo sistema (não ficam salvas)
- `must_change_password = true` force troca obrigatória
- Troca via `supabase.auth.updateUser({ password: newPassword })`
- Sem recuperação por e-mail (fluxo gerenciado pelo admin)

## Headers de Segurança (Vercel)

Configurados em `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Content-Security-Policy", "value": "..." }
      ]
    }
  ]
}
```

## Auditoria

Todas as ações do sistema são registradas na tabela `logs`:
- Login / logout
- Criação, edição, exclusão de qualquer entidade
- Finalização e reabertura de ocorrências
- Reset de senha
- Vinculação de equipes

Os logs são **imutáveis** — não há operação de DELETE na tabela `logs` para usuários normais.

## O Que Nunca Expor

- `service_role` key do Supabase
- Variáveis `VITE_*` não devem conter secrets (são expostas no bundle)
- Policies RLS internas
- Estrutura interna de tabelas em interfaces públicas
- Tokens de acesso ou refresh tokens em logs
