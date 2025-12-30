# 🔍 Investigação: CORS/CSP Bloqueando Atualizações Visuais

**Data:** 2025-01-24  
**Problema:** Possível bloqueio de atualizações visuais por CORS ou CSP

---

## 🔴 Problemas Identificados

### 1. CSP (Content Security Policy) no `vercel.json`

O `vercel.json` tem um CSP configurado que pode estar bloqueando recursos visuais:

```json
{
  "key": "Content-Security-Policy",
  "value": "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; img-src 'self' data: blob: https:; connect-src 'self' https: wss:; style-src 'self' 'unsafe-inline' https:; font-src 'self' data: https:;"
}
```

**Possíveis problemas:**
- `style-src 'self' 'unsafe-inline' https:` pode estar bloqueando CSS de hot reload do Vite
- `script-src 'self' 'unsafe-inline' 'unsafe-eval' https:` pode estar bloqueando scripts de hot reload
- `connect-src 'self' https: wss:` pode estar bloqueando WebSocket do Vite (`ws://localhost:5173`)

### 2. Headers de Segurança Restritivos

O `vercel.json` também tem headers restritivos:
- `X-Content-Type-Options: nosniff` - Pode bloquear recursos com MIME type incorreto
- `X-Frame-Options: DENY` - Bloqueia iframes (não deve afetar desenvolvimento)
- `Cache-Control: no-cache, no-store, must-revalidate` - Pode estar impedindo cache necessário para hot reload

### 3. Service Worker Bloqueando Recursos

O Service Worker pode estar interceptando e bloqueando recursos visuais mesmo em desenvolvimento.

---

## ✅ Soluções Propostas

### Solução 1: Desabilitar CSP em Desenvolvimento Local

O CSP no `vercel.json` só deve ser aplicado em produção. Em desenvolvimento local, o Vite não usa o `vercel.json`, mas podemos garantir que não há CSP bloqueando recursos.

**Verificação:**
- O `index.html` já tem CSP removido (linha 191: `<!-- CSP REMOVIDO PARA DESENVOLVIMENTO E MVP -->`)
- O CSP do `vercel.json` só é aplicado em produção (Vercel)

### Solução 2: Verificar WebSocket do Vite

O Vite usa WebSocket (`ws://localhost:5173`) para hot reload. O CSP pode estar bloqueando isso.

**Verificar no console:**
```javascript
// Verificar se WebSocket está conectado
console.log('WebSocket status:', document.querySelector('script[src*="@vite"]') ? 'Conectado' : 'Desconectado');
```

### Solução 3: Verificar Recursos Bloqueados

No DevTools do navegador:
1. Abrir Console (F12)
2. Verificar erros relacionados a:
   - `Content Security Policy`
   - `Refused to load`
   - `Blocked by CSP`
   - `CORS`
   - `Mixed Content`

### Solução 4: Verificar Hot Reload do Vite

O hot reload do Vite pode estar desabilitado ou bloqueado.

**Verificar:**
1. No terminal do Vite, verificar se mostra `[vite] connecting...`
2. No console do navegador, verificar se aparece `[vite] connected.`
3. Se não aparecer, o WebSocket está bloqueado

---

## 🧪 Testes de Diagnóstico

### Teste 1: Verificar CSP no Console

No console do navegador (F12), executar:

```javascript
// Verificar CSP ativo
const metaCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
console.log('CSP Meta Tag:', metaCSP ? metaCSP.content : 'Não encontrado');

// Verificar headers CSP
fetch('/').then(r => {
  const csp = r.headers.get('Content-Security-Policy');
  console.log('CSP Header:', csp || 'Não encontrado');
});
```

### Teste 2: Verificar WebSocket do Vite

No console do navegador (F12), verificar:

```javascript
// Verificar se WebSocket está conectado
const wsStatus = document.querySelector('script[src*="@vite"]') ? 'Conectado' : 'Desconectado';
console.log('Vite WebSocket:', wsStatus);

// Verificar logs do Vite
// Deve aparecer: [vite] connecting... e [vite] connected.
```

### Teste 3: Verificar Recursos Bloqueados

No DevTools:
1. Abrir aba "Network"
2. Filtrar por "Failed" ou "Blocked"
3. Verificar quais recursos estão sendo bloqueados
4. Verificar motivo do bloqueio (CSP, CORS, etc.)

### Teste 4: Verificar Hot Reload

1. Fazer uma mudança em um arquivo CSS ou JS
2. Verificar se a página atualiza automaticamente
3. Se não atualizar, o hot reload está bloqueado

---

## 🛠️ Correções Aplicadas

### 1. Verificar se CSP está Bloqueando em Desenvolvimento

O CSP do `vercel.json` **NÃO** é aplicado em desenvolvimento local. O Vite não usa o `vercel.json` em desenvolvimento.

**Mas podemos garantir que não há CSP bloqueando:**

1. **Verificar `index.html`:**
   - ✅ CSP já está removido (linha 191)

2. **Verificar se há CSP em outros lugares:**
   - Verificar `vite.config.ts` - não há CSP configurado
   - Verificar headers HTTP do servidor Vite - não há CSP configurado

### 2. Verificar WebSocket do Vite

O Vite usa WebSocket para hot reload. Se o WebSocket estiver bloqueado, as atualizações visuais não funcionarão.

**Solução:**
- O CSP do `vercel.json` não afeta desenvolvimento local
- Mas podemos verificar se o WebSocket está funcionando

### 3. Verificar Cache do Navegador

O cache do navegador pode estar impedindo atualizações visuais.

**Solução:**
- Limpar cache do navegador
- Usar modo anônimo
- Hard reload (`Ctrl + Shift + R`)

---

## 📋 Checklist de Diagnóstico

- [ ] Verificar console para erros de CSP
- [ ] Verificar se WebSocket do Vite está conectado
- [ ] Verificar Network para recursos bloqueados
- [ ] Verificar se hot reload está funcionando
- [ ] Verificar cache do navegador
- [ ] Verificar se CSP está ativo em desenvolvimento

---

## 🎯 Próximos Passos

1. **Executar testes de diagnóstico acima**
2. **Verificar console do navegador para erros específicos**
3. **Verificar Network para recursos bloqueados**
4. **Aplicar correções específicas baseadas nos resultados**

---

**Status:** Investigação em andamento  
**Próxima ação:** Executar testes de diagnóstico e verificar erros específicos no console



