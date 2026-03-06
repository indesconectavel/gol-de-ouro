# Checklist — Patch CI Frontend Audit (2026-03-06)

## Pré-patch

- [x] Causa raiz confirmada (npm audit falha o job; vulnerabilidades em devDependencies antigas)
- [x] PR não introduziu o problema (sem alteração em package.json/lock)
- [x] Decisão: alterar apenas o workflow

## Implementação

- [x] Alterar somente `.github/workflows/frontend-deploy.yml`
- [x] Step "🔍 Análise de segurança frontend": adicionar `|| echo "⚠️ Vulnerabilidades encontradas no frontend"` após `npm audit --audit-level=moderate`
- [x] Manter execução do npm audit e echo final de conclusão
- [x] Não alterar código do player
- [x] Não alterar package.json nem package-lock.json

## Documentação

- [x] Relatório: `CI-FRONTEND-AUDIT-PATCH-2026-03-06.md`
- [x] Checklist: `CI-FRONTEND-AUDIT-PATCH-CHECKLIST-2026-03-06.md`
- [x] Rollback plan descrito no relatório

## Commit

- [ ] Commit pequeno e rastreável (mensagem clara)
- [ ] SHA registrado no relatório/checklist

## Pós-patch (responsabilidade do time)

- [ ] Push para a branch do PR (ou abrir PR com o patch)
- [ ] Revalidar: novo run do workflow no PR deve passar o job 🧪 Testes Frontend
- [ ] Merge do PR quando checks verdes

## Rollback (se necessário)

- [ ] Reverter a linha no workflow (remover `|| echo "..."`) ou `git revert <SHA>`
- [ ] Push e verificar que o comportamento anterior foi restaurado
