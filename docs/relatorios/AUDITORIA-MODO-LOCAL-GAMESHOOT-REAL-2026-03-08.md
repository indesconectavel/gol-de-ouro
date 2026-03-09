# AUDITORIA DO MODO LOCAL — CONFIRMAÇÃO REAL DO GAMESHOOT

**Data:** 2026-03-08  
**Modo:** READ-ONLY ABSOLUTO (nenhuma alteração realizada)  
**Escopo:** Versão real do GameShoot.jsx, divergência 382 vs 510, estado do frontend/backend local

---

## 1. Arquivo real do GameShoot.jsx

### 1.1 Caminho exato usado pelas rotas `/game` e `/gameshoot`

- **App.jsx (linha 15):** `import GameShoot from './pages/GameShoot'`
- Resolução no projeto: **`goldeouro-player/src/pages/GameShoot.jsx`**
- No workspace atual o player está em: **`goldeouro-backend/goldeouro-player/`**
- **Caminho absoluto lido:** `goldeouro-backend/goldeouro-player/src/pages/GameShoot.jsx`

As rotas `/game` e `/gameshoot` (App.jsx linhas 49–56) renderizam `<GameShoot />`; ambas importam o mesmo módulo acima.

### 1.2 Quantidade de linhas no disco

- **Contagem no arquivo lido:** **382 linhas** (incluindo linhas em branco e comentário final).
- Última linha de código do componente: 376 (`};`); linhas 377–382 são `export` e comentário.

### 1.3 Existência de outros GameShoot.jsx ou cópias

- **Único arquivo de página de jogo principal:** `goldeouro-player/src/pages/GameShoot.jsx`.
- Outros arquivos relacionados (não usados nas rotas `/game` e `/gameshoot`):
  - `GameShootFallback.jsx`
  - `GameShootTest.jsx`
  - `GameShootSimple.jsx`
- **Backups:** Busca por `backups/**/GameShoot*` no repositório retornou **0** arquivos (pasta de backup referida em PONTO-RESTAURACAO não contém GameShoot na árvore atual).
- Não foi encontrado segundo `GameShoot.jsx` (duplicata ou caminho alternativo) no projeto.

### 1.4 Conferência do import no App.jsx

- App importa **exatamente** `./pages/GameShoot` (sem extensão); o bundler resolve para `GameShoot.jsx`.
- Não há alias no `vite.config.ts` que remeta para outro arquivo; `resolve(__dirname, 'index.html')` é só para o build.

### 1.5 Respostas com evidência

| Pergunta | Resposta |
|----------|----------|
| Qual arquivo exato está sendo importado por `/game`? | **`goldeouro-player/src/pages/GameShoot.jsx`** (mesmo arquivo para `/game` e `/gameshoot`). |
| Quantas linhas ele tem no estado atual? | **382 linhas.** |
| Há divergência real entre a versão auditada e a versão local? | No repositório há **apenas uma** versão do arquivo; a auditada **é** a versão em disco (382 linhas). Se no ambiente de quem roda o dev a cópia for outra (ex.: outro clone ou outro diretório do player), aí sim pode haver divergência. |
| A linha ~510 pertence ao arquivo atual ou indica outro estado/cópia/cache? | **Não pertence ao arquivo fonte atual** (que tem 382 linhas). A linha ~510 tende a ser **(1)** número de linha no **bundle transformado** pelo Vite/esbuild (o overlay de erro pode mostrar a linha do bundle ou do source map), ou **(2)** referência a **outra cópia** do projeto (ex.: `goldeouro-player` em outro caminho) que não foi lida nesta auditoria. |

---

## 2. Divergência entre editor, disco e Vite

### 2.1 Arquivo salvo e conteúdo em disco

- Não foi possível inspecionar o estado “não salvo” do editor; a análise usa **apenas o conteúdo em disco**.
- O arquivo lido (382 linhas) é o que está no caminho `goldeouro-backend/goldeouro-player/src/pages/GameShoot.jsx`.

### 2.2 Vite: cache e versão servida

- **vite.config.ts:** não desabilita cache; não há configuração que force outro arquivo para `GameShoot`.
- **Cache do Vite:** existe `goldeouro-player/node_modules/.vite/deps/` com pré-bundles de dependências (react, axios, etc.); **não** há cópia de `GameShoot.jsx` ali — o código da aplicação é servido sob demanda a partir do disco.
- Em dev, o Vite usa **esbuild** e transforma JSX; o bundle resultante tem **outro número de linhas** que o fonte. O overlay de erro no navegador pode mostrar a linha no **bundle transformado** ou a linha mapeada pelo source map; daí a diferença 382 (fonte) vs ~510 (possível linha no bundle/transformação).

