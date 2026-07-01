# RUNBOOK — Fly release inesperada

**Área:** Deploy · **Alerta V1.2C:** DC-02, DA-06

---

## Sintomas

- `flyctl releases` mostra versão ≠ **461** ou deploy recente não documentado.
- Alerta **DC-02** Fly divergente.
- Sem relatório em `docs/relatorios/*deploy*`.

## Severidade

| Situação | Nível |
|----------|-------|
| Release &gt; baseline com relatório V1.1F+ | **P2** (validar) |
| Release sem relatório / rollback automático | **P0** |

## Possíveis causas

- `fly deploy` manual.
- Workflow `backend-deploy` dispatch.
- Rollback Fly automático após health fail.

## Queries (read-only)

```bash
flyctl releases -a goldeouro-backend-v2 --json
flyctl status -a goldeouro-backend-v2
curl -s https://goldeouro-backend-v2.fly.dev/meta
grep -r "v461\|v462" docs/relatorios/*.md
```

## Critérios GO / NO-GO

| GO | NO-GO |
|----|-------|
| Release mapeada a SHA em `/meta` + relatório | Release órfã ou SHA mismatch |
| Health ok + webhooks 401 | Health fail pós-release |

## Ações permitidas

- Documentar release imediatamente (relatório estilo V1.1F).
- Comparar diff SHA anterior vs atual.
- Executar rollback workflow se regressão.

## Ações proibidas

- `fly deploy` adicional sem triagem.
- Assumir v462+ é “melhor” sem gates.

## Rollback

```bash
# Preferir workflow documentado
gh workflow run rollback.yml --ref main
# Ou release anterior via Fly conforme H3-6C snapshot
```

## Escalonamento

Ops on-call → owner Fly → postmortem se produção afetada.
