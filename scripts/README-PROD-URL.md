# Configuração da URL de Produção

## 📝 Como configurar

1. **Edite o arquivo** `scripts/prod.backend.url.txt`
2. **Substitua** a URL exemplo pela URL real do seu backend no Render
3. **Salve** o arquivo

## 🌐 Exemplo de URL

```
https://goldeouro-backend-abc123.onrender.com
```

## 🔍 Onde encontrar a URL

1. Acesse [Render Dashboard](https://dashboard.render.com/)
2. Clique no seu serviço `goldeouro-backend`
3. Copie a URL mostrada em "URL"
4. Cole no arquivo `scripts/prod.backend.url.txt`

## ✅ Testar

Após configurar, execute:

```bash
.\scripts\smoke.prod.ps1
```

## 🚨 Importante

- **Nunca commite** este arquivo com URLs reais
- Use apenas para testes locais
- Para produção, configure as variáveis no Vercel
