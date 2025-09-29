# Guia de Configuração DNS - Gol de Ouro v1.1.1

## 🌐 REGISTROS DNS NECESSÁRIOS

### 1. Admin Panel (admin.goldeouro.lol)
```
Tipo: CNAME
Nome: admin
Valor: cname.vercel-dns.com
TTL: 300 (5 minutos)
```

### 2. Player Mode (goldeouro.lol)
```
Opção A - Nameservers Vercel:
- Configurar nameservers do domínio para Vercel
- Adicionar domínio no painel Vercel

Opção B - ANAME/ALIAS:
Tipo: ANAME/ALIAS
Nome: @
Valor: cname.vercel-dns.com
TTL: 300
```

## 🔧 CONFIGURAÇÃO NO VERCEL

### 1. Adicionar Domínios
1. Acessar [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecionar projeto (goldeouro-player ou goldeouro-admin)
3. Ir em "Settings" > "Domains"
4. Adicionar domínio:
   - Player: `goldeouro.lol`
   - Admin: `admin.goldeouro.lol`

### 2. Configurar SSL
1. Aguardar verificação do domínio
2. Configurar SSL automático
3. Verificar status "Configured"

## ✅ VERIFICAÇÕES

### 1. Teste de Conectividade
```bash
# Testar resolução DNS
nslookup admin.goldeouro.lol
nslookup goldeouro.lol

# Testar HTTPS
curl -I https://admin.goldeouro.lol
curl -I https://goldeouro.lol
```

### 2. Verificação no Vercel
- Status do domínio: "Configured"
- SSL: "Valid Certificate"
- Deploy: "Production"

## 🚨 TROUBLESHOOTING

### Domínio não resolve
- Verificar se os registros DNS foram propagados (pode levar até 24h)
- Confirmar se o TTL está baixo (300s)
- Verificar se o domínio foi adicionado no Vercel

### SSL não funciona
- Aguardar propagação do certificado (até 1h)
- Verificar se o domínio está "Configured" no Vercel
- Testar com `https://` explicitamente

### Erro 404
- Verificar se o projeto foi deployado com `vercel --prod`
- Confirmar se o `vercel.json` tem SPA fallback
- Verificar se as variáveis de ambiente estão corretas
