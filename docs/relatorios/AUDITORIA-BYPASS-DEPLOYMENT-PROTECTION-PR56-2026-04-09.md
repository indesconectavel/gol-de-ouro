# Auditoria — Deployment Protection e bypass do preview Vercel (PR #56)

**Data:** 2026-04-09  
**Modo:** leitura (documentação oficial, repositório, ambiente local — sem alterar Vercel nem secrets)  
**Preview analisado:** `https://goldeouro-backend-cl025ubrc-goldeouro-admins-projects.vercel.app`

---

## 1. Resumo executivo

O bloqueio **401** com HTML *“Authentication Required”* e redireccionamento para `vercel.com/sso-api` corresponde, pela forma da resposta e pela documentação pública, a **Vercel Authentication** (protecção por SSO / login Vercel para quem pode ver o deployment).

A Vercel documenta **bypass automatizável** via **Protection Bypass for Automation**: cabeçalho ou query `x-vercel-protection-bypass` com um segredo gerido no projecto. A CLI inclui `vercel curl` com `--protection-bypass <SECRET>` e `-t <TOKEN>`.

**Neste ambiente de auditoria:** não há `VERCEL_TOKEN` nem segredo de bypass nas variáveis de shell; **não foi possível** confirmar no dashboard se o bypass está activo nem executar um pedido autenticado com sucesso. A **viabilidade de automação** assenta em política e secrets do projecto, não em limitação técnica da plataforma.

---

## BLOCO 1 — Auditoria da protecção

### Tipo de protecção

| Evidência | Interpretação |
|-----------|----------------|
| Corpo HTML com título *“Authentication Required”*, texto sobre *Vercel authentication*, redirect para `vercel.com/sso-api` | Compatível com **[Vercel Authentication](https://vercel.com/docs/security/deployment-protection/methods-to-protect-deployments/vercel-authentication)**. |
| Resposta **401** sem `X-Vercel-Error: NOT_FOUND` | Não é o erro típico de ficheiro em falta no edge; é **gate de acesso** antes da app. |

### Escopo

Pela documentação, Vercel Authentication pode aplicar-se por ambiente (ex.: só **Preview**, ou **All deployments**, ou produção + previews). **Qual variante está activa neste projecto** só é confirmável em **Deployment Protection** no dashboard do projecto (ou API/Terraform com credenciais).

### Quem acede sem bypass

- Membros da equipa / projecto com papel mínimo de visualização (conforme docs).
- Utilizadores com *Shareable Link* (outro mecanismo de bypass humano).
- Ferramentas com **Protection bypass for automation** (ver Bloco 2).

### “Protection Bypass for Automation”

É uma funcionalidade **opcional por projecto**: o administrador gera um (ou mais) segredos em **Project Settings → Deployment Protection**. Sem isso configurado, **não** existe token público para automatizar — apenas login Vercel ou *share link*.

---

## BLOCO 2 — Possibilidades de bypass (oficial)

Fonte: [Protection Bypass for Automation](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation).

| Método | Suporte |
|--------|---------|
| **Header** `x-vercel-protection-bypass: <secret>` | Sim (recomendado para CI, Playwright, etc.). |
| **Query** `?x-vercel-protection-bypass=<secret>` | Sim (útil quando não há headers custom, ex.: webhooks). |
| **Cookie** | Indirecto: header/query adicional `x-vercel-set-bypass-cookie=true` para a Vercel definir cookie de bypass em redirect (testes no browser). |
| **Token** | O segredo é o **bypass secret** do projecto; em builds, a Vercel pode expor **`VERCEL_AUTOMATION_BYPASS_SECRET`** como variável de sistema quando configurado. |
| **Integração GitHub/Vercel** | O bot publica o deployment; **não** injecciona automaticamente o bypass nos workflows do repositório — para CI, o segredo deve estar em **GitHub Actions secrets** (ou equivalente) e ser passado ao `curl`/Playwright. |

### CLI no ambiente actual

- **Vercel CLI** presente: `48.10.2` (`vercel.cmd` no PATH).
- Comando **`vercel curl`** (beta): suporta `--deployment <ID|URL>` e **`--protection-bypass <SECRET>`**, além de **`-t, --token`** para token de API.

Exemplo lógico (valores fictícios):

```bash
vercel curl "https://goldeouro-backend-....vercel.app/" --deployment "<URL>" --protection-bypass "$SECRET" -t "$VERCEL_TOKEN"
```

### Repositório

Pesquisa em workflows e docs do monorepo: há referências a `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, mas **não** foi encontrado workflow que use `x-vercel-protection-bypass` nem secret nomeado `VERCEL_AUTOMATION_BYPASS_SECRET` / bypass explícito. Ou seja: **automação de bypass não está modelada no Git** (o que é normal — o segredo não deve ser versionado).

---

## BLOCO 3 — Viabilidade real

| Pergunta | Resposta |
|----------|----------|
| Dá para validar via **prompt/CLI** sem browser? | **Sim, em princípio:** `curl` com header/query de bypass, ou `vercel curl` com `--protection-bypass`, **desde que** o segredo exista e esteja disponível no ambiente (local ou CI). |
| A protecção **impede** qualquer automação? | **Não** a nível de plataforma: a documentação prevê exactamente automação. **Impede** automação **anónima** sem segredo (como os testes anteriores com `curl` simples). |
| O que falta para “validação final” automatizada? | (1) Confirmar no dashboard que **Protection Bypass for Automation** está activo. (2) Guardar o segredo em **GitHub Actions** (ex.: `VERCEL_AUTOMATION_BYPASS_SECRET`) ou no ambiente local. (3) Passo de workflow ou script que faça GET às rotas com o header/query. |

### Outras formas “seguras” sem login manual no browser

- **Smoke em CI** com secret de bypass (só referência ao secret, valor nunca no log em claro).
- **`vercel curl`** com token + bypass (equipa já usa token para deploy).
- **Shareable Link** (docs): útil para humanos; menos ideal para pipeline repetível.

---

## Evidências recolhidas (ambiente local)

| Verificação | Resultado |
|-------------|-----------|
| `VERCEL_TOKEN` | Não definido no shell da auditoria. |
| `VERCEL_PROTECTION_BYPASS` | Não definido. |
| `vercel --version` | `48.10.2` |
| `vercel curl --help` | Existe; opções `--deployment`, `--protection-bypass`, `-t`. |

---

## Saída final obrigatória

**BYPASS AUTOMATIZÁVEL IDENTIFICADO — PRONTO PARA VALIDAÇÃO FINAL**

*(Interpretação: o mecanismo oficial de bypass para automação está identificado e é utilizável com header/query ou `vercel curl`; falta apenas confirmar que o projecto tem o segredo configurado e disponibilizá-lo de forma segura ao CI ou ao script local — sem isso, os pedidos continuam a devolver 401 como observado.)*
