# 🔧 Correção: CSP Bloqueando Hot Reload e Atualizações Visuais

**Data:** 2025-01-24  
**Problema:** CSP pode estar bloqueando WebSocket do Vite (`ws://localhost:5173`) e recursos visuais

---

## 🔴 Problema Identificado

### CSP no `vercel.json`

O CSP configurado no `vercel.json` tem:
```json
"connect-src 'self' https: wss:;"
```

**Problemas:**
1. **WebSocket do Vite:** O Vite em desenvolvimento usa `ws://localhost:5173` (não seguro), mas o CSP só permite `wss:` (seguro). Isso bloqueia o hot reload.
2. **Recursos locais:** O CSP pode não permitir recursos de `localhost` ou `127.0.0.1` em algumas diretivas.

---

## ✅ Solução

### Importante: CSP do `vercel.json` NÃO afeta desenvolvimento local

O `vercel.json` é usado **apenas em produção** (Vercel). Em desenvolvimento local, o Vite não aplica esses headers.

**MAS:** Se houver CSP configurado em outro lugar (meta tag, servidor local, etc.), pode estar bloqueando.

### Verificações Necessárias

1. **Verificar se há CSP ativo em desenvolvimento:**
   - Abrir DevTools (F12) → Console
   - Procurar por erros: `Content Security Policy`, `Refused to load`, `Blocked by CSP`
   - Se houver erros, o CSP está bloqueando

2. **Verificar WebSocket do Vite:**
   - No console, deve aparecer: `[vite] connecting...` e `[vite] connected.`
   - Se não aparecer, o WebSocket está bloqueado

3. **Verificar recursos bloqueados:**
   - Abrir DevTools → Network
   - Filtrar por "Failed" ou "Blocked"
   - Verificar quais recursos estão sendo bloqueados

---

## 🛠️ Correções Aplicadas

### 1. Garantir que CSP não bloqueia desenvolvimento local

O CSP do `vercel.json` já permite `wss:` para WebSocket, mas em desenvolvimento local o Vite usa `ws:`. Como o `vercel.json` não é aplicado em desenvolvimento, isso não é um problema.

**Mas podemos garantir que não há CSP bloqueando:**

1. **Verificar `index.html`:**
   - ✅ CSP já está removido (linha 191: `<!-- CSP REMOVIDO PARA DESENVOLVIMENTO E MVP -->`)

2. **Verificar se há CSP em outros lugares:**
   - ✅ `vite.config.ts` - não há CSP configurado
   - ✅ Servidor Vite - não aplica CSP por padrão

### 2. Ajustar CSP do `vercel.json` para produção (opcional)

Se quiser garantir que o CSP em produção não bloqueie recursos legítimos, podemos ajustar:

```json
{
  "key": "Content-Security-Policy",
  "value": "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; img-src 'self' data: blob: https:; connect-src 'self' https: wss: ws:; style-src 'self' 'unsafe-inline' https:; font-src 'self' data: https:;"
}
```

**Mudança:** Adicionar `ws:` em `connect-src` para permitir WebSocket não seguro (se necessário em produção).

**Mas isso não é necessário** porque:
- Em produção, não há WebSocket do Vite
- O CSP atual já permite `wss:` para WebSocket seguro

---

## 🧪 Testes de Validação

### Teste 1: Verificar CSP no Console

No console do navegador (F12), executar:

```javascript
// Verificar CSP ativo
const metaCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
console.log('CSP Meta Tag:', metaCSP ? metaCSP.content : 'Não encontrado');

// Verificar headers CSP (só funciona em produção)
fetch('/').then(r => {
  const csp = r.headers.get('Content-Security-Policy');
  console.log('CSP Header:', csp || 'Não encontrado (normal em desenvolvimento)');
}).catch(e => {
  console.log('Erro ao verificar CSP (normal em desenvolvimento):', e.message);
});
```

**Resultado esperado em desenvolvimento:**
- CSP Meta Tag: `Não encontrado` ✅
- CSP Header: `Não encontrado (normal em desenvolvimento)` ✅

### Teste 2: Verificar WebSocket do Vite

No console do navegador (F12), verificar logs:

```
[vite] connecting...
[vite] connected.
```

**Se aparecer:** WebSocket está funcionando ✅  
**Se não aparecer:** WebSocket está bloqueado ❌

### Teste 3: Verificar Recursos Bloqueados

No DevTools:
1. Abrir aba "Network"
2. Filtrar por "Failed" ou "Blocked"
3. Verificar se há recursos bloqueados por CSP

**Se houver recursos bloqueados:**
- Verificar motivo (CSP, CORS, etc.)
- Verificar se são recursos necessários
- Aplicar correção específica

### Teste 4: Verificar Hot Reload

1. Fazer uma mudança em um arquivo CSS ou JS
2. Verificar se a página atualiza automaticamente
3. Verificar console para erros

**Se hot reload não funcionar:**
- Verificar se WebSocket está conectado
- Verificar se há erros no console
- Verificar cache do navegador

---

## 📋 Checklist de Diagnóstico

- [ ] Console não mostra erros de CSP
- [ ] WebSocket do Vite está conectado (`[vite] connected.`)
- [ ] Network não mostra recursos bloqueados por CSP
- [ ] Hot reload está funcionando
- [ ] Cache do navegador está limpo
- [ ] Não há CSP ativo em desenvolvimento local

---

## 🎯 Conclusão

### Em Desenvolvimento Local (`localhost:5173`)

- ✅ **CSP não é aplicado** - O `vercel.json` não é usado pelo Vite em desenvolvimento
- ✅ **WebSocket deve funcionar** - O Vite usa `ws://localhost:5173` para hot reload
- ✅ **Recursos locais devem carregar** - Não há restrições de CSP em desenvolvimento

### Se Hot Reload Não Estiver Funcionando

**Possíveis causas:**
1. **Cache do navegador** - Limpar cache e fazer hard reload
2. **WebSocket bloqueado** - Verificar firewall ou extensões do navegador
3. **Servidor Vite não está rodando** - Verificar terminal
4. **Erros de JavaScript** - Verificar console para erros que podem quebrar hot reload

**Soluções:**
1. Limpar cache do navegador (`Ctrl + Shift + Delete`)
2. Usar modo anônimo (`Ctrl + Shift + N`)
3. Hard reload (`Ctrl + Shift + R`)
4. Reiniciar servidor Vite
5. Verificar console para erros específicos

---

**Status:** CSP não é problema em desenvolvimento local  
**Próxima ação:** Verificar se hot reload está funcionando e se há erros específicos no console



