# 🏆 Gol de Ouro – Backend

Este projeto contém toda a lógica de backend para o jogo online **Gol de Ouro**, incluindo sistema de fila, partidas, premiações, relatórios administrativos e exportações em CSV.

---

## 📌 Estrutura do Projeto

- Node.js + Express
- PostgreSQL
- Firebase Auth (autenticação)
- Integração com pagamentos (Pix)
- Painel administrativo com autenticação via token
- Sistema de exportação de dados (.csv)
- Lógica de partidas a cada 10 jogadores com 1 vencedor

---

## 📄 Documentação da API

Toda a documentação dos endpoints públicos e administrativos está disponível no PDF abaixo:

👉 [Documentação da API Gol de Ouro](./docs/api-documentacao-goldeouro.pdf)

---

## 🚀 Endpoints disponíveis

### Públicos (Jogador)
- `POST /fila/entrar` – Entra na fila
- `GET /fila/status` – Consulta posição
- `POST /fila/chutar` – Realiza chute
- `GET /usuario/saldo` – Consulta saldo
- `POST /usuario/saque` – Solicita saque
- `GET /usuario/relatorio` – Histórico do jogador

### Administrativos (com token)
- `GET /admin/relatorio-semanal`
- `GET /admin/controle-fila`
- `GET /admin/usuarios`
- `GET /admin/estatisticas`
- `GET /admin/top-jogadores`
- `GET /admin/transacoes-recentes`
- `GET /admin/chutes-recentes`
- `GET /admin/relatorio-usuarios`
- `GET /admin/logs`
- `GET /admin/usuarios-bloqueados`
- `POST /admin/suspender/:id`

### Exportação CSV
- `/admin/exportar/usuarios-csv`
- `/admin/exportar/chutes-csv`
- `/admin/exportar/transacoes-csv`
- `/admin/exportar/relatorio-completo-csv`
- `/admin/exportar/saques-csv`
- `/admin/exportar/relatorio-geral-csv`

---

## 🔐 Segurança
- As rotas administrativas requerem o header:
  ```
  x-admin-token: goldeouro123
  ```

---

## 🛠️ Como rodar o backend localmente

```bash
git clone https://github.com/seuusuario/goldeouro-backend.git
cd goldeouro-backend
npm install
npm start
```

Crie um arquivo `.env` com:

```env
DATABASE_URL=postgres://postgres:Free10signer@localhost:5432/postgres
PORT=3000
```

---

## 🧠 Desenvolvido por

Fred S. Silva – Indesconectável | Marketing Digital  
https://indesconectavel.com

