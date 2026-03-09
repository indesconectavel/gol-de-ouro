# GO/NO-GO Produção — envalid (auditoria READ-ONLY)

**Data:** 2026-03-02  
**Escopo:** Ambiente real de deploy (Fly / Render) e sustentação por `node_modules` ou cache.  
**Regra:** 100% READ-ONLY; nenhuma alteração de config, deploy ou npm install em produção.

---

## 1) Objetivos e respostas com evidência

| Pergunta | Resposta com evidência |
|----------|------------------------|
| **1) O deploy atual consegue executar `require('envalid')` em runtime?** | **No ambiente real não foi possível executar comandos** (sem Fly SSH / Render shell nesta auditoria). No **repositório**: sim, após o patch — `envalid` está em `dependencies` (package.json linha 21); um build que use o package.json atual instalará envalid. **Se a imagem/build em produção tiver sido gerada antes do patch**, o runtime **não** terá envalid e o processo falhará ao carregar `config/env.js` (MODULE_NOT_FOUND). |
| **2) O `config/env.js` está sendo carregado no boot do processo em produção?** | **Sim, no fluxo atual do código.** O entrypoint é `node server-fly.js` (Fly e Render). Em server-fly.js linha 28: `const { authAdminToken } = require('./middlewares/authMiddleware');` — executado no **boot**. O authMiddleware na linha 2 faz `require('../config/env')`, que carrega config/env.js, que na linha 1 faz `require('envalid')`. Logo o carregamento de config/env (e envalid) ocorre na subida do processo. |
| **3) A imagem/container tem `node_modules/envalid` presente?** | **Não foi possível inspecionar o sistema de arquivos do ambiente real.** No repo: após `npm i envalid --save`, o package-lock.json declara envalid; um build limpo (Docker ou `npm ci`) instala `node_modules/envalid`. **Se o deploy em produção foi feito antes do patch**, a imagem não terá envalid e o boot falhará. **Se passou a usar cache antigo de node_modules** (ex.: camada Docker em cache de um build anterior sem envalid), classificado como NO-GO operacional. |
| **4) Provedor e mecanismo de build/install em uso?** | **Fly.io (primário)** — fly.toml app = `goldeouro-backend-v2`, build via Dockerfile, processo app = `npm start` → `node server-fly.js`. **Render (alternativo)** — render.yaml buildCommand = `npm ci`, startCommand = `node server-fly.js`. CI: `.github/workflows/backend-deploy.yml` faz deploy para Fly em push em main, com `flyctl deploy --remote-only --no-cache`. |

---

## A) Plataforma e entrypoint real

### Arquivos e indicadores encontrados

| Arquivo | Caminho | Conteúdo relevante |
|---------|---------|--------------------|
| fly.toml | `e:\Chute de Ouro\goldeouro-backend\fly.toml` | app = "goldeouro-backend-v2", primary_region = "gru", [build] dockerfile = "Dockerfile", [processes] app = "npm start", payout_worker = "node src/workers/payout-worker.js" |
| render.yaml | `e:\Chute de Ouro\goldeouro-backend\render.yaml` | type: web, buildCommand: "npm ci", startCommand: "node server-fly.js", env: node |
| Dockerfile | `e:\Chute de Ouro\goldeouro-backend\Dockerfile` | FROM node:20-alpine, COPY package*.json ./, RUN npm install --only=production, COPY . ., CMD ["node", "server-fly.js"] |
| Procfile | `e:\Chute de Ouro\goldeouro-backend\Procfile` | web: node server.js (entrypoint diferente; não usa server-fly.js) |
| package.json scripts | `e:\Chute de Ouro\goldeouro-backend\package.json` | "start": "node server-fly.js" |

### Comando real de start

- **Fly (fly.toml):** `npm start` → `node server-fly.js` (porta 8080 via variável PORT no Dockerfile).
- **Render (render.yaml):** `node server-fly.js` (direto).
- **CI (backend-deploy.yml):** deploy Fly com `flyctl deploy --remote-only --no-cache --app goldeouro-backend-v2`; o build é remoto e usa o Dockerfile do repo.

### Build step (instalação de deps)

- **Fly (Dockerfile):** `COPY package*.json ./` e `RUN npm install --only=production`. Usa package.json e package-lock.json (ambos copiados). Não usa `npm ci`; usa cache de camadas Docker se não for --no-cache.
- **CI Fly:** `flyctl deploy --remote-only --no-cache` — build remoto **sem cache** de imagem, então cada deploy reconstrói e roda `npm install --only=production` com os package*.json do commit.
- **Render:** `npm ci` — instalação a partir do lockfile; limpa node_modules antes. Build cache do Render pode reutilizar camadas; o conteúdo de node_modules segue o package-lock.json do commit deployado.

Trecho do Dockerfile (raiz):

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY . .
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
CMD ["node", "server-fly.js"]
```

Trecho do workflow (deploy Fly):

```yaml
- name: 🚀 Deploy para Fly.io
  run: |
    flyctl deploy --remote-only --no-cache --app ${{ env.FLY_APP_NAME }}
