# ✅ GUIA COMPLETO DE VERIFICAÇÃO - TODAS AS PÁGINAS E FUNCIONALIDADES

**Data:** 13 de Novembro de 2025  
**Versão:** 1.2.0  
**Status:** ✅ **GUIA DE VERIFICAÇÃO CRIADO**

---

## 📋 **PÁGINAS DO JOGO**

### **1. PÁGINA DE LOGIN** (`/`)

#### **URL:** `https://goldeouro.lol/`

#### **Funcionalidades:**
- [ ] Campo de email visível e funcional
- [ ] Campo de senha visível e funcional
- [ ] Botão "Entrar" funcional
- [ ] Link "Esqueci minha senha" funcional
- [ ] Link "Criar conta" funcional
- [ ] Validação de campos (email inválido, senha vazia)
- [ ] Mensagem de erro para credenciais inválidas
- [ ] Redirecionamento para `/dashboard` após login bem-sucedido
- [ ] Token JWT armazenado no localStorage
- [ ] VersionBanner exibido corretamente

#### **Testes:**
1. **Login Válido:**
   - Email: `teste@example.com`
   - Senha: `senha123`
   - ✅ Deve redirecionar para `/dashboard`

2. **Login Inválido:**
   - Email: `invalido@example.com`
   - Senha: `senha123`
   - ❌ Deve mostrar mensagem de erro

3. **Validação:**
   - Email vazio → ❌ Deve mostrar erro
   - Senha vazia → ❌ Deve mostrar erro
   - Email inválido → ❌ Deve mostrar erro

---

### **2. PÁGINA DE REGISTRO** (`/register`)

#### **URL:** `https://goldeouro.lol/register`

#### **Funcionalidades:**
- [ ] Campo de nome de usuário visível e funcional
- [ ] Campo de email visível e funcional
- [ ] Campo de senha visível e funcional
- [ ] Campo de confirmação de senha (se houver)
- [ ] Botão "Criar conta" funcional
- [ ] Link "Já tenho conta" funcional
- [ ] Validação de campos
- [ ] Mensagem de erro para email já cadastrado
- [ ] Mensagem de erro para senha muito curta (< 6 caracteres)
- [ ] Redirecionamento para `/dashboard` após registro bem-sucedido
- [ ] Token JWT armazenado no localStorage
- [ ] VersionBanner exibido corretamente

#### **Testes:**
1. **Registro Válido:**
   - Nome: `Teste Usuario`
   - Email: `novo@example.com`
   - Senha: `senha123`
   - ✅ Deve criar conta e redirecionar para `/dashboard`

2. **Email Já Cadastrado:**
   - Email: `teste@example.com` (já existe)
   - ❌ Deve mostrar mensagem de erro

3. **Senha Muito Curta:**
   - Senha: `12345` (< 6 caracteres)
   - ❌ Deve mostrar mensagem de erro

---

### **3. PÁGINA DE RECUPERAÇÃO DE SENHA** (`/forgot-password`)

#### **URL:** `https://goldeouro.lol/forgot-password`

#### **Funcionalidades:**
- [ ] Campo de email visível e funcional
- [ ] Botão "Enviar link de recuperação" funcional
- [ ] Link "Voltar para login" funcional
- [ ] Validação de email
- [ ] Mensagem de sucesso após envio
- [ ] VersionBanner exibido corretamente

#### **Testes:**
1. **Email Válido:**
   - Email: `teste@example.com`
   - ✅ Deve mostrar mensagem de sucesso

2. **Email Inválido:**
   - Email: `invalido`
   - ❌ Deve mostrar erro de validação

---

### **4. PÁGINA DE REDEFINIÇÃO DE SENHA** (`/reset-password`)

#### **URL:** `https://goldeouro.lol/reset-password?token=...`

#### **Funcionalidades:**
- [ ] Campo de nova senha visível e funcional
- [ ] Campo de confirmação de senha visível e funcional
- [ ] Botão "Redefinir senha" funcional
- [ ] Validação de token (se inválido ou expirado)
- [ ] Validação de senhas (devem ser iguais)
- [ ] Mensagem de sucesso após redefinição
- [ ] Redirecionamento para `/` após sucesso
- [ ] VersionBanner exibido corretamente

#### **Testes:**
1. **Token Válido:**
   - Token: `token_valido_do_email`
   - Nova senha: `novasenha123`
   - ✅ Deve redefinir senha e redirecionar

2. **Token Inválido:**
   - Token: `token_invalido`
   - ❌ Deve mostrar erro

