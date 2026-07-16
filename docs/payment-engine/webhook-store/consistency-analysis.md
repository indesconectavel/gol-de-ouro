# PE.2H — Consistency Analysis



## Status monotônico



`processed` é terminal. `markFailed` após `processed` → noop/`duplicate`.



## Sem dupla persistência financeira



Flag ON: `GolDeOuroWebhookStore` usa **um** backing `PaymentWebhookDryRunStore` por chamada de compat; não escreve `pagamentos_pix`/ledger/wallet.



## Sem tabela inventada



Gate não cria migration. Adapter documenta ausência de `webhook_events` no schema GDO.



## Atomicidade futura



Port permite unit-of-work no adapter; core permanece agnóstico.

