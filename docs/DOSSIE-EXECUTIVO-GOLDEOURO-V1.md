# DOSSIÊ EXECUTIVO — GOL DE OURO V1

**Público-alvo:** sócios, investidores e parceiros **não técnicos**.  
**Data:** 2026-03-29  
**Detalhe técnico:** `docs/PROJETO-GOLDEOURO-V1-OFICIAL.md` e `docs/relatorios/RELATORIO-MESTRE-V1-GOLDEOURO.md`.

---

## 1. Resumo executivo

O **Gol de Ouro** é uma plataforma de jogo com **conta própria**, **carregamento via PIX** e **prémios** ligados ao desempenho no jogo, com **saques**. O software está num estado em que a **lógica principal** e a **documentação** foram **revistas e consolidadas**; falta, para operação comercial técnica, **colocar o sistema num servidor pago**, **configurar chaves e ligações** (banco de dados, pagamentos, segurança) e **validar** tudo no ambiente real com checklists já escritos.

---

## 2. Situação atual

- **Produto:** versão **V1** fechada em termos de desenho documentado — monólito único, integração Mercado Pago e Supabase, duas aplicações web (jogador e administração).  
- **Documentação:** centenas de relatórios técnicos mais um **pacote de entrada** (projeto oficial, memória estratégica, mapa oficial vs legado, “leia antes”).  
- **Risco residual:** conhecido e **listado** (escala, memória do jogo, configuração de webhook, painel admin com histórico de código antigo). Nada disso é “surpresa oculta”; está em matriz de riscos e no relatório mestre.

---

## 3. Nível de prontidão

**PRONTO COM RESSALVAS** — expressão já usada no relatório mestre: o código e o plano estão alinhados para um **primeiro go-live** quando houver **orçamento de infraestrutura** e **tempo de configuração/teste**. As ressalvas são sobretudo **operação** (secrets corretos, uma máquina para o jogo, SQL aplicado no banco) e **disciplina** (não usar caminhos legados nem múltiplas instâncias sem decisão nova).

---

## 4. Dependências de infraestrutura

- **Hospedagem** do backend (ex.: Fly.io, referida na documentação).  
- **Base de dados** gerida (Supabase).  
- **Mercado Pago** (conta, token, URL pública do backend para notificações).  
- **Construção e alojamento** das páginas do jogador e do painel (URLs e variáveis de ambiente no build).  

---

## 5. Custos operacionais conhecidos

Este dossie **não fixa valores em moeda**: os custos dependem do fornecedor escolhido, tráfego e plano Supabase/Fly/MP. A documentação **`INVENTARIO-ENV-V1.md`** e os checklists de deploy listam **o que** tem de existir, não **quanto** custa. Para orçamento, pedir estimativa ao responsável financeiro com base nos preços públicos atuais dos serviços.

---

## 6. Riscos controlados

- **Riscos mapeados** com impacto e mitigação descritos (`MATRIZ-RISCOS-V1.md`).  
- **Procedimentos** para incidentes comuns (PIX, webhook, saldo) no **runbook**.  
- **Checklist GO/NO-GO** define o que **bloqueia** o lançamento se não estiver verificado.

---

## 7. Fatores que ainda impedem ativação real

- Ausência de **ambiente pago** configurado end-to-end.  
- **Secrets** e URLs não validados no ar (webhook, `BACKEND_URL`, JWT, admin).  
- **SQL** de produção (constraints, RPC) não confirmado como igual ao esperado pelo código.  
- **Testes de fumo** no ambiente real não executados ou não assinados conforme `SMOKE-TEST-PRODUCAO-V1.md`.

---

## 8. Leitura final para sócios e parceiros

O Gol de Ouro V1 é um produto **maduro em documentação e desenho**, com **caminho claro** para ligar a “tomada”: infraestrutura, chaves e testes. Os principais riscos de negócio técnico são **configuração errada**, **mais de um servidor** a servir o jogo sem plano, e **painel admin** ainda com código antigo no cliente — todos **anticipados** e **geríveis** com o material já produzido. O passo seguinte natural é **orçamentar o deploy** e **executar os checklists** no dia do go-live.

---

*Fim do dossiê executivo.*
