# Ícones PWA - Gol de Ouro

## Ícones Necessários

Coloque os seguintes arquivos nesta pasta:

- `icon-192.png` (192x192px)
- `icon-512.png` (512x512px) 
- `maskable-192.png` (192x192px)
- `maskable-512.png` (512x512px)
- `apple-touch-icon.png` (180x180px) - na pasta public/

## Gerar Ícones Automaticamente

Se você tem um logo.png na pasta public/, execute:

```bash
npm i -D pwa-asset-generator
npx pwa-asset-generator .\public\logo.png .\public\icons -i
```

## Especificações

- **Formato**: PNG
- **Fundo**: Transparente (exceto maskable que pode ter fundo)
- **Qualidade**: Alta resolução
- **Tema**: Amarelo/dourado (#ffd700) + azul escuro (#001a33)
