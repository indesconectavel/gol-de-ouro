# Validação do preview da baseline FyKKeg6zb

**Projeto:** Gol de Ouro  
**Data:** 2026-03-08  
**Objetivo:** Validar se o preview da branch **baseline/fykkeg6zb** reproduz o deploy validado **FyKKeg6zb** (Current).

---

## 1. Objetivo da validação

Provar, em ambiente de preview, se a branch **baseline/fykkeg6zb** (commit 0a2a5a1) gera resultado visual e funcional equivalente ao deploy validado em produção **FyKKeg6zb**, sem alterar produção, main, Fly, banco ou env.

---

## 2. Branch e tag utilizadas

| Item | Valor |
|------|--------|
| **Branch** | baseline/fykkeg6zb |
| **Tag** | fykkeg6zb-baseline |
| **Commit** | 0a2a5a1 (0a2a5a1effb18f78e6df7d7081cd9c04e657e800) |
| **Mensagem** | Merge pull request #18 from indesconectavel/security/fix-ssrf-vulnerabilities |
| **Verificação** | git rev-parse baseline/fykkeg6zb = git rev-parse fykkeg6zb-baseline = 0a2a5a1 |

---

## 3. Preview gerado

| Item | Valor |
|------|--------|
| **Push executado** | Sim. `git push -u origin baseline/fykkeg6zb` concluído com sucesso. |
| **Branch no remoto** | origin/baseline/fykkeg6zb criada; branch local configurada para trackear origin/baseline/fykkeg6zb. |
| **Trigger do preview** | A Vercel, ao estar ligada ao repositório (ex.: indesconectavel/gol-de-ouro) com Root Directory = goldeouro-player, passa a construir um deployment para cada push na branch. O preview da **baseline/fykkeg6zb** é gerado automaticamente após o push. |
| **Deployment ID / URL** | Não obtidos automaticamente (sem acesso à API Vercel). **Como obter:** Vercel Dashboard → projeto **goldeouro-player** → aba Deployments → filtrar por branch **baseline/fykkeg6zb**; ou no GitHub, na branch baseline/fykkeg6zb, verificar o status check da Vercel e o link "View deployment". |
| **URL típica de preview** | Padrão comum: `https://goldeouro-player-<id-ou-slug>-<team>.vercel.app` ou link gerado pela Vercel para a branch (ex.: preview no comentário do commit ou na lista de deployments). |

**Conclusão:** O preview foi **disparado** pelo push; a URL e o status do build devem ser conferidos no dashboard da Vercel ou na integração GitHub.

---

## 4. Comparação visual com FyKKeg6zb

Checklist para o operador comparar **Preview da baseline/fykkeg6zb** vs **Current FyKKeg6zb** (deploy validado):

### 4.1 Tela de login

- [ ] Layout geral semelhante ao Current (logo, campos, botão).
- [ ] **Presença ou ausência de banner verde** (VersionBanner): no **código** do commit 0a2a5a1, Login.jsx importa e renderiza `<VersionBanner showTime={true} />`; portanto o **preview** tende a **exibir** o banner. O Current validado foi descrito como "login sem banner verde" — se o preview mostrar o banner, há **divergência** em relação a essa descrição.
- [ ] **VersionWarning** (global no App.jsx): no código da baseline também está presente; verificar se aparece no topo ou em outra área.
- [ ] Estrutura visual, botões, fundo, logo: anotar diferenças.

### 4.2 Navegação inicial

