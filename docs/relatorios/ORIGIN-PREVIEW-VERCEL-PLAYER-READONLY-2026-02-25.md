# ORIGIN real do Preview Vercel (Player) — READ-ONLY

**Data:** 2026-02-25  
**Modo:** 100% READ-ONLY (nenhum arquivo existente alterado; nenhum deploy, flyctl auth ou vercel login)  
**Objetivo:** Descobrir o ORIGIN real de um preview do projeto goldeouro-player no repositório e provar via curl o estado atual do preflight CORS no backend Fly.

---

## 1) Objetivo e regras (READ-ONLY)

- **Objetivo:** (1) Identificar o domínio (ORIGIN) de um preview Vercel do player sem depender de print; (2) Provar com curl OPTIONS que o preview hoje **não** recebe `Access-Control-Allow-Origin` e que produção (www.goldeouro.lol) **recebe**.
- **Regras:** Não editar arquivos existentes; não rodar deploy, `flyctl auth login` ou `vercel login`; não alterar configs. Permitido: leitura de arquivos, ripgrep, git, curl.exe, criação apenas deste relatório.

---

## 2) Comandos executados

### Busca no repositório

```bash
# Padrões usados (ripgrep / grep no repo):
goldeouro-player-[a-z0-9]+[^"\s]*vercel\.app
https://goldeouro-player[^"\s\)]+vercel\.app
```

Busca em `*.md`, `*.json`, `*.yml`, `*.yaml`, `*.txt` e depois em todo o repo.

### Ordenação dos candidatos

- Uso de referências a “Deploy Atual” / “URL Atual” em `docs/auditorias/` (AUDITORIA-DOMINIO-VERCEL-FINAL-v1.2.0.md, AUDITORIA-VALIDACAO-TOTAL-DOMINIOS-v1.2.0.md).
- Candidato “mais recente” = o citado como deploy/URL atual nessas auditorias v1.2.0 + referenciado em relatórios de 2026-02-25.

### Curls executados (PowerShell)

```powershell
# Preview (candidato principal)
curl.exe -s -D - -o NUL -X OPTIONS "https://goldeouro-backend-v2.fly.dev/api/auth/login" -H "Origin: https://goldeouro-player-jk10qipn8-goldeouro-admins-projects.vercel.app" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type,Authorization"

# Preview (alternativas)
curl.exe -s -D - -o NUL -X OPTIONS "https://goldeouro-backend-v2.fly.dev/api/auth/login" -H "Origin: https://goldeouro-player-99sd97jgr-goldeouro-admins-projects.vercel.app" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type,Authorization"
curl.exe -s -D - -o NUL -X OPTIONS "https://goldeouro-backend-v2.fly.dev/api/auth/login" -H "Origin: https://goldeouro-player-o2a3spxll-goldeouro-admins-projects.vercel.app" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type,Authorization"

# Produção (controle positivo)
curl.exe -s -D - -o NUL -X OPTIONS "https://goldeouro-backend-v2.fly.dev/api/auth/login" -H "Origin: https://www.goldeouro.lol" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type,Authorization"
```

---

## 3) Lista de candidatos encontrados (arquivo / linha)

URLs normalizadas para `https://<host>` (sem path), deduplicadas, com um arquivo e linha de referência:

