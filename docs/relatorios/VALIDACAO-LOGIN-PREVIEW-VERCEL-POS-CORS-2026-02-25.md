# Validação de login no preview Vercel (pós-patch CORS)

**Data:** 2026-02-25  
**Contexto:** CORS patch em produção no Fly (release `deployment-01KJB5K9MPDYQ49P82YF2P3J3D`). Preflight OPTIONS já validado para preview e www. Este relatório documenta a validação do **login no preview** no navegador e evidências auditáveis.

**Regras aplicadas:** Sem alterações de código; sem alterações em Vercel/DNS/env; apenas validação e documentação.

---

## 1) Preview alvo (URL)

| Item | Valor |
|------|--------|
| **Preview validado** | `https://goldeouro-player-jk10qipn8-goldeouro-admins-projects.vercel.app` |
| Backend | `https://goldeouro-backend-v2.fly.dev` |

---

## 2) Checklist ultra-curto — exportar HAR (3 ações manuais)

**Para o usuário executar (Chrome/Edge):**

1. Abrir: **https://goldeouro-player-jk10qipn8-goldeouro-admins-projects.vercel.app**
2. F12 → **Network** → marcar **Preserve log** → fazer **login** (conta válida).
3. Na aba Network: botão direito → **Save all as HAR with content** (ou **Export HAR**) → salvar como:
   - **`docs/relatorios/evidencias/HAR-login-preview-2026-02-25.har`**
   - Se a pasta `docs/relatorios/evidencias` não existir, crie-a antes de salvar. *(A pasta já foi criada com um `.gitkeep`.)*

Após o HAR existir nesse caminho, a análise é feita em leitura e a seção **Evidência HAR** e a conclusão GO/NO-GO são preenchidas automaticamente.

---

## 2b) Checklist de validação no navegador (detalhado)

Executar no Chrome ou Edge e preencher as evidências abaixo após a execução.

### Passos

1. Abrir a URL do preview:  
   **https://goldeouro-player-jk10qipn8-goldeouro-admins-projects.vercel.app**
2. Abrir DevTools (F12) → aba **Network**.
3. Marcar **Preserve log**.
4. Filtrar por `login` ou `auth` (opcional).
5. Fazer tentativa de **login** com uma conta válida.  
   *(Não registrar senha no relatório; pode registrar e-mail mascarado, ex.: `u***@mail.com`.)*
6. Verificar:
   - **A)** Requisição **OPTIONS** para `.../api/auth/login`: status **204** ou **200** e header `access-control-allow-origin` igual à origem do preview.
   - **B)** Requisição **POST** para `.../api/auth/login`: status **200** (ou sucesso esperado) e corpo JSON com `success: true` / token etc.
   - **C)** Aba **Console** sem erro de CORS (ex.: "blocked by CORS policy").

### Evidências (preencher após executar)

| Check | Esperado | Resultado (preencher) |
|-------|----------|------------------------|
| **A) OPTIONS /api/auth/login** | 204/200 + `access-control-allow-origin: https://goldeouro-player-jk10qipn8-goldeouro-admins-projects.vercel.app` | _Ex.: OK, status 204, header presente_ |
| **B) POST /api/auth/login** | 200 + JSON success/token | _Ex.: OK, status 200, token recebido_ |
| **C) Console** | Sem erro CORS | _Ex.: Nenhum erro CORS_ |

**Em caso de falha:** registrar qual etapa falhou (OPTIONS ou POST), status code e mensagem exibida no Console/Network (sem dados sensíveis). Indicar se é erro de API (401/403/500) ou bloqueio (CORS/CSP/redirect).

### Evidência HAR — análise (auditável)

**HAR encontrado?** NÃO. Caminho verificado: `docs/relatorios/evidencias/HAR-login-preview-2026-02-25.har` (arquivo inexistente). Conteúdo da pasta `docs/relatorios/evidencias/`: `.gitkeep`. Nenhum `*.har` no repositório.

*Análise feita em cima do arquivo `docs/relatorios/evidencias/HAR-login-preview-2026-02-25.har` (somente leitura).*