### 2.3 Hipóteses para 382 vs 510

| Hipótese | Sustentação |
|----------|-------------|
| **A) Arquivo local diferente** | Possível se houver outro clone/cópia do player (ex.: `goldeouro-player` fora de `goldeouro-backend`) com versão maior do arquivo. No **repositório auditado** há só a versão de 382 linhas. |
| **B) Arquivo não salvo** | Não verificável nesta auditoria; se o editor tiver conteúdo diferente do disco, o Vite servirá o que está no disco. |
| **C) Cache do Vite** | Cache de **deps** não contém GameShoot; o código da app vem do disco. Cache de transformação pode alterar **onde** a linha do erro aparece (bundle vs fonte), mas não “inventa” 510 linhas no arquivo fonte. |
| **D) Erro de outra origem** | Possível: erro em outro componente ou em arquivo que importa GameShoot; o stack trace pode apontar para o bundle onde o trecho de GameShoot aparece por volta da linha 510. |

### 2.4 Conclusão sobre a divergência

- **Causa mais provável da diferença 382 vs 510:** **(C) Vite/bundle** — a linha ~510 refere-se ao **código transformado** (bundle ou passo intermediário), não ao arquivo fonte de 382 linhas. Em segundo plano: **(A)** outra cópia do projeto com arquivo maior.
- **Hipótese mais sustentada pelas evidências:** a de **linha no bundle/transformação (C)**; no repo há um único GameShoot.jsx e ele tem 382 linhas.

---

## 3. Análise sintática do GameShoot.jsx

### 3.1 Estrutura do retorno JSX (linhas 331–376)

- **Raiz do return (331):** um único `<div className="min-h-screen ...">` — OK.
- **Nível seguinte:** `<div className="transition-all duration-300">` (332) e dentro dele `<div className="p-6">` (334).
- Dentro de `p-6`: Header (335–355), Valor do Chute (357–364), Campo de Futebol (366–318/319), animações (321–334), bloco “Tente novamente” (336–339), depois **`</div>` na linha 340**.

### 3.2 Problema identificado (causa exata)

- **Linha 335:** `</div>` — fecha o div **“Campo de Futebol”** (aberto na 366).
- **Linhas 336–339:** bloco condicional “Tente novamente” — irmão do bloco Campo, ainda dentro de `p-6`.
- **Linha 340:** `</div>` com 10 espaços.

O `<div className="p-6">` (334) foi aberto com **8 espaços**. Os fechamentos com 10 espaços já usados são: Header (355), Valor (364), Campo (335). Após 335 não há mais nenhum div aberto com 10 espaços. Portanto o **`</div>` da linha 340 é um fechamento a mais**: não há div correspondente ainda aberto nesse nível. Isso deixa o JSX **inválido** (fechamento extra ou “adjacent” conforme o parser).

### 3.3 Efeito no parser

- O parser pode acusar **“Adjacent JSX elements must be wrapped”** (o bloco condicional 336–339 e o `</div>` de 340 ficam como irmãos sem wrapper comum) ou **“Unmatched closing tag”** / erro de estrutura.
- **Causa exata no arquivo atual:** **um `</div>` a mais na linha 340.** O fechamento correto do container `p-6` deve ocorrer **depois** de Estatísticas, Sistema Gol de Ouro e Controles (ou seja, no nível onde hoje está o `</div>` da linha 373), e não antes deles.

### 3.4 Respostas

| Pergunta | Resposta |
|----------|----------|
| Existe erro de JSX visível no arquivo atual? | **Sim.** Um **`</div>` extra na linha 340** quebra a árvore JSX. |
| A causa é localizada? | **Sim.** Restrita às linhas 335–340 (fechamento do Campo + bloco “Tente novamente” + `</div>` sobrando). |
| O arquivo parece íntegro ou inconsistente? | **Inconsistente** nessa região: um fechamento a mais; o restante do arquivo (aberturas/fechamentos) está coerente. |

---

## 4. Estado real do frontend local

### 4.1 Outros erros potenciais