| ORIGIN (candidato) | Arquivo | Observação |
|--------------------|---------|------------|
| https://goldeouro-player-jk10qipn8-goldeouro-admins-projects.vercel.app | docs/auditorias/AUDITORIA-DOMINIO-VERCEL-FINAL-v1.2.0.md (44, 99, 108) | “Deploy Atual” / “URL Atual” |
| https://goldeouro-player-99sd97jgr-goldeouro-admins-projects.vercel.app | docs/auditorias/AUDITORIA-DEPLOY-VISUALIZACAO-FINAL-v1.2.0.md (34, 39, 120) | “Deploy Atual” / “URL Temporária” |
| https://goldeouro-player-o2a3spxll-goldeouro-admins-projects.vercel.app | docs/AUDITORIA-POS-DEPLOY-GOLDEOURO.md (37, 169), tests/production-tests.js (15) | Deploy / Frontend |
| https://goldeouro-player-5rdd2rczq-goldeouro-admins-projects.vercel.app | docs/auditorias/CORRECAO-404-GOLDEOURO-LOL-FINAL.md (76) | |
| https://goldeouro-player-q02hpq1cw-goldeouro-admins-projects.vercel.app | docs/auditorias/AUDITORIA-404-VERCEL-COMPLETA-2025-11-12.md (152) | |
| https://goldeouro-player-ickyugr2a-goldeouro-admins-projects.vercel.app | docs/auditorias/AUDITORIA-DASHBOARD-CACHE-FINAL.md (64) | |
| https://goldeouro-player-hc5vset5l-goldeouro-admins-projects.vercel.app | docs/auditorias/AUDITORIA-PROFUNDA-COMPLETA.md (41), AUDITORIA-VERCEL-COMPLETA.md (41) | |
| https://goldeouro-player.vercel.app | docs/auditorias, render.yaml, README-VERCEL.md, middlewares/security-performance.js | Domínio genérico Vercel |
| (+ outras URLs em docs/relatorios, docs/configuracoes, goldeouro-player/*.md, etc.) | Vários | Outros deploys históricos |

---

## 4) Candidato escolhido como ORIGIN “mais recente” e por quê

- **Escolhido:** `https://goldeouro-player-jk10qipn8-goldeouro-admins-projects.vercel.app`
- **Motivo:** Aparece como **“Deploy Atual”** e **“URL Atual”** em `AUDITORIA-DOMINIO-VERCEL-FINAL-v1.2.0.md` e `AUDITORIA-VALIDACAO-TOTAL-DOMINIOS-v1.2.0.md` (auditorias v1.2.0) e é reutilizado como exemplo em relatórios de 2026-02-25 (READONLY-CHECKLIST-CORS-PREVIEW-VERCEL-2026-02-25.md). Padrão de URL típico do Vercel para o projeto (`goldeouro-player-<id>-goldeouro-admins-projects.vercel.app`).
- **Alternativas (fallback):**
  - `https://goldeouro-player-99sd97jgr-goldeouro-admins-projects.vercel.app` (AUDITORIA-DEPLOY-VISUALIZACAO-FINAL)
  - `https://goldeouro-player-o2a3spxll-goldeouro-admins-projects.vercel.app` (AUDITORIA-POS-DEPLOY, production-tests.js)

---

## 5) Output resumido dos curls

### Preview (candidato principal: jk10qipn8)

- **Status:** 204 No Content  
- **access-control-allow-origin:** **ausente**  
- **access-control-allow-credentials:** true  
- **access-control-allow-methods:** GET,POST,PUT,DELETE,OPTIONS  
- **access-control-allow-headers:** Content-Type,Authorization,X-Requested-With,X-Idempotency-Key  

**Conclusão:** Preview **não** recebe `Access-Control-Allow-Origin` (comportamento esperado com backend atual, sem deploy do patch CORS).

### Preview (alternativas 99sd97jgr e o2a3spxll)

- Mesmo resultado: status 204, **sem** `access-control-allow-origin`; demais headers CORS presentes.

### Produção (www.goldeouro.lol)

- **Status:** 204 No Content  
- **access-control-allow-origin:** **https://www.goldeouro.lol**  
- **access-control-allow-credentials:** true  
- **access-control-allow-methods:** GET,POST,PUT,DELETE,OPTIONS  
- **access-control-allow-headers:** Content-Type,Authorization,X-Requested-With,X-Idempotency-Key  

**Conclusão:** Produção **recebe** `Access-Control-Allow-Origin` (controle positivo OK).

---

## 6) Conclusão

- **ORIGIN real identificado para testes:** `https://goldeouro-player-jk10qipn8-goldeouro-admins-projects.vercel.app` (obtido a partir do repositório, sem Vercel CLI nem print).
- **Estado atual do backend (sem deploy do patch) confirmado:** Para essa origem (e para as duas alternativas testadas), o backend em produção **não** envia `Access-Control-Allow-Origin` na resposta ao OPTIONS; para `Origin: https://www.goldeouro.lol` envia corretamente o header. Isso confirma o bloqueio CORS atual para previews e o comportamento correto para produção.

---

## 7) Próximo passo recomendado (NÃO executar neste READ-ONLY)

Após `flyctl auth login` e `flyctl deploy --app goldeouro-backend-v2` (deploy do commit 7afa349):

1. Repetir o mesmo curl do **preview** com o ORIGIN escolhido:
   ```powershell
   curl.exe -s -D - -o NUL -X OPTIONS "https://goldeouro-backend-v2.fly.dev/api/auth/login" -H "Origin: https://goldeouro-player-jk10qipn8-goldeouro-admins-projects.vercel.app" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type,Authorization"
   ```
   **Esperado:** Resposta com `access-control-allow-origin: https://goldeouro-player-jk10qipn8-goldeouro-admins-projects.vercel.app` (e status 204).

2. Repetir o curl de **www** e confirmar que `access-control-allow-origin: https://www.goldeouro.lol` continua presente.

3. (Opcional) Testar login no browser em um preview atual; se o deployment tiver outro domínio, usar esse domínio no curl para validar a regex do fix.
