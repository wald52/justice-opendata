import glob
import os
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
files = glob.glob(str(BASE_DIR / "*.html"))

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Trouver le bloc <ul class="nav-links">...</ul>
    start_idx = content.find('<ul class="nav-links">')
    end_idx = content.find('</ul>', start_idx)
    
    if start_idx != -1 and end_idx != -1:
        # Déterminer la page active
        filename = os.path.basename(f)
        def active(page):
            return ' class="active" aria-current="page"' if filename == page else ''
        
        nav_html = f"""<ul class="nav-links" id="nav-links">
                <li{active("index.html")}><a href="index.html"><i class="fa-solid fa-chart-pie" aria-hidden="true"></i> Vue d'ensemble</a></li>
                <li{active("activite.html")}><a href="activite.html"><i class="fa-solid fa-chart-line" aria-hidden="true"></i> Flux & Activité</a></li>
                <li{active("penal.html")}><a href="penal.html"><i class="fa-solid fa-gavel" aria-hidden="true"></i> Justice Pénale</a></li>
                <li{active("civil.html")}><a href="civil.html"><i class="fa-solid fa-users" aria-hidden="true"></i> Justice Civile</a></li>
                <li{active("vif.html")}><a href="vif.html"><i class="fa-solid fa-house-chimney-crack" aria-hidden="true"></i> Violences Intrafamiliales</a></li>
                <li{active("prisons.html")}><a href="prisons.html"><i class="fa-solid fa-building-shield" aria-hidden="true"></i> Prisons</a></li>
                <li{active("aide-juridictionnelle.html")}><a href="aide-juridictionnelle.html"><i class="fa-solid fa-hand-holding-dollar" aria-hidden="true"></i> Aide Juridictionnelle</a></li>
                <li{active("delais.html")}><a href="delais.html"><i class="fa-solid fa-hourglass-half" aria-hidden="true"></i> Délais de Jugement</a></li>
                <li{active("budget.html")}><a href="budget.html"><i class="fa-solid fa-sack-dollar" aria-hidden="true"></i> Budget & Moyens</a></li>
                <li{active("carte.html")}><a href="carte.html"><i class="fa-solid fa-map-location-dot" aria-hidden="true"></i> Carte Judiciaire</a></li>
                <li{active("explorer.html")}><a href="explorer.html"><i class="fa-solid fa-magnifying-glass-chart" aria-hidden="true"></i> Explorateur</a></li>
            </ul>"""
        
        new_content = content[:start_idx] + nav_html + content[end_idx+5:]
        
        if content != new_content:
            with open(f, 'w', encoding='utf-8') as file:
                file.write(new_content)
            print(f"Updated {f}")
