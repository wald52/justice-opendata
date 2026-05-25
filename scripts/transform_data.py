#!/usr/bin/env python3
"""
Script pour transformer les données brutes CSV en JSON optimisés
pour être consommés par le site web statique (Chart.js / DataTables).
"""

import os
import json
import csv
from pathlib import Path

# Configuration
BASE_DIR = Path(__file__).parent.parent
RAW_DATA_DIR = BASE_DIR / 'data' / 'raw'
PROCESSED_DATA_DIR = BASE_DIR / 'data'
PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)

def generate_mock_time_series():
    """Génère des données de simulation pour l'affichage initial du site"""
    
    # 1. Données d'activité des tribunaux
    activity = {
        "years": ["2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024"],
        "series": {
            "civil": [1850000, 1820000, 1800000, 1750000, 1720000, 1400000, 1650000, 1680000, 1700000, 1710000],
            "penal": [1200000, 1220000, 1230000, 1210000, 1180000, 950000, 1100000, 1120000, 1150000, 1130000]
        }
    }
    
    with open(PROCESSED_DATA_DIR / 'activity.json', 'w', encoding='utf-8') as f:
        json.dump(activity, f, ensure_ascii=False, indent=2)
        
    print("Généré: activity.json (Données simulées)")

def main():
    print("Démarrage de la transformation des données...")
    
    # Pour l'instant, on génère des mocks car les CSV peuvent être volumineux (ex: NATINF)
    # Dans un environnement de CI/CD, on utiliserait pandas pour traiter les CSV réels.
    generate_mock_time_series()
    
    print("\nTerminé ! Les données JSON prêtes pour le web sont dans data/")

if __name__ == "__main__":
    main()