- [ ] Ao abrir a URL do preview, a rota carregada é **/** (login).
- [ ] Comportamento visual da home/login comparado ao Current.

### 4.3 Login

- [ ] Tentar login com credenciais válidas de produção.
- [ ] Observar: sucesso, "Credenciais inválidas", "Erro ao fazer login" (rede/timeout), ou erro de CORS no console.
- [ ] Se falhar: anotar mensagem e abas Network/Console (CORS, status HTTP, URL chamada).

### 4.4 Dashboard / Game (se o login passar)

- [ ] Estrutura principal (sidebar, saldo, menu).
- [ ] Layout lembra o Current validado ou versão “antiga” diferente.
- [ ] Presença de barra de versão ou outros elementos divergentes.

### 4.5 Banner e elementos divergentes

- [ ] **VersionBanner** aparece em login/outras páginas? (Sim/Não.)
- [ ] **VersionWarning** aparece? (Sim/Não.)
- [ ] Listar onde o preview diverge do Current (banner, cores, textos, rotas).

---

## 5. Resultado do login

A ser preenchido pelo operador após testar o preview:

- **Login funcionou?** ( ) Sim  ( ) Não  
- **Se não:** mensagem exibida (ex.: "Erro ao fazer login", "Credenciais inválidas") e causa provável (CORS, env de preview, backend indisponível, outro).  
- **URL chamada pelo frontend:** verificar em Network qual `API_BASE_URL` foi usada (ex.: goldeouro-backend-v2.fly.dev para domínio de preview).

**Nota técnica:** No código da baseline, **environments.js** define a API por hostname: localhost → development (localhost:8080); demais hostnames → production (goldeouro-backend-v2.fly.dev). O domínio do preview (*.vercel.app) não é localhost, então o frontend deve usar produção. Se o backend (Fly) não permitir a origem do preview em CORS, o login pode falhar com erro de CORS.

---

## 6. Presença ou ausência de banner

- **No código da baseline (0a2a5a1):** Login.jsx, Register, ForgotPassword, ResetPassword, Dashboard, Profile, Pagamentos importam e renderizam **VersionBanner**; App.jsx renderiza **VersionWarning**. Não há condicional que desative esses componentes em produção no código auditado.
- **Expectativa para o preview:** o build a partir de baseline/fykkeg6zb **deve incluir** esses componentes; portanto é **provável** que o **banner apareça** no preview.
- **Current FyKKeg6zb:** descrito como "login sem banner verde". Se o deploy validado foi buildado a partir do mesmo commit 0a2a5a1, a diferença poderia ser variáveis de build (ex.: VITE_BUILD_* não definidas no build da Vercel na época) ou outro fator de build; não confirmado.
- **Conclusão para esta validação:** até confirmação visual pelo operador, considerar que o **preview pode exibir o banner**, divergindo da descrição do Current.

---

## 7. Diferenças restantes

- **Possível divergência 1:** Banner (VersionBanner/VersionWarning) no preview vs ausência no Current descrito.
- **Possível divergência 2:** Login no preview falha por CORS (origem *.vercel.app não permitida no backend) ou por variáveis de ambiente de Preview na Vercel diferentes das de Production.
- **Possível divergência 3:** Hash do bundle (ex.: index-*.js) do preview pode ser **diferente** do index-qIGutT6K.js do FyKKeg6zb (mesmo código-fonte pode gerar hash diferente por data/build env); a comparação visual e funcional é o critério prático.

---

## 8. Conclusão técnica

- A **branch baseline/fykkeg6zb** foi enviada ao remoto com sucesso e o **preview é gerado** pela Vercel a partir dessa branch.
- A **equivalência visual e funcional** ao deploy FyKKeg6zb **só pode ser afirmada** após o operador abrir a URL do preview (obtida no dashboard Vercel ou no GitHub), executar o checklist acima e comparar com o Current.
- Com base **apenas no código** do commit 0a2a5a1: o preview tende a **mostrar o banner** (VersionBanner + VersionWarning) e o **login** pode funcionar se CORS e env de Preview estiverem corretos; caso contrário, é provável falha por CORS ou env.
- **Status recomendado** até validação manual: **BASELINE AINDA NÃO REPRODUZIDA** (preview gerado, mas equivalência ao FyKKeg6zb pendente de confirmação visual/funcional e possível divergência de banner/env/CORS). Se após o checklist o operador constatar que o preview está igual ao Current (sem banner e login ok), o status pode ser atualizado para **BASELINE REPRODUZIDA COM SUCESSO**.

---

## 9. Próximo passo recomendado

1. **Obter a URL do preview:** Vercel Dashboard → projeto goldeouro-player → Deployments → branch **baseline/fykkeg6zb** → abrir o deployment e copiar a URL.
2. **Executar o checklist** da seção 4 e 5 neste documento (login, banner, layout, CORS/erro).
3. **Comparar** lado a lado com o Current FyKKeg6zb (ou com o que estiver em www.goldeouro.lol se ainda for esse deploy).
4. **Documentar** no próprio relatório ou em comentário: URL do preview, resultado do login, presença/ausência de banner, e se o preview está ou não equivalente ao FyKKeg6zb.
5. Se o **banner** aparecer no preview e no Current não: decidir se a baseline de referência permanece 0a2a5a1 (e aceitar a diferença) ou se será necessário condicionar VersionBanner/VersionWarning por env em uma branch futura, sem alterar produção nesta etapa.
6. Se o **login** falhar: verificar CORS no backend (Fly) para a origem do preview e variáveis de ambiente de Preview no projeto Vercel.

---

*Relatório gerado após push da branch baseline/fykkeg6zb. Nenhum código, produção, Vercel, Fly ou env foi alterado; apenas Git (checkout e push).*
