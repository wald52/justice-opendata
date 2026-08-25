/**
 * Export CSV / PNG pour les graphiques Chart.js
 */
(function() {
  function download(filename, text, type="text/csv") {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  function chartToCSV(chart) {
    if (!chart || !chart.data) return "";
    const labels = chart.data.labels || [];
    const datasets = chart.data.datasets || [];
    let csv = "Label," + datasets.map(d=>`"${d.label}"`).join(",") + "\n";
    labels.forEach((lab, i) => {
      const row = [lab, ...datasets.map(d=> d.data[i] ?? "")].join(",");
      csv += row + "\n";
    });
    return csv;
  }

  function addExportButtons() {
    document.querySelectorAll("canvas").forEach((canvas) => {
      const container = canvas.closest(".chart-container");
      if (!container || container.querySelector(".export-btn")) return;
      const header = container.querySelector(".chart-header");
      if (!header) return;
      const group = document.createElement("div");
      group.style.display = "flex";
      group.style.gap = "0.5rem";
      group.innerHTML = `
        <button class="btn btn-outline export-btn" data-type="csv" aria-label="Exporter CSV" title="Exporter CSV"><i class="fa-solid fa-file-csv" aria-hidden="true"></i> CSV</button>
        <button class="btn btn-outline export-btn" data-type="png" aria-label="Exporter PNG" title="Exporter PNG"><i class="fa-solid fa-image" aria-hidden="true"></i> PNG</button>
      `;
      header.appendChild(group);
      group.querySelectorAll(".export-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const type = btn.dataset.type;
          const chart = Object.values(window.charts || {}).find(c => c.canvas === canvas);
          // Fallback: trouver par id
          const id = canvas.id;
          const chartInstance = window.charts ? (window.charts[id] || Object.values(window.charts).find(c=> c.canvas && c.canvas.id===id)) : null;
          const ch = chart || chartInstance || Chart.getChart(canvas);
          if (!ch) { alert("Graphique non trouvé"); return; }
          if (type === "csv") {
            const csv = chartToCSV(ch);
            download(`${id || 'chart'}.csv`, csv);
          } else {
            const url = ch.toBase64Image("image/png", 1);
            const a = document.createElement("a");
            a.href = url; a.download = `${id || 'chart'}.png`; a.click();
          }
        });
      });
    });
  }

  // Expose global for manual trigger
  window.addExportButtons = addExportButtons;
  window.chartToCSV = chartToCSV;

  document.addEventListener("DOMContentLoaded", () => {
    // Attendre que les charts soient rendus
    setTimeout(addExportButtons, 1500);
    // Réessayer après chaque init
    window.addEventListener("themeChanged", () => setTimeout(addExportButtons, 100));
  });
})();
