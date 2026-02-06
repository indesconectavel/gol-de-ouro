# Relatório técnico comparativo — Correção do erro 500 no login

Data: 2026-02-03  
Sistema: Gol de Ouro (backend)  
Endpoint: `POST /api/auth/login`  
Ambiente: Produção (Fly.io)  
Modo: Auditoria técnica, escopo cirúrgico

---

## 1) Resumo executivo
O erro HTTP 500 no login era causado por um erro lógico de escopo: a variável `sanitizedEmailLogin` era definida apenas dentro de um bloco condicional (`if (userError || !user)`) e usada posteriormente nos caminhos de senha inválida e login bem‑sucedido. Isso gerava `ReferenceError`, capturado pelo `catch`, resultando em 500. A correção foi mínima e reversível: definir `sanitizedEmailLogin` uma única vez no início do handler, sem alterar qualquer lógica de autenticação, retornos HTTP, mensagens, ou integrações.

---

## 2) Escopo e garantias
- Nenhuma alteração estrutural
- Nenhuma mudança em PIX, Mercado Pago, workers ou saques
- Nenhuma alteração em CORS
- Nenhuma alteração em banco de dados
- Correção localizada apenas no handler `POST /api/auth/login`

---

## 3) Estado anterior (antes)

### Evidência de risco lógico
`sanitizedEmailLogin` era criado apenas no fluxo de “usuário não encontrado” e usado depois em fluxos distintos.

```874:929:server-fly.js
if (userError || !user) {
  const sanitizedEmailLogin = typeof email === 'string' ? email.replace(/[<>\"'`\x00-\x1F\x7F-\x9F]/g, '') : String(email);
  const logMessageLoginNotFound = `❌ [LOGIN] Usuário não encontrado: ${sanitizedEmailLogin}`;
  console.log(logMessageLoginNotFound);
  return res.status(401).json({
    success: false,
    message: 'Credenciais inválidas'
  });
}

if (!senhaValida) {
  const logMessageInvalidPassword = `❌ [LOGIN] Senha inválida para: ${sanitizedEmailLogin}`;
  console.log(logMessageInvalidPassword);
  return res.status(401).json({
    success: false,
    message: 'Credenciais inválidas'
  });
}

const logMessageLoginSuccess = `✅ [LOGIN] Login realizado: ${sanitizedEmailLogin}`;
console.log(logMessageLoginSuccess);
```

### Impacto técnico
- **Falha determinística** em senha inválida e login bem‑sucedido, com `ReferenceError`.
- **Resposta HTTP 500** pelo `catch`, mesmo com credenciais válidas.

---

## 4) Estado posterior (depois)

### Correção aplicada (mínima)
`sanitizedEmailLogin` é definida uma única vez, logo após o parsing do body, antes de qualquer uso.

```853:885:server-fly.js
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const sanitizedEmailLogin = typeof email === 'string'
      ? email.replace(/[<>\"'`\x00-\x1F\x7F-\x9F]/g, '')
      : String(email);

    // APENAS SUPABASE REAL - SEM FALLBACK
    if (!dbConnected || !supabase) {
      return res.status(503).json({
        success: false,
        message: 'Sistema temporariamente indisponível'
      });
    }
    // ...
```

```874:882:server-fly.js
if (userError || !user) {
  const logMessageLoginNotFound = `❌ [LOGIN] Usuário não encontrado: ${sanitizedEmailLogin}`;
  console.log(logMessageLoginNotFound);
  return res.status(401).json({
    success: false,
    message: 'Credenciais inválidas'
  });
}
```

### Impacto técnico
- Nenhuma alteração em lógica de autenticação, JWT, Supabase ou bcrypt.
- Nenhuma mudança em mensagens ou status HTTP.
- Eliminação do `ReferenceError` no fluxo de login.

---

## 5) Comparativo antes/depois

### Antes
- `sanitizedEmailLogin` com escopo limitado (apenas em “usuário não encontrado”).
- Uso posterior fora do escopo em:
  - senha inválida
  - login bem‑sucedido
- Resultado: `ReferenceError` → `catch` → **HTTP 500**

### Depois
- `sanitizedEmailLogin` definido no início do handler.
- Uso seguro nos três fluxos:
  - usuário não encontrado
  - senha inválida
  - login bem‑sucedido
- Resultado: **sem exceção**, retornos preservados (401/200).

---

## 6) Análise de risco

### Antes
- Risco alto de erro 500 em login (determinístico).
- Regressão visível assim que o CORS passou a permitir o POST.

### Depois
- Risco baixo: mudança apenas de escopo de variável.
- Nenhuma alteração de fluxo, dependências ou comportamento externo.

---

## 7) Veredito final
- **Erro lógico corrigido de forma cirúrgica:** SIM  
- **Impacto negativo esperado em produção:** NÃO  
- **Necessidade de hotfix adicional:** NÃO  
- **Possibilidade de regressão:** BAIXA

---

## 8) Nota de auditoria
Este relatório compara exclusivamente o comportamento do handler de login, sem tocar em CORS, PIX, Mercado Pago, workers, saques ou banco de dados. A correção é mínima e reversível, mantendo a estabilidade operacional do sistema financeiro.