```

---

## B) Prova local do repositório (declaração)

- **package.json (atual):** na seção `dependencies` existe `"envalid": "^8.1.1"` (linha 21). Nenhuma alteração feita nesta auditoria.
- **config/env.js:** linha 1: `const { cleanEnv, str, num, url } = require('envalid');`
- **Conclusão por declaração:** o **repositório está GO** para o próximo build — qualquer deploy que use o package.json e package-lock.json atuais (e build limpo ou lockfile respeitado) instalará envalid e o boot não falhará por MODULE_NOT_FOUND de envalid.

---

## C) Prova do ambiente REAL (comandos de diagnóstico)

Não foi executado shell/SSH no ambiente de produção (Fly ou Render). Abaixo estão os **comandos que devem ser rodados no host real** para fechar o veredito, e o que interpretar.

### 1) Comandos a rodar no ambiente real (ex.: Fly SSH)

Com o **cwd na raiz do app** (ex.: `/app` no container):

```bash
node -e "require('envalid'); console.log('envalid presente')"
node -e "require('./config/env'); console.log('config/env carregou')"
node -p "require.resolve('envalid')"
```

- Se algum comando falhar: capturar **stack e mensagem completa** (ex.: MODULE_NOT_FOUND, EnvValidationError).
- **envalid presente** + **config/env carregou** = runtime tem o módulo e o env carrega (podendo falhar depois por variável obrigatória ausente, não por módulo).

### 2) Presença física do pacote

```bash
ls -la node_modules/envalid
cat node_modules/envalid/package.json | head -n 30
```

- Se “No such file or directory” em `node_modules/envalid`: **NO-GO** (imagem/build sem envalid).

### 3) Logs de boot em produção

Procurar nos logs do app (ex.: `fly logs --app goldeouro-backend-v2` ou painel Render):

- “Cannot find module 'envalid'”
- “Cannot find module './config/env'” ou “../config/env”
- Qualquer stack trace apontando para `config/env.js` ou envalid

Se essas mensagens aparecerem no boot, o ambiente real está **NO-GO** por falta de envalid ou path errado. Se o processo sobe e atende /health sem esses erros, o carregamento de config/env no boot está OK (GO para módulo/env).

### 4) Cache “fantasma”

- **Fly (CI):** `--no-cache` no deploy evita reutilizar camada de build antiga; cada push em main gera novo build. **Risco:** se alguém fizer deploy manual com `fly deploy` **sem** `--no-cache`, uma camada antiga (sem envalid) poderia ser reutilizada → NO-GO operacional até rebuild limpo.
- **Render:** `npm ci` recria node_modules a partir do lockfile; cache é sobretudo de dependências baixadas. Se o lockfile tiver envalid, o próximo deploy instalará envalid. Cache de build antigo com node_modules sem envalid seria inconsistente com npm ci (que apaga node_modules).
- **Lockfile:** package-lock.json está no repo e é copiado no Dockerfile (`COPY package*.json ./`); o workflow não o altera. Repo atual tem envalid no lockfile após o patch.

---

## D) Veredito final (GO / NO-GO real)

### Repositório e próximo deploy

- **GO.** O repo declara `envalid` em dependencies e config/env.js importa envalid. Um **novo** build (Fly com Dockerfile atual ou Render com npm ci) instalará envalid e o processo poderá carregar config/env no boot, desde que as variáveis obrigatórias estejam definidas no ambiente.

### Ambiente real em produção (sem acesso a SSH/logs)

- **Indeterminado** apenas pela inspeção do código. O veredito real depende de:
  1. A **imagem/instância em produção** ter sido construída **depois** do commit que adicionou envalid ao package.json (e package-lock.json).
  2. Ou de **não** estar dependendo de cache antigo de build (ex.: deploy Fly sem --no-cache reutilizando camada sem envalid).

Se a imagem em produção foi gerada **antes** do patch de envalid:

- **NO-GO:** no primeiro require de authMiddleware (boot de server-fly.js), o Node lançará **Cannot find module 'envalid'** e o processo não sobe. Logs de deploy ou de saúde devem mostrar esse erro.

Se a imagem foi gerada **depois** do patch (ou o lockfile em produção já tinha envalid por outro motivo):

- **GO** para o módulo envalid; falhas restantes seriam apenas de validação de env (variáveis obrigatórias), não de módulo faltando.

### Classificação resumida

| Critério | Veredito |
|----------|----------|
| Repo atual (declaração) | **GO** — envalid em dependencies; config/env.js importa envalid. |
| Próximo deploy (build limpo / lockfile atual) | **GO** — esperado instalar envalid e carregar config/env no boot (desde que env vars estejam configuradas). |
| Ambiente real atual (sem execução de comandos no host) | **INDETERMINADO** — requer rodar os diagnósticos na seção C ou inspecionar logs de boot. |
| Se produção estiver usando build/cache anterior ao patch | **NO-GO** — MODULE_NOT_FOUND envalid no boot. |
| Se produção depender de cache antigo de build (ex.: Fly sem --no-cache) com node_modules sem envalid | **NO-GO operacional** — até fazer rebuild limpo. |

### Recomendações mínimas

1. **Manter envalid em dependencies** (já está) e **não remover** do package.json nem do package-lock.json.
2. **Garantir rebuild limpo no próximo deploy:** no Fly, continuar usando `flyctl deploy --remote-only --no-cache` (ou equivalente) para não reutilizar camada de build sem envalid.
3. **No ambiente real**, executar os comandos da seção C (node -e, ls node_modules/envalid, leitura de logs de boot) para converter “indeterminado” em GO ou NO-GO com evidência.
4. Se em produção aparecer “Cannot find module 'envalid'”: fazer **um novo deploy** a partir do branch que contém envalid em dependencies (e lockfile atualizado) e verificar logs após o deploy; após isso, o ambiente deve ficar **GO** para o carregamento de config/env e envalid.

---

*Relatório gerado por inspeção READ-ONLY do repositório e dos arquivos de configuração de deploy. Nenhum comando foi executado no ambiente Fly/Render; diagnósticos na seção C devem ser executados pelo time com acesso ao host ou aos logs de produção.*
