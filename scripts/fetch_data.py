#!/usr/bin/env python3
"""
Script pour télécharger les données ouvertes de la justice française.
Destiné à être exécuté localement ou via GitHub Actions pour mettre à jour les données.
"""

import os
import urllib.request
import json
from pathlib import Path

# Configuration
BASE_DIR = Path(__file__).parent.parent
RAW_DATA_DIR = BASE_DIR / 'data' / 'raw'
RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)

# Sources des données (URLs de démonstration vers les API data.gouv.fr)
DATASETS = {
    # 1. Nomenclature NATINF (Infractions)
    'natinf': 'https://www.data.gouv.fr/api/1/datasets/liste-des-infractions-en-vigueur-de-la-nomenclature-natinf/',
    
    # 2. Carte Judiciaire (Juridictions compétentes)
    'juridictions': 'https://www.data.gouv.fr/api/1/datasets/liste-des-juridictions-competentes-pour-les-communes-de-france/'
}

def fetch_dataset_metadata(url):
    """Récupère les métadonnées d'un dataset data.gouv.fr"""
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        print(f"Erreur lors de la récupération des métadonnées {url}: {e}")
        return None

def download_resource(url, filename):
    """Télécharge un fichier CSV/JSON"""
    filepath = RAW_DATA_DIR / filename
    print(f"Téléchargement de {url} vers {filepath}...")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            with open(filepath, 'wb') as f:
                f.write(response.read())
        print(f"Succès: {filename}")
    except Exception as e:
        print(f"Erreur lors du téléchargement de {url}: {e}")

def main():
    print("Démarrage de l'import des données de justice...")
    
    for name, api_url in DATASETS.items():
        print(f"\nRecherche du jeu de données: {name}")
        metadata = fetch_dataset_metadata(api_url)
        
        if metadata and 'resources' in metadata and len(metadata['resources']) > 0:
            # Prendre la première ressource (souvent le CSV principal)
            resource = metadata['resources'][0]
            download_url = resource.get('url')
            file_format = resource.get('format', 'csv').lower()
            
            if download_url:
                filename = f"{name}.{file_format}"
                download_resource(download_url, filename)
        else:
            print(f"Aucune ressource exploitable trouvée pour {name}")
            
    print("\nTerminé ! Les données brutes sont dans data/raw/")

if __name__ == "__main__":
    main()
