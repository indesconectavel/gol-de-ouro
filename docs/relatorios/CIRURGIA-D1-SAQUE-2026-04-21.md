# CIRURGIA — D1 — SAQUE

## 1. Resumo executivo

Foi corrigido o desalinhamento funcional do D1 na tela de saque. O frontend deixou de usar fluxo de deposito PIX e passou a usar o endpoint real de saque do backend (`POST /api/withdraw/request`), com payload aderente ao contrato existente (`valor`, `chave_pix`, `tipo_chave`). Tambem foi corrigida a fonte do historico para o endpoint de saque (`GET /api/withdraw/history`) para manter coerencia semantica da tela.

## 2. Confirmacao da base limpa

- Branch de cirurgia: `hotfix/d1-saque-2026-04-21`
- Base: `origin/main`
- SHA base: `a315c21e02cda47fbf06f212fe919ec3ac1cf5b1`
- Evidencia inicial registrada: `working tree clean` antes da edicao.

## 3. Arquivos alterados

- `goldeouro-player/src/pages/Withdraw.jsx`

## 4. Correcoes aplicadas

### endpoint do saque

- Removida a chamada de saque via `paymentService.createPix()` (fluxo de deposito).
- Implementada chamada direta para `POST ${API_ENDPOINTS.WITHDRAW}/request`.

### contrato/payload

- Payload alinhado ao backend real:
  - `valor`
  - `chave_pix`
  - `tipo_chave`
- Incluida normalizacao de tipo de chave para o contrato do backend:
  - `phone` -> `telefone`
  - `random` -> `aleatoria`

### tratamento de resposta

- Sucesso: leitura de `response.data.success`, exibicao de sucesso, atualizacao local de saldo e recarga do historico.
- Erro: exibicao da mensagem retornada pelo backend (`err.response.data.message`) com fallback.

### historico, se aplicavel

- Historico da tela passou de fonte de PIX/deposito para fonte de saque:
  - de `paymentService.getUserPix()`
  - para `GET ${API_ENDPOINTS.WITHDRAW}/history`
- Normalizacao de itens do historico para render atual da tela (`amount`, `pixKey`, `status`, `date`).

## 5. O que foi preservado

- Fluxo de deposito PIX: nao alterado.
- Leitura de saldo via perfil: preservada.
- Autenticacao da tela: preservada (mesmo `apiClient` com token).
- Navegacao da tela: preservada.
- Backend financeiro e regras de negocio: nao alterados.
- Escopo D2, D3 e D4: nao tocados.

## 6. Riscos eliminados

- Eliminado o risco de operacao invertida na tela de saque (saque disparando endpoint de deposito).
- Eliminado o desalinhamento de contrato frontend/backend no envio da solicitacao de saque.
- Eliminada a incoerencia principal de historico vinculado a fonte errada de operacao.

## 7. Riscos remanescentes

- D2: trilha contabil de deposito/ledger permanece fora deste escopo.
- D3: drift de schema financeiro permanece fora deste escopo.
- D4: atomicidade/concurrencia global dos fluxos financeiros permanece fora deste escopo.

## 8. Testes minimos realizados

- Validacao de codigo da tela:
  - confirmada chamada para `POST ${API_ENDPOINTS.WITHDRAW}/request`;
  - confirmada chamada para `GET ${API_ENDPOINTS.WITHDRAW}/history`;
  - confirmado payload com `valor`, `chave_pix`, `tipo_chave`.
- Validacao de linter no arquivo alterado:
  - sem erros em `goldeouro-player/src/pages/Withdraw.jsx`.
- Build frontend:
  - tentativa executada com `npm run build`;
  - ambiente local sem `vite` no PATH (`'vite' nao e reconhecido...`), impedindo validacao de build completa nesta execucao.

## 9. Classificacao da cirurgia

**CONCLUIDA COM RESSALVAS**

## 10. Conclusao objetiva

O D1 foi corrigido no frontend com escopo cirurgico estrito: a tela de saque agora usa o endpoint correto do backend e contrato coerente de requisicao/resposta. A cirurgia esta pronta para avancar para **Execucao Controlada de Runtime**, com ressalva de que a validacao de build local completo depende de ambiente com `vite` disponivel.

