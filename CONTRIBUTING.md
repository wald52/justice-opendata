# Contribuer

Merci de contribuer à Justice Open Data France !

## Développement local

```bash
git clone https://github.com/wald52/justice-opendata.git
cd justice-opendata
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python -m http.server 8000
# http://localhost:8000
```

Pipeline données :

```bash
python scripts/fetch_data.py
python scripts/transform_data.py
python scripts/geocode_juridictions.py  # optionnel, ~45s
```

## Standards

- Branche `main` protégée — PR requis (sauf mainteneur solo)
- Commits conventionnels : `feat:`, `fix:`, `docs:`, `chore:`
- `npm run lint` doit passer, `npm test` vert
- Accessibilité RGAA : chaque PR vérifiée avec `axe` / Lighthouse

## Pull Request

1. Fork + branche `feat/ma-feature`
2. `npm run format` avant commit
3. Décrire les sources `data.gouv.fr` utilisées
4. Captures avant/après pour UI

## Signalement

Utilisez les templates `.github/ISSUE_TEMPLATE/` pour bug / idée.

## Licence

En contribuant, vous acceptez que vos contributions soient sous MIT.
