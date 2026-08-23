#!/usr/bin/env python3
"""
Extrait les juridictions uniques du CSV des compétences territoriales
et les géocode via l'API gouvernementale adresse.data.gouv.fr.
Génère data/juridictions_geo.json pour la carte Leaflet.
"""
import csv
import json
import time
import urllib.request
import urllib.parse
from pathlib import Path
from collections import defaultdict

BASE_DIR = Path(__file__).parent.parent
RAW_CSV = BASE_DIR / 'data' / 'raw' / 'juridictions.csv'
OUTPUT = BASE_DIR / 'data' / 'juridictions_geo.json'

def extract_unique_juridictions():
    """Extrait les juridictions uniques et le nombre de communes rattachées."""
    juridictions = defaultdict(lambda: {"type": "", "communes": 0})
    
    with open(RAW_CSV, 'r', encoding='utf-8-sig') as f:
        reader = csv.reader(f, delimiter=';')
        header = next(reader)
        
        for row in reader:
            if len(row) < 14:
                continue
            
            # Cour d'Appel
            ca_name = row[4].strip()
            if ca_name:
                juridictions[ca_name]["type"] = "ca"
                juridictions[ca_name]["communes"] += 1
            
            # Tribunal Judiciaire
            tj_name = row[7].strip()
            if tj_name:
                juridictions[tj_name]["type"] = "tj"
                juridictions[tj_name]["communes"] += 1
            
            # Conseil de Prud'hommes
            cph_name = row[13].strip()
            if cph_name:
                juridictions[cph_name]["type"] = "cph"
                juridictions[cph_name]["communes"] += 1
    
    return juridictions

def extract_city_from_name(name):
    """Extrait le nom de ville depuis le nom de la juridiction."""
    # "Tribunal judiciaire de Bourg-en-Bresse" -> "Bourg-en-Bresse"
    # "Cour d'Appel de Lyon" -> "Lyon"
    # "Conseil de Prud'hommes de Belley" -> "Belley"
    prefixes = [
        "Tribunal judiciaire de ", "Tribunal Judiciaire de ",
        "Cour d'Appel de ", "Cour d'appel de ",
        "Conseil de Prud'hommes de ", "Conseil de prud'hommes de ",
        "Conseil de Prud'hommes de ",
        "Tribunal de proximité de ", "Tribunal de Proximité de "
    ]
    for prefix in prefixes:
        if name.startswith(prefix):
            return name[len(prefix):]
    return name

def geocode_city(city_name):
    """Géocode une ville via l'API adresse.data.gouv.fr (gratuit, sans clé)."""
    try:
        params = urllib.parse.urlencode({'q': city_name, 'type': 'municipality', 'limit': 1})
        url = f"https://api-adresse.data.gouv.fr/search/?{params}"
        req = urllib.request.Request(url, headers={'User-Agent': 'JusticeOpenData/1.0'})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            if data.get('features'):
                coords = data['features'][0]['geometry']['coordinates']
                return coords[1], coords[0]  # lat, lng
    except Exception as e:
        print(f"  Erreur géocodage {city_name}: {e}")
    return None, None

def main():
    print("Extraction des juridictions uniques...")
    juridictions = extract_unique_juridictions()
    print(f"  {len(juridictions)} juridictions trouvées")
    
    results = []
    total = len(juridictions)
    
    for i, (name, info) in enumerate(juridictions.items()):
        city = extract_city_from_name(name)
        print(f"  [{i+1}/{total}] Géocodage: {city} ({name})...")
        lat, lng = geocode_city(city)
        
        if lat and lng:
            results.append({
                "name": name,
                "type": info["type"],
                "city": city,
                "lat": lat,
                "lng": lng,
                "communes": info["communes"]
            })
        
        # Respecter le rate-limit de l'API
        time.sleep(0.15)
    
    print(f"\n{len(results)} juridictions géocodées sur {total}")
    
    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"Fichier écrit: {OUTPUT}")

if __name__ == "__main__":
    main()
