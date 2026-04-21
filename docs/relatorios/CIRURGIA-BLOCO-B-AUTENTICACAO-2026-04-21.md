# CIRURGIA — BLOCO B — AUTENTICAÇÃO

## 1. Resumo executivo
Foram corrigidos os pontos críticos do BLOCO B com escopo estrito no runtime canônico (`server-fly.js`) e serviço de e-mail (`services/emailService.js`), além de compatibilidade mínima no `AuthContext`.

Riscos eliminados nesta cirurgia:
- reset password com risco de sucesso parcial sem invalidação confiável do token;
- vazamento de token/link sensível em logs de recuperação;
- divergência de shape de `user` entre login/register/profile com risco de inconsistência no frontend.

## 2. Confirmação da base limpa
A cirurgia foi iniciada em base limpa derivada do checkpoint seguro:
- Worktree cirúrgica criada a partir da tag `pre-bloco-b-autenticacao-2026-04-21`;
- HEAD inicial confirmado em `61e08e9` (tag e checkpoint de preparação);
- `git status --short --branch` na worktree cirúrgica retornou apenas `## cirurgia/bloco-b-auth` (sem arquivos modificados);
- runtime alvo confirmado em `server-fly.js` com rotas ativas `/api/auth/forgot-password`, `/api/auth/reset-password` e `/api/auth/login`.

## 3. Arquivos alterados
- `server-fly.js`
- `services/emailService.js`
- `goldeouro-player/src/contexts/AuthContext.jsx`

## 4. Correções aplicadas

### reset password
- Fluxo reestruturado para validar estado do token com distinção explícita:
  - token inexistente: `Token inválido`;
  - token já usado: `Token já utilizado`;
  - token expirado: `Token expirado`.
- Consumo do token (`used=true`) passou a ocorrer antes da troca de senha com guarda de concorrência (`eq('used', false)`), reduzindo risco de reutilização.
- Em falha de atualização de senha após consumo, foi adicionada compensação (`used=false`) para evitar bloqueio indevido por erro transitório.
- Resultado: eliminação do cenário anterior em que senha podia ser alterada e token permanecer reutilizável.

### email/logs
- Removido log de token completo quando serviço de e-mail não está configurado.
- Removido log de link de reset no fluxo de falha de envio em `forgot-password`.
- `sendVerificationEmail` deixou de retornar sucesso falso quando serviço está indisponível; agora retorna erro operacional seguro (`success: false`).

### contrato de user
- Criado normalizador backend `buildAuthUserPayload` para unificar shape de usuário entre login/register/profile.
- Payload padronizado inclui campos compatíveis: `id`, `email`, `username`, `nome`, `saldo`, `tipo`, `total_apostas`, `total_ganhos`, `total_gols_de_ouro`.
- `login`, `register` e `profile` passaram a emitir contrato alinhado.

### compatibilidade frontend
- Adicionado normalizador mínimo no `AuthContext` (`normalizeAuthUser`) para robustez de compatibilidade no consumo de `user`.
- `login`, `register` e restore de sessão por `PROFILE` passam por normalização local antes de `setUser`.
- Ajuste pontual, sem refatoração de arquitetura de auth.

## 5. O que foi preservado
- login principal (`/api/auth/login`);
- cadastro (`/api/auth/register`);
- compatibilidade de `/auth/login`;
- proteção de rotas via `ProtectedRoute`;
- logout client-side (sem introdução de logout server-side);
- política anti-enumeração no forgot password para e-mail inexistente (mensagem genérica preservada).

## 6. Riscos eliminados
- risco de senha alterada com token potencialmente reutilizável por falha na etapa de invalidação;
- risco de exposição indevida de segredo (token/link) em logs do fluxo de recuperação;
- risco de inconsistência de shape de `user` entre endpoints críticos de auth e consumo inicial no frontend.

## 7. Riscos remanescentes
- ausência de transação SQL real multi-operação (foi aplicado controle lógico + compensação; transação nativa exigiria função transacional no banco);
- validação final de comportamento depende de Execução Controlada de Runtime com Supabase/SMTP reais;
- ambiente com `SMTP` indisponível continuará retornando erro operacional (comportamento esperado), exigindo monitoramento em runtime.

## 8. Testes locais/mínimos realizados
- Validação de base limpa antes da cirurgia (worktree derivada da tag segura).
- Verificação de sintaxe:
  - `node --check server-fly.js`
  - `node --check services/emailService.js`
- Verificação de lint nos arquivos alterados:
  - `server-fly.js`
  - `services/emailService.js`
  - `goldeouro-player/src/contexts/AuthContext.jsx`
- Não foram executados testes de integração/runtime reais nesta etapa (ficam para Execução Controlada de Runtime).

## 9. Classificação da cirurgia
**CONCLUÍDA COM RESSALVAS**

## 10. Conclusão objetiva
O BLOCO B foi corrigido no escopo cirúrgico definido e está tecnicamente apto para avançar para **Execução Controlada de Runtime**.

Ressalva objetiva: a validação final de comportamento operacional (Supabase + SMTP reais + cenários de token expirado/reutilizado em ambiente) ainda depende da próxima etapa do pipeline.
