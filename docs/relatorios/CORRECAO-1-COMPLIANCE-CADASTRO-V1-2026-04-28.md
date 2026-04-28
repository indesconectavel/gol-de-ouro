# CORRECAO 1 V1 - COMPLIANCE SERVER-SIDE NO CADASTRO

Data: 2026-04-28  
Modo: Execucao controlada  
Escopo: `server-fly.js` (sem alteracao de financeiro, deposito, saque, ledger ou gameplay)

## 1. Objetivo

Garantir validacao server-side de consentimento minimo no endpoint `POST /api/auth/register`, impedindo criacao de usuario sem:
- aceite de termos;
- confirmacao de maioridade.

## 2. Diagnostico

Antes da correcao, o frontend enviava campos de consentimento no cadastro, mas o backend nao exigia esses campos antes de criar usuario.

Risco identificado:
- criacao de conta sem consentimento minimo validado pelo servidor.

## 3. Investigacao executada

### 3.1 Body atual do register
No `POST /api/auth/register`, o backend lia apenas:
- `email`
- `password`
- `username`

### 3.2 Campos enviados pelo frontend
No fluxo atual de cadastro, o frontend envia:
- `acceptedTerms`
- `isAdultConfirmed`

### 3.3 Variacoes de nome cobertas
Foi adicionada compatibilidade para:
- termos: `acceptedTerms`, `accepted_terms`, `termsAccepted`
- maioridade: `isAdultConfirmed`, `ageConfirmed`

### 3.4 Ponto de criacao de usuario
Criacao ocorre no bloco `supabase.from('usuarios').insert(...)` do mesmo endpoint.

## 4. Regra aplicada

Antes de prosseguir para validacao de email e criacao de usuario, o backend agora:
1. normaliza flags de consentimento com leitura tolerante (`true`, `1`, `"1"`, `"true"`);
2. exige:
   - aceite de termos;
   - confirmacao de maioridade;
3. se qualquer um faltar, retorna:
   - HTTP `400`
   - mensagem:  
     `"É necessário aceitar os Termos de Uso e confirmar maioridade para criar sua conta."`

## 5. Arquivos alterados

- `server-fly.js`

## 6. Impacto no cadastro

- Cadastro sem consentimento completo nao cria usuario.
- Cadastro com consentimento completo segue fluxo normal existente.
- Contrato de resposta mantido em JSON com `success/message`.

## 7. Itens explicitamente nao alterados

- Login
- Perfil
- JWT
- Financeiro
- Deposito
- Saque
- Ledger
- Gameplay

## 8. Validacao tecnica executada

- `node --check server-fly.js`
- validacao de diff restrito ao escopo autorizado
- sem commit
- sem deploy

## 9. Risco final

Classificacao: **baixo**.

Justificativa:
- mudanca pequena, localizada e de regra de entrada;
- sem impacto em fluxos financeiros e de jogo;
- melhora de compliance sem alterar contratos criticos de autenticacao alem da validacao minima obrigatoria no cadastro.
