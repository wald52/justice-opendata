#!/usr/bin/env python3
import os
import requests
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
RAW_DATA_DIR = BASE_DIR / 'data' / 'raw'
RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)

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
        resp = requests.get(api_url, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        
        resources = data.get('resources', [])
        if not resources:
            print(f"Aucune ressource trouvée pour {name}")
            return
            
        # Prendre la ressource la plus récente (la première)
        latest_res = resources[0]
        url = latest_res['url']
        fmt = latest_res['format'].lower()
        
        filename = f"{name}.{fmt}"
        filepath = RAW_DATA_DIR / filename
        
        print(f"Téléchargement de {url} vers {filepath}...")
        file_resp = requests.get(url, stream=True, timeout=30)
        file_resp.raise_for_status()
        
        with open(filepath, 'wb') as f:
            for chunk in file_resp.iter_content(chunk_size=8192):
                f.write(chunk)
                
        print(f"Succès: {filename}")
        
    except Exception as e:
        print(f"Erreur pour {name}: {e}")

def main():
    print("Démarrage de l'import des données de justice...")
    # On privilégie les prisons en premier (demande de l'utilisateur)
    fetch_latest_resource(DATASETS['prisons'], 'prisons')
    fetch_latest_resource(DATASETS['aide_juridictionnelle'], 'aide_juridictionnelle')
    fetch_latest_resource(DATASETS['delais'], 'delais')
    fetch_latest_resource(DATASETS['natinf'], 'natinf')
    fetch_latest_resource(DATASETS['juridictions'], 'juridictions')
    print("\nTerminé !")

if __name__ == "__main__":
    main()
