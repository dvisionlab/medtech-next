# MedTech Next — sito della conferenza

Sito statico (HTML + CSS + JS, nessuna build) della conferenza **MedTech Next**, organizzata da D/Vision Lab e NRG.
Pubblicato su GitHub Pages: https://medtechnext-conf.dvisionlab.com

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

## SEO

- `<title>`, meta description, canonical, Open Graph e Twitter card in `index.html`.
- Dati strutturati JSON-LD (schema.org: `WebSite`, `Organization`, `EventSeries`, `Event` per ogni edizione), generati da `build.py`.
  Quando si annuncia il 2027 aggiungere un nuovo `Event` con data e luogo in `jsonld()` dentro `build.py`.
- `robots.txt` e `sitemap.xml` (quest'ultima generata da `build.py`, con le alternative `hreflang`).
- Immagine social `assets/img/og-image.jpg` (1200×630) e favicon (`favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`).
- Dopo la pubblicazione: registrare il sito su Google Search Console e inviare la sitemap.

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
2. **DNS** (zona `dvisionlab.com`): record `CNAME` `medtechnext-conf` → `dvisionlab.github.io`.
3. Quando il certificato è pronto, in Settings → Pages attiva **Enforce HTTPS**.
