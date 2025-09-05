# 📱 Gol de Ouro - Mobile App

**Aplicativo nativo para iOS e Android do jogo Gol de Ouro**

## 🚀 Visão Geral

O Gol de Ouro Mobile é um aplicativo nativo desenvolvido com React Native e Expo que oferece a experiência completa do jogo de futebol em dispositivos móveis.

## ✨ Funcionalidades

### 🎮 Jogo Completo
- **Sistema de chute** interativo com 3 zonas
- **Física realista** da bola
- **Sistema de pontuação** dinâmico
- **Tempo limitado** para partidas
- **Animações fluidas** e responsivas

### 👤 Perfil do Jogador
- **Upload de foto** de perfil
- **Estatísticas** detalhadas
- **Sistema de níveis** e XP
- **Conquistas** e badges
- **Configurações** personalizáveis

### 🏆 Ranking e Competições
- **Rankings** em tempo real
- **Pódium** dos melhores jogadores
- **Filtros** por período (diário, semanal, mensal)
- **Compartilhamento** de conquistas

### 🔗 Integração Blockchain
- **Transparência total** dos jogos
- **Transações verificáveis**
- **Rankings imutáveis**
- **Auditoria completa**

### 📱 Recursos Mobile
- **Notificações push** personalizadas
- **Modo offline** para prática
- **Sincronização** automática
- **Integração** com câmera
- **Compartilhamento** social

## 🛠️ Tecnologias

- **React Native** - Framework mobile
- **Expo** - Plataforma de desenvolvimento
- **React Navigation** - Navegação
- **React Native Paper** - UI components
- **Expo Linear Gradient** - Gradientes
- **Expo Image Picker** - Seleção de imagens
- **Expo Notifications** - Push notifications
- **Expo Haptics** - Feedback tátil
- **AsyncStorage** - Armazenamento local
- **Axios** - Requisições HTTP

## 📦 Instalação

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Expo CLI
- Android Studio (para Android)
- Xcode (para iOS)

### Passos

1. **Clone o repositório**
```bash
git clone https://github.com/goldeouro/mobile-app.git
cd goldeouro-mobile
```

2. **Instale as dependências**
```bash
npm install
# ou
yarn install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

4. **Inicie o servidor de desenvolvimento**
```bash
npm start
# ou
expo start
```

## 🚀 Deploy

### Desenvolvimento
```bash
# Android
npm run android

# iOS
npm run ios

# Web
npm run web
```

### Produção
```bash
# Build Android
npm run build:android

# Build iOS
npm run build:ios
```

## 📱 Screenshots

### Tela Inicial
- Dashboard com estatísticas
- Botão de jogar destacado
- Jogos recentes
- Conquistas desbloqueadas

### Tela de Jogo
- Campo de futebol interativo
- Zonas de chute coloridas
- Controles intuitivos
- Sistema de pontuação

### Tela de Perfil
- Foto de perfil personalizável
- Estatísticas detalhadas
- Sistema de níveis
- Configurações

### Tela de Ranking
- Pódium dos melhores
- Lista completa de jogadores
- Filtros por período
- Sua posição destacada

## 🔧 Configuração

### Variáveis de Ambiente
```env
API_BASE_URL=http://localhost:3000/api
EXPO_PUBLIC_API_URL=http://localhost:3000/api
EXPO_PUBLIC_BLOCKCHAIN_URL=http://localhost:3000/api/blockchain
```

### Configuração de Notificações
```javascript
// app.json
{
  "expo": {
    "notification": {
      "icon": "./assets/notification-icon.png",
      "color": "#ffffff"
    }
  }
}
```

## 📊 Performance

### Métricas
- **Tempo de inicialização:** < 3 segundos
- **FPS:** 60 FPS constante
- **Tamanho do app:** < 50MB
- **Uso de memória:** < 100MB
- **Bateria:** Otimizado para longa duração

### Otimizações
- **Lazy loading** de componentes
- **Memoização** de cálculos pesados
- **Compressão** de imagens
- **Cache** inteligente de dados
- **Debounce** em interações

## 🧪 Testes

### Testes Unitários
```bash
npm test
```

### Testes de Integração
```bash
npm run test:integration
```

### Testes E2E
```bash
npm run test:e2e
```

## 📈 Analytics

### Métricas Rastreadas
- **Jogos iniciados** e finalizados
- **Tempo de sessão** médio
- **Zonas de chute** mais usadas
- **Taxa de retenção** diária/semanal
- **Conversão** de usuários

### Ferramentas
- **Expo Analytics** - Métricas básicas
- **Firebase Analytics** - Análise avançada
- **Custom Events** - Eventos personalizados

## 🔒 Segurança

### Implementações
- **Autenticação JWT** robusta
- **Criptografia** de dados sensíveis
- **Validação** de entrada
- **Rate limiting** automático
- **Logs** de segurança

### Boas Práticas
- **Não armazenar** senhas localmente
- **Validar** todas as entradas
- **Usar HTTPS** para todas as requisições
- **Implementar** timeout em requisições
- **Monitorar** tentativas de acesso

## 🌐 Internacionalização

### Idiomas Suportados
- **Português** (Brasil) - Padrão
- **Inglês** - Em desenvolvimento
- **Espanhol** - Planejado

### Configuração
```javascript
// i18n.js
import { I18nManager } from 'react-native';

const translations = {
  pt: {
    welcome: 'Bem-vindo ao Gol de Ouro',
    play: 'Jogar',
    // ...
  },
  en: {
    welcome: 'Welcome to Gol de Ouro',
    play: 'Play',
    // ...
  }
};
```

## 🐛 Troubleshooting

### Problemas Comuns

#### App não inicia
```bash
# Limpar cache
expo r -c

# Reinstalar dependências
rm -rf node_modules
npm install
```

#### Erro de build
```bash
# Limpar build
expo build:clear

# Rebuild
expo build:android
```

#### Problemas de performance
- Verificar uso de memória
- Otimizar imagens
- Reduzir re-renders
- Implementar lazy loading

## 📞 Suporte

### Canais de Suporte
- **Email:** suporte@goldeouro.com
- **Discord:** https://discord.gg/goldeouro
- **GitHub Issues:** https://github.com/goldeouro/mobile-app/issues

### Documentação
- **API Docs:** https://docs.goldeouro.com/api
- **Component Library:** https://docs.goldeouro.com/components
- **Tutorials:** https://docs.goldeouro.com/tutorials

## 🤝 Contribuição

### Como Contribuir
1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

### Padrões de Código
- **ESLint** para linting
- **Prettier** para formatação
- **Conventional Commits** para commits
- **Jest** para testes

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🏆 Créditos

**Desenvolvido com ❤️ pela Equipe Gol de Ouro**

- **Desenvolvimento:** Equipe de Desenvolvimento
- **Design:** Equipe de UX/UI
- **Blockchain:** Equipe de Blockchain
- **QA:** Equipe de Qualidade

---

**Gol de Ouro Mobile - O futuro dos jogos de futebol está em suas mãos!** ⚽📱
