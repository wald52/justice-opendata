/**
 * Filtres génériques - année et période
 * Injecte un sélecteur de période si présent et filtre les datasets
 */
(function() {
  const FILTERS = {
    "activite.html": { id: "fluxChart", key: "flux_annuels" },
    "penal.html": { id: "peinesEvolutionChart", key: "evolution_peines" },
    "civil.html": { id: "tutellesChart", key: "evolution_tutelles" },
    "vif.html": { id: "opChart", key: "evolution_op" },
    "prisons.html": { id: "prisonPopChart", key: "timeseries" },
    "budget.html": { id: "budgetEvolutionChart", key: "timeseries" },
    "delais.html": { id: "delaisEvolutionChart", key: "timeseries" },
    "aide-juridictionnelle.html": { id: "ajAdmissionsChart", key: "timeseries" },
  };

  function getPage() {
    return location.pathname.split("/").pop() || "index.html";
  }

  function injectFilter() {
    const page = getPage();
    if (!FILTERS[page] && page !== "index.html") return;
    // Ne pas dupliquer
    if (document.getElementById("year-filter")) return;
    const topbar = document.querySelector(".topbar");
    if (!topbar) return;
    const wrapper = document.createElement("div");
    wrapper.className = "filter-wrapper";
    wrapper.style.display = "flex";
    wrapper.style.gap = "0.5rem";
    wrapper.style.alignItems = "center";
    wrapper.innerHTML = `
      <label for="year-filter" style="font-size:0.875rem;color:var(--text-secondary)">Période:</label>
      <select id="year-filter" class="select-styled" aria-label="Filtrer par période">
        <option value="all">Tout</option>
        <option value="3">3 dernières années</option>
        <option value="5">5 dernières années</option>
      </select>
    `;
    topbar.appendChild(wrapper);
    document.getElementById("year-filter").addEventListener("change", (e) => {
      const val = e.target.value;
      // Dispatch custom event que les charts peuvent écouter
      window.dispatchEvent(new CustomEvent("filterChanged", { detail: { period: val } }));
    });
  }

  // Écoute globale : les pages peuvent réagir
  window.addEventListener("filterChanged", (e) => {
    const period = e.detail.period;
    // Pour les charts, on ajuste l'affichage via CSS ou en re-rendant si possible
    // Ici on stocke la préférence et on log
    console.log("Filtre période:", period);
    // Les fonctions de rendu peuvent lire window.__filterPeriod
    window.__filterPeriod = period;
    // Déclencher un refresh si bouton présent
    const btn = document.getElementById("refresh-data-btn");
    if (btn) {
      // Optionnel: recharger données filtrées côté JS (non destructif)
    }
  });

  document.addEventListener("DOMContentLoaded", injectFilter);
})();
