# ✅ CHECKLIST COMPLETO DE AUDITORIA - GO-LIVE

## 🎯 OBJETIVO

Validar 100% do sistema antes do lançamento oficial para jogadores reais.

---

## 📋 CHECKLIST POR MCP

### **MCP 1 — Auditoria de Backend**

- [ ] Health check retorna 200 OK
- [ ] Meta info retorna versão e build date
- [ ] Rotas principais respondem corretamente
- [ ] Admin stats funciona com token válido
- [ ] Rotas protegidas retornam 401 sem token
- [ ] Rate limiting está ativo
- [ ] Webhook PIX está configurado
- [ ] Sistema ACID funcionando
- [ ] RLS habilitado no Supabase
- [ ] Search_path corrigido nas funções

---

### **MCP 2 — Auditoria do Front Admin**

- [ ] Login funciona
- [ ] Dashboard carrega dados reais
- [ ] Lista de usuários funciona
- [ ] Filtros funcionam
- [ ] Paginação funciona
- [ ] Relatórios financeiros corretos
- [ ] Relatórios de chutes corretos
- [ ] Exportações funcionam
- [ ] Navegação entre páginas funciona
- [ ] Logout funciona

---

### **MCP 3 — Auditoria do Mobile**

- [ ] Login funciona
- [ ] API calls funcionam
- [ ] WebSocket conecta
- [ ] Parâmetros corretos (direction, amount)
- [ ] Navegação funciona
- [ ] Tela de chute funciona
- [ ] Fluxo financeiro funciona
- [ ] PIX cria pagamento
- [ ] Saldo atualiza corretamente

---

### **MCP 4 — Auditoria Financeira PIX**

- [ ] PIX criado com sucesso
- [ ] Código copia e cola presente
- [ ] QR Code presente
- [ ] Webhook recebido (após pagamento real)
- [ ] Idempotência funcionando
- [ ] Saldo creditado corretamente
- [ ] Transação registrada
- [ ] Extrato atualizado
- [ ] Conciliação funcionando
- [ ] Sem inconsistências financeiras

---

### **MCP 5 — Auditoria do WebSocket**

- [ ] Conexão estabelecida
- [ ] Autenticação funciona
- [ ] Reconexão automática funciona
- [ ] Broadcast funciona
- [ ] Eventos corretos enviados/recebidos
- [ ] Sem erros silenciosos
- [ ] Latência aceitável (< 500ms)
- [ ] Timeouts configurados
- [ ] Cancelamentos funcionam

---

### **MCP 6 — Auditoria dos Lotes**

- [ ] Lotes criados automaticamente
- [ ] Jogadores entram no lote
- [ ] Chute registrado corretamente
- [ ] Persistência no banco funciona
- [ ] Finalização funciona
- [ ] Ganhador identificado corretamente
- [ ] Recompensa creditada
- [ ] Histórico registrado

---

### **MCP 7 — Auditoria de Performance**

- [ ] Latência < 500ms (p95)
- [ ] Tempo de resposta < 1s (p95)
- [ ] Taxa de erro < 1%
- [ ] TPS suportado adequado
- [ ] Teste de carga leve passa

---

### **MCP 8 — Auditoria de Segurança**

- [ ] JWT válido e expira corretamente
- [ ] WebSocket tokens funcionam
- [ ] Admin tokens funcionam
- [ ] Variáveis de ambiente seguras
- [ ] RLS habilitado e funcionando
- [ ] Policies corretas
- [ ] Search_path corrigido
- [ ] Rate limiting ativo

---

## 🔥 CHECKLIST POR MODO

### **MODO A — Testes Financeiros Reais**

- [ ] PIX real criado
- [ ] Código PIX válido
- [ ] Pagamento realizado (manual)
- [ ] Webhook recebido
- [ ] Saldo creditado
- [ ] Transação registrada
- [ ] Extrato atualizado
- [ ] Sem inconsistências

---

### **MODO B — Testes de Lote + Chute**

- [ ] 10 jogadores criados
- [ ] Todos entram no lote
- [ ] Chutes registrados
- [ ] Lote finalizado
- [ ] Ganhador identificado
- [ ] Recompensa creditada
- [ ] Histórico registrado

---

### **MODO C — Testes do WebSocket**

- [ ] Múltiplas conexões simultâneas
- [ ] Reconexão automática testada
- [ ] Queda de internet simulada
- [ ] Burst de eventos testado
- [ ] Sem erros silenciosos

---

### **MODO D — Testes do Admin**

- [ ] Dashboard completo
- [ ] Relatórios corretos
- [ ] Saques funcionam
- [ ] Transações corretas
- [ ] Chutes corretos
- [ ] Exportações funcionam

---

### **MODO E — Teste Total (RECOMENDADO)**

- [ ] Todos os modos anteriores executados
- [ ] PIX real testado
- [ ] Lote real testado
- [ ] Chute real testado
- [ ] Admin testado
- [ ] WebSocket testado
- [ ] Auditoria cruzada realizada
- [ ] Sem divergências críticas

---

## ✅ CRITÉRIOS DE APROVAÇÃO

### **Aprovado:**
- ✅ Todos os itens críticos passam
- ✅ Sem divergências financeiras
- ✅ Performance aceitável
- ✅ Segurança validada

### **Aprovado com Ressalvas:**
- ⚠️ Itens não críticos com problemas menores
- ⚠️ Problemas conhecidos documentados
- ⚠️ Plano de correção definido

### **Reprovado:**
- ❌ Itens críticos falhando
- ❌ Divergências financeiras
- ❌ Problemas de segurança
- ❌ Performance inaceitável

---

## 📝 TEMPLATE DE RELATÓRIO

Ver: `docs/MASTER-PROMPT-FINAL-v4.0.md`

---

**Status:** ✅ **CHECKLIST PREPARADO - AGUARDANDO COMANDO PARA INICIAR**

