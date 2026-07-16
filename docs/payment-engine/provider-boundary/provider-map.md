# Provider Map — PE.2L



## Antes (PB-03)



```text

payment-engine/providers → FinanceProviderFactory → Asaas|MP|Celcoin

MercadoPagoPayoutProvider → services/pix-mercado-pago

```



## Depois



```text

PaymentEngine / RuntimeBoundary

  → ProviderResolver

      [flag OFF] → FinanceProviderFactory (idêntico)

      [flag ON]  → PaymentProviderPort / TransferProviderPort

                   → adapters/psp/* → finance providers → (MP: services)

```



Core: **zero** requires Asaas/MP/SDK/factory.

