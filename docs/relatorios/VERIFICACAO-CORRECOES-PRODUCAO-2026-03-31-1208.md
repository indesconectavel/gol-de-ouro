# VERIFICAÇÃO DE CORREÇÕES EM PRODUÇÃO

## 1. Resumo executivo
A correção PIX/Webhook/Reconcile **não está comprovadamente em produção**. O runtime ativo ainda exibe comportamento compatível com código antigo, com drift local x produção ainda presente.

## 2. Escopo verificado
- Estado local Git (commit, árvore, pendências).
- Tags de rastreabilidade/rollback.
- Estado real de deploy na Fly (releases, image, machine/version).
- Logs reais de produção para comparar comportamento esperado x observado.

## 3. Commit
- `HEAD` atual local: `7d94d3a7d7f4c987b00bd82e3d9e3c305df4f797`.
- Há mudanças não commitadas, incluindo arquivos críticos da correção:
  - `server-fly.js` (modificado)
  - `utils/webhook-signature-validator.js` (modificado)
  - `database/migrate-pagamentos-pix-legado-non-numeric-skip-2026-03-31.sql` (não rastreado)
- Conclusão: **não há evidência de commit final da correção nesta árvore atual** e a árvore local **não está limpa**.

## 4. Tags
- Tags relevantes identificadas:
  - `pre-bloco-m-seguranca-2026-03-30` (exemplo de proteção prévia)
  - `fykkeg6zb-baseline` (baseline)
  - `v1.0.0-pre-deploy` e demais tags históricas
- Não foi identificada tag explícita de pós-correção PIX/Webhook/Reconcile nesta rodada.
- Conclusão: rollback histórico existe via tags anteriores, mas a correção atual não está plenamente rastreável por tag dedicada.

## 5. Deploy
- App Fly: `goldeouro-backend-v2`.
- `flyctl status` mostra image ativa: `goldeouro-backend-v2:deployment-01KK9VY7DCVTESWZAS2ANDA5PP`.
- Máquina ativa:
  - `ID: 1850066f141908`
  - `VERSION: 340`
  - `LAST UPDATED: 2026-03-09T17:57:50Z`
- `flyctl releases` confirma release mais recente completa: `v340` (09/03/2026).
- Conclusão: **não há deploy novo associado à correção cirúrgica recente**.

## 6. Runtime em produção
- Runtime ativo permanece em release antiga (`v340`).
- Não há evidência de atualização de machine/version após os ajustes locais de 31/03.

## 7. Drift
- **Drift existe** entre local e produção.
- Evidências:
  - local contém alterações não commitadas da correção.
  - produção permanece em release de 09/03.
  - logs de produção continuam com padrões antigos.

## 8. Prova concreta da correção em produção
### Evidência observada (produção atual)
- Logs mostram repetidamente:
  - `❌ [WEBHOOK] Signature inválida: Formato de signature inválido`
  - `❌ [RECON] ID de pagamento inválido (não é número): deposito_...`

### Comparação com o comportamento esperado pós-correção
- Esperado após correção:
  - logs de webhook com `validation.code` quando inválido;
  - redução/controle de ruído recorrente de reconcile para legados não numéricos.
- Observado:
  - mensagem antiga sem `code=...`;
  - ruído recorrente intacto de `deposito_...`.

### Conclusão de runtime
- A evidência concreta aponta que a produção **ainda está com comportamento antigo**.
- Correção **não comprovada no runtime**.

## 9. Checklist final
- [ ] commit existe
- [ ] árvore local limpa
- [x] tag de segurança existe
- [ ] deploy executado com sucesso
- [ ] runtime atualizado
- [ ] drift eliminado
- [ ] prova concreta de produção atualizada
- [ ] teste funcional liberado

## 10. Classificação final
**CORREÇÃO NÃO DEPLOYADA**

## 11. Decisão operacional
**TESTE BLOQUEADO**

