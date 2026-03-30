# VALIDAÇÃO — USUARIOS / USERNAME / DDL

## 1. Resumo executivo

A validação **somente leitura** confirma que a cirurgia de alinhamento cumpriu o objetivo principal: **`database/schema.sql`** e **`schema-supabase.sql`** declaram **`username`** como coluna canónica em **`usuarios`**, sem **`nome`** como coluna física dessa tabela. Comentários SQL e versão **v1.1.2** estão coerentes. O runtime (**`server-fly.js`**) e o player continuam alinhados a **`username`** no persistido e a **`nome`** apenas como **alias** na resposta JSON. Não foram identificadas alterações nesta cirurgia em fluxos de PIX, engine ou gameplay nos ficheiros inspecionados.

**Veredito:** **VALIDADO COM RESSALVAS** — ressalvas limitadas a **artefactos legados na raiz do repo** e ao **modelo paralelo** `schema-completo.sql`, fora do núcleo corrigido.

---

## 2. Schema principal validado

| Critério | Estado |
|----------|--------|
| `database/schema.sql` define `username` em `usuarios` | **OK** — `username VARCHAR(255) NOT NULL` (linhas 10–14) |
| `nome` não é coluna canónica de `usuarios` | **OK** — não existe `nome` na definição de `usuarios` |
| `nome` noutras tabelas (ex.: `conquistas.nome`) | **Esperado** — nome da conquista; não conflita com `usuarios` |
| Comentários / versão | **OK** — cabeçalho v1.1.2, nota sobre alias API; `COMMENT ON COLUMN usuarios.username`; seed `sistema_versao` = `1.1.2` |

---

## 3. Schema operacional validado

| Critério | Estado |
|----------|--------|
| `schema-supabase.sql` (raiz) alinhado a `username` | **OK** — mesma estrutura de `usuarios` com `username` e mesmo `COMMENT` |
| Contradição com runtime | **Não** — coerente com selects/inserts que usam `username` |
| **Ressalva:** `schema-supabase.sql` não inclui todas as colunas opcionais presentes em `database/schema.sql` (ex.: consentimento BLOCO L) | **Pré-existente / fora do escopo desta validação** — não invalida o alinhamento `nome`/`username` |

---

## 4. Artefatos impactados validados

| Artefacto | Verificação |
|-----------|-------------|
| `database/schema-completo.sql` | Já tinha `username`; comentário explícito a não usar `nome` em `usuarios`. **Coerente.** Continua a ser **modelo paralelo** (SERIAL, `password_hash`, etc.) em relação ao schema principal — dívida estrutural antiga, não reintroduzida por esta cirurgia. |
| `database/schema-ranking.sql` | Comentário de pré-requisito (`username`, não `nome`); views usam `u.username`. **Coerente.** |
| `database/migrate-consentimento-bloco-l-2026-03-30.sql` | Sem referência a `nome` em `usuarios`. **OK.** |
| `docs/relatorios/CIRURGIA-USUARIOS-USERNAME-DDL-2026-03-30.md` | Registo da cirurgia presente no repositório. **OK.** |

---

## 5. Compatibilidade com aplicação preservada

| Camada | Evidência |
|--------|-----------|
| **Backend** | `server-fly.js`: `username` em body, inserts, selects e JWT; `nome: user.username` e `nome: updatedUser.username` como **alias** explícito para o frontend. **Preservado.** |
| **Frontend** | `AuthContext`: envia `username` no registo; `Profile` consome `userData.nome` (valor preenchido pelo alias do backend). **Preservado.** |
| **Schema vs API** | DDL canónico = `username`; JSON pode expor `nome` = mesmo valor. **Sem conflito lógico.** |

---

## 6. Escopo respeitado

| Regra | Validação |
|-------|-----------|
| Sem mexida em PIX / saque / engine / gameplay nos ficheiros da cirurgia DDL | **Confirmado por inspeção** — alterações reportadas na cirurgia limitam-se a schema, `schema-supabase.sql`, docs listados e relatórios; **não** há diff obrigatório nesta validação em `paymentController`, engine, etc. para este objetivo |
| Sem migração destrutiva nova no repositório para “rename” em produção | **OK** — cirurgia foi de **alinhamento versionado** (relatório CIRURGIA) |
| Submódulos | **Não inspecionados** (conforme modo validação); assumido não tocado |

---

## 7. Riscos eliminados

- Afirmar em DDL que **`usuarios.nome`** era coluna real quando o sistema opera com **`username`**.
- Guia Supabase com **INSERT** usando coluna **`nome`** inexistente no modelo alvo.
- Narrativa em relatórios pontuais que misturavam **username/nome** como coluna física única.

---

## 8. Riscos remanescentes

- **Ficheiros SQL legados na raiz** (`schema-supabase-real.sql`, `schema-supabase-corrigido.sql`, variantes `SCHEMA-SUPABASE-*.sql`) podem ainda conter **`nome`** em `usuarios` ou lógica híbrida — **não** fazem parte do conjunto corrigido; podem confundir quem os executar sem filtro.
- **`schema-completo.sql`** permanece um **segundo desenho** (tipos/nomes de colunas diferentes do monólito UUID/`senha_hash`) — coerente em `username`, mas não substitui o schema principal de forma única.
- Pequena **divergência de funcionalidade** entre `schema-supabase.sql` e `database/schema.sql` (ex.: colunas de consentimento só no segundo) — risco de bootstrap parcial se alguém copiar só o ficheiro da raiz; **não** bloqueia a validação do conflito `nome`/`username`.

---

## 9. Veredito final

**VALIDADO COM RESSALVAS**

Motivo: o **conflito estrutural principal** (`usuarios.nome` vs `usuarios.username` no DDL versionado alvo) está **resolvido** nos artefactos centrais; as ressalvas são **legados e modelos paralelos** claramente separáveis.

---

## 10. Conclusão final

- O repositório, nos ficheiros **`database/schema.sql`** e **`schema-supabase.sql`**, representa corretamente **`username`** como verdade da tabela **`usuarios`**.
- O **conflito estrutural principal** documentado na pré-cirurgia está **resolvido** nesse núcleo.
- A **compatibilidade da aplicação** (alias **`nome`**) mantém-se **coerente** com o schema.
- Os **resíduos** são sobretudo **SQL legado na raiz** e **documentação histórica** não atualizada linha a linha — não impedem considerar a cirurgia **concluída** no seu escopo.

**Commit final da cirurgia:** **sim, com segurança**, desde que o commit inclua apenas (ou inclua de forma clara) os ficheiros desta cirurgia e o working tree reflita o estado validado. Recomenda-se mensagem explícita (ex.: alinhamento DDL `usuarios.username`) e, se aplicável, referência à tag de rollback `pre-usuarios-username-ddl-alignment-2026-03-30` para rastreabilidade.
