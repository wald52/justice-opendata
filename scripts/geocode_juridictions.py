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
CACHE_FILE = BASE_DIR / 'data' / 'raw' / '.geocode_cache.json'

def extract_unique_juridictions():
    """Extrait les juridictions uniques et le nombre de communes rattachées."""
    if not RAW_CSV.exists():
        raise FileNotFoundError(f"CSV introuvable : {RAW_CSV} - lancez d'abord fetch_data.py")
    juridictions = defaultdict(lambda: {"type": "", "communes": 0})
    
    with open(RAW_CSV, 'r', encoding='utf-8-sig') as f:
        reader = csv.reader(f, delimiter=';')
        try:
            header = next(reader)
        except StopIteration:
            return juridictions
        
        for row in reader:
            if len(row) < 14:
                continue
            
            # Cour d'Appel (col 4)
            ca_name = row[4].strip()
            if ca_name:
                if not juridictions[ca_name]["type"]:
                    juridictions[ca_name]["type"] = "ca"
                elif juridictions[ca_name]["type"] != "ca":
                    print(f"  Attention: {ca_name} déjà typée {juridictions[ca_name]['type']}, conflit avec ca")
                juridictions[ca_name]["communes"] += 1
            
            # Tribunal Judiciaire (col 7)
            tj_name = row[7].strip()
            if tj_name:
                if not juridictions[tj_name]["type"]:
                    juridictions[tj_name]["type"] = "tj"
                elif juridictions[tj_name]["type"] != "tj":
                    # TJ/CPH peuvent partager même ville mais noms différents normalement
                    pass
                juridictions[tj_name]["communes"] += 1
            
            # Conseil de Prud'hommes (col 13)
            cph_name = row[13].strip()
            if cph_name:
                if not juridictions[cph_name]["type"]:
                    juridictions[cph_name]["type"] = "cph"
                juridictions[cph_name]["communes"] += 1
    
    return juridictions

def extract_city_from_name(name):
    """Extrait le nom de ville depuis le nom de la juridiction."""
    # Normaliser les apostrophes
    normalized = name.replace("’", "'").strip()
    # Liste ordonnée du plus spécifique au plus générique
    prefixes = [
        "Tribunal judiciaire de ", "Tribunal judiciaire d'",
        "Tribunal Judiciaire de ", "Tribunal Judiciaire d'",
        "Tribunal de proximité de ", "Tribunal de proximité d'",
        "Tribunal de Proximité de ", "Tribunal de Proximité d'",
        "Cour d'Appel de ", "Cour d'Appel d'",
        "Cour d'appel de ", "Cour d'appel d'",
        "Conseil de Prud'hommes de ", "Conseil de Prud'hommes d'",
        "Conseil de prud'hommes de ", "Conseil de prud'hommes d'",
    ]
    for prefix in prefixes:
        if normalized.startswith(prefix):
            city = normalized[len(prefix):].strip()
            # Gérer le cas "d'Aurillac" -> prefix "Tribunal judiciaire d'" donne "Aurillac" (ok)
            # Gérer "de La Rochelle" -> "La Rochelle"
            return city
    # Fallback : retirer "de " / "d'" générique
    for generic in [" de ", " d'"]:
        if generic in normalized:
            # Prendre après le dernier " de " ou " d'"
            idx = normalized.rfind(generic)
            if idx != -1:
                return normalized[idx+len(generic):].strip()
    return normalized

def geocode_city(city_name, cache=None):
    """Géocode une ville via l'API adresse.data.gouv.fr (gratuit, sans clé)."""
    if cache is not None and city_name in cache:
        return cache[city_name]
    try:
        params = urllib.parse.urlencode({'q': city_name, 'type': 'municipality', 'limit': 1})
        url = f"https://api-adresse.data.gouv.fr/search/?{params}"
        req = urllib.request.Request(url, headers={'User-Agent': 'JusticeOpenData/1.0'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            if data.get('features'):
                coords = data['features'][0]['geometry']['coordinates']
                lat, lng = coords[1], coords[0]  # lat, lng
                # Validation France métropole approx
                if -5 < lng < 10 and 41 < lat < 52:
                    if cache is not None:
                        cache[city_name] = (lat, lng)
                    return lat, lng
                else:
                    print(f"  Coords hors France pour {city_name}: {lat},{lng}")
    except Exception as e:
        print(f"  Erreur géocodage {city_name}: {e}")
    if cache is not None:
        cache[city_name] = (None, None)
    return None, None

def main(limit=None):
    print("Extraction des juridictions uniques...")
    juridictions = extract_unique_juridictions()
    print(f"  {len(juridictions)} juridictions trouvées")
    
    # Charger cache
    cache = {}
    if CACHE_FILE.exists():
        try:
            raw_cache = json.loads(CACHE_FILE.read_text(encoding='utf-8'))
            # convertir list -> tuple
            cache = {k: tuple(v) if isinstance(v, list) else v for k, v in raw_cache.items()}
        except: 
            cache = {}

    results = []
    total = len(juridictions)
    if limit:
        juridictions = dict(list(juridictions.items())[:limit])
        total = len(juridictions)
    
    for i, (name, info) in enumerate(juridictions.items()):
        city = extract_city_from_name(name)
        print(f"  [{i+1}/{total}] Géocodage: {city} ({name})...")
        lat, lng = geocode_city(city, cache)
        
        if lat and lng:
            results.append({
                "name": name,
                "type": info["type"],
                "city": city,
                "lat": lat,
                "lng": lng,
                "communes": info["communes"]
            })
        else:
            print(f"    -> échec géocodage pour {city}, ignorée")
        
        # Respecter le rate-limit de l'API (~50 req/s max, on vise ~6 req/s)
        time.sleep(0.15)
    
    print(f"\n{len(results)} juridictions géocodées sur {total}")
    
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    # Sauver cache
    try:
        # convertir tuples -> listes pour json
        json_cache = {k: list(v) if isinstance(v, (tuple, list)) else v for k, v in cache.items()}
        CACHE_FILE.write_text(json.dumps(json_cache, ensure_ascii=False, indent=2), encoding='utf-8')
    except Exception as e:
        print(f"Impossible de sauver le cache: {e}")
    
    print(f"Fichier écrit: {OUTPUT}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Géocode les juridictions")
    parser.add_argument("--limit", type=int, help="Limiter le nombre de juridictions (debug)")
    args = parser.parse_args()
    main(limit=args.limit)
