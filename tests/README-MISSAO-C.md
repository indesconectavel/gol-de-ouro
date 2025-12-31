# 🧪 MISSÃO C - TESTES AUTOMATIZADOS

## 📋 Descrição

Testes automatizados para validar o sistema de lotes do Gol de Ouro em dois blocos:

- **BLOCO 1:** Fluxo base (7 testes)
- **BLOCO 2:** Concorrência (6 testes)

## 🚀 Como Executar

### Pré-requisitos

1. Node.js instalado
2. Dependências instaladas:
   ```bash
   npm install axios
   ```

### Execução

```bash
# Opção 1: Executar script completo (testes + relatório)
node tests/executar-missao-c.js

# Opção 2: Executar apenas os testes
node tests/missao-c-automated-test.js

# Opção 3: Gerar relatório a partir de resultados existentes
node tests/gerar-relatorio-missao-c.js
```

### Variáveis de Ambiente (Opcional)

```bash
# Definir URL do backend (padrão: https://goldeouro-backend-v2.fly.dev)
export BACKEND_URL=https://goldeouro-backend-v2.fly.dev
```

## 📊 Resultados

Após a execução, serão gerados:

1. **`tests/missao-c-resultados.json`** - Resultados em JSON
2. **`RELATORIO-MISSAO-C-AUTOMATIZADA.md`** - Relatório técnico completo

## 🧪 Testes Executados

### BLOCO 1 - FLUXO BASE

1. ✅ Criação de lote quando não há lote ativo
2. ✅ Reutilização de lote ativo
3. ✅ Incremento correto de shotIndex
4. ✅ Definição única de winnerIndex
5. ✅ Encerramento imediato após gol
6. ✅ Nenhum chute aceito após finalização
7. ✅ Sincronização banco x cache

### BLOCO 2 - CONCORRÊNCIA

8. ✅ Chutes simultâneos no mesmo lote
9. ✅ Bloqueio por transação (FOR UPDATE)
10. ✅ Apenas um gol possível
11. ✅ Ausência de duplicidade de shotIndex
12. ✅ Apenas um lote criado em concorrência
13. ✅ Ausência de lotes órfãos

## 📝 Notas

- Os testes criam usuários de teste automaticamente
- Cada usuário recebe saldo inicial de R$100
- Os testes são executados sequencialmente (BLOCO 1 → BLOCO 2)
- Timeout de 30 segundos por requisição

