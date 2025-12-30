# 🔙 SISTEMA DE ROLLBACK V19

## Visão Geral

Este diretório contém scripts para restaurar completamente o projeto Gol de Ouro para o estado do backup V19.

## Scripts Disponíveis

### rollback_database.sh
Restaura apenas o banco de dados do backup.

**Uso:**
```bash
cd BACKUP-V19-SNAPSHOT/rollback
chmod +x rollback_database.sh
./rollback_database.sh
```

**O que faz:**
- Exibe instruções para restaurar schema via SQL Editor do Supabase
- Fornece comandos para restaurar via pg_restore (se backup.dump existir)

### rollback_project.sh
Restaura apenas o código do projeto.

**Uso:**
```bash
cd BACKUP-V19-SNAPSHOT/rollback
chmod +x rollback_project.sh
./rollback_project.sh
```

**O que faz:**
- Cria backup pré-rollback do estado atual
- Restaura todos os arquivos e diretórios do backup V19
- Valida checksums SHA-256
- Restaura migrations

### rollback_all.sh
Restaura banco e projeto completos.

**Uso:**
```bash
cd BACKUP-V19-SNAPSHOT/rollback
chmod +x rollback_all.sh
./rollback_all.sh
```

**O que faz:**
- Executa rollback_database.sh
- Executa rollback_project.sh
- Gera relatório final

## ⚠️ AVISOS IMPORTANTES

1. **Backup Pré-Rollback:** O script cria automaticamente um backup do estado atual antes de restaurar
2. **Validação de Checksums:** Os scripts validam integridade dos arquivos via SHA-256
3. **Confirmação:** Todos os scripts pedem confirmação antes de executar
4. **Banco de Dados:** A restauração do banco requer acesso ao Supabase Dashboard ou psql

## Validação Pós-Rollback

Após executar o rollback, valide:

1. **Conexão com Banco:**
   ```bash
   npm test
   ```

2. **Servidor:**
   ```bash
   npm start
   ```

3. **Health Check:**
   ```bash
   curl http://localhost:8080/health
   ```

## Problemas Comuns

### Erro: "Arquivo não encontrado"
- Verifique se o backup V19 está completo
- Execute o script de criação de backup novamente

### Erro: "Hash mismatch"
- Arquivo pode ter sido corrompido
- Restaure manualmente do backup

### Erro: "Permissão negada"
- Execute: `chmod +x rollback_*.sh`

## Suporte

Em caso de problemas, consulte:
- MANIFEST.md - Documentação completa do backup
- RELATORIO-BACKUP-V19.md - Relatório detalhado
