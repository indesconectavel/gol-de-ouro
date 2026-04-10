# Validação — BLOCO C, Fase 1 de hardening (autenticação)

**Data:** 2026-04-09  
**Modo:** somente leitura sobre o estado do código após implementação  
**Objetivo:** confirmar escopo, correções e ausência de regressão evidente no repositório.

---

## 1. Resumo executivo

A Fase 1 autorizada foi **aplicada nos ficheiros previstos** (`server-fly.js`, `services/emailService.js`), **sem evidência** de alterações a outros ficheiros de aplicação no estado atual do Git. Os quatro objetivos (enumeração no register, verdade no forgot, link com `FRONTEND_URL`, login duplicado alinhado) **encontram-se refletidos no código**. O handler `POST /api/auth/reset-password` mantém-se na mesma zona do ficheiro, sem alteração funcional identificável nesta validação. O perfil (`GET /api/user/profile`) e o payload JWT do login (`userId`, `email`, `username`, `expiresIn: '24h'`) **mantêm a mesma forma** que o núcleo compartilhado reutiliza a assinatura existente.

**Classificação final:** **APROVADA COM RESSALVAS** — critérios de código cumpridos; ressalvas operacionais (env, testes reais, e-mail de verificação fora do escopo desta fase).

---

## 2. Escopo validado

| Critério | Evidência |
|----------|-----------|
| Apenas `server-fly.js` e `services/emailService.js` | `git status` / `git diff --name-only`: apenas estes dois ficheiros modificados. |
| Sem expansão de escopo | Não foram detetadas alterações a `goldeouro-player`, SQL de schema, ou rotas de jogo neste diff. |
| Sem alteração explícita de contrato JWT além do consolidado | `jwt.sign` no register (auto-login) e em `loginPlayerWithEmailPassword` mantêm payload `{ userId, email, username }` e `expiresIn: '24h'`. |
| Sem alteração de frontend | Nenhum ficheiro sob `goldeouro-player` neste diff. |

**Nota:** o repositório contém outros ficheiros não versionados ou alterações alheias a esta fase fora do âmbito desta validação; a confirmação de escopo baseia-se no `git diff --name-only` face ao HEAD.

---

## 3. Correções confirmadas

### 3.1 Register — enumeração

- **Ramo “email existente + senha errada”:** retorno `401` com `message: 'Credenciais inválidas'` (linhas 737–740 de `server-fly.js`), **sem** texto “email já cadastrado”.
- **Coerência com login inválido:** mesma mensagem e família de status que o núcleo de login (`401` + “Credenciais inválidas”).
- **Ramo “email existente + senha correta”:** mantém `200` com `token`, `user` completo e `message: 'Login realizado com sucesso'` (linhas 717–730).

### 3.2 Forgot password — sucesso falso

- **`emailService.sendPasswordResetEmail` com `!isConfigured`:** retorna `success: false` com `message` e `error` explícitos (linhas 53–60 de `services/emailService.js`).
- **Handler forgot:** se `emailResult.success` for falso, **não** segue para `res.status(200)`; devolve **`503`** com `success: false` e mensagem derivada do serviço (linhas 459–468 de `server-fly.js`).
- **Fluxo com envio bem-sucedido:** apenas após `emailResult.success === true` se chega ao `200` com `success: true` (linhas 471–477).

### 3.3 Link de reset

- **Construção do link:** `process.env.FRONTEND_URL` com fallback `'https://goldeouro.lol'`, remoção de barras finais, path `/reset-password?token=...` (linhas 64–65 de `services/emailService.js`).
- **Log de fallback no forgot:** usa a mesma lógica `FRONTEND_URL || 'https://goldeouro.lol'` (linhas 462–463 de `server-fly.js`).
- **Hardcode:** o valor de produção permanece apenas como **fallback literal** quando a env não existe — comportamento estável e alinhado ao pedido original.

### 3.4 Login duplicado

- **Núcleo único:** função `loginPlayerWithEmailPassword` (a partir da linha 824).
- **`POST /api/auth/login`:** delega no núcleo e devolve `success`, `message`, `token`, `user` (linhas 943–966).
- **`POST /auth/login`:** delega no **mesmo** núcleo com o mesmo shape de sucesso (linhas 2795–2814).

---

## 4. Regressão (verificação estática)

| Área | Resultado |
|------|------------|
| JWT | Payload e `expiresIn` no núcleo de login inalterados em espírito; register auto-login inalterado na estrutura do token. |
| Profile | Handler `GET /api/user/profile` contíguo ao login, sem alterações identificadas nesta secção. |
| Reset password | Rota `POST /api/auth/reset-password` mantida; alterações limitadas ao fluxo forgot + email. |
| Núcleo do jogo | Nenhuma alteração estrutural detetada nas rotas de jogo neste diff (validação por escopo de ficheiros). |

**Limitação:** não foram executados testes de integração ou E2E nesta validação.

---

## 5. Ressalvas

1. **Deploy / env:** comportamento do link e logs depende de definir `FRONTEND_URL` (e SMTP) no ambiente; sem `FRONTEND_URL`, o fallback continua `https://goldeouro.lol`.
2. **Teste real:** envio SMTP, receção do e-mail e clique no link exigem validação manual ou automatizada contra ambiente com credenciais reais.
3. **Fora do escopo desta fase:** revogação de sessão após reset; `sendVerificationEmail` em `emailService.js` **não** foi objeto da Fase 1 e ainda pode reportar sucesso simulado quando `!isConfigured` (comportamento pré-existente fora do corte cirúrgico do reset).
4. **Cliente:** respostas `401` no register disparam o comportamento já existente do cliente HTTP que trata `401` (limpeza de token); não é regressão introduzida pelo núcleo do backend, mas permanece relevante em cenários de utilizador já autenticado noutro separador.

---

## 6. Classificação final

**APROVADA COM RESSALVAS**

Motivos da aprovação: escopo respeitado, quatro correções verificáveis no código, alinhamento `/auth/login` ↔ `/api/auth/login`, ausência de mudança ao endpoint de reset além do contexto forgot/email.

Motivos das ressalvas: dependência de env/testes reais; `sendVerificationEmail` fora do escopo; validação sem execução de testes.

---

## 7. Conclusão oficial

A **Fase 1 do BLOCO C pode ser considerada concluída ao nível de implementação no repositório**, com **APROVAÇÃO CONDICIONADA** à conclusão dos testes operacionais (SMTP + `FRONTEND_URL` em staging/produção) pela equipa responsável pelo deploy.

---

*Documento gerado por validação read-only sobre o estado do código em 2026-04-09.*
