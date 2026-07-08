# 02 — Technical

**Prioridade:** P1 (due diligence técnica / CTO)  
**Finalidade:** evidências de arquitetura, runtime, deploy, hardening H3 e auditorias técnicas.

---

## O que deve ficar aqui

Cópias ou PDFs derivados de:

| Tema | Documentos sugeridos |
|------|----------------------|
| **Arquitetura** | [../../../V1-FINAL-TECHNICAL-DOSSIER.md](../../../V1-FINAL-TECHNICAL-DOSSIER.md) |
| **Runtime / deploy** | V1.2C drift/deploy; baseline SHA `a83c3cf`, Fly v461 |
| **H3 / game** | Relatórios H3 em `docs/relatorios/` |
| **Auditorias técnicas** | H3-6B runtime; V1.1F webhook/payout hardening |
| **Integrações** | PIX, webhooks, workers (somente relatórios, sem secrets) |

---

## O que não colocar

- `.env`, tokens, chaves HMAC reais
- Scripts executáveis de deploy alterados neste pacote
- Patches SQL (ficam em `database/` — referência apenas)

---

## Uso na reunião

Apresentar sob demanda após demo e bloco financeiro. Resposta padrão: baseline **GOVERNED**, runtime congelado em v461.
