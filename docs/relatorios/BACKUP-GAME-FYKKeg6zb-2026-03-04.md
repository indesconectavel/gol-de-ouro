# Backup estático do build /game (FyKKeg6zb)

**Data/hora:** 2026-03-04 19:21:37  
**Origem:** https://www.goldeouro.lol/  
**Objetivo:** Snapshot estático do build atual do player como backup permanente.

---

## 1) HTML principal

**Comando:** `curl -s https://www.goldeouro.lol > backup-game-index.html`  
**Destino:** o arquivo foi salvo como `index.html` na pasta de backup.

---

## 2) Assets identificados no HTML

Extraídos do HTML baixado:

| Tipo | Caminho |
|------|---------|
| JS principal | `/assets/index-qIGutT6K.js` |
| CSS principal | `/assets/index-lDOJDUAS.css` |
| Script | `/sw-kill-global.js` |
| Script | `/force-update.js` |
| Script | `/registerSW.js` |
| Manifest | `/manifest.webmanifest` |

*(Hashes index-qIGutT6K / index-lDOJDUAS são os mesmos documentados para o build FyKKeg6zb em POST-ROLLBACK-VERCEL-FyKKeg6zb.)*

---

## 3) Download dos assets

**Comandos utilizados (base https://www.goldeouro.lol):**

- `curl -s -L -o .../index-qIGutT6K.js` ← `/assets/index-qIGutT6K.js`
- `curl -s -L -o .../index-lDOJDUAS.css` ← `/assets/index-lDOJDUAS.css`
- `curl -s -L -o .../sw-kill-global.js` ← `/sw-kill-global.js`
- `curl -s -L -o .../force-update.js` ← `/force-update.js`
- `curl -s -L -o .../registerSW.js` ← `/registerSW.js`
- `curl -s -L -o .../manifest.webmanifest` ← `/manifest.webmanifest`

O HTML foi movido para a pasta de backup como `index.html`.

---

## 4) Pasta de backup

**Caminho:** `backups/game-FyKKeg6zb-2026-03-04/`

---

## 5) Arquivos na pasta (nomes exatos)

| Nome do arquivo |
|------------------|
| index.html |
| index-qIGutT6K.js |
| index-lDOJDUAS.css |
| sw-kill-global.js |
| force-update.js |
| registerSW.js |
| manifest.webmanifest |

---

## 6) Hashes SHA256 e data/hora

**Data/hora do backup:** 2026-03-04 19:21:37

| Arquivo | SHA256 |
|---------|--------|
| index.html | BEBE03D33AC9BBF67BE1AC78FDD1BCA0DC9ECA615EAF5DF9024A80710F346EE0 |
| index-qIGutT6K.js | 176879BB92EAA5AA98EE51BCC0E82D9B04AA867F8F37C3DE0734CBCA8B5AAC89 |
| index-lDOJDUAS.css | 4541015E7DE788AE7CF4B9ECEAB3041A8D5263F4332427894E0CD72516BC6626 |
| sw-kill-global.js | 5622C5AB33A82C23433502743741961EE1FDB62654DB9E7301A489EADD82B15B |
| force-update.js | 54DA852C41EC2DDDE898E68E264C4577EDA32CBFEF2DE84C919EF8BB8C8AE54F |
| registerSW.js | 9742073EF7FC795E7673D98F272992843298426A0FFD8CB3507784DF5143608B |
| manifest.webmanifest | EF746EF499F61488E91469D602C921C5A1562234E8A3AFF83FAC6279902B90D0 |

---

## Conclusão

**Backup estático completo do /game preservado.**

O snapshot do build (HTML + JS principal, CSS principal e scripts auxiliares referenciados) está em `backups/game-FyKKeg6zb-2026-03-04/` com hashes SHA256 registrados acima. Os assets correspondem ao que foi servido em https://www.goldeouro.lol/ na data do backup (index-qIGutT6K.js, index-lDOJDUAS.css), associados ao build FyKKeg6zb na documentação do projeto.
