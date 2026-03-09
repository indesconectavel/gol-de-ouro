# SMTP SAFE MODE — HARDENING DE PRODUÇÃO

**Projeto:** Gol de Ouro  
**Data:** 2026-03-09  
**Escopo:** services/emailService.js (dependência opcional e resiliente)  
**Referência:** FIX-SMTP-CRASH-LOOP-2026-03-09.md, INCIDENTE-FLY-STARTUP-BACKEND-READONLY-2026-03-09.md

---

## 1. Resumo executivo

Foi implementado o **SMTP safe mode** no `emailService.js`: o serviço de e-mail passou a ter estado explícito (configurado, verificado, último erro de verify/send), verificação SMTP em background sem impacto no startup, método interno `ensureReady()` para checagem segura antes de envio, retornos padronizados sem exceções para fora do módulo, logging sem token completo nem credenciais, e método `getStatus()` para inspeção. O backend sobe mesmo com SMTP inválido ou indisponível; falhas de e-mail não derrubam o servidor; contratos existentes (forgot-password retornando 503 quando `!emailResult.success`) foram preservados. Nenhuma alteração foi feita em server-fly.js, rotas, autenticação ou banco.

---

## 2. Arquivos alterados

| Arquivo | Alterações |
|---------|------------|
| **services/emailService.js** | Estado explícito (isVerified, lastVerifyError, lastVerifyAt, lastSendError); verify em background com .catch() e atualização de estado; ensureReady(); sendPasswordResetEmail e sendVerificationEmail usando ensureReady e lastSendError; logging com email mascarado e sem token completo; getStatus(); getStats() compatível com getStatus(). |

Nenhum outro arquivo foi modificado (server-fly.js, fly.toml, rotas e controllers permanecem inalterados).

---

## 3. Problemas mitigados

| Problema | Mitigação |
|----------|-----------|
| Falha SMTP no boot derrubando o backend | Verify em background com .catch(); Promise nunca fica com rejeição não tratada. |
| Estado do serviço pouco claro | Campos isConfigured, isVerified, lastVerifyError, lastVerifyAt, lastSendError e getStatus() para inspeção. |
| Envio sem checagem única de “pronto” | ensureReady() centraliza: credenciais, await da verify pendente e estado configurado/verificado. |
| Retornos inconsistentes ou throw para fora | Todos os métodos públicos retornam { success, error?, messageId?, message? }; nenhum throw para o chamador. |
| Logs com token ou email completo em produção | Email truncado (ex.: 5 primeiros caracteres + ***); token só truncado em dev; sem credenciais. |
| Impossibilidade de auditar SMTP em produção | getStatus() retorna configured, verified, provider, fromAddress, frontendBaseUrl, lastVerifyError, lastSendError, lastVerifyAt. |

---

## 4. Alterações aplicadas

### 4.1 Estado explícito

- **isConfigured:** true apenas quando verify conclui com sucesso.
- **isVerified:** true quando transporter.verify() retorna sucesso.
- **lastVerifyError:** mensagem do último erro de verify (ou null).
- **lastVerifyAt:** timestamp da última execução de verify (ou null).
- **lastSendError:** mensagem do último erro de sendMail (ou null); limpo em envio bem-sucedido.

### 4.2 Verify não crítico no boot

- Verify continua sendo executada no constructor, em background (callback assíncrono).
- A Promise é encadeada com .catch(): em falha, atualiza lastVerifyError, isConfigured e isVerified e resolve com undefined (sem unhandled rejection).
- Boot do servidor não aguarda verify; /health não depende de SMTP.

### 4.3 ensureReady()

- Método interno assíncrono que retorna `{ ready: boolean, error?: string }`.
- Verifica existência de transporter; aguarda _verifyPromise se existir; verifica isConfigured e isVerified.
- Não lança exceção; em falha retorna ready: false e mensagem em error.

### 4.4 Retorno padronizado

- sendPasswordResetEmail e sendVerificationEmail:
  - Sucesso: `{ success: true, messageId?, message }`.
  - Falha: `{ success: false, error, message? }`.
- Nenhum throw para fora do emailService.

### 4.5 Logging

