# MedTech Next — sito della conferenza

Sito statico (HTML + CSS + JS, nessuna build) della conferenza **MedTech Next**, organizzata da D/Vision Lab e NRG.
Pubblicato su GitHub Pages: https://medtechnext-conf.dvisionlab.com

## Struttura

```
index.html            # pagina unica: hero, cos'è, edizioni (tab), sponsor, organizzatori, contatti
assets/css/style.css  # stili
assets/js/main.js     # menu mobile + tab delle edizioni (link diretto: #edizione-2026)
assets/img/           # immagini (speaker, gallery, loghi sponsor, og-image)
CNAME                 # dominio custom per GitHub Pages
```

I contenuti da completare sono marcati con `TODO` nell'HTML:

```bash
grep -n TODO index.html
```

## SEO

- `<title>`, meta description, canonical, Open Graph e Twitter card in `index.html`.
- Dati strutturati JSON-LD (schema.org: `WebSite`, `Organization`, `EventSeries`, `Event` per ogni edizione).
  Quando si annuncia il 2027 aggiungere un nuovo `Event` con data e luogo nel blocco `application/ld+json`.
- `robots.txt` e `sitemap.xml` (aggiornare `lastmod` quando cambiano i contenuti).
- Immagine social `assets/img/og-image.jpg` (1200×630) e favicon (`favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`).
- Dopo la pubblicazione: registrare il sito su Google Search Console e inviare la sitemap.

## Sviluppo locale

```bash
python3 -m http.server 8000
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
