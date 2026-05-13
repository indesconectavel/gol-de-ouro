# Smoke real — `/auditoria` (admin produção)

**Data do teste:** 2026-05-13  
**Alvo:** `https://admin.goldeouro.lol`  
**Escopo:** smoke manual autenticado conforme prompt cirúrgico (sem alteração de código ou deploy).

---

## Resumo executivo

| Item | Resultado |
|------|-----------|
| Login | Sessão já existente no browser (sem credenciais fornecidas; não foi necessário nem possível inventar login). |
| `/auditoria` | Carregou após reload; UI de auditoria visível. |
| Network (GET `/api/admin/audit/logs`) | **Não validado pelo painel DevTools** nesta execução: a ferramenta de rede do browser MCP só reportou o documento principal (`GET /auditoria`, 200), **sem listagem de XHR/fetch** para `/api/admin/audit/logs`. |
| Status HTTP da API | **Inferido** pelo comportamento da UI: tabela populada com registos consistentes (sem mensagem de erro visível). |
| Dados reais | **Sim** — linhas com `user.block` / `user.unblock`, UUIDs de admin e alvo, IP e metadata JSON (ex.: `{"mode": "block", "reason_len": 23}`). |
| Tabela renderizada | **Sim** — cabeçalhos e linhas visíveis em captura full-page. |
| Filtro `action` | **Sim** — preenchido `user.block` + **Atualizar**; tabela passou a mostrar apenas a linha `user.block`. |
| `/logs` | Navegação para `https://admin.goldeouro.lol/logs` OK (título *Painel Gol de Ouro*, URL correta). Snapshot de acessibilidade mostrou **apenas navegação lateral** (Painel, Usuários, …, Sair); **não foi possível confirmar** texto “Logs do Sistema”, loader ou empty state nas capturas (viewport/screenshot mostrou sobretudo o fundo do layout). |

---

## Classificação

**ACEITA COM RESSALVAS**

**Motivos das ressalvas:**

1. **Network:** não houve evidência direta (linha de pedido com URL e status) para `GET /api/admin/audit/logs` no relatório de rede disponível ao agente — apenas confirmação funcional pela UI.
2. **`/logs`:** rota acedida e sessão aparentemente ativa, mas **conteúdo da página de logs não ficou demonstrado** nas observações objetivas desta sessão.

---

## Próximo passo opcional (humano)

Repetir em Chrome local: DevTools → Network → filtrar `audit/logs` e abrir `/logs` com viewport largo, para fechar as duas ressalvas acima.
