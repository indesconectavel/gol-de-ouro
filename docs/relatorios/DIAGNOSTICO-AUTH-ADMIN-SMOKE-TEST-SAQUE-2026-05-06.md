# DIAGNÓSTICO PROFISSIONAL — AUTH ADMIN E SMOKE TEST DE SAQUE

**Data:** 2026-05-06  
**Modo:** diagnóstico read-only (sem alteração de banco, sem bypass, sem brute force)

---

## 1) Diagnóstico da autenticação do painel admin

### Evidência disponível no workspace

O código-fonte do projeto `goldeouro-admin` **não está presente** neste workspace atual.  
Portanto, o diagnóstico do painel foi corroborado pelos relatórios técnicos já versionados:

- `docs/relatorios/DIAGNOSTICO-READONLY-PAINEL-ADMIN-COMPLETO-2026-05-04.md`
- `docs/relatorios/DIAGNOSTICO-READONLY-ADMIN-SAQUES-2026-05-04.md`

### Conclusão sobre o painel admin

- Fluxo predominante descrito: uso de `x-admin-token` (`VITE_ADMIN_TOKEN`) e, em alguns trechos legacy, token fixo no frontend.
- Não há evidência de emissão de JWT backend pelo login do painel admin analisado nesses relatórios.
- A tela de saques (`/saque-usuarios`) não chama `approve/cancel` reais e usa endpoint legacy de listagem.

**Resultado:** painel admin (no diagnóstico disponível) **NÃO** opera com JWT real como contrato principal.

---

## 2) Diagnóstico da autenticação do backend (endpoints alvo)

Endpoints alvo em produção no `server-fly.js`:

- `POST /api/admin/withdraw/approve`
- `POST /api/admin/withdraw/cancel`

### Middleware aplicado

Essas rotas usam, em cadeia:

1. `authenticateToken`  
   - Exige header `Authorization: Bearer <jwt>`
   - Faz `jwt.verify(token, process.env.JWT_SECRET)`
   - Injeta payload decodificado em `req.user`

2. `requireAdministradorDb`  
   - Lê `req.user.userId`
   - Consulta `usuarios` no Supabase
   - Permite apenas `tipo === 'admin'`

### O que o Bearer precisa conter

Pelo login oficial (`/api/auth/login` e `/auth/login`) o JWT é assinado com payload:

- `userId`
- `email`
- `username`

Observação crítica: **não há `role` no payload usado por `server-fly.js`** para esses endpoints.  
A autorização admin real é feita por **consulta ao banco** (`usuarios.tipo`), não por claim de role do JWT.

---

## 3) Endpoint oficial de login

No `server-fly.js`, os dois endpoints compartilham o mesmo núcleo:

- `POST /api/auth/login`
- `POST /auth/login` (compatibilidade)

### Body esperado

```json
{
  "email": "string",
  "password": "string"
}
```

### Resposta de sucesso (campos relevantes)

- `success: true`
- `token` (JWT)
- `user` (objeto normalizado)

### Como um usuário vira admin

Para acesso admin em `approve/cancel`, o usuário precisa estar com `usuarios.tipo = 'admin'`.

---

## 4) Fluxo seguro para garantir usuário admin

Existe endpoint oficial:

- `POST /api/admin/bootstrap`

Contrato observado:

- Requer JWT (`authenticateToken`)
- Só promove o usuário autenticado se **ainda não existir nenhum admin** no sistema
- Se já existir admin, retorna bloqueio (`403`)

Portanto, há caminho oficial sem bypass:

- Login oficial + validação de `tipo` no banco
- Bootstrap apenas para cenário inicial (one-shot)

---

## 5) Escolha recomendada (A/B/C/D)

**Recomendação: C** — criar/usar smoke test interno baseado em auth oficial do projeto, com login em `/api/auth/login` para obter JWT legítimo.

Complemento operacional:

- Preferir **A** quando já existe usuário admin válido (situação normal)
- Acionar **B** apenas via procedimento controlado (`/api/admin/bootstrap`) quando ambiente novo e sem admin
- **D (NO-GO)** apenas se não houver credencial admin oficial disponível e bootstrap não aplicável

---

## 6) Comandos seguros (sem imprimir secrets)

> Os comandos abaixo não exibem senha/token em stdout.  
> Ajuste apenas `BASE_URL` e use credenciais oficiais de teste controlado.

### 6.1 Comando único para obter token (PowerShell)

```powershell
$env:BASE_URL="https://goldeouro-backend-v2.fly.dev"; $env:ADMIN_TOKEN=((Invoke-RestMethod -Method Post -Uri "$env:BASE_URL/api/auth/login" -ContentType "application/json" -Body (@{ email=$env:ADMIN_EMAIL; password=$env:ADMIN_PASSWORD } | ConvertTo-Json -Compress)).token)
```

Pré-requisito seguro (na mesma sessão):

```powershell
$env:ADMIN_EMAIL="seu_admin_oficial"; $env:ADMIN_PASSWORD="sua_senha_oficial"
```

### 6.2 Comando único para executar o smoke test

```powershell
node .\scripts\test-withdraw-admin.js
```

Observação: o script atual usa `process.env.ADMIN_TOKEN` e `SAQUE_ID` fixo no arquivo.

---

## 7) Saída final objetiva

- **Painel admin usa JWT real?** **NÃO** (conforme diagnóstico disponível no repositório de relatórios)
- **Backend exige qual token?** `Authorization: Bearer <JWT assinado com JWT_SECRET>`
- **Como admin é validado?** Consulta no banco (`usuarios.tipo === 'admin'`) via `requireAdministradorDb`
- **Caminho seguro recomendado:** **C** (auth oficial + smoke interno), com A/B conforme contexto
- **Comandos exatos para smoke test:** seção 6

---

## 8) Referências técnicas consultadas

- `server-fly.js`
- `middlewares/authMiddleware.js`
- `routes/adminRoutes.js`
- `controllers/authController.js`
- `scripts/test-withdraw-admin.js`
- `docs/relatorios/DIAGNOSTICO-READONLY-PAINEL-ADMIN-COMPLETO-2026-05-04.md`
- `docs/relatorios/DIAGNOSTICO-READONLY-ADMIN-SAQUES-2026-05-04.md`
