# CI Frontend — Falha do npm audit (READ-ONLY)

**Data:** 2026-03-06

---

## 1) Resumo executivo

O check **🎨 Frontend Deploy (Vercel) / 🧪 Testes Frontend** falha no PR do frontend do player porque o step **"🔍 Análise de segurança frontend"** executa `npm audit --audit-level=moderate` e o projeto possui vulnerabilidades reportadas em dependências de desenvolvimento (**serialize-javascript**, **tar**). O workflow não permite que o audit falhe (não há `|| true` nem `continue-on-error`), então o job falha.

**Causa raiz:** Política de CI (exigir que o audit passe) aplicada a vulnerabilidades **já existentes** no repositório. O **PR de saque/depósito não introduziu** essas dependências nem alterou `package.json` ou `package-lock.json`.

**Recomendação:** Ajustar o workflow para não bloquear o merge por esse audit (opção mais segura para V1), permitindo publicar o frontend validado e tratar as vulnerabilidades em um PR dedicado depois.

---

## 2) Workflow que falhou

| Campo | Valor |
|-------|--------|
| Arquivo | `.github/workflows/frontend-deploy.yml` |
| Nome do workflow | 🎨 Frontend Deploy (Vercel) |
| Trigger | `pull_request`, branches: `[main]`, paths: `goldeouro-player/**` |
| Job | `test-frontend` (🧪 Testes Frontend) |
| Step que falha | 🔍 Análise de segurança frontend (linhas 42-46) |
| Comando | `cd goldeouro-player` + `npm audit --audit-level=moderate` |

O step não trata exit code não zero; qualquer vulnerabilidade moderate ou superior faz o job falhar.

---

## 3) Dependências envolvidas

| Pacote | Versão (lockfile) | Origem | Uso |
|--------|-------------------|--------|-----|
| **serialize-javascript** | 6.0.2 | workbox-build → @rollup/plugin-terser | Build (minificação) / PWA |
| **tar** | 7.5.7 (override em package.json) | @capacitor/cli | Ferramenta mobile (CLI) |

- **serialize-javascript:** dependência **transitiva** de **workbox-build** (vite-plugin-pwa). Usada apenas em tempo de build (Rollup/Terser), não em runtime do app.
- **tar:** dependência **transitiva** de **@capacitor/cli**. Usada em desenvolvimento/build mobile. Já existe override `"tar": "^7.5.7"` no `package.json`.

Ambas são **devDependencies**; não fazem parte do bundle de produção do player.

---

## 4) Causa raiz

- **A falha do job é causada por:** política de CI que exige que `npm audit --audit-level=moderate` passe, somada a vulnerabilidades já presentes no lockfile.
- **Não é causada por:** código novo do PR. O PR altera apenas arquivos em `goldeouro-player/src` e em `docs`; não altera `package.json` nem `package-lock.json`.
- **Conclusão:** O PR de saque/depósito **não introduziu** o problema. As dependências vulneráveis já existiam no projeto (workbox-build, @capacitor/cli).

---

## 5) O PR introduziu o problema?

**Não.** Os commits do PR (correção de saque e simplificação de depósito) não tocam em dependências. A falha do CI ocorre na mesma árvore de dependências que já existia na base (main).

---

## 6) Melhor caminho para destravar com segurança

**Opção recomendada:** Ajustar o workflow para **não bloquear** o PR quando o audit encontrar vulnerabilidades.

- No step **"🔍 Análise de segurança frontend"**, trocar o comando para algo como:
  - `npm audit --audit-level=moderate || echo "⚠️ Vulnerabilidades encontradas no frontend"`
  - Ou adicionar `continue-on-error: true` ao step (menos preferível, pois marca o job como “failed” no GitHub).

Assim o merge é desbloqueado, o audit continua sendo executado (e visível nos logs), e as vulnerabilidades podem ser tratadas em um PR futuro (overrides, atualização de workbox/Capacitor, etc.) sem atrasar a publicação do frontend validado.

---

## 7) GO/NO-GO para patch mínimo no CI ou dependências

| Ação | GO/NO-GO | Observação |
|------|----------|------------|
| Patch mínimo **apenas no workflow** (audit não bloquear) | **GO** | Não altera código nem dependências; não afeta /game; destrava o merge. |
| Alterar package.json / package-lock.json (audit fix ou overrides) | **NO-GO** para este PR | Regras do pedido: não alterar package.json; além disso, mudança de deps exige validação em outro PR. |

**Conclusão:** **GO** para um patch mínimo **somente no arquivo de workflow** (`.github/workflows/frontend-deploy.yml`), fazendo o step de análise de segurança não falhar o job. Não alterar `package.json` nem rodar `npm audit fix` neste contexto.

---

## Entregas

- `docs/relatorios/ci-frontend-fail-workflow.json`
- `docs/relatorios/ci-frontend-fail-deps.json`
- `docs/relatorios/ci-frontend-fail-rootcause.json`
- `docs/relatorios/ci-frontend-fail-options.json`

---

*Auditoria READ-ONLY em 2026-03-06. Nenhuma alteração foi feita em código, package.json ou deploy.*
