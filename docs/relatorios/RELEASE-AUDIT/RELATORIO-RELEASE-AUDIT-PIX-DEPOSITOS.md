# Relatório Release Audit — PIX Depósitos (READ-ONLY)

**Data:** 2026-02-05T20:58:11.766Z

## 1. Contagem por status

| status | count |
|--------|-------|
| expired | 258 |
| pending | 34 |
| approved | 22 |

## 2. Duplicidade

- payment_id duplicado (total): 0
- payment_id duplicado em approved: 0
- external_id duplicado (total): 1
- external_id com >1 approved: 0

## 3. Qualidade

- amount/valor nulo: 0
- valor <= 0: 0
- valor > 10000: 0

## 4. Pendings antigos

Total pending: 34
Faixas: 0-1d=2, 2-7d=2, 8-30d=21, 31+d=9

## 5. Cruzamento approved por usuario_id

| usuario_id (mascarado) | soma_pix_approved | qtd_pix_approved |
|--------------------------|-------------------|------------------|
| u_254ad5 | 69 | 12 |
| u_2e7df6 | 10 | 1 |
| u_f38dcf | 5 | 1 |
| u_3f81df | 10 | 1 |
| u_deafdd | 10 | 1 |
| u_508b8d | 1 | 1 |
| u_6a1eb8 | 10 | 1 |
| u_7b1c35 | 6 | 4 |
