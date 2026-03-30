# CIRURGIA — USUARIOS / USERNAME / DDL

## 1. Resumo executivo

Foi alinhada a **fonte de verdade versionada** do modelo `usuarios` à realidade operacional já confirmada: a coluna canónica no DDL do repositório passa a ser **`username`**, em substituição de **`nome`** na tabela `usuarios` em `database/schema.sql`. Artefactos SQL e documentação técnica que induziam erro (INSERT de exemplo com `nome`) foram corrigidos ou clarificados. **Nenhuma** migration destrutiva foi adicionada para o Postgres real; **nenhuma** alteração foi feita em fluxos de cadastro/login no código de aplicação — o campo **`nome` na API** continua documentado como **alias** derivado de `username`, não como coluna física.

Checkpoint de rollback pré-existente: commit `5d86bb25df0eed54f5e13cd9096ab6bc10b82561`, tag `pre-usuarios-username-ddl-alignment-2026-03-30`.

## 2. Arquivos alterados

| Ficheiro | Tipo de alteração |
|----------|-------------------|
| `database/schema.sql` | DDL `usuarios`: `nome` → `username`; comentário SQL; versão schema/cabeçalho; `sistema_versao` em seed de configurações |
| `database/schema-completo.sql` | Comentário de alinhamento (já usava `username`) |
| `database/schema-ranking.sql` | Comentário de pré-requisito (`username`, não `nome`) |
| `docs/configuracoes/GUIA-EXECUCAO-SCHEMA-SUPABASE.md` | INSERT de utilizadores de teste: colunas e valores coerentes com `username` |
| `docs/relatorios/PROGRESSO-POR-BLOCOS-GOLDEOURO-V1-2026-03-28.md` | Referência técnica `nome` → `username` na linha sobre middleware |
| `docs/relatorios/VALIDACAO-SCHEMA-FINANCEIRO-SUPABASE-READONLY-2026-03-07.md` | Texto: remoção de “username/nome” ambíguo em favor de `username` |
| `docs/relatorios/CIRURGIA-USUARIOS-USERNAME-DDL-2026-03-30.md` | Este relatório (novo) |
| `schema-supabase.sql` (raiz) | Espelho do modelo usado no guia Supabase: `usuarios.username`, comentário e `sistema_versao` alinhados a `database/schema.sql` |

## 3. Correções aplicadas no schema

- Em **`database/schema.sql`**, a definição de `CREATE TABLE usuarios` utiliza **`username VARCHAR(255) NOT NULL`** no lugar de `nome`.
- Foi adicionado **`COMMENT ON COLUMN usuarios.username`** explicitando que a API pode expor o mesmo valor como **`nome`** por compatibilidade.
- Versão do artefacto: cabeçalho **v1.1.2** e valor semântico em `configuracoes` (`sistema_versao` → `1.1.2`) no bloco de INSERT de configurações padrão.
- A tabela **`conquistas`** mantém a coluna **`nome`** (nome da conquista), **sem** relação com o antigo campo de perfil em `usuarios`.

## 4. Artefatos conflitantes corrigidos

- **`schema-completo.sql`**: já declarava `username`; acrescentou-se nota explícita para não assumir coluna `nome` em `usuarios`.
- **`schema-ranking.sql`**: views já referiam `u.username`; acrescentou-se comentário de pré-requisito alinhado ao schema principal.
- **Guia Supabase**: exemplo de `INSERT` passou a listar **`username`** e valores adequados a identificadores (ex.: `usuario_teste`, `admin_teste`).
- **`schema-supabase.sql` (raiz)**: mesmo ajuste de `database/schema.sql` para quem copia esse ficheiro para o SQL Editor (referência no guia).

## 5. Compatibilidade preservada

- **Backend / JWT / cadastro com `username`**: inalterados (não foi necessário editar `server-fly.js`).
- **Perfil com `nome` como alias** (`nome: user.username`): permanece válido como contrato de API; apenas deixa de ser descrito como coluna DDL em `usuarios`.
- **Migrações existentes** (ex.: consentimento BLOCO L): não referem `nome` em `usuarios`; sem impacto.

## 6. O que não foi alterado

- Código de **PIX, saques, engine, gameplay**, `goldeouro-admin` (submódulo).
- Refatoração ampla de nomenclatura PT/EN fora do âmbito `usuarios` / DDL.
- Relatórios históricos que apenas citam “nome” no **payload JSON** da API (correto como alias) ou auditorias não ligadas a coluna física.
- **`database/migrate-consentimento-bloco-l-2026-03-30.sql`** e RPCs financeiras: sem alteração (fora do conflito `nome` vs `username` em `usuarios`).

## 7. Riscos eliminados

- **Bootstrap** a partir de `schema.sql` deixando de criar coluna errada (`nome`) que o runtime não usa.
- **Contradição** entre DDL principal e uso de `username` em `schema-ranking` / runtime.
- **Procedimento de teste** no guia Supabase que falharia ou confundiria com coluna inexistente no modelo real.

## 8. Riscos remanescentes

- **Outros ficheiros** na raiz do repo (`schema-supabase-real.sql`, `schema-supabase-corrigido.sql`, variantes `SCHEMA-SUPABASE-*.sql`) podem ainda conter `nome` em `usuarios` ou lógica híbrida legada — **não** foram normalizados nesta cirurgia para não misturar modelos paralelos; `schema-supabase-final.sql` já declara `username` em `usuarios`.
- **`schema-completo.sql`** continua a ser um modelo paralelo (SERIAL, `password_hash` vs `senha_hash`, etc.); apenas foi **nota** de alinhamento em `username`, não unificação completa dos dois esquemas (fora de escopo).
- Ambientes que já aplicaram DDL antigo com `nome` **não** são migrados por este PR — a premissa foi banco real **já** com `username` e sem `nome`.

## 9. Checklist de validação

- [ ] Revisar diff de `database/schema.sql` na secção `usuarios`.
- [ ] Opcional: `grep -r "nome"` em `database/*.sql` procurando referências a `usuarios` (não a `conquistas`).
- [ ] Garantir que documentação de onboarding aponta para `schema.sql` v1.1.2 quando relevante.
- [ ] Após merge: nenhuma ação de DB em produção obrigatória para esta alteração (só alinhamento versionado).

## 10. Veredito final

**Concluído com escopo estrito:** o repositório deixa de afirmar que a coluna canónica de identificação pública em `usuarios` é `nome`; passa a refletir **`username`**, coerente com o runtime e com o banco real descrito. A compatibilidade da API via **`nome` como alias** mantém-se conceitualmente separada do DDL. Rollback permanece disponível pela tag **`pre-usuarios-username-ddl-alignment-2026-03-30`** se necessário desfazer alterações subsequentes no mesmo ramo.
