# PAYOUT V1.1 — Configuração segura de DATABASE_URL (autoconfig)

**Data:** 2026-03-06  
**Objetivo:** Obter a connection string do banco Supabase e configurá-la no `.env` local do backend sem expor segredos, para permitir o backup pg_dump.

---

## 1) Resumo executivo

- **BACKUP READY:** **false**
- **Motivo:** Nenhuma connection string PostgreSQL válida foi encontrada nas fontes auditadas (`.env` do backend, `.env.production` local, `.env.production` do repositório pai). O projeto Supabase foi detectado (variáveis relacionadas presentes), mas `DATABASE_URL` não está preenchida em nenhum desses arquivos.
- **Ação executada:** Gate de segurança do `.env` (OK), identificação de projeto Supabase, tentativa de obter connection string a partir de arquivos de ambiente existentes, escrita no `.env` (não realizada por ausência de valor), teste de backup (não executado com sucesso).
- **Segredos:** Nenhum valor de DATABASE_URL, senha, SUPABASE_URL ou SERVICE_ROLE_KEY foi impresso ou registrado em relatórios.

---

## 2) Fonte da connection string

- **Fontes lidas (sem imprimir valores):**  
  - `.env` na raiz do backend  
  - `.env.production` na raiz do backend  
  - `.env.production` no diretório pai do repositório
- **Resultado:** Nenhuma linha `DATABASE_URL=...` com valor válido (postgresql://... com comprimento e formato adequados, sem placeholder como `seu_usuario`/`sua_senha`) foi encontrada.
- **Artefato:** `docs/relatorios/payout-v1_1-dburl-source.json`  
  - `supabase_detected`: true (indica que variáveis do projeto Supabase estão presentes em algum arquivo)  
  - `source_type`: null (nenhuma DATABASE_URL utilizável encontrada)

A connection string não foi obtida via API Supabase (a API de gestão não expõe a senha do banco); apenas arquivos de ambiente locais foram usados como fonte.

---

## 3) Gate de segurança do .env

- **.env na raiz do backend:** considerado existente ou criável pelo script (uso seguro).
- **.env no .gitignore:** sim — `.env` está listado no `.gitignore` do backend.
- **Decisão:** **Seguro para escrita.** O script não escreveu no `.env` porque não havia valor de DATABASE_URL para gravar.
- **Registro:** `gate_safe_to_write: true` em `payout-v1_1-dburl-write.json`.

---

## 4) Ação executada

- **PASSO 3 (escrever DATABASE_URL no .env):** **Não executado.**  
  - **Motivo:** `detected: false`, `format_valid: false` — nenhuma connection string válida encontrada.  
  - **env_updated:** false  
  - **reason:** "Nenhuma connection string valida encontrada em .env ou .env.production."  
  - **Artefato:** `docs/relatorios/payout-v1_1-dburl-write.json`

Nenhum segredo foi impresso nem gravado em relatórios ou JSONs.

---

## 5) Resultado do backup

- **Executado:** O script de autoconfig tentou executar o passo de backup. Como não havia DATABASE_URL utilizável, o pg_dump não foi invocado com connection string válida.
- **Sucesso:** Não.
- **Artefato:** `docs/relatorios/payout-v1_1-backup-validation.json`  
  - `success`: false  
  - `error_redacted`: "DATABASE_URL indisponivel ou formato invalido."  
  - `path`, `size_bytes`, `sha256`: null

---

## 6) BACKUP READY = false

O backup do pipeline de deploy seguro permanece **bloqueado** até que exista uma connection string PostgreSQL válida no ambiente do backend.

Para que BACKUP READY passe a true é necessário:

1. Incluir em um dos arquivos lidos pelo script (por exemplo `.env` ou `.env.production` na raiz do backend) uma linha:  
   `DATABASE_URL=postgresql://...`  
   com a connection string real do projeto Supabase (Dashboard > Project Settings > Database > Connection string), **ou**
2. Garantir que o `.env` do backend já contenha essa linha e que o valor não seja placeholder (e que o script seja executado novamente para validação e backup).

---

## 7) Próximo passo recomendado

1. **Obter a connection string no Supabase**  
   - Acessar: https://supabase.com/dashboard  
   - Selecionar o projeto do backend  
   - **Project Settings** > **Database**  
   - Copiar a **Connection string** (URI, por exemplo "Transaction" ou "Session")

2. **Configurar no backend (sem commitar)**  
   - Abrir `.env` na raiz do backend (`e:\Chute de Ouro\goldeouro-backend\.env`)  
   - Adicionar ou editar a linha:  
     `DATABASE_URL=<connection string copiada>`  
   - Salvar. Não commitar o `.env`.

3. **Rerodar o script de autoconfig**  
   - Executar:  
     `node scripts/payout-v1_1-dburl-autoconfig.js`  
   - O script irá:  
     - Ler DATABASE_URL do `.env`  
     - Não sobrescrever se já existir  
     - Executar pg_dump e preencher `payout-v1_1-backup-validation.json`  
   - Verificar em `payout-v1_1-backup-validation.json`: `success: true` e presença de `path`, `size_bytes`, `sha256`.

4. **Rerodar o deploy seguro**  
   - Com backup validado, executar novamente o pipeline de deploy seguro do payout V1.1 (a partir do PASSO 3 ou do PASSO 0).

---

## Artefatos gerados

| Arquivo | Caminho |
|---------|---------|
| Fonte da connection string / Supabase | `docs/relatorios/payout-v1_1-dburl-source.json` |
| Escrita no .env | `docs/relatorios/payout-v1_1-dburl-write.json` |
| Validação do backup | `docs/relatorios/payout-v1_1-backup-validation.json` |
| Script auxiliar | `scripts/payout-v1_1-dburl-autoconfig.js` |
| Relatório | `docs/relatorios/PAYOUT-V1_1-DATABASE-URL-AUTOCONFIG-2026-03-06.md` |

Nenhum deploy foi realizado. Vercel, frontend e /game não foram alterados.
