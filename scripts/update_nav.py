import glob
import os
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
files = glob.glob(str(BASE_DIR / "*.html"))

for f in files:
    if "delais.html" in f:
        continue
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Trouver le bloc <ul class="nav-links">...</ul>
    start_idx = content.find('<ul class="nav-links">')
    end_idx = content.find('</ul>', start_idx)
    
    if start_idx != -1 and end_idx != -1:
        # Déterminer la page active
        import os
        filename = os.path.basename(f)
        
        nav_html = f"""<ul class="nav-links">
                <li{" class='active'" if filename == "index.html" else ""}><a href="index.html"><i class="fa-solid fa-chart-pie"></i> Vue d'ensemble</a></li>
                <li{" class='active'" if filename == "activite.html" else ""}><a href="activite.html"><i class="fa-solid fa-chart-line"></i> Flux & Activité</a></li>
                <li{" class='active'" if filename == "penal.html" else ""}><a href="penal.html"><i class="fa-solid fa-gavel"></i> Justice Pénale</a></li>
                <li{" class='active'" if filename == "civil.html" else ""}><a href="civil.html"><i class="fa-solid fa-users"></i> Justice Civile</a></li>
                <li{" class='active'" if filename == "vif.html" else ""}><a href="vif.html"><i class="fa-solid fa-house-chimney-crack"></i> Violences Intrafamiliales</a></li>
                <li{" class='active'" if filename == "prisons.html" else ""}><a href="prisons.html"><i class="fa-solid fa-building-shield"></i> Prisons</a></li>
                <li{" class='active'" if filename == "aide-juridictionnelle.html" else ""}><a href="aide-juridictionnelle.html"><i class="fa-solid fa-hand-holding-dollar"></i> Aide Juridictionnelle</a></li>
                <li{" class='active'" if filename == "delais.html" else ""}><a href="delais.html"><i class="fa-solid fa-hourglass-half"></i> Délais de Jugement</a></li>
                <li{" class='active'" if filename == "budget.html" else ""}><a href="budget.html"><i class="fa-solid fa-sack-dollar"></i> Budget & Moyens</a></li>
                <li{" class='active'" if filename == "carte.html" else ""}><a href="carte.html"><i class="fa-solid fa-map-location-dot"></i> Carte Judiciaire</a></li>
                <li{" class='active'" if filename == "explorer.html" else ""}><a href="explorer.html"><i class="fa-solid fa-magnifying-glass-chart"></i> Explorateur</a></li>
            </ul>"""
        
        new_content = content[:start_idx] + nav_html + content[end_idx+5:]
        
        if content != new_content:
            with open(f, 'w', encoding='utf-8') as file:
                file.write(new_content)
            print(f"Updated {f}")
