# Execução de hoje — Cirurgia 01 de instância única

**Data:** 2026-03-27 (UTC do Fly: 2026-03-28 na captura de comandos)  
**App:** `goldeouro-backend-v2` (Fly.io)  
**Escopo:** apenas infraestrutura Fly — **nenhuma** alteração de código, banco, secrets ou rotas de aplicação.

---

## 1. Resumo executivo

Antes da cirurgia, o **`flyctl status`** mostrava **2 máquinas** no grupo **`app`**, ambas **`started`** e com health **1/1 passing** — situação **incompatível** com estado em memória único (`lotesAtivos`, idempotência do shoot).

Foi executado **`flyctl scale count 1`** no app. A Fly **removeu 1 máquina** do grupo `app` (destroy da máquina `e82d445ae76178`). Permaneceu **1** máquina `app` (`1850066f141908`), **`scale show`** passou a **COUNT = 1** para `app`, e **`/health`** e **`/ready`** responderam **HTTP 200**.

**Não** havia grupo `payout_worker` neste momento na saída de `scale show` / `machines list` (apenas `app`).

---

## 2. Estado anterior

| Métrica | Valor (antes) |
|---------|----------------|
| Grupos em `flyctl scale show` | `app` com **COUNT = 2** (região `gru`) |
| Máquinas `app` **started** | **2** |
| IDs (app, started) | `1850066f141908`, `e82d445ae76178` |
| Versão de deploy (imagem) | `deployment-01KK9VY7DCVTESWZAS2ANDA5PP` (v340 no status) |
| `payout_worker` | **Ausente** na listagem desta sessão (somente grupo `app`). |

---

## 3. Ação aplicada

Comando executado (confirmação não interativa):

```bash
flyctl scale count 1 -a goldeouro-backend-v2 --yes
```

**Efeito reportado pelo CLI:**

- Plano: `-1 machines for group 'app' on region 'gru' of size 'shared-cpu-1x'`
- Execução: **`Destroyed e82d445ae76178`** `group:app` `region:gru`

**Por que afeta só o grupo HTTP:** neste app, `scale show` listava **apenas** o process group `app`; não foi necessário `--process-group` adicional — o `scale count 1` aplicou-se ao plano de escala do serviço principal.

**Máquina conservada:** `1850066f141908` (`rough-sunset-8382`) — permaneceu como a única instância `app`.

---

## 4. Estado atual

| Métrica | Valor (depois) |
|---------|----------------|
| `app` **COUNT** (`flyctl scale show`) | **1** |
| Máquinas `app` **started** | **1** |
| ID da máquina `app` ativa | `1850066f141908` |
| Health | **1/1** checks passing |
| Região | `gru` |

---

## 5. Worker / outros grupos

- **Nenhum** process group além de **`app`** apareceu em `flyctl scale show` ou `flyctl machines list` **após** o ajuste.
- **Histórico do repositório** menciona `payout_worker` em snapshots antigos; **nesta cirurgia** esse grupo **não** estava presente na saída do Fly — nada foi desligado além da máquina `app` redundante.

---

## 6. Validação operacional

### `flyctl status -a goldeouro-backend-v2` (após)

- **1** linha em **Machines** para processo **`app`**: `1850066f141908`, `started`, `1 total, 1 passing`.

### `flyctl scale show -a goldeouro-backend-v2` (após)

- Grupo **`app`**: **COUNT = 1**, `gru`.

### `flyctl machines list -a goldeouro-backend-v2` (após)

- **1** máquina listada, **PROCESS GROUP** = `app`, **STATE** = `started`, **CHECKS** = `1/1`.

### Health checks HTTP

| URL | Resultado |
|-----|-----------|
| `GET https://goldeouro-backend-v2.fly.dev/health` | **200** — JSON com `"status":"ok"`, DB/MP conectados |
| `GET https://goldeouro-backend-v2.fly.dev/ready` | **200** — `{"status":"ready"}` |

---

## 7. Riscos residuais

- **Deploy ou `scale count 2+` no futuro** pode recriar segunda máquina `app` — revisar escala antes de releases grandes.
- **Disponibilidade:** uma única VM `app` é ponto único de falha (aceitável para piloto controlado).
- **Estado em memória:** ainda depende de **não reiniciar** sem aceitar perda de lotes em RAM (comportamento já documentado no projeto).
- **Worker:** se `payout_worker` for recriado em deploy futuro, continuar separando **tráfego HTTP** (grupo `app`) de workers na documentação operacional.

---

## 8. Conclusão

O grupo **`app`** (HTTP/API) está com **1 instância** ativa, **`scale`** fixado em **1** para esse grupo, e o backend responde **saudável** em `/health` e `/ready`.

**Pronto para seguir** para os **testes financeiros de hoje** do ponto de vista de **multinstância do jogo** — o risco de **duas VMs `app`** atendendo requisições simultâneas foi **controlado** nesta cirurgia.

---

*Fim do relatório.*
