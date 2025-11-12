# 📋 Changelog - Gol de Ouro

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [1.2.0] - 2025-11-12

### ✅ Adicionado
- Sistema automático de atualização de banner com data/hora do deploy
- Script `inject-build-info.js` para injetar informações de build
- Dependabot configurado para atualizações automáticas de dependências
- Arquivos padrão: CONTRIBUTING.md, SECURITY.md, CHANGELOG.md
- Correções de URL do backend (unificação para goldeouro-backend-v2.fly.dev)
- Saneamento de URL no apiClient (remoção de BOM, normalização)
- Permissões corrigidas no health-monitor.yml
- Timeout aumentado no health-monitor.yml

### 🔧 Corrigido
- Banner mostrando data desatualizada (agora atualiza automaticamente)
- URL malformada no login (BOM character removido)
- CORS configurado incorretamente (X-Idempotency-Key adicionado)
- Backend boot failure (logger opcional com fallback)
- App name incorreto em workflows (goldeouro-backend-v2)
- Workflows duplicados identificados e documentados
- Código duplicado no rollback.yml removido

### 🔄 Alterado
- VersionBanner agora usa variáveis de ambiente injetadas no build
- Todas as páginas removem props hardcoded do VersionBanner
- Health monitor mais tolerante a falhas temporárias
- Workflows atualizados para usar app correto (goldeouro-backend-v2)

### 📚 Documentação
- Auditoria completa de correções recentes
- Auditoria completa do GitHub Actions
- Auditoria completa e avançada do GitHub
- Resumos executivos criados

---

## [1.1.0] - 2025-10-25

### ✅ Adicionado
- Sistema de monitoramento de saúde
- Workflows de CI/CD completos
- Análise de segurança automatizada
- CodeQL Analysis

### 🔧 Corrigido
- Problemas de CORS
- Configurações de deploy

---

## [1.0.0] - 2025-09-21

### ✅ Adicionado
- Versão inicial do sistema
- Backend Node.js + Express
- Frontend React + Vite
- Sistema de autenticação JWT
- Integração com Mercado Pago PIX
- Sistema de jogo completo
- Deploy para Fly.io e Vercel

---

## Tipos de Mudanças

- `✅ Adicionado` - Novas funcionalidades
- `🔄 Alterado` - Mudanças em funcionalidades existentes
- `🗑️ Removido` - Funcionalidades removidas
- `🔧 Corrigido` - Correções de bugs
- `🔒 Segurança` - Correções de segurança
- `📚 Documentação` - Mudanças na documentação

---

**Formato baseado em:** [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/)  
**Versionamento:** [Semantic Versioning](https://semver.org/lang/pt-BR/)
