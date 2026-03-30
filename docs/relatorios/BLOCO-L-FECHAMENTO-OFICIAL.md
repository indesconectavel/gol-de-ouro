# BLOCO L — JURÍDICO, COMPLIANCE E CONSENTIMENTO

## 1. Resumo executivo

O **BLOCO L** formaliza o **consentimento informado** no cadastro — aceite de termos e política de privacidade, confirmação explícita de **maioridade (18+)** e **persistência auditável** no banco (timestamp, IP, versão dos termos). A validação é **obrigatória no backend**; o frontend apenas reforça a mesma regra. O bloco **não** substitui KYC, verificação documental nem políticas jurídicas completas; delimita uma **camada mínima** de compliance operacional e rastreabilidade alinhada ao produto atual.

**Estado:** incorporado à arquitetura (backend Fly, player, modelo de dados). Fechamento documental neste ficheiro.

---

## 2. Objetivo do bloco

- Garantir que **novos utilizadores** não criem conta sem aceitar termos/privacidade e sem declarar maioridade.
- Registrar **prova mínima** do momento do aceite (quando, a partir de que IP, com que versão de termos).
- Expor ao cliente, após login/registo, um indicador **`consentimento_incompleto`** para **contas legadas** ou dados em falta, sem bloquear sessão por defeito nesta fase.
- Manter o âmbito **cirúrgico**: sem alterar fluxos financeiros críticos (PIX, saque, engine) além do necessário para o contrato de registo.

---

## 3. Escopo implementado

### Aceite de termos
- Checkbox obrigatório no **cadastro** (`Register.jsx`); envio de `acceptedTerms` como boolean no corpo do registo.
- **Backend:** `POST /api/auth/register` rejeita com **400** se `acceptedTerms !== true` (mensagem explícita sobre Termos e Política de Privacidade).

### Confirmação de maioridade
- Checkbox obrigatório no cadastro; envio de `isAdultConfirmed`.
- **Backend:** **400** se `isAdultConfirmed !== true` (mensagem sobre 18 anos ou mais).

### Persistência auditável
- Colunas em **`public.usuarios`** (migração `database/migrate-consentimento-bloco-l-2026-03-30.sql`):
  - `accepted_terms`, `accepted_terms_at`, `accepted_terms_ip`, `accepted_terms_version`, `is_adult_confirmed`
- Snapshot no registo via `buildConsentSnapshot(req, TERMS_VERSION)` em `utils/consent-utils.js` (IP a partir de `x-forwarded-for` / `req.ip`, timestamp ISO, flags coerentes com o aceite).

### Versionamento de termos (mínimo)
- Constante **`TERMS_VERSION = 'v1.0'`** em `utils/consent-utils.js`, gravada em `accepted_terms_version` no insert.
- Evolução futura: alterar versão e processos de re-aceite **fora** do escopo mínimo atual.

### Validação backend obrigatória
- Cadastro **não** depende só do frontend: validação estrita de booleanos `true` no servidor antes de criar utilizador.
- Função **`isConsentIncomplete(user)`** centraliza a regra de “consentimento incompleto” para respostas JSON.

---

## 4. Integração com o sistema

### Cadastro
- **Rota:** `POST /api/auth/register` (`server-fly.js`).
- **Payload:** `email`, `password`, `username`, `acceptedTerms`, `isAdultConfirmed`.
- **Insert:** espelha snapshot de consentimento nas colunas acima.
- **Registo com email já existente (login automático):** resposta inclui `consentimento_incompleto` conforme dados existentes no utilizador.

### Login
- **Rota:** `POST /api/auth/login` — resposta do utilizador inclui **`consentimento_incompleto`** para permitir ao cliente tratar legado ou UX futura.

### Banco
- **Migração:** `database/migrate-consentimento-bloco-l-2026-03-30.sql` (`ADD COLUMN IF NOT EXISTS`, comentários SQL nas colunas).
- **Schema versionado:** colunas espelhadas em `database/schema.sql` na definição de `usuarios` (alinhamento ao modelo aplicado em ambiente com migração executada).

