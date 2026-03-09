# Relatório executivo — V1 do jogo Gol de Ouro

**Destinatários:** Sócios  
**Data:** 2026-03-06  
**Base:** Relatórios de encerramento da etapa financeira V1 e validação E2E da jornada do jogador.

---

## Resumo executivo

A **primeira versão funcional (V1)** do jogo Gol de Ouro foi auditada, corrigida e validada. O produto está **estável em produção**: frontend em www.goldeouro.lol (Vercel) e backend em produção (Fly, release v315). Os fluxos de **cadastro, login, depósito PIX, saldo, jogo (chute), saque e persistência** foram validados; a parte financeira (depósitos, saques, rollback em caso de falha) está consistente e com trilha (ledger). **A V1 está pronta para demonstração aos sócios**, com ressalvas não bloqueantes descritas adiante.

---

## Objetivo da V1

- Entregar uma **jornada completa do jogador**: cadastro → login → depósito via PIX → visualização de saldo → entrada no jogo → chute (aposta) → resultado → saque PIX → persistência dos dados.
- Garantir **segurança operacional**: rejeições de saque (timeout ou falha do provedor) devolvem o saldo e ficam registradas; backend em produção sem alterar a experiência atual do frontend.
- Estabelecer **base confiável** para as próximas etapas do produto (novas funcionalidades, melhorias de UX, escala).

---

## O que foi validado

- **Jornada E2E (APIs e página do jogo):** Cadastro de usuário, login, perfil e saldo, criação de depósito PIX (QR Code e código copy-paste), carregamento da página do jogo (/game), endpoint de chute (com validação de saldo), endpoint de saque (com validação de valor e chave PIX), segundo login e verificação de persistência de dados.
- **Backend financeiro:** Depósitos PIX (webhook e reconciliação), saques PIX (solicitação, worker, reconciliador), rollback de saldo e registro no ledger quando o saque é rejeitado, consistência entre saldo e movimentações.
- **Frontend e infraestrutura:** Páginas /game e /dashboard acessíveis e estáveis; deploy do backend concluído (v315); frontend preservado (nenhuma alteração não planejada no Vercel).

---

## O que está funcionando

| Área | Status | Descrição |
|------|--------|-----------|
| **Cadastro** | OK | Criação de usuário com e-mail e senha; retorno de token e saldo inicial. |
| **Login** | OK | Autenticação e geração de sessão/token; redirecionamento para dashboard/jogo. |
| **Saldo** | OK | Exibição e persistência do saldo; API de perfil operacional. |
| **Depósito PIX** | OK | Geração do PIX (QR Code e código copy-paste); confirmação via webhook quando o pagamento é aprovado no Mercado Pago. |
| **Página do jogo** | OK | Acesso a /game; carregamento do palco (campo, goleiro, bola, botões de chute). |
| **Chute (aposta)** | OK | Escolha de direção e valor; validação de saldo; envio ao backend e retorno do resultado (gol ou perda). |
| **Saque PIX** | OK | Solicitação de saque, validação de valor e chave PIX; processamento pelo worker; em caso de falha, devolução do saldo e registro no ledger. |
| **Persistência** | OK | Dados da conta (saldo, histórico) mantidos após logout e novo login. |

---

## Ressalvas não bloqueantes

- **Demonstração de depósito:** A confirmação do depósito depende de pagamento PIX real (ou ambiente de teste do Mercado Pago). Na demo, é recomendável usar um PIX de valor baixo ou ambiente de teste para mostrar o crédito no saldo.
- **Demonstração de saque:** O fluxo completo de saque (até o dinheiro cair na conta) exige saldo na conta de demonstração e chave PIX válida (e-mail, CPF ou celular). Pode ser mostrado em ambiente controlado ou apenas a tela de solicitação e o histórico.
- **Casos históricos:** Existe 1 saque antigo (anterior às correções) sem rollback registrado e 1 caso inconclusivo; não impactam novos fluxos e podem ser tratados manualmente se necessário.
- **Deploy:** Em futuros deploys do backend, pode ser necessário usar deploy em dois passos (app e depois worker) conforme documentação interna; não afeta a operação atual.

Nenhuma dessas ressalvas impede a demonstração da V1 aos sócios.

---

## Status atual do produto

- **Frontend:** Em produção em https://www.goldeouro.lol (Vercel). Páginas /game e /dashboard estáveis; nenhuma alteração não planejada durante a etapa V1.
- **Backend:** Em produção (Fly, release v315). Versão 1.2.1; health check e APIs de jogo, pagamentos e saques operacionais.
- **Financeiro:** Depósitos e saques PIX funcionais; rollback e ledger ativos para rejeições; saldo e histórico consistentes.
- **Rollback:** Existe release anterior estável (v305) documentada para rollback de emergência, se necessário.

---

## Conclusão: V1 pronta para demonstração

Com base nos relatórios de encerramento da etapa financeira V1 e na validação E2E da jornada do jogador:

- **A V1 do jogo Gol de Ouro está pronta para demonstração aos sócios.**
- Os fluxos de cadastro, login, depósito PIX, saldo, jogo (chute), saque e persistência estão operacionais e validados.
- A parte financeira está estável, com rollback e trilha (ledger) em caso de rejeição de saque.
- As ressalvas listadas são conhecidas e não bloqueantes; a demonstração pode ser feita em ambiente controlado (PIX real ou teste, conta com saldo e chave PIX válida para saque).

Recomenda-se usar o **Roteiro de demonstração V1** (ROTEIRO-DEMO-V1-GOLDEOURO.md) para preparar e conduzir a apresentação.

---

*Documento gerado com base exclusiva em relatórios existentes; modo READ-ONLY.*
