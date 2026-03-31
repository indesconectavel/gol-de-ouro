# 🧠 PIPELINE OFICIAL PERMANENTE — GOL DE OURO (V2)

Versão com gate obrigatório de produção.

---

## 1. Diagnóstico
Entender o estado atual sem alterar nada.

Regras:
- read-only
- sem assumir
- separar fato/risco

---

## 2. Pré-execução
Validar segurança antes de mexer.

Verificar:
- backup
- rollback
- impacto
- riscos

---

## 3. Preparação automática
Criar ponto seguro.

Fazer:
- commit
- tag
- push

---

## 4. Cirurgia
Implementar com escopo estrito.

Regras:
- não expandir escopo
- não refatorar paralelo

---

## 5. Execução controlada (NOVO)

Garantir que a correção está em produção.

Passos:
1. git status
2. git add controlado
3. git commit
4. git tag
5. fly deploy
6. fly status + logs

Obrigatório:
- runtime atualizado
- nova release ativa
- logs novos

Se falhar:
TESTE BLOQUEADO

---

## 6. Validação

Confirmar:
- funcionamento
- ausência de regressão

Saída:
- VALIDADO
- COM RESSALVAS
- NÃO VALIDADO

---

## FORMA CURTA

1) Diagnóstico  
2) Pré-execução  
3) Preparação  
4) Cirurgia  
5) Execução controlada  
6) Validação  

---

## REGRA MESTRA

- nunca validar sem produção atualizada
- nunca confiar só no local
- nunca ignorar drift
