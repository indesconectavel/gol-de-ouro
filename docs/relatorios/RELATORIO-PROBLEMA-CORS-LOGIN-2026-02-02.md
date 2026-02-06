# Relatório completo - Falha de login/registro por CORS

Data: 2026-02-02  
Sistema: Gol de Ouro (frontend `https://www.goldeouro.lol`)  
Backend alvo: `https://goldeouro-backend-v2.fly.dev`  
Status do backend (health): OK (200)  

## Resumo executivo
O login e o registro estão falhando no navegador com “Network Error”. O console mostra bloqueio de CORS no preflight para `https://goldeouro-backend-v2.fly.dev/api/auth/login`, indicando ausência do header `Access-Control-Allow-Origin`. Isso impede o navegador de enviar o POST real para login/registro.

Conclusão: **não é quebra de jogo/conta**, é **bloqueio de CORS** no backend.  

## Sintomas observados
- Interface do jogador exibe “Network Error” ao tentar login/registro.
- Console do navegador registra:
  - “Access to XMLHttpRequest ... has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header...”
  - `ERR_FAILED` no endpoint `/api/auth/login`.

## Evidências técnicas (código)
O frontend aponta corretamente para o backend:
```8:17:goldeouro-player/src/config/api.js
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'https://goldeouro-backend-v2.fly.dev';
```

Login/registro usam `/api/auth/login` e `/api/auth/register`:
```52:85:goldeouro-player/src/contexts/AuthContext.jsx
const response = await apiClient.post(API_ENDPOINTS.LOGIN, { email, password });
// ...
const response = await apiClient.post(API_ENDPOINTS.REGISTER, { username: name, email, password });
```

CORS no backend depende da env `CORS_ORIGIN`:
```227:243:server-fly.js
app.use(cors({
  origin: parseCorsOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Idempotency-Key']
}));
```

Se `CORS_ORIGIN` não estiver definido, usa lista padrão:
```228:235:server-fly.js
const parseCorsOrigins = () => {
  const csv = process.env.CORS_ORIGIN || '';
  const list = csv.split(',').map(s => s.trim()).filter(Boolean);
  return list.length > 0 ? list : [
    'https://goldeouro.lol',
    'https://www.goldeouro.lol',
    'https://admin.goldeouro.lol'
  ];
};
```

## Causa raiz
**Backend não está retornando o header `Access-Control-Allow-Origin`** para o domínio `https://www.goldeouro.lol`. Isso geralmente ocorre quando:
- A variável `CORS_ORIGIN` não está configurada no ambiente do Fly.io, ou
- Está configurada sem incluir `https://www.goldeouro.lol`, ou
- A configuração não foi aplicada (necessário restart/deploy).

## Impacto
- Login e criação de conta falham para todos os usuários no domínio `www`.
- Mensagem de erro no front é genérica (“Network Error”), sem resposta do servidor.
- Usuários existentes (ex.: `free10signer@gmail.com`) não conseguem autenticar.

## Como reproduzir
1. Acessar `https://www.goldeouro.lol`.
2. Tentar fazer login ou criar conta.
3. Abrir o Console do navegador e verificar a falha de CORS no preflight para `/api/auth/login`.

## Verificação de backend (rede)
O endpoint `/health` responde OK, indicando que o backend está online, mas sem liberar CORS corretamente.

## Ação corretiva recomendada (sem código)
Atualizar a variável de ambiente no Fly.io:
```
CORS_ORIGIN=https://www.goldeouro.lol,https://goldeouro.lol,https://admin.goldeouro.lol
```
Depois disso, reiniciar o app (deploy/restart) para aplicar.

## Plano de validação pós-correção
1. No navegador, repetir login/registro e confirmar ausência de erro de CORS.
2. Verificar no Network que o preflight retorna `Access-Control-Allow-Origin: https://www.goldeouro.lol`.
3. Confirmar login bem-sucedido para usuário existente.

## Observações adicionais
Os logs do console também indicam bloqueios de CSP para `vercel.live` e `googletagmanager`. Esses itens não impedem login/registro, mas podem gerar ruído no console.

