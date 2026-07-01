# Certificação Oficial — Plataforma Gol de Ouro V1

---

**Documento:** Certificação Operacional e de Integridade — Versão 1  
**Emissor:** Programa de Governança Operacional Gol de Ouro  
**Data oficial:** 19 de maio de 2026  
**Classificação:** Uso interno, sócios e investidores qualificados  

---

## 1. Identificação da plataforma

| Campo | Valor |
|-------|-------|
| **Nome comercial** | Gol de Ouro |
| **Domínio principal** | goldeouro.lol |
| **Produto** | Jogo de penáltis com saldo real, depósitos PIX e saques |
| **Versão certificada** | **V1** (encerramento oficial 2026-05-19) |

---

## 2. Baseline operacional congelada

A baseline abaixo constitui referência única para deploy, auditoria e herança da futura **Engine V2**.

| Parâmetro | Valor certificado |
|-----------|-------------------|
| **Commit runtime (produção)** | `a83c3cffcc998ed3d1bd8d2e88619a9b03afb634` |
| **Commit curto** | `a83c3cf` |
| **Fly.io release** | **v461** |
| **Aplicação Fly** | `goldeouro-backend-v2` |
| **API produção** | `https://goldeouro-backend-v2.fly.dev` |
| **Bundle player (Vercel)** | `index-B6M2smS9.js` |
| **Documento baseline** | `docs/certification/V1-BASELINE-CERTIFIED.md` |

Qualquer alteração em produção que diverja destes identificadores **invalida** esta certificação até novo ciclo formal (V1.7+ ou V2).

---

## 3. Certificação emitida

| Item | Resultado |
|------|-----------|
| **Programa** | V1.1A → V1.6 (auditoria, hardening, governança, certificação) |
| **Missão final** | V1.6 — Operational Production Certification |
| **Auditoria suprema** | V1.FINAL — Supreme Audit & Executive Delivery |
| **Veredito** | **CERTIFIED WITH RESSALVAS** |
| **Veredito operacional** | **PASS COM RESSALVAS** |
| **Score consolidado** | **88 / 100** |
| **Maturidade operacional** | **Semi-autonomous** |
| **Classificação** | **GOVERNED** |

---

## 4. Domínios avaliados

| Domínio | Score | Estado |
|---------|------:|--------|
| Runtime & deploy | 100 | Alinhado ao baseline |
| Integridade financeira | 85 | P0 ausente; legado documentado |
| Segurança (webhooks/HMAC) | 100 | Hardening live V1.1F |
| Governança operacional | 100 | Runbooks, gates, incident flow |
| Observabilidade | 100 | Scripts e relatórios; alertas externos dry-run |
| Resiliência | 96 | Engines V1.5 simulados |
| Readiness ativação | 82 | Gate REVIEW; monitoramento externo plano |

---

## 5. Riscos aceitos (declaração formal)

Os seguintes riscos foram **identificados, quantificados e aceitos** para continuidade da V1:

1. Trinta e quatro (34) pagamentos PIX `approved` sem entrada correspondente no ledger — backlog legado estável (casos U1–U4).
2. Zero (0) registros históricos `payout_confirmado` no ledger — coerente com modelo de integração documentado.
3. Monitoramento externo e roteamento de alertas em produção **não ativados** — apenas plano e dry-run (V1.5C/V1.5D).
4. Gate pré-deploy em estado **REVIEW** — aprovação humana obrigatória antes de releases.
5. Validação de liveness do worker de payout dependente de análise de logs Fly em janela operacional.

Estes riscos **não constituem** falha de certificação P0, desde que permaneçam estáveis e monitorados conforme runbooks.

---

## 6. Declarações de conformidade

| Declaração | Status |
|------------|--------|
| Produção alterada durante emissão deste documento | **Não** |
| SQL aplicado durante certificação | **Não** |
| Deploy executado durante certificação | **Não** |
| Webhooks hardened (401 sem assinatura) | **Sim** (verificado live) |
| Duplicatas ledger críticas | **0** |
| Saldo negativo de usuários | **0** |

---

## 7. Status operacional

| Status | Descrição |
|--------|-----------|
| **OPERACIONAL** | Plataforma em produção com baseline certificada |
| **GOVERNED** | Processos, runbooks e gates documentados |
| **NOT ENTERPRISE-SCALE-TESTED** | Sem evidência de stress test em massa |
| **EXPANSION-READY (CONTROLLED)** | Aptidão para V2 e crescimento com change control |

---

## 8. Validade e renovação

- **Vigência:** válida enquanto runtime, Fly release e bundle permanecerem alinhados à baseline, salvo novo ciclo de certificação.
- **Renovação obrigatória após:** deploy de runtime, patch RPC/ledger em produção, ou ativação de monitoramento/CI bloqueante.
- **Contato técnico:** repositório `goldeouro-backend` · relatórios em `docs/relatorios/`.

---

## 9. Assinatura documental

```
┌─────────────────────────────────────────────────────────────┐
│  GOL DE OURO — CERTIFICAÇÃO OFICIAL V1                      │
│  Status: CERTIFIED WITH RESSALVAS                           │
│  Data: 2026-05-19                                           │
│  Baseline: a83c3cf · Fly v461 · index-B6M2smS9.js           │
│  Score: 88/100 · Maturidade: Semi-autonomous                │
└─────────────────────────────────────────────────────────────┘
```

---

*Documento institucional. Não substitui due diligence jurídica, fiscal ou de investimento.*
