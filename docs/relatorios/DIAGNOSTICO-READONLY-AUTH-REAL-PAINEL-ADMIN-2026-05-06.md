# DIAGNÓSTICO READ-ONLY — AUTENTICAÇÃO REAL DO PAINEL ADMIN

**Data:** 2026-05-06  
**Escopo:** `goldeouro-admin` (somente diagnóstico)  
**Regras aplicadas:** sem alteração de código, sem deploy, sem banco

---

## 1) Projeto oficial do painel admin

Projeto identificado no workspace:

- `goldeouro-admin`

Entrypoint e roteamento principal:

- `goldeouro-admin/src/main.jsx`
- `goldeouro-admin/src/AppRoutes.jsx`

---

## 2) Tela de login admin

Arquivo de login identificado:

- `goldeouro-admin/src/pages/Login.jsx`

Fluxo atual observado no arquivo:

- formulário com **apenas senha** (sem campo de email)
- lista local `validPasswords = ["admin123"]`
- validação local em memória (`validPasswords.includes(formData.password)`)
- token local gerado no client: ``admin-token-${Date.now()}``
- sem chamada de API de autenticação real

---

## 3) Autenticação atual (estado real do frontend)

### Sessão/token

Persistência local:

- `goldeouro-admin/src/js/auth.js`
  - `login(token)` salva em `localStorage`:
    - `admin-token`
    - `admin-token-timestamp`
  - `isAuthenticated()` valida apenas presença + TTL local (24h)
  - não valida assinatura JWT nem exp real do backend

Proteção de rotas:

- `goldeouro-admin/src/components/MainLayout.jsx`
  - usa `isAuthenticated()` local
  - redireciona para `/login` quando token local ausente/expirado

### Cliente HTTP/API atual

Há **3 padrões paralelos**:

1. `goldeouro-admin/src/js/api.js`
   - usa `fetch`
   - envia `x-admin-token: VITE_ADMIN_TOKEN`
   - padrão legacy (não JWT Bearer)

2. `goldeouro-admin/src/services/api.js`
   - usa `axios`
   - header fixo hardcoded `x-admin-token: 'goldeouro123'`
   - padrão inseguro/legacy

3. `goldeouro-admin/src/services/dataService.js`
   - usa `fetch`
   - tenta `Authorization: Bearer <admin-token do localStorage>`
   - porém esse token vem do login local fake, não de `/api/auth/login`

---

## 4) Comparação com contrato real do backend

Contrato backend real (já validado no repositório backend):

- `POST /api/auth/login`
- body esperado:
  - `email`
  - `password`
- resposta:
  - `token` JWT real
- chamadas protegidas:
  - `Authorization: Bearer <JWT>`

### Gap principal

O painel admin atual **não está conectado** ao contrato real:

- login não chama `/api/auth/login`
- não captura `token` JWT da resposta do backend
- convive com headers legacy `x-admin-token`
- usa token local sintético como se fosse Bearer real

---

## 5) Páginas que precisam de token real

Todas as páginas sob `MainLayout` em `AppRoutes.jsx` precisam de sessão real JWT para integração de produção:

- `/painel` (`Dashboard`)
- `/lista-usuarios`
- `/relatorio-usuarios`
- `/relatorio-por-usuario`
- `/relatorio-financeiro`
- `/relatorio-geral`
- `/relatorio-semanal`
- `/estatisticas`
- `/estatisticas-gerais`
- `/transacoes`
- `/saque-usuarios`
- `/usuarios-bloqueados`
- `/fila`
- `/top-jogadores`
- `/backup`
- `/configuracoes`
- `/exportar-dados`
- `/logs`
- `/chutes`

Rotas públicas relacionadas:

- `/login` (precisa migrar para login real)
- `/logout` (precisa limpar sessão JWT real)

---

## 6) Arquivos candidatos a correção (cirurgia de auth)

Núcleo mínimo de autenticação:

- `goldeouro-admin/src/pages/Login.jsx`
- `goldeouro-admin/src/js/auth.js`
- `goldeouro-admin/src/components/MainLayout.jsx`

Camada de API (padronização para Bearer JWT):

- `goldeouro-admin/src/js/api.js`
- `goldeouro-admin/src/services/api.js`
- `goldeouro-admin/src/services/dataService.js`

Consumidores importantes para validação pós-cirurgia:

- `goldeouro-admin/src/pages/Dashboard.jsx`
- `goldeouro-admin/src/pages/SaqueUsuarios.jsx`
- `goldeouro-admin/src/pages/RelatorioSemanal.jsx`
- `goldeouro-admin/src/pages/ListaUsuarios.jsx`
- e demais páginas roteadas em `AppRoutes.jsx`

---

## 7) Saída objetiva solicitada

- **arquivo de login:** `goldeouro-admin/src/pages/Login.jsx`
- **cliente API atual:** múltiplo (`src/js/api.js`, `src/services/api.js`, `src/services/dataService.js`)
- **usa JWT real?** **NÃO**
- **arquivos candidatos a correção:** seção 6
- **GO/NO-GO para cirurgia de autenticação admin:** **GO**

### Justificativa GO

Há diagnóstico claro e reproduzível de desacoplamento entre frontend admin e contrato real do backend.  
A cirurgia de autenticação é necessária para viabilizar integração real com segurança.

---

**Fim do diagnóstico.**