| Item | Resultado extraído do HAR |
|------|----------------------------|
| **A) OPTIONS** `.../api/auth/login` | Não aplicável — HAR inexistente no caminho verificado. |
| **B) POST** `.../api/auth/login` | Não aplicável — HAR inexistente no caminho verificado. |
| **C) Inferência** | Análise não realizada: arquivo `docs/relatorios/evidencias/HAR-login-preview-2026-02-25.har` não encontrado no repositório na data da verificação. |

*(Tabela preenchida quando o HAR existir; até lá, evidência de login no browser permanece pendente.)*

---

## 3) Validação adicional (read-only) — backend

### Preflight OPTIONS (preview origin)

Comando:

```powershell
curl.exe -s -D - -o NUL -X OPTIONS "https://goldeouro-backend-v2.fly.dev/api/auth/login" -H "Origin: https://goldeouro-player-jk10qipn8-goldeouro-admins-projects.vercel.app" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type,Authorization"
```

Resultado (2026-02-25):

- **Status:** 204 No Content  
- **access-control-allow-origin:** `https://goldeouro-player-jk10qipn8-goldeouro-admins-projects.vercel.app`  
- **access-control-allow-methods:** GET,POST,PUT,DELETE,OPTIONS  
- **access-control-allow-headers:** Content-Type,Authorization,X-Requested-With,X-Idempotency-Key  

Conclusão: preflight para o preview está correto em produção.

### POST de login via curl

Não executado com credenciais reais (não expor no relatório). **Registro:** não aplicável.

### Health check

Comando:

```powershell
curl.exe -s "https://goldeouro-backend-v2.fly.dev/health"
```

Resultado:

- **Status HTTP:** 200  
- **Corpo (exemplo):** `{"status":"ok","timestamp":"2026-02-25T19:56:04.650Z","version":"1.2.1","database":"connected","mercadoPago":"connected",...}`  

Backend respondendo e saudável.

---

## 4) Conclusão GO/NO-GO (preview login)

| Critério | Status |
|----------|--------|
| Preflight OPTIONS (preview) | **GO** — evidência via curl acima |
| Backend /health | **GO** — 200 OK |
| Login no preview (browser) | **NO-GO** — evidência HAR ausente (arquivo não encontrado) |

**Conclusão atual:**

- **Preflight e backend:** **GO.**
- **Preview login (navegador):** **NO-GO** — HAR inexistente; análise não realizada.  
  Arquivo HAR em `docs/relatorios/evidencias/HAR-login-preview-2026-02-25.har` não encontrado; conclusão NO-GO por ausência de evidência. *(Antes: executar checklist seção 2 e exportar HAR.)*
  - Se OPTIONS e POST OK e sem erro CORS → marcar **GO** para “preview login” e atualizar a tabela de evidências.
  - Se falha → marcar **NO-GO**, preencher a causa provável e o próximo passo sugerido (somente leitura) abaixo.

### Motivo NO-GO (evidência HAR)

- **Causa:** Arquivo HAR não encontrado no caminho esperado; análise read-only não realizada.
- **Próximo passo (read-only):** Exportar o HAR conforme o checklist da seção 2 (abrir preview → login → Save all as HAR with content) e salvar em `docs/relatorios/evidencias/HAR-login-preview-2026-02-25.har`. Em seguida solicitar nova análise do HAR para preencher evidências e reavaliar GO/NO-GO.

---

## 5) Resumo

- **Preview URL:** `https://goldeouro-player-jk10qipn8-goldeouro-admins-projects.vercel.app`
- **OPTIONS (curl):** 204, `access-control-allow-origin` = origin do preview
- **/health:** 200 OK
- **Login no preview (browser):** Evidência HAR ausente — análise não realizada
- **GO/NO-GO:** GO para preflight e backend; preview login = **NO-GO** (HAR inexistente)

---

## 6) Resumo final (análise HAR / GO-NO-GO)

- **OPTIONS:** Status e allow-origin não extraídos — HAR não encontrado; curl independente já atesta 204 e allow-origin OK.
- **POST:** Status e sucesso não extraídos — HAR não encontrado.
- **Conclusão:** **NO-GO** para "login no preview (browser)" por ausência de evidência auditável (arquivo HAR inexistente).
- **Próximo passo:** Exportar HAR (checklist seção 2), salvar em `docs/relatorios/evidencias/HAR-login-preview-2026-02-25.har`, e solicitar nova análise para fechar GO com evidência.
