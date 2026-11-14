---
name: gdo-auditoria-sem-efeitos
description: Auditar Gol de Ouro sem ações financeiras, alteração de runtime ou deploy, reduzindo contexto e risco.
---
# Gol de Ouro — auditoria sem efeitos

1. Identifique primeiro **repositório, branch e baseline** da tarefa; há backend, admin e player separados e documentos históricos. Não trate relatórios antigos como prova do estado atual.
2. Leia somente os arquivos relevantes e os trechos correspondentes. Use `.cursor/commands/` como checklists de referência, não como autorização de comandos.
3. Audite em modo somente leitura. Não invoque login real, depósitos, saques, webhooks PIX, operações Asaas/MP, alterações Fly/Vercel/Supabase ou deploy sem autorização explícita e específica.
4. Proteja credenciais e dados de usuários. Não exponha conteúdo de `.env` nem imprima segredos em logs ou respostas.
5. Diferencie observação direta, documentação e hipótese; cite `arquivo:linha`. Não declare testes, homologação ou produção íntegra sem execução e evidência.
6. Prefira uma hipótese por vez e verificações pontuais. Não crie novos MCPs, agentes paralelos ou dependências para uma auditoria simples.
7. Entrega curta: **evidência | risco | menor correção sugerida | validação necessária | próximo tijolo**. Correções e deploys são tarefas separadas e exigem aprovação.
