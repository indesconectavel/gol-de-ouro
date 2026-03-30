# DECLARAÇÃO DE AUTORIA E PROPRIEDADE — GOL DE OURO

**Natureza:** registo formal **documental** no repositório, sem efeito jurídico automático fora do contexto em que for subscrita por titular competente.  
**Data de consolidação deste texto:** 2026-03-29  

---

## 1. Nome do projeto

**Gol de Ouro** — produto digital integrado (backend, frontends jogador e admin, documentação e artefactos de operação no repositório `goldeouro-backend`).

---

## 2. Descrição do projeto

Sistema de jogo com **conta e saldo**, **depósitos PIX** (Mercado Pago), **gameplay** com motor por lotes em memória e **saques**, exposto via API Node/Express com persistência em **Supabase (PostgreSQL)**. O repositório inclui aplicações **`goldeouro-player`** e **`goldeouro-admin`**, scripts, SQL de schema/RPC e **extensa documentação** em `docs/` e `docs/relatorios/`.

---

## 3. Estrutura criada

- **Backend de produção referenciado pela documentação:** `server-fly.js` como ponto de entrada; `Dockerfile` com `CMD ["node", "server-fly.js"]`; `package.json` com `main` / `start` → `server-fly.js`.  
- **Routers e utilitários** alinhados ao monólito (ex.: `routes/adminApiFly.js`, `routes/analyticsIngest.js`, integração Supabase, validação de webhook, normalização financeira).  
- **Frontends** em subpastas do monorepositório.  
- **Base de dados:** ficheiros SQL e migrações em `database/`.  
- **Documentação:** relatórios de auditoria, checklists, runbook, mapas de endpoints e riscos, índices e **pacote oficial** em `docs/` (projeto oficial, memória estratégica, mapa oficial vs legado, contexto crítico, etc.).

---

## 4. Elementos de propriedade intelectual

Incluem, sem limitação enumerativa absoluta:

- **Código-fonte** e configuração de build/deploy presentes no repositório.  
- **Documentação técnica e operacional** produzida no âmbito do projeto (auditorias, decisões, procedimentos).  
- **Desenho de fluxos** (PIX, webhook, reconcile, chute, saque, admin).  
- **Nome e identidade de produto** “Gol de Ouro” tal como utilizados no projeto.  

O campo **`author`** em `package.json` indica **"Gol de Ouro Team"**; a **licença** declarada no mesmo ficheiro é **MIT** — a interpretação jurídica concreta compete ao titular legal e aos instrumentos que este subscrever.

---

## 5. Data de consolidação atual

**2026-03-29** (data do pacote documental de contexto e proteção; atualizar se houver nova rodada oficial de consolidação).

---

## 6. Responsável pela criação e condução

**A preencher pelo titular legal ou pela pessoa moral que detenha a propriedade do produto.**  
Este ficheiro **não** atribui nomes de indivíduos ou entidades sem registo explícito fornecido pelo titular; a finalidade é reservar o espaço para assinatura/identificação oficial quando aplicável.

---

## 7. Estado atual do desenvolvimento

Conforme documentação consolidada (relatório mestre e checklists V1): **fase final de preparação para produção** — núcleo técnico V1 descrito e auditado em modo READ-ONLY; **ativação** depende de **infraestrutura paga**, **secrets** e **validação no ambiente real** (deploy, webhook, smoke tests), sem reabrir o desenho base salvo decisão estratégica.

---

## 8. Observação sobre documentação, arquitetura e lógica proprietária

A **arquitetura**, as **decisões** registadas em `docs/MEMORIA-ESTRATEGICA-GOLDEOURO-V1.md` e nos relatórios, e a **lógica de negócio** descrita nas auditorias constituem **conhecimento organizacional** do projeto. A sua reprodução ou uso fora do âmbito autorizado pelo titular deve seguir **contratos, licenças e leis aplicáveis**. O repositório contém também **caminhos legados e ficheiros de confusão** — ver `docs/MAPA-OFICIAL-VS-LEGADO-GOLDEOURO.md` — que não diminuem a proteção sobre o **caminho oficial** documentado.

---

## 9. Conclusão formal

O **Gol de Ouro** é um produto com **estrutura de código, dados e documentação** consolidada neste repositório. A presente declaração **formaliza o registo documental** de autoria organizacional e de elementos de propriedade intelectual **no âmbito do projeto**, devendo ser **completada** com identificação do titular e instrumentos legais quando a equipa ou os sócios o exigirem.

---

*Fim da declaração.*