- **App.jsx:** Imports e rotas conferidos; `ToastContainer` está presente (linha 33); nenhum import quebrado detectado.
- **GameShoot:** Depende de `gameService`, `apiClient`, `API_ENDPOINTS`, `Logo`; todos existem no projeto.
- **Relatórios anteriores:** Dashboard.jsx já teve correção de JSX (divs/indentação); não foi reaberto nesta auditoria.
- **Sidebar:** Documentação e outros relatórios citam remoção de sidebar; no App.jsx atual não há uso de sidebar; GameShoot não importa Navigation nem useSidebar no arquivo de 382 linhas.

### 4.2 Resposta

| Pergunta | Resposta |
|----------|----------|
| O frontend local está bloqueado só por GameShoot.jsx? | **Sim, na análise estática.** O único erro de estrutura JSX identificado está em GameShoot.jsx (linha 340). Outras páginas não foram escaneadas para erros de compilação; recomenda-se rodar `npm run build` no player para confirmar. |
| Há outros problemas relevantes na fila? | Não foram encontrados **imports quebrados** nem **componentes órfãos** críticos. Possíveis pendências não bloqueantes: relatos de `ToastContainer`/toasts em outros docs; margens ml-64/ml-72 em algumas telas. |

---

## 5. Estado real do backend local

### 5.1 Por que o backend pode não subir

- **Ponto de falha no boot:** `config/required-env.js` chamado em `server-fly.js` (linhas 52–55).
- **Regra:** `assertRequiredEnv(['JWT_SECRET', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'], { onlyInProduction: ['MERCADOPAGO_DEPOSIT_ACCESS_TOKEN'] })`.
- Se alguma variável obrigatória estiver ausente ou vazia, o processo lança **antes** de abrir a porta (não há start parcial).

### 5.2 Variáveis obrigatórias no ambiente atual

- **Sempre:** `JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- **Só se `NODE_ENV === 'production'`:** `MERCADOPAGO_DEPOSIT_ACCESS_TOKEN`.
- **.env.example** não lista `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` nem `SUPABASE_ANON_KEY`; o `required-env.js` exige apenas as três acima (e a quarta em produção). O `supabase-unified-config.js` usa também `SUPABASE_ANON_KEY`; a validação dele roda na conexão, não no require, então o **start** do processo não falha por falta de `SUPABASE_ANON_KEY`, mas a conexão/health check pode falhar depois.

### 5.3 Uso de NODE_ENV=production em local

- Se no ambiente local estiver **NODE_ENV=production** (ex.: script ou .env), então `MERCADOPAGO_DEPOSIT_ACCESS_TOKEN` passa a ser obrigatória e a falta dela impede o backend de subir.

### 5.4 Respostas

| Pergunta | Resposta |
|----------|----------|
| O backend local está bloqueado apenas por configuração? | **Sim.** O único bloqueio identificado no código é a validação de env em `required-env.js`. Não há outro erro estrutural no start (ex.: server-fly não carrega `config/env.js` nem authMiddleware no boot). |
| Quais variáveis são obrigatórias no ambiente atual? | **Sempre:** JWT_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY. **Se NODE_ENV=production:** MERCADOPAGO_DEPOSIT_ACCESS_TOKEN. |
| Existe algo estrutural errado no start local? | **Não.** O arranque depende apenas de `dotenv`, `required-env` e dos requires; não há path incorreto nem módulo obrigatório faltando no fluxo de inicialização. |

---

## 6. Impacto por bloco

| Bloco | Impedido de testar localmente? | Validado em produção / análise estática? | Depende da restauração do ambiente local? |
|-------|--------------------------------|----------------------------------------|--------------------------------------------|
| **A — Financeiro** | Sim (sem frontend/backend estável não há fluxo PIX/saldo). | Parcialmente (lógica e rotas já auditadas em outros relatórios). | Sim (depósito/saque no player). |
| **B — Sistema de apostas** | Sim (GameShoot não compila). | Parcialmente (engine no backend e contrato já auditados). | Sim (tela de chute). |
| **C — Conta do usuário** | Sim (sem build não há login/perfil no browser). | Parcialmente (AuthContext e rotas conferidos). | Sim. |
| **D — Sistema de saldo** | Sim (sem frontend não há uso de saldo na UI). | Parcialmente (triggers e ledger em outros relatórios). | Sim. |
| **E — Gameplay** | **Sim (bloqueio direto pelo GameShoot.jsx).** | Parcialmente (regras e API já auditadas). | Sim. |
| **F — Interface** | Sim (build quebra). | Parcialmente (componentes e rotas existem). | Sim. |
| **G — Fluxo do jogador** | Sim (fluxo completo depende de front + back). | Parcialmente (fluxo documentado). | Sim. |

- **Resumo:** Todos os blocos estão **impedidos de serem testados de ponta a ponta no modo local** enquanto o frontend não compilar e, se for o caso, o backend não subir por env. Nenhum bloco fica “totalmente válido” só por análise estática sem ambiente local rodando.

---

## 7. Ordem segura para estabilizar o modo local

Sequência recomendada:

1. **Confirmar versão real do GameShoot**  
   No diretório onde você roda `npm run dev` (player), conferir que o arquivo compilado é `goldeouro-player/src/pages/GameShoot.jsx` e quantas linhas ele tem (no repo atual: 382). Se houver outro clone/caminho do player, inspecionar esse arquivo.

2. **Corrigir o erro JSX em GameShoot.jsx**  
   Remover o **`</div>` extra na linha 340** (ou recolocar o bloco “Tente novamente” e os fechamentos de forma que exista um único fechamento do `p-6` depois de Estatísticas, Sistema Gol de Ouro e Controles). Garantir um único elemento raiz no return e fechamentos pareados.

3. **Ajustar .env / NODE_ENV no backend (se o backend não subir)**  
   Garantir no `.env` local: `JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. Se quiser rodar local **sem** token do Mercado Pago, usar `NODE_ENV=development` ou não definir NODE_ENV. Opcionalmente preencher `SUPABASE_ANON_KEY` para o health check do Supabase.

