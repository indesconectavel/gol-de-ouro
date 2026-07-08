# Checklist — Entrega final V1 (reunião / investidores)

**Pacote:** V1.FINAL.F  
**Baseline:** `a83c3cf` · Fly v461 · `index-B6M2smS9.js` · 88/100 · CERTIFIED WITH RESSALVAS

Marque cada item antes da reunião. Não substitui runbooks de incidente.

---

## PDFs

- [ ] `MASTER HANDBOOK.pdf` exportado e em `01-EXECUTIVE-PDF/`
- [ ] `EXECUTIVE SUMMARY.pdf` exportado e em `01-EXECUTIVE-PDF/`
- [ ] `DELIVERY INDEX.pdf` exportado e em `01-EXECUTIVE-PDF/`
- [ ] PDFs revisados (datas, SHA, score 88/100)
- [ ] Capa institucional aplicada (ver `11-COVER/`)

---

## Demo

- [ ] Roteiro de rehearsal lido ([../04-DEMO/V1-PRESENTATION-REHEARSAL-FLOW.md](../04-DEMO/V1-PRESENTATION-REHEARSAL-FLOW.md))
- [ ] Checklist de ambiente demo OK ([../04-DEMO/V1-DEMO-ENVIRONMENT-CHECKLIST.md](../04-DEMO/V1-DEMO-ENVIRONMENT-CHECKLIST.md))
- [ ] Plano de contingência à mão ([../04-DEMO/V1-DEMO-CONTINGENCY-PLAN.md](../04-DEMO/V1-DEMO-CONTINGENCY-PLAN.md))
- [ ] Validação de runtime documentada ([../04-DEMO/V1-DEMO-RUNTIME-VALIDATION.md](../04-DEMO/V1-DEMO-RUNTIME-VALIDATION.md))
- [ ] Apresentação ensaiada (tempo e transições)
- [ ] Admin testado (fluxo mínimo da demo)
- [ ] Player testado (login, jogo, saldo visível se aplicável)

---

## Mobile

- [ ] Celular carregado e com tela limpa
- [ ] PWA instalado ou atalho configurado
- [ ] APK/build de referência documentado em `09-MOBILE/` (se usar)
- [ ] Prints mobile copiados para `09-MOBILE/` ou `10-BACKUPS/`

---

## Backups

- [ ] Screenshots preparados (`10-BACKUPS/`)
- [ ] Vídeos preparados (`12-VIDEOS/` e cópia em backups se offline)
- [ ] Evidências financeiras (ledger/PIX/401) arquivadas
- [ ] Fallback demo testado sem depender só de Wi‑Fi ao vivo

---

## Certificação

- [ ] Certificado oficial impresso ou PDF ([../../../certification/GOLDEOURO-V1-OFFICIAL-CERTIFICATION.md](../../../certification/GOLDEOURO-V1-OFFICIAL-CERTIFICATION.md))
- [ ] Baseline V1 citada ([../../../certification/V1-BASELINE-CERTIFIED.md](../../../certification/V1-BASELINE-CERTIFIED.md))
- [ ] V1.6 e JSON de dados disponíveis em `06-CERTIFICATION/`
- [ ] [V1-FINAL-FREEZE.md](V1-FINAL-FREEZE.md) lido pela equipe

---

## Reunião (dia D)

- [ ] `/health` OK em produção
- [ ] `/meta` SHA OK (`a83c3cff…`)
- [ ] Webhook sem HMAC → **401** OK (teste controlado, sem spam)
- [ ] Hotspot pronto (backup de rede)
- [ ] 4G pronto no celular
- [ ] Runbook aberto ([../../../runbooks/README.md](../../../runbooks/README.md) ou pasta `05-OPERATIONS/`)
- [ ] Ninguém autorizado a deployar durante a reunião
- [ ] Materiais `01` → `06` na ordem acordada no [README.md](README.md)

---

## Pós-reunião

- [ ] Ata: decisões, perguntas em aberto, próximos gates
- [ ] Lista de follow-ups (sem comprometer escopo V1 congelado)
- [ ] Atualizar cópias locais do pacote se novos PDFs forem gerados
- [ ] Manter freeze até gate formal de descongelamento ([V1-FINAL-FREEZE.md](V1-FINAL-FREEZE.md))
- [ ] Registrar se houve incidente durante demo (template operacional)

---

**Confirmação:** montagem deste checklist **não** alterou produção, banco, deploy nem código funcional.
