# 🤝 Guia de Contribuição - Gol de Ouro

Obrigado por considerar contribuir com o Gol de Ouro! Este documento fornece diretrizes para contribuir com o projeto.

---

## 📋 **Como Contribuir**

### **1. Reportar Bugs**

Se você encontrou um bug:

1. Verifique se o bug já não foi reportado nas [Issues](https://github.com/indesconectavel/gol-de-ouro/issues)
2. Se não foi reportado, crie uma nova issue com:
   - **Título claro e descritivo**
   - **Descrição detalhada do problema**
   - **Passos para reproduzir**
   - **Comportamento esperado vs comportamento atual**
   - **Screenshots (se aplicável)**
   - **Ambiente** (navegador, OS, versão)

### **2. Sugerir Melhorias**

Para sugerir uma nova funcionalidade:

1. Verifique se já existe uma issue similar
2. Crie uma nova issue com:
   - **Título descritivo**
   - **Descrição detalhada da funcionalidade**
   - **Casos de uso**
   - **Benefícios**

### **3. Contribuir com Código**

#### **Processo:**

1. **Fork o repositório**
2. **Crie uma branch** para sua feature/fix:
   ```bash
   git checkout -b feature/nova-funcionalidade
   # ou
   git checkout -b fix/correcao-bug
   ```

3. **Faça suas alterações**
   - Siga os padrões de código do projeto
   - Adicione testes quando apropriado
   - Atualize a documentação se necessário

4. **Commit suas mudanças**:
   ```bash
   git commit -m "feat: adiciona nova funcionalidade"
   # ou
   git commit -m "fix: corrige bug no login"
   ```

5. **Push para sua branch**:
   ```bash
   git push origin feature/nova-funcionalidade
   ```

6. **Abra um Pull Request**
   - Descreva claramente suas mudanças
   - Referencie issues relacionadas
   - Aguarde revisão

---

## 📝 **Padrões de Código**

### **Conventional Commits**

Use o formato Conventional Commits:

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Mudanças na documentação
- `style:` Formatação, ponto e vírgula, etc (não afeta código)
- `refactor:` Refatoração de código
- `test:` Adição ou correção de testes
- `chore:` Mudanças em build, dependências, etc

### **Exemplos:**

```bash
feat: adiciona sistema de notificações push
fix: corrige erro de CORS no login
docs: atualiza README com novas instruções
refactor: reorganiza estrutura de pastas
```

### **JavaScript/TypeScript**

- Use **ESLint** e **Prettier** (quando configurado)
- Siga o estilo de código existente
- Use nomes descritivos para variáveis e funções
- Adicione comentários quando necessário

### **React**

- Use componentes funcionais com hooks
- Mantenha componentes pequenos e focados
- Use TypeScript quando possível
- Siga as convenções do projeto

---

## 🧪 **Testes**

### **Antes de Enviar:**

1. Execute os testes:
   ```bash
   npm test
   ```

2. Verifique linting:
   ```bash
   npm run lint
   ```

3. Teste manualmente sua funcionalidade

### **Escrevendo Testes:**

- Teste casos de sucesso e falha
- Teste edge cases
- Mantenha testes simples e legíveis
- Use nomes descritivos para testes

---

## 📚 **Documentação**

### **Quando Atualizar:**

- Adicionar nova funcionalidade → Atualizar README
- Mudar API → Atualizar documentação da API
- Adicionar configuração → Atualizar guias de configuração

### **Formato:**

- Use Markdown
- Seja claro e conciso
- Inclua exemplos quando apropriado
- Mantenha a documentação atualizada

---

## 🔍 **Processo de Revisão**

### **O que Esperar:**

1. **Feedback:** Pode receber sugestões de melhoria
2. **Discussão:** Podemos discutir abordagens alternativas
3. **Aprovação:** Após revisão, seu PR será aprovado e mergeado

### **Como Responder:**

- Seja respeitoso e profissional
- Considere feedback construtivo
- Faça alterações solicitadas quando apropriado
- Pergunte se algo não estiver claro

---

## ❓ **Dúvidas?**

Se tiver dúvidas:

1. Verifique a documentação existente
2. Procure em issues anteriores
3. Abra uma issue com a tag `question`
4. Entre em contato com os mantenedores

---

## 📄 **Licença**

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a mesma licença do projeto (MIT).

---

**Obrigado por contribuir com o Gol de Ouro! 🎉**