3. **Senhas Diferentes:**
   - Nova senha: `senha123`
   - Confirmação: `senha456`
   - ❌ Deve mostrar erro

---

### **5. DASHBOARD** (`/dashboard`) 🔒 **PROTEGIDA**

#### **URL:** `https://goldeouro.lol/dashboard`

#### **Funcionalidades:**
- [ ] **Navegação:**
  - [ ] Logo clicável (redireciona para dashboard)
  - [ ] Menu lateral funcional
  - [ ] Links de navegação funcionais
  - [ ] Botão de logout funcional

- [ ] **Informações do Usuário:**
  - [ ] Saldo atual exibido corretamente
  - [ ] Nome do usuário exibido
  - [ ] Email do usuário exibido

- [ ] **Estatísticas:**
  - [ ] Total de apostas exibido
  - [ ] Total de ganhos exibido
  - [ ] Taxa de vitória calculada corretamente

- [ ] **Histórico:**
  - [ ] Histórico de pagamentos carregado
  - [ ] Histórico de saques carregado
  - [ ] Histórico de chutes carregado

- [ ] **Ações Rápidas:**
  - [ ] Botão "Jogar" redireciona para `/game`
  - [ ] Botão "Depositar" redireciona para `/pagamentos`
  - [ ] Botão "Sacar" redireciona para `/withdraw`

- [ ] **Proteção:**
  - [ ] Redireciona para `/` se não autenticado
  - [ ] VersionBanner exibido corretamente

#### **Testes:**
1. **Acesso Sem Autenticação:**
   - Acessar `/dashboard` sem token
   - ❌ Deve redirecionar para `/`

2. **Acesso Com Autenticação:**
   - Fazer login primeiro
   - Acessar `/dashboard`
   - ✅ Deve exibir dashboard com dados do usuário

3. **Carregamento de Dados:**
   - ✅ Saldo deve ser carregado do backend
   - ✅ Histórico deve ser carregado do backend

---

### **6. PÁGINA DO JOGO** (`/game` ou `/gameshoot`) 🔒 **PROTEGIDA**

#### **URL:** `https://goldeouro.lol/game`

#### **Funcionalidades:**
- [ ] **Interface do Jogo:**
  - [ ] Campo de futebol renderizado
  - [ ] Goleiro visível e animado
  - [ ] Bola visível e animada
  - [ ] 5 zonas de chute visíveis (TL, TR, C, BL, BR)

- [ ] **Seleção de Aposta:**
  - [ ] Botões de valor de aposta (R$ 1, 2, 5, 10) funcionais
  - [ ] Valor selecionado destacado
  - [ ] Validação de saldo suficiente

- [ ] **Chute:**
  - [ ] Clique em zona de chute funciona
  - [ ] Animação de chute executada
  - [ ] Resultado exibido (gol ou defesa)
  - [ ] Prêmio calculado corretamente
  - [ ] Saldo atualizado após chute

- [ ] **Estatísticas:**
  - [ ] Contador de chutes atualizado
  - [ ] Contador de gols atualizado
  - [ ] Contador de defesas atualizado
  - [ ] Contador até Gol de Ouro atualizado

- [ ] **Gol de Ouro:**
  - [ ] Gol de Ouro detectado (a cada 1000 chutes)
  - [ ] Animação especial exibida
  - [ ] Prêmio adicional de R$ 100 creditado

- [ ] **Áudio:**
  - [ ] Som de chute reproduzido
  - [ ] Som de gol reproduzido
  - [ ] Som de defesa reproduzido
  - [ ] Música de fundo (se houver)

- [ ] **Proteção:**
  - [ ] Redireciona para `/` se não autenticado
  - [ ] VersionBanner exibido corretamente

#### **Testes:**
1. **Chute com Saldo Suficiente:**
   - Selecionar valor: R$ 1
   - Clicar em zona: "TL"
   - ✅ Deve processar chute e atualizar saldo

2. **Chute com Saldo Insuficiente:**
   - Saldo: R$ 0
   - Tentar chutar com R$ 1
   - ❌ Deve mostrar erro "Saldo insuficiente"

3. **Gol:**
   - Realizar chute
   - Se gol: ✅ Deve mostrar animação e creditar prêmio

4. **Defesa:**
   - Realizar chute
   - Se defesa: ✅ Deve mostrar animação e debitar aposta

---

### **7. PÁGINA DE PAGAMENTOS** (`/pagamentos`) 🔒 **PROTEGIDA**

