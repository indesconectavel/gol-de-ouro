# Diagnóstico — PR #56 não aparece no projecto `goldeouro-player` (Vercel)

**Data:** 2026-04-09  
**Modo:** leitura (workflows, API GitHub, evidências já recolhidas) — valores de secrets **não** são legíveis no repositório.

---

## 1. Resumo executivo

O PR #56 **não** gera deployment via **GitHub Actions** `frontend-deploy.yml` para qualquer projecto Vercel: em `pull_request`, só corre o job **Testes Frontend**; os jobs que invocam `amondnet/vercel-action` estão limitados a **`main`** (produção) ou **`dev`** (preview “dev”). O preview do PR surge da **integração Git ↔ Vercel** (build automático no Vercel), que neste repositório está associada a um projecto cujo hostname é **`goldeouro-backend-…vercel.app`**, não **`goldeouro-player-…`**.

Por isso, ao olhar para a lista de deployments do projecto **`goldeouro-player`**, **não** é expectável ver o preview do PR #56 — esse preview está noutro projecto (evidência: URL do deployment GitHub ↔ `goldeouro-backend-cl025ubrc-goldeouro-admins-projects.vercel.app`).

---

## 2. O que foi observado no Vercel (relato do contexto)

- Em **`goldeouro-player`**: não aparece um preview “novo” do branch `fix/restaurar-baseline-player-2026-04-09` / PR #56; *Current* associado a `main` / `d72e21d`.
- Previews antigos (`diag/...`, `fix/vercel-edge...`) podem ser históricos desse **mesmo** projecto ou de outro contexto de ligação Git.

Isto é **consistente** com: (a) o PR não ser deployado por Actions para `goldeouro-player`; (b) a integração GitHub estar a criar builds noutro projecto (`goldeouro-backend`).

---

## 3. O que o GitHub Actions realmente fez (PR #56)

Run exemplo: `24199996568` (workflow **Frontend Deploy (Vercel)** no contexto do PR, `headSha` `138db81…`).

| Job | Condição no workflow | Resultado no PR |
|-----|----------------------|-----------------|
| **Testes Frontend** | Sempre (após filtros de paths) | **SUCCESS** |
| **Deploy Produção** | `github.ref == 'refs/heads/main'` | **SKIPPED** |
| **Deploy Desenvolvimento** | `github.ref == 'refs/heads/dev'` | **SKIPPED** |
| **Build APK** | `github.ref == 'refs/heads/main'` | **SKIPPED** |

Trecho relevante do workflow:

```83:89:e:\Chute de Ouro\goldeouro-backend\.github\workflows\frontend-deploy.yml
  deploy-production:
    name: 🚀 Deploy Produção
    runs-on: ubuntu-latest
    needs: test-frontend
    if: github.ref == 'refs/heads/main'
```

```286:333:e:\Chute de Ouro\goldeouro-backend\.github\workflows\frontend-deploy.yml
  deploy-development:
    ...
    if: github.ref == 'refs/heads/dev'
    ...
      - name: 🔐 Configurar Vercel (Dev)
        uses: amondnet/vercel-action@v25
        with:
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--target preview'
```

**Conclusão:** o workflow **não** executa `vercel-action` em **pull requests** de branches de feature. Não há “URL final” nem `preview-url` desse job para o PR #56 — esses passos nem correm.

---

## 4. Qual projecto recebeu ou deveria receber o deploy

| Origem | Projecto / destino |
|--------|---------------------|
| **Actions** (`main` + paths) | O definido por `secrets.VERCEL_PROJECT_ID` (valor **não** visível no repo; comentário no YAML: deve ser `prj_…`, não o nome “goldeouro-player”). |
| **Actions** (PR #56) | **Nenhum** — sem passo de deploy. |
| **Vercel Git Integration** (push/PR no repo) | O projecto Vercel **ligado ao repositório GitHub** na consola Vercel. A URL de deployment publicada pela API GitHub para o commit do PR foi **`goldeouro-backend-…vercel.app`**, o que indica projecto cujo slug/nome inclui **`goldeouro-backend`**. |

---

## 5. Qual URL/preview foi gerado

- Evidência anterior (deployment status GitHub):  
  **`https://goldeouro-backend-cl025ubrc-goldeouro-admins-projects.vercel.app`**  
  (ambiente **Preview**, SHA alinhado ao head do PR #56).

Isto **não** é um hostname do projecto `goldeouro-player`.

---

## 6. Existe mismatch de project id?

**Sim, a nível de “nome humano” vs “onde o PR aparece”:**

1. **Documentação interna / secrets** referem-se muitas vezes ao nome **`goldeouro-player`**.
2. O **preview do PR** materializa-se no projecto que a integração Git usa para este repo — pelo hostname, **`goldeouro-backend`**.
3. **`VERCEL_PROJECT_ID`** nos workflows aponta para **um** `prj_…`; sem ler o secret, não se prova aqui se é o mesmo ID que o dashboard mostra em `goldeouro-player` ou em `goldeouro-backend`. O que se prova é: **Actions não faz deploy do PR**; o preview vem da **Vercel**, noutro projecto com outro nome no URL.

---

## 7. Causa exacta

1. **O PR #56 não dispara deploy por GitHub Actions** para Vercel — só testes/build local no runner; condições `if` restringem `vercel-action` a `main`/`dev`.
2. O **preview** é criado pela **integração nativa GitHub–Vercel**, que está ligada ao projecto que gera URLs **`goldeouro-backend-…`**, não ao projecto que o utilizador está a inspeccionar (`goldeouro-player`).
3. Por isso, **não há** entrada “nova” do PR #56 na lista de deployments de **`goldeouro-player`** — o deployment está **no outro projecto**.

---

## 8. Próximo passo recomendado

1. No Vercel: **Project settings → Git** (ou lista de projectos ligados ao repo `indesconectavel/gol-de-ouro`) e confirmar **qual** projecto está ligado ao repositório para **Preview deployments**.
2. Alinhar expectativas: ou passar a usar **`goldeouro-backend`** como fonte de verdade dos previews deste monorepo, ou **mover a ligação Git** para `goldeouro-player` (implica cuidado com root directory `goldeouro-player`, duplicidade de builds, etc.).
3. Opcional: acrescentar um job de **deploy preview em PR** no Actions (por exemplo `if: github.event_name == 'pull_request'`) com `vercel-args` adequados, **no mesmo `VERCEL_PROJECT_ID` desejado`**, se quiserem que **todos** os previews passem pelo pipeline — hoje isso **não** existe.

---

## Saída final obrigatória

**CAUSA IDENTIFICADA — PRONTO PARA CIRURGIA**
