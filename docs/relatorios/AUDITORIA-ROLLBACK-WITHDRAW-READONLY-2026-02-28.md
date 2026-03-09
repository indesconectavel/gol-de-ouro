# Auditoria de Rollback — Sistema de Saques (READ-ONLY)

**Data:** 2026-02-28  
**Modo:** READ-ONLY (não alterar código, banco ou disparar payouts).  
**Objetivo:** Determinar se houve rollback no backend após o POST /api/withdraw/request, usando apenas evidências não destrutivas (responses do DevTools, logs do Fly, status do app). Não expor tokens/segredos; mascarar se necessário.

---

## 1. Entrada (o que você cola para análise)

Preencha e cole quando for analisar:

- **Response do POST /api/withdraw/request** (incluindo `correlation_id` e `id` do saque, se existir). Mascarar: Bearer token, dados pessoais (CPF, e-mail).
- **Response do GET /api/user/profile** (campo `data.saldo`).
- **Response do GET /api/withdraw/history** (status do saque correspondente: `pendente`, `processado`, `falhou`, etc.).
- **Horário aproximado do teste** (America/Sao_Paulo), ex.: `2026-02-28 17:30`.

---

## 2. Comandos READ-ONLY do Fly (PowerShell)

App: **goldeouro-backend-v2**. Todos os comandos são só leitura (nenhum `deploy`, `ssh`, `console` que altere estado).

### 2.1 Status do app e máquinas

```powershell
flyctl status --app goldeouro-backend-v2
flyctl machines list --app goldeouro-backend-v2
```

### 2.2 Capturar logs no intervalo do teste

Defina o horário de início e fim em America/Sao_Paulo. Os logs do Fly vêm em UTC; ajuste mentalmente ou use uma janela maior.

**Opção A — Capturar logs e filtrar (sem alterar nada):**

```powershell
# Capturar logs (ajuste --no-tail conforme sua versão do flyctl; se não existir, use apenas flyctl logs e Ctrl+C após alguns segundos)
flyctl logs --app goldeouro-backend-v2 2>&1 | Tee-Object -FilePath "$env:TEMP\fly-logs-withdraw.txt" | Select-Object -First 500

# Filtrar por correlation_id (substituir CORRELATION_ID pelo valor da response do POST)
Get-Content "$env:TEMP\fly-logs-withdraw.txt" -ErrorAction SilentlyContinue | Select-String -Pattern "CORRELATION_ID"

# Filtrar por rota do withdraw
Get-Content "$env:TEMP\fly-logs-withdraw.txt" -ErrorAction SilentlyContinue | Select-String -Pattern "/api/withdraw/request"

# Filtrar por palavras de rollback/payout/webhook
Get-Content "$env:TEMP\fly-logs-withdraw.txt" -ErrorAction SilentlyContinue | Select-String -Pattern "rollback|falhou|payout|webhook|PAYOUT|WITHDRAW|SAQUE" -AllMatches
```

*Alternativa:* executar `flyctl logs --app goldeouro-backend-v2` e deixar rodando durante o teste; depois usar os `Get-Content` no arquivo gravado. Se a versão do flyctl tiver `--no-tail`, use `flyctl logs --app goldeouro-backend-v2 --no-tail 2>&1 | Out-File "$env:TEMP\fly-logs-withdraw.txt"` para um snapshot sem pipe aberto.

**Opção B — Filtrar direto no pipe (sem salvar arquivo):**

```powershell
# Logs em tempo real filtrados (Ctrl+C para parar)
flyctl logs --app goldeouro-backend-v2 2>&1 | Select-String -Pattern "withdraw|SAQUE|rollback|ROLLBACK|falhou|payout|PAYOUT|webhook|WEBHOOK"
```

**Opção C — Buscar por correlation_id específico (substituir `SEU_CORRELATION_ID`):**

```powershell
flyctl logs --app goldeouro-backend-v2 --no-tail 2>&1 | Select-String -Pattern "SEU_CORRELATION_ID"
```

**O que procurar nos resultados:**

| Padrão no log | Significado |
|---------------|-------------|
| `[SAQUE] Início` | Request de saque chegou. |
| `[SAQUE] Sucesso` | Saque criado; saldo debitado. |
| `[SAQUE][ROLLBACK] Início` | Rollback foi executado (saldo devolvido). |
| `[SAQUE] Erro ao debitar saldo` | Falha no débito; pode ser seguido de rollback. |
| `[SAQUE] Falha ao reverter saldo` | Tentativa de rollback após erro ao criar saque. |
| `[WEBHOOK][MP]` ou `webhook` | Webhook Mercado Pago (payout/confirmação). |
| `PAYOUT` / `payout` | Worker ou fluxo de payout. |

