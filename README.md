# Justice Open Data France

Plateforme de visualisation des données ouvertes de la justice française. Explorez l'activité judiciaire, la justice pénale et civile, les prisons, l'aide juridictionnelle, les délais de jugement, le budget et les violences intrafamiliales.

**→ Démo en ligne :** https://wald52.github.io/justice-opendata/

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Data: data.gouv.fr](https://img.shields.io/badge/Data-data.gouv.fr-orange)
![Pages: GitHub Pages](https://img.shields.io/badge/Hosting-GitHub%20Pages-green)

---

## Aperçu

| Page | Description |
|------|-------------|
| **Vue d'ensemble** (`index.html`) | Dashboard transversal : flux contentieux, KPIs, répartition |
| **Flux & Activité** (`activite.html`) | Affaires nouvelles/terminées, taux de couverture, classements sans suite |
| **Justice Pénale** (`penal.html`) | Condamnations, infractions (NATAFF/NATINF), peines |
| **Justice Civile** (`civil.html`) | Divorces, tutelles, contentieux civils |
| **VIF** (`vif.html`) | Ordonnances de protection, TGD/BAR, condamnations VIF |
| **Prisons** (`prisons.html`) | Population carcérale, densité, aménagements de peine |
| **Aide Juridictionnelle** (`aide-juridictionnelle.html`) | Admissions, budget, répartition par contentieux |
| **Délais** (`delais.html`) | Délais moyens civil/pénal/assises par instance |
| **Budget** (`budget.html`) | Budget Justice, effectifs, répartition missions |
| **Carte** (`carte.html`) | Carte judiciaire géolocalisée (juridictions) |
| **Explorateur** (`explorer.html`) | Explorateur générique des jeux de données |

Fonctionnalités : thème clair/sombre, responsive, graphiques Chart.js interactifs, données JSON locales.

## Stack

- **Frontend** : HTML5, CSS3 (`css/style.css`), Vanilla JS (`js/app.js`, `js/charts.js`), Chart.js (CDN), FontAwesome, Google Fonts Inter
- **Data pipeline** : Python 3.11 (`requests`, `pandas`, `openpyxl`)
- **Hébergement** : GitHub Pages (branche `main`, dossier `/`)
- **CI** : GitHub Actions (`.github/workflows/update_data.yml`)

## Structure

```
justice-opendata/
├── index.html, penal.html, civil.html, vif.html, prisons.html, ...
├── css/style.css
├── js/
│   ├── app.js      # thème, navigation
│   └── charts.js   # rendu Chart.js (fetch data/*.json)
├── data/
│   ├── *.json              # données transformées (commitées)
│   └── raw/                # données brutes (ignorées par git, régénérables)
├── scripts/
│   ├── fetch_data.py              # télécharge depuis data.gouv.fr
│   ├── transform_data.py          # génère les JSON
│   ├── geocode_juridictions.py
│   └── update_nav.py
└── .github/workflows/update_data.yml
```

## Sources de données

Toutes issues de [data.gouv.fr](https://www.data.gouv.fr) :

- Statistique mensuelle de la population écrouée et détenue
- Liste NATINF / NATAFF
- Liste des juridictions compétentes par commune
- Aide juridictionnelle
- Délais de traitement des affaires
- PLF Justice (budget, effectifs - mock structuré)

> Les JSON actuels dans `data/` sont générés par `transform_data.py` sur la base de chiffres publics 2015-2024 pour garantir un frontend fonctionnel. Le parsing réel des fichiers Excel/CSV bruts est prêt à être branché (voir commentaires dans `transform_data.py`).

## Installation locale

```bash
# Cloner
git clone https://github.com/wald52/justice-opendata.git
cd justice-opendata

# Lancer un serveur local (au choix)
python -m http.server 8000
# ou
npx serve .

# Ouvrir http://localhost:8000
```

### Pipeline données (optionnel)

```bash
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
# source venv/bin/activate

pip install -r requirements.txt

python scripts/fetch_data.py      # télécharge dans data/raw/
python scripts/transform_data.py  # génère data/*.json
```

`venv/` et `data/raw/` sont ignorés par Git (voir `.gitignore`).

## Automatisation

Le workflow `.github/workflows/update_data.yml` tourne **tous les dimanches à minuit** (cron `0 0 * * 0`) et peut être lancé manuellement (`workflow_dispatch`) :

1. `actions/checkout@v4` (fetch-depth 0)
2. `setup-python@v5` (3.11) avec cache pip
3. `pip install -r requirements.txt`
4. `python scripts/fetch_data.py` (tri par date, headers, timeout 60s)
5. `python scripts/transform_data.py`
6. `git add data/*.json && git commit && git pull --rebase && git push` (concurrency, permissions)

## Déploiement

GitHub Pages est activé sur la branche `main` / racine `/` (avec `.nojekyll` pour site statique).

URL : **https://wald52.github.io/justice-opendata/**

Toute poussée sur `main` redéploie automatiquement.

Pour activer manuellement :

```bash
gh api repos/wald52/justice-opendata/pages -X PUT -f source[branch]=main -f source[path]=/
# ou via Settings > Pages > Source: Deploy from a branch > main / (root)
```

## Feuille de route

- [x] SEO / a11y de base (meta OG, canonical, sitemap, robots, aria, SRI, skip-link)
- [x] CI robuste (cache, concurrency, pull rebase, requirements.txt)
- [ ] Parser réel des fichiers `data/raw/*.xlsx` / `*.csv` (prisons, juridictions) - mocks actuels
- [ ] Filtres temporels dynamiques sur les graphiques
- [ ] Export CSV/PNG des graphiques

## Licence

MIT — libre de réutiliser, citer les sources `data.gouv.fr`.

---

<div align="center">
  <sub>Projet indépendant — non affilié au Ministère de la Justice. Données publiques.</sub>
</div>
