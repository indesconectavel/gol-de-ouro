# Gol de Ouro - Frontend Jogador

Frontend para jogadores do sistema Gol de Ouro, desenvolvido com React e Vite.

## 🎯 Funcionalidades

### 📱 Páginas Implementadas
- **Loading Screen** - Tela de carregamento com logo animado
- **Login** - Autenticação do jogador
- **Registro** - Cadastro de novos jogadores
- **Dashboard** - Painel principal com saldo e ações
- **Jogo** - Interface do penalty shootout
- **Perfil** - Informações do jogador e históricos
- **Saque** - Solicitação de saques via PIX

### 🎮 Sistema de Jogo
- **Fila de Jogadores** - Sistema de espera
- **Chutes ao Gol** - 5 zonas de chute com multiplicadores
- **Sistema de Apostas** - Controle de valor e saldo
- **Resultados** - Feedback visual dos chutes

### 🎨 Design
- **Mobile-First** - Otimizado para dispositivos móveis
- **Tema de Estádio** - Visual imersivo de futebol
- **Animações** - Transições suaves com Framer Motion
- **Responsivo** - Adaptável para desktop e mobile

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+
- npm ou yarn

### Instalação
```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

### Configuração
O frontend se conecta automaticamente ao backend em `http://localhost:3000`.

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   └── LoadingScreen.jsx
├── pages/              # Páginas da aplicação
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Dashboard.jsx
│   ├── Game.jsx
│   ├── Profile.jsx
│   └── Withdraw.jsx
├── hooks/              # Hooks customizados
│   └── useGame.jsx
├── config/             # Configurações
│   └── api.js
├── utils/              # Utilitários
├── assets/             # Recursos estáticos
├── App.jsx             # Componente principal
├── main.jsx            # Ponto de entrada
└── index.css           # Estilos globais
```

## 🎯 Baseado nas Imagens

O frontend foi desenvolvido seguindo exatamente as imagens e wireframes fornecidos:

1. **Tela de Login/Cadastro** - Formulário com background de estádio
2. **Tela de Aguardando** - Timer, contador e botão jogar
3. **Tela de Jogo** - Campo com goleiro e zonas de chute
4. **Tela de Vitória** - Feedback de gol com prêmio
5. **Tela de Saque** - Formulário PIX com saldo
6. **Tela de Perfil** - Informações e históricos
7. **Dashboard** - Saldo, botões e lista de apostas

## 🔧 Tecnologias

- **React 18** - Framework principal
- **Vite** - Build tool e dev server
- **React Router** - Navegação
- **Framer Motion** - Animações
- **Tailwind CSS** - Estilização
- **Lucide React** - Ícones
- **Axios** - Cliente HTTP

## 📱 Responsividade

- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px  
- **Desktop**: 1024px+

## 🎨 Tema Visual

- **Cores Principais**: Azul, Verde, Dourado
- **Background**: Gradientes de estádio
- **Efeitos**: Glass morphism, glow, animações
- **Tipografia**: Inter (Google Fonts)

## 🔗 Integração com Backend

O frontend se conecta ao backend através de:
- **API REST** - Para dados e autenticação
- **WebSocket** - Para atualizações em tempo real
- **Endpoints** - Configurados em `src/config/api.js`

## 📊 Estado do Jogo

Gerenciado pelo hook `useGame`:
- Estado do jogo (esperando, jogando, finalizado)
- Timer e countdown
- Apostas e saldo
- Histórico de jogadas
- Fila de jogadores

## 🚀 Próximos Passos

1. **Integração com Backend** - Conectar APIs reais
2. **Autenticação** - Sistema de login completo
3. **Pagamentos** - Integração com Mercado Pago
4. **Notificações** - Push notifications
5. **PWA** - Progressive Web App
6. **Testes** - Unit e integration tests

## 📝 Notas de Desenvolvimento

- Desenvolvido seguindo as imagens fornecidas
- Interface mobile-first
- Componentes reutilizáveis
- Estado gerenciado com Context API
- Animações suaves e responsivas
- Código limpo e documentado