- Sem token completo (apenas truncado em dev quando SMTP indisponível).
- Email mascarado em produção (ex.: primeiros 5 caracteres + ***).
- Erros com error.message apenas (sem stack em fluxo esperado).
- Mensagens claras quando SMTP não está configurado ou verify falhou.

### 4.6 getStatus() e getStats()

- **getStatus():** retorna configured, verified, provider, fromAddress, frontendBaseUrl, lastVerifyError, lastSendError, lastVerifyAt.
- **getStats():** mantém compatibilidade; passa a delegar para getStatus() e expor também service e user (alias de provider e fromAddress).

### 4.7 Compatibilidade

- sendPasswordResetEmail retorna success: false quando SMTP indisponível; server-fly.js continua podendo responder 503 quando !emailResult.success.
- isEmailConfigured() mantido; getStats() mantido com shape anterior enriquecido.

---

## 5. Estado final do emailService

| Propriedade / método | Descrição |
|----------------------|-----------|
| **Estado** | isConfigured, isVerified, lastVerifyError, lastVerifyAt, lastSendError; _verifyPromise com .catch() garantido. |
| **ensureReady()** | Checagem única antes de envio; nunca throw. |
| **sendPasswordResetEmail** | Usa ensureReady(); retorno padronizado; atualiza lastSendError em falha. |
| **sendVerificationEmail** | Idem. |
| **getStatus()** | Objeto de status para auditoria e debug. |
| **getStats()** | Compatível; inclui campos de getStatus(). |
| **isEmailConfigured()** | Mantido (alias de estado configurado). |

Estados possíveis do serviço:

- **Não configurado:** sem SMTP_PASS/GMAIL_APP_PASSWORD; transporter = null; isConfigured = false.
- **Configurado mas indisponível:** transporter existe; verify falhou ou ainda pendente; isVerified = false; lastVerifyError preenchido em caso de falha.
- **Configurado e saudável:** verify ok; isConfigured = true; isVerified = true; lastVerifyError = null.

---

## 6. Impacto no startup do backend

- **Nenhuma dependência de SMTP para o boot:** assertRequiredEnv em server-fly.js não exige variáveis de e-mail; require('./services/emailService') não faz throw; verify roda em background e toda rejeição é tratada com .catch().
- **Health check:** /health não chama emailService; continua retornando 200 com base em Supabase e Mercado Pago.
- **Comportamento esperado:** com SMTP inválido ou ausente, o backend sobe; a primeira requisição a forgot-password recebe 503 com mensagem controlada; o processo não encerra por falha de e-mail.

---

## 7. Riscos eliminados

- Crash do processo por unhandled rejection na verificação SMTP.
- Startup bloqueado ou dependente de SMTP.
- Estado do serviço de e-mail não observável (agora getStatus() e getStats()).
- Exceções do emailService propagadas para server-fly.js (retornos controlados).
- Log de token completo ou credenciais em produção (apenas truncados/mascarados conforme regras acima).

---

## 8. Riscos remanescentes

- **Gmail fora do ar ou limitando envio:** o serviço falha de forma controlada (lastSendError, retorno success: false); o backend continua de pé.
- **Credenciais corretas mas expiradas/revogadas:** verify falha; isVerified = false; envios retornam erro até atualização de secrets.
- **Uso de getStats() com shape antigo:** mantido e estendido; qualquer consumidor que espere apenas configured/service/user/frontendBaseUrl continua atendido.

---

## 9. Conclusão objetiva

O emailService opera em **SMTP safe mode**: falhas de SMTP não derrubam o backend; a verificação não bloqueia o startup; o estado é explícito e inspecionável; as chamadas de envio falham de forma controlada e previsível; não há Promises sem tratamento nem exceções escapando do módulo. O contrato com server-fly.js (forgot-password → 503 quando envio falha) foi preservado. Nenhuma alteração foi feita em lógica de autenticação, rotas, banco, server-fly.js ou fly.toml.

---

*Hardening aplicado em 2026-03-09. Validação recomendada: deploy com SMTP inválido ou ausente e confirmação de que o app sobe, /health retorna 200 e forgot-password retorna 503 quando o envio não for possível.*
