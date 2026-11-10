#!/usr/bin/env python3
"""Genera index.html (IT) e en/index.html (EN) da src/index.html, più la sitemap.

Uso:  python3 build.py            # genera i file
      python3 build.py --check    # verifica che i file generati siano aggiornati (usato in CI)
"""
import hashlib, json, re, sys
from pathlib import Path

ROOT = Path(__file__).parent
SITE = "https://medtechnext-conf.dvisionlab.com"
LANGS = {
    "it": dict(out="index.html", url=SITE + "/", ogLocale="it_IT", ogLocaleAlt="en_US", ogImage="og-image.jpg", inLang="it-IT"),
    "en": dict(out="en/index.html", url=SITE + "/en/", ogLocale="en_US", ogLocaleAlt="it_IT", ogImage="og-image-en.jpg", inLang="en-US"),
}

# (file, alt IT, alt EN, in evidenza)
GALLERY = [
    ("gruppo", "Foto di gruppo di speaker e organizzatori di MedTech Next 2026 al PoliHub", "Group photo of the speakers and organizers of MedTech Next 2026 at PoliHub", True),
    ("apertura", "Lo schermo di apertura di MedTech Next 2026 in sala", "The opening slide of MedTech Next 2026 on screen", False),
    ("sala", "La sala del PoliHub Bovisa piena durante MedTech Next 2026", "The packed PoliHub Bovisa room during MedTech Next 2026", False),
    ("talk-dvisionlab", "Il talk di D/Vision Lab sul flusso diagnostico integrato con AI", "The D/Vision Lab talk on the AI-integrated diagnostic workflow", False),
    ("speaker-1", "Uno speaker durante il suo intervento a MedTech Next 2026", "A speaker during their talk at MedTech Next 2026", False),
    ("speaker-2", "Un intervento sul software medicale a MedTech Next 2026", "A talk on medical software at MedTech Next 2026", False),
    ("speaker-3", "Uno speaker presenta un caso di studio a MedTech Next 2026", "A speaker presents a case study at MedTech Next 2026", False),
    ("pubblico", "Il pubblico di MedTech Next 2026 al PoliHub Bovisa", "The audience of MedTech Next 2026 at PoliHub Bovisa", False),
    ("polihub", "Le vetrate del PoliHub Bovisa durante MedTech Next 2026", "The glass walls of PoliHub Bovisa during MedTech Next 2026", False),
]

# (nome, ruolo IT, ruolo EN, organizzazione)
SPEAKERS = [
    ("Gabriele Dubini", "Professore", "Professor", "Politecnico di Milano"),
    ("Simone Manini", "Presidente", "President", "D/Vision Lab"),
    ("Alessandro Rotilio", "Medical Device Industry Executive", "Medical Device Industry Executive", None),
    ("Valeria Glorioso", "Direttrice Centro Studi", "Head of Research Centre", "Confindustria Dispositivi Medici"),
    ("Pasquale Pedicini", "Sales Manager", "Sales Manager", "GMM Group"),
    ("Sofia Mosci", "Senior Manager", "Senior Manager", "Camelot Biomedical Systems"),
    ("Marco Ciambrone", "CTO", "CTO", "NRG"),
    ("Felice Lopane", "Managing Director", "Managing Director", "BION Cluster Lombardo Scienze della Vita"),
]


def gallery_html(lang):
    out = []
    for name, alt_it, alt_en, feat in GALLERY:
        alt = alt_it if lang == "it" else alt_en
        sizes = "(max-width: 720px) 100vw, 760px" if feat else "(max-width: 720px) 50vw, 380px"
        cls = ' class="feature"' if feat else ""
        out.append(
            f'            <a href="/assets/img/2026/gallery/{name}.webp" target="_blank" rel="noopener"{cls}>'
            f'<img src="/assets/img/2026/gallery/{name}-sm.webp" '
            f'srcset="/assets/img/2026/gallery/{name}-sm.webp 700w, /assets/img/2026/gallery/{name}.webp 1600w" '
            f'sizes="{sizes}" alt="{alt}" width="700" height="467" loading="lazy"></a>'
        )
    return "\n".join(out)


