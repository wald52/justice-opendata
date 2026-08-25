#!/usr/bin/env python3
"""
Télécharge les dernières ressources depuis data.gouv.fr
pour les jeux de données justice.
"""
import sys
import requests
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
RAW_DATA_DIR = BASE_DIR / 'data' / 'raw'
RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)

HEADERS = {
    "User-Agent": "JusticeOpenData/1.0 (https://github.com/wald52/justice-opendata)"
}

DATASETS = {
    'prisons': 'https://www.data.gouv.fr/api/1/datasets/statistique-mensuelle-de-la-population-ecrouee-et-detenue-en-france',
    'natinf': 'https://www.data.gouv.fr/api/1/datasets/liste-des-infractions-en-vigueur-de-la-nomenclature-natinf/',
    'juridictions': 'https://www.data.gouv.fr/api/1/datasets/liste-des-juridictions-competentes-pour-les-communes-de-france/',
    'aide_juridictionnelle': 'https://www.data.gouv.fr/api/1/datasets/l-aide-juridictionnelle-1/',
    'delais': 'https://www.data.gouv.fr/api/1/datasets/delais-de-traitement-des-affaires/'
}

def fetch_latest_resource(api_url, name):
    print(f"Recherche pour {name}...")
    try:
        resp = requests.get(api_url, headers=HEADERS, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        
        resources = data.get('resources', [])
        if not resources:
            print(f"Aucune ressource trouvée pour {name}")
            return False
            
        # Trier par date de modification décroissante (plus récente d'abord)
        def sort_key(r):
            return r.get('last_modified') or r.get('created_at') or ''
        resources = sorted(resources, key=sort_key, reverse=True)
            
        latest_res = resources[0]
        url = latest_res.get('url')
        if not url:
            print(f"Ressource sans URL pour {name}")
            return False
        fmt = (latest_res.get('format') or 'csv').lower().strip()
        # Normaliser format
        if fmt in ('xls', 'xlsx'):
            fmt = 'xlsx' if 'xlsx' in fmt else 'xls'
        elif fmt not in ('csv', 'xlsx', 'xls', 'json', 'ods'):
            fmt = fmt.replace('.', '') or 'csv'
        
        filename = f"{name}.{fmt}"
        filepath = RAW_DATA_DIR / filename
        
        print(f"Téléchargement de {url} vers {filepath}...")
        file_resp = requests.get(url, headers=HEADERS, stream=True, timeout=60)
        file_resp.raise_for_status()
        
        # Vérifier Content-Type si possible
        with open(filepath, 'wb') as f:
            for chunk in file_resp.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
                
        print(f"Succès: {filename} ({filepath.stat().st_size} octets)")
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"Erreur réseau pour {name}: {e}")
        return False
    except Exception as e:
        print(f"Erreur pour {name}: {e}")
        return False

def main():
    print("Démarrage de l'import des données de justice...")
    results = []
    # On privilégie les prisons en premier (demande utilisateur)
    for key in ['prisons', 'aide_juridictionnelle', 'delais', 'natinf', 'juridictions']:
        ok = fetch_latest_resource(DATASETS[key], key)
        results.append(ok)

    success = sum(results)
    total = len(results)
    print(f"\nTerminé : {success}/{total} jeux téléchargés")
    if success < total:
        print("Certains téléchargements ont échoué - transform_data générera des mocks pour les manquants")
    # Ne pas échouer le CI si certains échouent (données optionnelles)
    # sys.exit(1) si vraiment critique
    return 0

if __name__ == "__main__":
    sys.exit(main())
