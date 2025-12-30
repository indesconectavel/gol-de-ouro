#!/bin/bash
# 🚀 CRIAR RELEASE v1.2.0 - GOL DE OURO
# ======================================
# Data: 15/11/2025
# Status: Script para criar release v1.2.0

echo "🚀 Criando Release v1.2.0..."

# Criar tag
git tag -a v1.2.0 -m "Release v1.2.0 - Correções de Segurança e Melhorias

## 🎉 Release v1.2.0

### ✅ Correções de Segurança
- Correção de vulnerabilidades SSRF
- Correção de aleatoriedade insegura
- Correção de format string vulnerabilities
- Melhorias em sanitização e HTML filtering

### ✅ Correções de Bugs
- Correção de erros 404 no backend (rotas / e /robots.txt)
- Correção de erros 404 no frontend Vercel
- Correção de CSP para permitir scripts externos (PostHog e GTM)

### ✅ Melhorias
- Adicionado version: 2 no vercel.json
- Adicionado cleanUrls e trailingSlash
- Melhorias em workflows GitHub Actions
- Documentação completa de auditorias

### 📊 Estatísticas
- PR #18 mergeado com sucesso
- 5,523 linhas adicionadas
- 41 linhas removidas
- 40 arquivos alterados

### 🔗 Links
- PR #18: https://github.com/indesconectavel/gol-de-ouro/pull/18
- Commit: 0a2a5a1effb18f78e6df7d7081cd9c04e657e800"

# Push tag
git push origin v1.2.0

# Criar release no GitHub
gh release create v1.2.0 \
  --title "v1.2.0 - Correções de Segurança e Melhorias" \
  --notes "## 🎉 Release v1.2.0

### ✅ Correções de Segurança
- Correção de vulnerabilidades SSRF
- Correção de aleatoriedade insegura
- Correção de format string vulnerabilities
- Melhorias em sanitização e HTML filtering

### ✅ Correções de Bugs
- Correção de erros 404 no backend (rotas / e /robots.txt)
- Correção de erros 404 no frontend Vercel
- Correção de CSP para permitir scripts externos (PostHog e GTM)

### ✅ Melhorias
- Adicionado version: 2 no vercel.json
- Adicionado cleanUrls e trailingSlash
- Melhorias em workflows GitHub Actions
- Documentação completa de auditorias

### 📊 Estatísticas
- PR #18 mergeado com sucesso
- 5,523 linhas adicionadas
- 41 linhas removidas
- 40 arquivos alterados

### 🔗 Links
- PR #18: https://github.com/indesconectavel/gol-de-ouro/pull/18
- Commit: 0a2a5a1effb18f78e6df7d7081cd9c04e657e800"

echo "✅ Release v1.2.0 criada!"