### Frontend
- **`goldeouro-player`:** `Register.jsx` — dois estados (`acceptTerms`, `isAdultConfirmed`) e validação local antes do submit.
- **`AuthContext.jsx`:** `register(..., acceptedTerms, isAdultConfirmed)` enviados no corpo para a API.

---

## 5. O que NÃO faz parte do bloco

- **KYC** (identificação reforçada, documentos).
- **Verificação documental** ou prova de idade além da declaração do utilizador.
- **Antifraude avançado** (device fingerprint, listas, scoring).
- **Pacote jurídico completo** (políticas como documentos legais definitivos, DPO, bases legais detalhadas) — o bloco trata **fluxo técnico e registo mínimo**, não substitui assessoria jurídica.
- **Bloqueio automático de sessão** para todos os utilizadores com `consentimento_incompleto` — o indicador existe; política de bloqueio reforçado é decisão de produto futura.

---

## 6. Riscos eliminados

- **Aceite “fake” só no cliente:** backend exige `true` estrito.
- **Ausência de trilha:** timestamp, IP e versão gravados no registo (quando migração aplicada e insert bem-sucedido).
- **Ausência de validação backend:** rejeição explícita com 400 se faltar termos ou maioridade.

---

## 7. Riscos remanescentes

- **Utilizadores antigos** criados antes da migração: campos podem ser `NULL`/`false` → **`consentimento_incompleto: true`** até haver política de re-consentimento ou backfill controlado.
- **Migração não aplicada** em algum ambiente: inserts podem falhar ou colunas inexistentes — risco operacional de **deploy**, não de lógica do bloco em si.
- **Ausência de KYC:** declaração de maioridade **não** prova idade perante terceiros.
- **Páginas jurídicas** (Termos/Privacidade): se ainda forem **básicas ou genéricas**, o risco legal de conteúdo permanece; o bloco garante **aceite registado**, não a qualidade jurídica do texto.
- **IP:** depende de cabeçalhos de proxy; em cenários mal configurados o valor pode ser aproximado ou `unknown`.

---

## 8. Estado final

**VALIDADO COM RESSALVAS**

**Ressalvas:** legado sem consentimento completo no banco; dependência da migração aplicada; limitações inerentes a ausência de KYC e de revisão jurídica externa do conteúdo das políticas.

---

## 9. Impacto no projeto

- **Contrato de API** de registo alargado com campos obrigatórios de compliance.
- **Modelo de dados** `usuarios` com cinco campos adicionais de consentimento.
- **Utilitário** reutilizável `utils/consent-utils.js` (versão, IP, snapshot, incompleto).
- **Player:** cadastro com UX explícita (checkboxes) alinhada ao backend.
- **Observabilidade de produto:** flag `consentimento_incompleto` para evoluções (banners, re-aceite, etc.).

---

## 10. Conclusão

O **BLOCO L** está **documentado**, **fechado** no sentido de escopo acordado e **incorporado** à estrutura técnica do Gol de Ouro: consentimento com validação servidor, persistência mínima auditável e compatibilidade com contas anteriores via indicador de incompleto. Próximos passos possíveis (fora deste fechamento) incluem campanhas de re-aceite, endurecimento de sessão para incompletos e evolução da versão dos termos com processo claro para o utilizador.

**Referências de implementação:** `utils/consent-utils.js`, `server-fly.js` (rotas `/api/auth/register` e login), `database/migrate-consentimento-bloco-l-2026-03-30.sql`, `goldeouro-player` (`Register.jsx`, `AuthContext.jsx`).

**Checkpoint de rollback histórico (DDL geral do projeto):** tag `pre-usuarios-username-ddl-alignment-2026-03-30` / commit `5d86bb25df0eed54f5e13cd9096ab6bc10b82561` — útil para contexto de repositório; o BLOCO L em si deve ser revertido apenas com consciência dos dados já gravados em `usuarios`.
