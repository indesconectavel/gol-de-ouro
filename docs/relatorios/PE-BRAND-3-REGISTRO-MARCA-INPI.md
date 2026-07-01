# PE.BRAND.3 — Registro de Marca INPI

**Projeto:** Indesconectável Payment Engine™ V1  
**Data:** 2026-07-01  
**Modo:** PREPARAÇÃO INSTITUCIONAL (protocolo INPI = ação do titular)  
**Pré-requisitos:** PE.BRAND.1, PE.BRAND.2

---

## Veredito

# PASS COM RESSALVAS

O dossiê de registro de marca no INPI está **preparado** para depósito. **Nenhum pedido foi protocolado** nesta fase — o INPI exige ação do titular (Gov.br, GRU, e-Marcas) fora do repositório.

**Ressalva:** assessoria jurídica recomendada; titular CPF/CNPJ a definir; taxas GRU por pedido.

---

## Objetivo

Preparar registro das marcas:

1. **INDESCONECTÁVEL** (marca-mãe)
2. **INDESCONECTÁVEL PAYMENT ENGINE** (produto)

---

## Entrega principal

| Artefato | Path |
|----------|------|
| Plano INPI completo | `docs/governance/INPI-PLANO-REGISTRO-MARCA.md` |

---

## Matriz de pedidos (resumo)

Cada linha = **1 pedido + 1 GRU** no e-Marcas.

| ID | Marca | Classe | Prioridade |
|----|-------|--------|:----------:|
| **A1** | INDESCONECTÁVEL | 42 (software/SaaS) | **P0** |
| **B1** | INDESCONECTÁVEL PAYMENT ENGINE | 42 | **P0** |
| A2 | INDESCONECTÁVEL | 9 (software produto) | P1 |
| B2 | INDESCONECTÁVEL PAYMENT ENGINE | 9 | P1 |
| A3 | INDESCONECTÁVEL | 36 (pagamentos) | P2 |

**Mínimo recomendado:** depositar **A1 + B1** (2 GRUs) antes de licenciamento comercial em escala.

---

## O que o titular deve fazer agora

1. Definir **titular legal** (PF ou PJ Indesconectável™)
2. Contratar advogado(a) de marcas (opcional mas recomendado)
3. Executar **busca de anterioridade** — §3 do plano INPI
4. Cadastrar-se no **e-INPI** / Gov.br
5. Depositar pedidos **A1** e **B1** via [e-Marcas](https://www.gov.br/pt-br/servicos/solicitar-o-registro-de-marca-de-produto-ou-servico)
6. Preencher tabela de processos em `INPI-PLANO-REGISTRO-MARCA.md` §7
7. Acompanhar via [BuscaWeb](https://busca.inpi.gov.br/pePI/) e RPI

---

## O que NÃO foi feito (por design)

| Ação | Motivo |
|------|--------|
| Protocolo INPI | Requer titular + pagamento GRU |
| Registro de software (código-fonte) | Fase opcional futura |
| Logotipo figurativo | Pendente identidade visual |
| Alteração de tags Git | Fora do escopo |

---

## Prazos INPI (referência gov.br, mar/2026)

| Cenário | Prazo estimado |
|---------|----------------|
| Sem oposição | ~18 meses até registro |
| Com oposição | ~22 meses |

---

## Integração patrimonial

Após protocolo, commitar atualização com números de processo em:

- `INPI-PLANO-REGISTRO-MARCA.md` §7
- `BRAND-AND-TRADEMARK-GUIDELINES.md`
- `INDICE-DUE-DILIGENCE.md`

---

## Próximo tijolo

### PE.BRAND.4 — Licenciamento comercial

Contrato-tipo de licença, política de uso de marca para clientes, FAQ jurídico-comercial.

---

## Critérios de sucesso PE.BRAND.3

| Critério | Status |
|----------|:------:|
| Plano INPI com classes e especificações | ✅ |
| Matriz marca × classe (1 GRU/pedido) | ✅ |
| Busca anterioridade documentada | ⏳ Titular |
| Pedido A1 protocolado | ⏳ Titular |
| Pedido B1 protocolado | ⏳ Titular |
| Números de processo no repo | ⏳ Pós-protocolo |

---

*PE.BRAND.3 — preparação concluída 2026-07-01. Protocolo INPI pendente do titular.*