#### **URL:** `https://goldeouro.lol/pagamentos`

#### **Funcionalidades:**
- [ ] **Saldo:**
  - [ ] Saldo atual exibido corretamente

- [ ] **Criar Depósito:**
  - [ ] Valores pré-definidos funcionais (R$ 10, 25, 50, 100, 200, 500)
  - [ ] Campo de valor customizado funcional
  - [ ] Botão "Gerar PIX" funcional
  - [ ] Validação de valor mínimo (R$ 1,00)
  - [ ] Validação de valor máximo (R$ 1.000,00)

- [ ] **QR Code:**
  - [ ] QR Code exibido após criação
  - [ ] Código PIX copiável (Copy & Paste)
  - [ ] QR Code Base64 exibido
  - [ ] Data de expiração exibida

- [ ] **Histórico:**
  - [ ] Lista de pagamentos carregada
  - [ ] Status de cada pagamento exibido (pending, approved, rejected)
  - [ ] Data de criação exibida
  - [ ] Valor exibido

- [ ] **Consulta de Status:**
  - [ ] Botão "Consultar Status" funcional
  - [ ] Atualização automática de status
  - [ ] Notificação quando pagamento aprovado

- [ ] **Proteção:**
  - [ ] Redireciona para `/` se não autenticado
  - [ ] VersionBanner exibido corretamente

#### **Testes:**
1. **Criar Depósito:**
   - Selecionar valor: R$ 10
   - Clicar "Gerar PIX"
   - ✅ Deve criar pagamento e exibir QR Code

2. **Valor Mínimo:**
   - Tentar criar depósito de R$ 0,50
   - ❌ Deve mostrar erro "Valor mínimo é R$ 1,00"

3. **Valor Máximo:**
   - Tentar criar depósito de R$ 2.000
   - ❌ Deve mostrar erro "Valor máximo é R$ 1.000,00"

4. **Copiar Código PIX:**
   - Clicar em "Copiar"
   - ✅ Deve copiar código para clipboard

---

### **8. PÁGINA DE SAQUES** (`/withdraw`) 🔒 **PROTEGIDA**

#### **URL:** `https://goldeouro.lol/withdraw`

#### **Funcionalidades:**
- [ ] **Saldo:**
  - [ ] Saldo atual exibido corretamente

- [ ] **Formulário de Saque:**
  - [ ] Campo de valor funcional
  - [ ] Campo de chave PIX funcional
  - [ ] Seleção de tipo de chave funcional (CPF, Email, Telefone, Chave Aleatória)
  - [ ] Validação de valor mínimo
  - [ ] Validação de saldo suficiente
  - [ ] Validação de formato de chave PIX

- [ ] **Criar Saque:**
  - [ ] Botão "Solicitar Saque" funcional
  - [ ] Mensagem de sucesso após criação
  - [ ] Taxa de saque exibida (R$ 2,00)
  - [ ] Valor líquido calculado corretamente

- [ ] **Histórico:**
  - [ ] Lista de saques carregada
  - [ ] Status de cada saque exibido (pendente, processando, aprovado, rejeitado)
  - [ ] Data de criação exibida
  - [ ] Valor exibido

- [ ] **Proteção:**
  - [ ] Redireciona para `/` se não autenticado
  - [ ] VersionBanner exibido corretamente

#### **Testes:**
1. **Criar Saque Válido:**
   - Valor: R$ 10
   - Chave PIX: `12345678900` (CPF)
   - Tipo: CPF
   - ✅ Deve criar saque e mostrar mensagem de sucesso

2. **Saldo Insuficiente:**
   - Saldo: R$ 5
   - Tentar sacar: R$ 10
   - ❌ Deve mostrar erro "Saldo insuficiente"

3. **Chave PIX Inválida:**
   - CPF: `123` (menos de 11 dígitos)
   - ❌ Deve mostrar erro de validação

---

### **9. PÁGINA DE PERFIL** (`/profile`) 🔒 **PROTEGIDA**

#### **URL:** `https://goldeouro.lol/profile`

#### **Funcionalidades:**
- [ ] **Informações do Usuário:**
  - [ ] Nome exibido
  - [ ] Email exibido
  - [ ] Data de cadastro exibida
  - [ ] Nível/Tipo exibido

- [ ] **Estatísticas:**
  - [ ] Total de apostas exibido
  - [ ] Total de ganhos exibido
  - [ ] Taxa de vitória calculada
  - [ ] Ranking exibido (se houver)

