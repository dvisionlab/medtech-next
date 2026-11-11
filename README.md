# MedTech Next — sito della conferenza

Sito statico (HTML + CSS + JS, nessuna build) della conferenza **MedTech Next**, organizzata da D/Vision Lab e NRG.
Pubblicato su GitHub Pages: https://medtechnext.it

## Struttura

```
src/index.html        # SORGENTE: template unico con testi IT/EN affiancati  ← si modifica questo
build.py              # genera index.html (IT), en/index.html (EN) e sitemap.xml dal template
index.html            # GENERATO (italiano)
en/index.html         # GENERATO (inglese)
assets/css/style.css  # stili
assets/js/main.js     # menu mobile + tab delle edizioni (link diretto: #edizione-2026)
assets/img/           # immagini (speaker, gallery, loghi sponsor, og-image)
CNAME                 # dominio custom per GitHub Pages
```

I contenuti da completare sono marcati con `TODO` nell'HTML:

```bash
grep -n TODO index.html
```

## Lingue (IT / EN)

Si scrive tutto in `src/index.html`, con i due testi affiancati:

```
{{it}}Testo in italiano{{en}}Text in English{{/}}
```

Poi si rigenerano le pagine e si committa il risultato (il controllo in CI fallisce se i file generati non sono aggiornati):

```bash
python3 build.py
```

- `/` è in italiano, `/en/` in inglese, collegate con `hreflang` (importante per Google).
- Alla prima visita della home un browser non italiano viene portato su `/en/`; la scelta fatta con il selettore IT/EN viene ricordata. I crawler non vengono reindirizzati.
- Immagini social: `assets/img/og-image.jpg` (IT) e `og-image-en.jpg` (EN).

## SEO e indicizzazione

Già fatto nel sito:
- `<title>`, meta description, canonical, `hreflang` IT/EN, Open Graph e Twitter card, per ogni lingua (generati da `build.py`).
- Dati strutturati JSON-LD (schema.org: `WebSite`, `Organization` con `sameAs` e contatto, `EventSeries`, `Event` 2026) in `build.py`, funzione `jsonld()`.
  Quando si annuncia il 2027, aggiungere lì un nuovo `Event` con data e luogo (Google richiede `startDate`).
- `robots.txt`, `sitemap.xml` con alternative `hreflang`, immagini e `lastmod` (aggiornare `LASTMOD` in `build.py` quando cambiano i contenuti).
- Immagini social `assets/img/og-image.jpg` (IT) e `og-image-en.jpg` (EN), 1200×630.
- Icone: `favicon.ico`, `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`, `icon-192/512.png`, `site.webmanifest`.
- Font ospitati sul sito (`assets/fonts/`): nessuna richiesta a Google, nessun cookie, nessuno spostamento del layout (CLS 0).
- Pagina `404.html` bilingue con `noindex`.

Da fare a mano dopo ogni cambio di dominio o di struttura:
1. **Google Search Console**: proprietà di tipo *Dominio* (verifica con record `TXT` su Squarespace), invio di `sitemap.xml`, *Richiedi indicizzazione* di `/` e `/en/`.
2. **Bing Webmaster Tools**: importare la proprietà da Search Console (alimenta anche DuckDuckGo e altri).
3. Controllare l'anteprima dei link con il [Post Inspector di LinkedIn](https://www.linkedin.com/post-inspector/) dopo ogni cambio di immagine social.
4. In *Settings → Pages* tenere attivo **Enforce HTTPS**.

## Sviluppo locale

```bash
python3 -m http.server 8000   # i percorsi sono assoluti: servire dalla radice del repo
```

Poi apri http://localhost:8000

## Aggiungere una nuova edizione

In `index.html`, nella sezione `#edizioni`:
1. aggiungi un `<button role="tab">` con l'anno dentro `.tabs`;
2. aggiungi il relativo `<div role="tabpanel" hidden>` (copia quello del 2026).

## Pubblicazione (GitHub Pages)

1. **Settings → Pages**: Source = **GitHub Actions**. Il workflow `.github/workflows/pages.yml` pubblica a ogni push su `master` (si può lanciare anche a mano da *Actions → Deploy GitHub Pages → Run workflow*).
2. **Dominio** `medtechnext.it` (DNS su Squarespace): quattro record `A` su `@` (`185.199.108.153`, `.109.153`, `.110.153`, `.111.153`), quattro `AAAA` (`2606:50c0:8000::153` … `8003::153`) e un `CNAME` `www` → `dvisionlab.github.io`. In Settings → Pages il *Custom domain* è `medtechnext.it` (con il deploy da Actions il file `CNAME` non conta: il dominio si imposta da lì).
3. Quando il certificato è pronto, in Settings → Pages attiva **Enforce HTTPS**.