def jsonld(lang):
    L = LANGS[lang]
    it = lang == "it"
    ref = lambda k: {"@id": f"{SITE}/#{k}"}
    people = []
    for n, r_it, r_en, org in SPEAKERS:
        p = {"@type": "Person", "name": n, "jobTitle": r_it if it else r_en}
        if org:
            p["worksFor"] = {"@type": "Organization", "name": org}
        people.append(p)
    graph = [
        {"@type": "WebSite", "@id": f"{SITE}/#website", "url": SITE + "/", "name": "MedTech Next",
         "inLanguage": ["it-IT", "en-US"], "publisher": [ref("dvisionlab"), ref("nrg")]},
        {"@type": "Organization", "@id": f"{SITE}/#dvisionlab", "name": "D/Vision Lab",
         "url": "https://www.dvisionlab.it", "logo": f"{SITE}/assets/img/loghi/dvisionlab.png"},
        {"@type": "Organization", "@id": f"{SITE}/#nrg", "name": "NRG",
         "url": "https://www.nrgsys.it/", "logo": f"{SITE}/assets/img/loghi/nrg.png"},
        {"@type": "EventSeries", "@id": f"{SITE}/#series", "name": "MedTech Next", "url": L["url"],
         "description": ("Tech conference di D/Vision Lab e NRG per chi guida progetti digitali complessi nei dispositivi medici."
                         if it else
                         "Tech conference by D/Vision Lab and NRG for the people leading complex digital projects in medical devices."),
         "organizer": [ref("dvisionlab"), ref("nrg")]},
        {"@type": "Event", "@id": f"{SITE}/#edizione-2026", "name": "MedTech Next 2026",
         "description": ("Progetti complessi, partner concreti: un pomeriggio di confronto tra industria, tecnologia e ricerca su AI nei flussi diagnostici, re-ingegnerizzazione guidata dal rischio e partnership nel medtech."
                         if it else
                         "Complex projects, real partners: an afternoon where industry, technology and research meet on AI in diagnostic workflows, risk-driven re-engineering and partnerships in medtech."),
         "url": L["url"] + "#edizione-2026",
         "startDate": "2026-06-11T15:00:00+02:00", "endDate": "2026-06-11T18:00:00+02:00",
         "eventStatus": "https://schema.org/EventScheduled",
         "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
         "inLanguage": "it-IT",
         "image": [f"{SITE}/assets/img/2026/gallery/gruppo.webp", f"{SITE}/assets/img/2026/gallery/sala.webp", f"{SITE}/assets/img/2026/locandina.jpg"],
         "superEvent": ref("series"),
         "location": {"@type": "Place", "name": "PoliHub Bovisa — Innovation Park & Startup Accelerator",
                      "address": {"@type": "PostalAddress", "streetAddress": "Via Giovanni Durando 39", "postalCode": "20158",
                                  "addressLocality": "Milano" if it else "Milan", "addressRegion": "MI", "addressCountry": "IT"}},
         "organizer": [ref("dvisionlab"), ref("nrg")],
         "sponsor": [{"@type": "Organization", "name": n} for n in
                     ["Confindustria Dispositivi Medici", "Cluster lombardo scienze della vita", "PoliHub"]],
         "performer": people,
         "offers": {"@type": "Offer", "price": "0", "priceCurrency": "EUR", "availability": "https://schema.org/SoldOut",
                    "url": "https://www.eventbrite.it/e/biglietti-medtech-next-2026-1977923893610",
                    "validFrom": "2026-05-01T00:00:00+02:00"},
         "isAccessibleForFree": True},
    ]
    return json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False, indent=2)


def version():
    h = hashlib.sha1()
    for f in ("assets/css/style.css", "assets/js/main.js"):
        h.update((ROOT / f).read_bytes())
    return h.hexdigest()[:8]


LANG_RE = re.compile(r"\{\{it\}\}(.*?)\{\{en\}\}(.*?)\{\{/\}\}", re.S)


def render(template, lang, ver):
    L = LANGS[lang]
    template = re.sub(r"<!--\s*TEMPLATE SORGENTE.*?-->\n", "<!-- Generato da src/index.html con build.py: non modificare a mano -->\n", template, flags=re.S)
    html = LANG_RE.sub(lambda m: m.group(1 if lang == "it" else 2), template)
    values = {
        "lang": lang, "url": L["url"], "site": SITE, "ogLocale": L["ogLocale"], "ogLocaleAlt": L["ogLocaleAlt"],
        "ogImage": L["ogImage"], "version": ver, "jsonld": jsonld(lang), "gallery": gallery_html(lang),
    }
    html = re.sub(r"\{\{@(\w+)\}\}", lambda m: values[m.group(1)], html)
    left = re.findall(r"\{\{[^}]*\}\}", html)
    if left:
        sys.exit(f"[{lang}] segnaposto non risolti: {left[:5]}")
    return html


def sitemap():
    alts = (f'    <xhtml:link rel="alternate" hreflang="it" href="{SITE}/"/>\n'
            f'    <xhtml:link rel="alternate" hreflang="en" href="{SITE}/en/"/>\n'
            f'    <xhtml:link rel="alternate" hreflang="x-default" href="{SITE}/"/>\n')
    imgs = "".join(f"    <image:image><image:loc>{SITE}/assets/img/{p}</image:loc></image:image>\n"
                   for p in ["og-image.jpg", "2026/gallery/gruppo.webp", "2026/gallery/sala.webp",
                             "2026/gallery/talk-dvisionlab.webp", "2026/gallery/apertura.webp", "2026/locandina.jpg"])
    urls = "".join(f"  <url>\n    <loc>{u}</loc>\n{alts}{imgs}  </url>\n" for u in (SITE + "/", SITE + "/en/"))
    return ('<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
            'xmlns:xhtml="http://www.w3.org/1999/xhtml" '
            'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' + urls + "</urlset>\n")


def main():
    check = "--check" in sys.argv
    template = (ROOT / "src/index.html").read_text(encoding="utf-8")
    ver = version()
    outputs = {L["out"]: render(template, lang, ver) for lang, L in LANGS.items()}
    outputs["sitemap.xml"] = sitemap()
    stale = []
    for rel, content in outputs.items():
        path = ROOT / rel
        if check:
            if not path.exists() or path.read_text(encoding="utf-8") != content:
                stale.append(rel)
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content, encoding="utf-8")
            print("scritto", rel)
    if check:
        if stale:
            sys.exit("File non aggiornati (lancia python3 build.py e committa): " + ", ".join(stale))
        print("ok: file generati aggiornati")


if __name__ == "__main__":
    main()