- [ ] **Edição de Perfil:**
  - [ ] Botão "Editar" funcional
  - [ ] Campos editáveis (nome, email)
  - [ ] Botão "Salvar" funcional
  - [ ] Validação de dados

- [ ] **Histórico:**
  - [ ] Histórico de apostas exibido
  - [ ] Histórico de saques exibido
  - [ ] Histórico de depósitos exibido

- [ ] **Conquistas:**
  - [ ] Lista de conquistas exibida
  - [ ] Conquistas desbloqueadas destacadas
  - [ ] Conquistas bloqueadas esmaecidas

- [ ] **Proteção:**
  - [ ] Redireciona para `/` se não autenticado
  - [ ] VersionBanner exibido corretamente

#### **Testes:**
1. **Carregar Perfil:**
   - Acessar `/profile`
   - ✅ Deve exibir dados do usuário

2. **Editar Perfil:**
   - Clicar "Editar"
   - Alterar nome
   - Clicar "Salvar"
   - ✅ Deve salvar alterações

---

### **10. PÁGINA DE TERMOS** (`/terms`)

#### **URL:** `https://goldeouro.lol/terms`

#### **Funcionalidades:**
- [ ] Conteúdo dos termos exibido
- [ ] Link "Voltar" funcional
- [ ] VersionBanner exibido corretamente

---

### **11. PÁGINA DE PRIVACIDADE** (`/privacy`)

#### **URL:** `https://goldeouro.lol/privacy`

#### **Funcionalidades:**
- [ ] Conteúdo da política de privacidade exibido
- [ ] Link "Voltar" funcional
- [ ] VersionBanner exibido corretamente

---

### **12. PÁGINA DE DOWNLOAD** (`/download`)

#### **URL:** `https://goldeouro.lol/download`

#### **Funcionalidades:**
- [ ] Informações sobre download do app exibidas
- [ ] Link de download do APK funcional
- [ ] Instruções de instalação exibidas
- [ ] VersionBanner exibido corretamente

---

## 🔍 **VERIFICAÇÃO DE INTEGRAÇÕES**

### **Backend (Fly.io):**
- [ ] Health check funcionando (`/health`)
- [ ] Endpoints de autenticação funcionando
- [ ] Endpoints de pagamento funcionando
- [ ] Endpoints de jogo funcionando
- [ ] Webhook do Mercado Pago funcionando

### **Banco de Dados (Supabase):**
- [ ] Conexão estabelecida
- [ ] Tabelas criadas corretamente
- [ ] RLS configurado (ou desabilitado)
- [ ] Funções SQL funcionando

### **Pagamentos (Mercado Pago):**
- [ ] Criação de pagamento PIX funcionando
- [ ] Webhook recebendo notificações
- [ ] Crédito automático de saldo funcionando

---

## 📊 **CHECKLIST DE FUNCIONALIDADES CRÍTICAS**

### **Autenticação:**
- [x] Registro de usuários
- [x] Login de usuários
- [x] Recuperação de senha
- [x] Redefinição de senha
- [x] Logout
- [x] Proteção de rotas

### **Pagamentos:**
- [x] Criar depósito PIX
- [x] Consultar status de pagamento
- [x] Webhook processando pagamentos
- [x] Crédito automático de saldo
- [x] Solicitar saque
- [x] Validação de chaves PIX

### **Jogo:**
- [x] Realizar chute
- [x] Sistema de lotes funcionando
- [x] Cálculo de prêmios
- [x] Gol de Ouro implementado
- [x] Atualização de saldo
- [x] Estatísticas do jogo

### **Interface:**
- [x] Navegação funcional
- [x] Responsividade
- [x] Loading states
- [x] Mensagens de erro
- [x] Mensagens de sucesso
- [x] VersionBanner

---

## 🎯 **PRÓXIMOS PASSOS**

1. **Executar Verificação Manual:**
   - Acessar cada página listada acima
   - Testar cada funcionalidade
   - Marcar checkboxes conforme testado

2. **Verificar Logs:**
   - Verificar logs do backend (Fly.io)
   - Verificar logs do frontend (Vercel)
   - Verificar erros no console do navegador

3. **Testar em Diferentes Dispositivos:**
   - Desktop
   - Mobile
   - Tablet

4. **Testar em Diferentes Navegadores:**
   - Chrome
   - Firefox
   - Safari
   - Edge

---

**Documentação criada em:** 13 de Novembro de 2025  
**Status:** ✅ **GUIA DE VERIFICAÇÃO COMPLETO**