Se aparecer **`[SAQUE][ROLLBACK] Início`** com o mesmo `correlationId` (ou próximo no tempo) do seu POST, houve rollback para esse saque.

---

## 3. Como interpretar (evidências das 3 responses)

### 3.1 Regras de interpretação

| Situação | Interpretação |
|----------|----------------|
| **POST success true** + status do saque **"pendente"** + **saldo voltou** (GET profile com saldo igual ao anterior) | **Rollback provável.** O backend debitou no request; depois algo (worker/webhook ou erro) disparou rollback e devolveu o saldo. Confirmar com logs: buscar `[SAQUE][ROLLBACK]` e o `correlation_id` do POST. |
| **POST success true** + status do saque **"falhou"** + **saldo voltou** | **Rollback esperado.** O fluxo marcou o saque como falhou e fez rollback (saldo reconstituído). Coerente com o desenho do sistema. |
| **POST success true** + status **"pendente"** + **saldo voltou** | **Inconsistente.** Pode ser: (1) rollback silencioso (saldo devolvido mas status não atualizado para falhou), (2) GET profile de outro usuário/token, (3) profile em cache. Verificar nos logs se existe `[SAQUE][ROLLBACK]` para o `correlation_id`; comparar id do usuário no profile com o do request. |
| **POST success true** + **saldo debitado** (profile com saldo menor) | Sem rollback para esse request; fluxo correto. |
| **POST não apareceu** na Network | Não é rollback; front não chamou o backend (bundle antigo/cache/CORS). |

### 3.2 Resumo

- **Rollback provável:** POST 200 + success true + saldo “voltou” → procurar no Fly por `[SAQUE][ROLLBACK]` e pelo `correlation_id` da response do POST.
- **Rollback esperado:** status do saque = `falhou` (ou equivalente) + saldo voltou.
- **Inconsistente:** status `pendente` e saldo voltou → checar logs de rollback e token/profile/cache.

---

## 4. Tabela de decisão (preencher com as 3 responses)

Com base apenas nas 3 responses (POST request, GET profile, GET history) e no horário do teste:

| # | Pergunta | Resposta (SIM/NÃO) |
|---|----------|--------------------|
| D1 | A response do POST tinha `success: true` (ou 200 com body de sucesso)? | |
| D2 | Na response do GET profile (última após o saque), o `data.saldo` é **menor** que o saldo antes do saque? | |
| D3 | Na response do GET history, o item do saque tem `status` = "falhou" (ou "falhou", "cancelado")? | |
| D4 | Na response do GET history, o item do saque tem `status` = "pendente" (ou "aguardando_confirmacao", "processando")? | |

**Classificação:**

| D1 | D2 | D3 | D4 | Conclusão |
|----|----|----|-----|-----------|
| SIM | NÃO | - | - | Saldo voltou após sucesso no POST → **Rollback provável ou profile/token/cache.** Executar comandos da seção 2 e buscar `[SAQUE][ROLLBACK]` + `correlation_id`. |
| SIM | NÃO | SIM | - | **Rollback esperado.** Saque falhou e saldo foi devolvido. |
| SIM | NÃO | NÃO | SIM | **Inconsistente:** pendente mas saldo voltou. Rollback silencioso ou profile errado. Checar logs. |
| SIM | SIM | - | - | **Sem rollback** para esse request; saldo debitado corretamente. |
| NÃO | - | - | - | POST não teve sucesso ou não foi enviado; não caracteriza rollback. |

---

## 5. Próximo passo seguro

1. **Coletar as 3 responses** (POST request, GET profile, GET history) e o **horário** do teste (America/Sao_Paulo).
2. **Preencher a tabela de decisão** (seção 4) com SIM/NÃO.
3. **Se D1=SIM e D2=NÃO:** rodar os comandos da seção 2 no PowerShell (com `correlation_id` da response do POST substituído no filtro). Procurar linhas com `[SAQUE][ROLLBACK]` e o mesmo `correlationId` para confirmar rollback.
4. **Não expor** tokens nem dados pessoais ao colar responses; mascarar Bearer e CPF/e-mail.
5. **Não executar** comandos que alterem estado (`flyctl deploy`, `flyctl ssh console`, etc.); apenas `status`, `machines list` e `logs` (leitura).

---

**Regra:** Nenhum arquivo do repositório foi alterado. Auditoria apenas com evidências não destrutivas (responses + logs + status).