4. **Validar o frontend**  
   Rodar `npm run build` no goldeouro-player; em seguida `npm run dev` e abrir `/game` e `/gameshoot`. Confirmar que o erro de compilação sumiu e que a linha do erro (se ainda aparecer em algum overlay) faz sentido com o arquivo corrigido.

5. **Validar o backend**  
   Rodar `node server-fly.js` (ou `npm start`) no goldeouro-backend e verificar que sobe sem “Variáveis de ambiente ausentes”. Testar health/endpoint básico se existir.

6. **Retomar revisão visual / E2E**  
   Com front e back estáveis, retomar testes de fluxo (login → dashboard → jogo → pagamentos/saque) e revisão visual conforme necessário.

---

## 8. Decisão final

- **O modo local está bloqueado por problemas localizados ou por algo mais estrutural?**  
  **Localizados:** (1) um `</div>` a mais em GameShoot.jsx (linha 340); (2) eventual falta de variáveis de ambiente no backend (ou NODE_ENV=production em local).

- **O problema principal agora é:**  
  **C) Ambos:**  
  - **A)** A “divergência” do GameShoot é na verdade **um único arquivo de 382 linhas** com erro de estrutura na região 335–340; a linha ~510 no navegador tende a ser do bundle/transformação.  
  - **B)** O backend pode não subir por configuração (env) se as três variáveis obrigatórias ou a quarta (em produção) faltarem.

- **É seguro seguir para um prompt cirúrgico depois desta auditoria?**  
  **Sim.** Causa do JSX e regras de env estão identificadas; um prompt cirúrgico pode ter como alvo: (1) remoção do `</div>` extra em GameShoot.jsx (e, se necessário, ajuste fino da estrutura 335–342); (2) instruções para .env/NODE_ENV local sem expor segredos.

- **Alvo recomendado do próximo prompt cirúrgico:**  
  **GameShoot.jsx** — corrigir a região das linhas 335–340 (eliminar o fechamento extra e manter um único elemento raiz e tags bem pareadas). Em paralelo ou em seguida, se o backend não estiver subindo: **configuração .env/NODE_ENV** do backend local (apenas nomes de variáveis e valores de exemplo, sem colar segredos reais).

---

## Classificação final

**MODO LOCAL BLOQUEADO POR PROBLEMAS LOCALIZADOS**

- Um erro de JSX localizado (um `</div>` a mais) em GameShoot.jsx.
- Bloqueio do backend apenas por variáveis de ambiente (e opcionalmente NODE_ENV em local).
- Nenhum indício de divergência estrutural ampla (múltiplos arquivos quebrados, arquitetura inconsistente). A diferença 382 vs 510 linhas é explicada pela linha no bundle/transformação ou por outra cópia do projeto.

---

*Auditoria realizada em modo read-only; nenhum arquivo foi alterado.*
