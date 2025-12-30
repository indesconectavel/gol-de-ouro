# 📦 MANIFEST DO BACKUP V19 SNAPSHOT
## Data: 2025-12-05
## Versão: V19.0.0

---

## 📊 RESUMO DO BACKUP

- **Total de Arquivos:** 503
- **Tamanho Total:** 3.70 MB
- **Data de Criação:** 2025-12-05T13:29:14.192Z
- **Algoritmo de Hash:** SHA-256

---

## 📁 ESTRUTURA DO BACKUP

```
BACKUP-V19-SNAPSHOT/
├── database/
│   ├── schema-consolidado.sql      # Schema completo consolidado
│   ├── schema.sql                   # Schema base
│   ├── schema-lotes-persistencia.sql
│   ├── schema-rewards.sql
│   ├── rpc-financial-acid.sql
│   ├── migrations_snapshot/        # Cópia das migrations
│   └── INSTRUCOES-BACKUP.md        # Instruções para pg_dump
│
├── project/
│   ├── controllers/                # Controladores
│   ├── services/                    # Serviços
│   ├── routes/                     # Rotas
│   ├── middlewares/                # Middlewares
│   ├── utils/                      # Utilitários
│   ├── database/                   # Schemas SQL
│   ├── scripts/                    # Scripts
│   ├── config/                     # Configurações
│   ├── prisma/                     # Schema Prisma
│   ├── src/                        # Código fonte
│   ├── server-fly.js               # Servidor principal
│   ├── package.json                # Dependências
│   └── [outros arquivos de config]
│
├── rollback/
│   ├── rollback_database.sh        # Script de rollback do banco (Linux/Mac)
│   ├── rollback_database.ps1       # Script de rollback do banco (Windows)
│   ├── rollback_project.sh         # Script de rollback do projeto (Linux/Mac)
│   ├── rollback_project.ps1        # Script de rollback do projeto (Windows)
│   ├── rollback_all.sh             # Script de rollback completo (Linux/Mac)
│   └── README_ROLLBACK.md          # Documentação de rollback
│
├── checksums.json                  # Checksums SHA-256 de todos os arquivos
├── MANIFEST.md                     # Este arquivo
└── RELATORIO-BACKUP-V19.md        # Relatório detalhado
```

---

## 🔍 CONTEÚDO DO BACKUP

### Banco de Dados

O backup do banco inclui:
- **Schema completo:** Todas as tabelas, índices, constraints, triggers
- **RPC Functions:** Funções críticas (rpc_add_balance, rpc_deduct_balance, etc.)
- **Migrations:** Snapshot completo de todas as migrations

**Arquivos SQL Principais:**
- `schema-consolidado.sql` - Schema completo consolidado
- `schema-lotes-persistencia.sql` - Schema de lotes
- `rpc-financial-acid.sql` - RPC functions financeiras

### Código do Projeto

O backup do código inclui:
- **Controllers:** Todos os controladores (gameController, authController, etc.)
- **Services:** Todos os serviços (financialService, loteService, etc.)
- **Routes:** Todas as rotas da API
- **Middlewares:** Todos os middlewares
- **Utils:** Utilitários e validadores
- **Scripts:** Scripts de automação e auditoria
- **Config:** Arquivos de configuração

**Arquivos Críticos:**
- `server-fly.js` - Servidor principal
- `package.json` - Dependências do projeto
- `fly.toml` - Configuração Fly.io

---

## 🔐 CHECKSUMS E INTEGRIDADE

Todos os arquivos foram validados com SHA-256. O arquivo `checksums.json` contém:
- Hash SHA-256 de cada arquivo
- Caminho relativo do arquivo
- Data de geração

**Validação:**
```bash
# Validar checksum de um arquivo específico
sha256sum project/server-fly.js

# Comparar com checksums.json
cat checksums.json | grep "server-fly.js"
```

---

## 📋 COMANDOS PASSO A PASSO PARA RESTAURAÇÃO

### Opção 1: Restauração Automática (Recomendado)

#### Linux/Mac:
```bash
cd BACKUP-V19-SNAPSHOT/rollback
chmod +x rollback_all.sh
./rollback_all.sh
```

#### Windows (PowerShell):
```powershell
cd BACKUP-V19-SNAPSHOT\rollback
.\rollback_project.ps1
```

### Opção 2: Restauração Manual

#### 1. Restaurar Banco de Dados

**Via Supabase Dashboard:**
1. Acesse Supabase Dashboard
2. Vá para SQL Editor
3. Execute: `database/schema-consolidado.sql`

**Via psql:**
```bash
psql [CONNECTION_STRING] < database/schema-consolidado.sql
```

#### 2. Restaurar Código

```bash
# Copiar diretórios
cp -r project/controllers ../controllers
cp -r project/services ../services
cp -r project/routes ../routes
# ... (repetir para todos os diretórios)

# Copiar arquivos
cp project/server-fly.js ../
cp project/package.json ../
# ... (repetir para todos os arquivos)
```

#### 3. Instalar Dependências

```bash
npm install
```

#### 4. Verificar Variáveis de Ambiente

```bash
# Verificar .env
cat .env

# Copiar .env.example se necessário
cp .env.example .env
```

---

## ✅ VERIFICAÇÃO PÓS-ROLLBACK

Após restaurar, execute estas verificações:

### 1. Validar Checksums
```bash
node -e "
const fs = require('fs');
const crypto = require('crypto');
const checksums = JSON.parse(fs.readFileSync('BACKUP-V19-SNAPSHOT/checksums.json', 'utf8'));
let errors = 0;
for (const [file, expectedHash] of Object.entries(checksums.checksums)) {
    const filePath = file;
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath);
        const hash = crypto.createHash('sha256').update(content).digest('hex');
        if (hash !== expectedHash) {
            console.error('❌ Hash mismatch:', file);
            errors++;
        }
    }
}
if (errors === 0) console.log('✅ Todos os checksums validados');
"
```

### 2. Testar Conexão com Banco
```bash
npm test
```

### 3. Iniciar Servidor
```bash
npm start
```

### 4. Health Check
```bash
curl http://localhost:8080/health
```

---

## 🔗 DEPENDÊNCIAS

### Requisitos do Sistema
- Node.js >= 18.0.0
- npm ou yarn
- PostgreSQL (via Supabase)
- Acesso ao Supabase Dashboard

### Variáveis de Ambiente Necessárias
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `MERCADOPAGO_ACCESS_TOKEN` (produção)

---

## ⚠️ AVISOS IMPORTANTES

1. **Backup Pré-Rollback:** Os scripts criam automaticamente um backup do estado atual antes de restaurar
2. **Validação:** Sempre valide checksums após restaurar
3. **Banco de Dados:** A restauração do banco requer acesso ao Supabase ou psql
4. **Variáveis de Ambiente:** Não esqueça de configurar .env após restaurar
5. **Dependências:** Execute `npm install` após restaurar código

---

## 📞 SUPORTE

Em caso de problemas:
1. Verifique o arquivo `RELATORIO-BACKUP-V19.md` para detalhes
2. Valide checksums: `checksums.json`
3. Verifique logs de erro dos scripts
4. Consulte documentação do projeto

---

**Gerado em:** 2025-12-05T13:29:14.192Z  
**Versão:** V19.0.0  
**Status:** ✅ Backup completo gerado
