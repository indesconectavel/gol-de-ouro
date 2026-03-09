# Roteiro de demonstração — V1 Gol de Ouro

**Objetivo:** Guiar a apresentação da V1 do jogo Gol de Ouro aos sócios, em ordem clara e com plano B caso PIX real não seja testado ao vivo.  
**Base:** Validação E2E e relatórios de encerramento V1.

---

## 1) Preparação antes da demo

- **Ambiente:** Confirmar que https://www.goldeouro.lol está acessível e que o backend responde (ex.: https://goldeouro-backend-v2.fly.dev/health retorna status ok).
- **Conta de demonstração:** Ter um e-mail e senha para cadastro novo **ou** uma conta já criada com saldo (se quiser mostrar chute e saque sem depósito ao vivo).
- **PIX para depósito:** Decidir antes:
  - **Opção A:** PIX real com valor baixo (ex.: R$ 5) para mostrar crédito no saldo.
  - **Opção B:** Não usar PIX real; seguir o Plano B abaixo (mostrar apenas geração do PIX e telas).
- **Dispositivo:** Celular ou navegador estável; boa conexão de internet.
- **Tempo estimado:** 15–25 minutos (com PIX real); 10–15 minutos (sem PIX real, Plano B).

---

## 2) Ordem ideal da apresentação

| Ordem | Etapa | Duração sugerida |
|-------|--------|-------------------|
| 1 | Abertura e contexto da V1 | 1–2 min |
| 2 | Cadastro (ou login se conta já existir) | 1–2 min |
| 3 | Login e primeira tela (dashboard/saldo) | 1 min |
| 4 | Depósito PIX (geração do PIX; pagamento se Opção A) | 2–5 min |
| 5 | Saldo atualizado (se houve confirmação) | 1 min |
| 6 | Entrada no jogo (/game) e explicação do palco | 1–2 min |
| 7 | Chute (aposta) e resultado | 2–3 min |
| 8 | Saldo após o chute | 1 min |
| 9 | Saque PIX (solicitação e histórico) | 2 min |
| 10 | Logout e login novamente (persistência) | 1–2 min |
| 11 | Conclusão e próximos passos | 1–2 min |

---

## 3) O que mostrar em cada etapa

- **Cadastro:** Tela de registro; preencher e-mail, senha e nome; mostrar mensagem de sucesso e entrada na área logada.
- **Login:** Tela de login; e-mail e senha; redirecionamento para dashboard ou jogo.
- **Saldo inicial:** Apontar o saldo exibido (0 para conta nova ou valor existente).
- **Depósito PIX:** Tela de depósito; informar valor (ex.: R$ 5); mostrar QR Code e/ou código copy-paste gerados; explicar que o usuário paga pelo app do banco e o saldo é creditado após confirmação. Se Opção A: fazer o pagamento e aguardar atualização do saldo (pode levar alguns segundos a 1 minuto).
- **Jogo:** Abrir /game; mostrar campo, goleiro, bola e botões de chute (direções e valores de aposta).
- **Chute:** Escolher direção e valor; clicar em chutar; mostrar resultado (gol ou não) e que o saldo foi atualizado (aposta debitada; prêmio se gol).
- **Saque:** Ir à área de saque; informar valor (mín. R$ 10) e chave PIX (e-mail, CPF ou celular); mostrar confirmação e histórico de saques (solicitado / processando / concluído).
- **Persistência:** Fazer logout; fazer login de novo com a mesma conta; mostrar que saldo e histórico continuam corretos.

---

## 4) O que falar para os sócios

- **Abertura:** “Esta é a primeira versão funcional (V1) do Gol de Ouro. Vamos percorrer a jornada completa do jogador: cadastro, login, depósito via PIX, jogo (chute com aposta), saque e persistência dos dados.”
- **Cadastro/Login:** “O usuário se cadastra com e-mail e senha ou faz login se já tiver conta. O sistema mantém sessão e saldo.”
- **Depósito:** “O depósito é via PIX. O jogador escolhe o valor, o sistema gera o QR Code ou o código copy-paste. Após o pagamento no app do banco, o saldo é creditado automaticamente.”
- **Jogo:** “No jogo, o jogador escolhe a direção do chute e o valor da aposta. O sistema valida o saldo, processa o chute e devolve o resultado (gol ou não), atualizando o saldo.”
- **Saque:** “O saque também é PIX. O jogador informa valor e chave PIX. A solicitação é processada em background; em caso de falha no provedor, o saldo é devolvido e fica registrado para auditoria.”
- **Persistência:** “Após logout e novo login, os dados da conta permanecem: saldo e histórico. A V1 está estável e pronta para evoluir para as próximas funcionalidades.”

---

## 5) Pontos de atenção

- **Tempo de confirmação do PIX:** Pode levar de alguns segundos a pouco mais de 1 minuto; avisar os sócios para evitar interpretação de falha.
- **Chave PIX no saque:** Usar chave válida (e-mail, CPF ou celular já cadastrado no PIX); chaves inválidas geram mensagem de erro (comportamento esperado).
- **Saldo para chute:** É necessário saldo suficiente para a aposta (ex.: R$ 1, 2, 5 ou 10); sem saldo, o sistema informa “Saldo insuficiente”.
- **Rede:** Se a conexão falhar, recarregar a página e fazer login novamente; a sessão pode expirar após certo tempo.

---

## 6) Plano B — Caso PIX real não seja testado ao vivo

Se não for possível fazer um PIX real durante a reunião:

1. **Cadastro e login:** Seguir normalmente.
2. **Depósito:** Mostrar a tela de depósito, informar valor (ex.: R$ 5), **mostrar o QR Code e o código copy-paste gerados**. Dizer: “Aqui o jogador pagaria pelo app do banco; em ambiente real o saldo é creditado em segundos. A integração com o Mercado Pago está validada e em produção.”
3. **Jogo e chute:** Se houver uma **conta de demonstração com saldo** (preparada antes), usar essa conta para mostrar chutes e atualização de saldo. Se não houver saldo: mostrar a tela do jogo, os botões de chute e explicar que “com saldo, o jogador escolhe direção e valor, chuta e vê o resultado com atualização de saldo; isso foi validado nos testes E2E.”
4. **Saque:** Mostrar a tela de solicitação de saque (valor e chave PIX) e o histórico. Explicar: “Com saldo e chave PIX válida, o saque é processado em background; em caso de falha, o saldo é devolvido automaticamente.”
5. **Persistência:** Fazer logout e login novamente com a mesma conta; mostrar que os dados permanecem.

**Mensagem para os sócios no Plano B:** “A demonstração ao vivo do crédito do PIX e do saque completo pode ser feita em um ambiente controlado ou em outra sessão; os fluxos foram validados tecnicamente e estão em produção.”

---

## 7) Conclusão final da demonstração

- Reforçar que **a V1 está em produção e estável**: cadastro, login, depósito PIX, jogo (chute), saque e persistência funcionando.
- Mencionar que **a parte financeira foi auditada**: rollback em caso de rejeição de saque, registro no ledger e consistência de saldo.
- Indicar **próximos passos** (conforme definido com o produto): novas funcionalidades, melhorias de UX, possíveis testes com mais usuários, etc.
- Agradecer e deixar espaço para perguntas.

---

*Roteiro baseado nos relatórios de validação E2E e encerramento da etapa financeira V1. Nenhuma alteração de código ou deploy foi feita para gerar este documento.*
