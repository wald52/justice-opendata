/**
 * Configuration et rendu des graphiques Chart.js
 */

// Variables globales pour stocker les instances de graphiques
let charts = {};

// Initialisation des graphiques de la page d'accueil
function initIndexCharts() {
    // Graphique : Évolution de l'activité
    const ctxActivity = document.getElementById('activityChart');
    if (ctxActivity) {
        renderActivityChart(ctxActivity);
    }
    
    // Graphique : Répartition
    const ctxRepartition = document.getElementById('repartitionChart');
    if (ctxRepartition) {
        renderRepartitionChart(ctxRepartition);
    }
    
    // Écouter les changements de thème pour mettre à jour les graphiques
    window.addEventListener('themeChanged', () => {
        if (charts.activity) updateChartColors(charts.activity);
        if (charts.repartition) updateChartColors(charts.repartition);
    });
}

function renderActivityChart(canvas) {
    const colors = AppUtils.getThemeColors();
    
    // Données de démonstration simulées
    const years = ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'];
    const affairesCiviles = [1850000, 1820000, 1800000, 1750000, 1720000, 1400000, 1650000, 1680000, 1700000, 1710000];
    const affairesPenales = [1200000, 1220000, 1230000, 1210000, 1180000, 950000, 1100000, 1120000, 1150000, 1130000];
    
    charts.activity = new Chart(canvas, {
        type: 'line',
        data: {
            labels: years,
            datasets: [
                {
                    label: 'Affaires Civiles',
                    data: affairesCiviles,
                    borderColor: colors.primary,
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Affaires Pénales',
                    data: affairesPenales,
                    borderColor: colors.red,
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: getCommonOptions(colors)
    });
}

function renderRepartitionChart(canvas) {
    const colors = AppUtils.getThemeColors();
    
    charts.repartition = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: ['Civil', 'Pénal', 'Prud\'hommes', 'Commerce', 'Administratif'],
            datasets: [{
                data: [45, 30, 8, 12, 5],
                backgroundColor: [
                    colors.primary,
                    colors.red,
                    colors.accent,
                    '#8b5cf6', // purple
                    '#10b981'  // green
                ],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: colors.textSecondary }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return ' ' + context.label + ': ' + context.raw + '%';
                        }
                    }
                }
            },
            cutout: '70%'
        }
    });
}

// Fonction utilitaire pour les options communes (couleurs qui s'adaptent au thème)
function getCommonOptions(colors) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            legend: {
                position: 'top',
                labels: { color: colors.textSecondary }
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                titleColor: '#fff',
                bodyColor: '#fff',
                padding: 10,
                cornerRadius: 4,
            }
        },
        scales: {
            x: {
                grid: { color: colors.grid, drawBorder: false },
                ticks: { color: colors.textSecondary }
            },
            y: {
                grid: { color: colors.grid, drawBorder: false },
                ticks: {
                    color: colors.textSecondary,
                    callback: function(value) {
                        return AppUtils.formatNumber(value);
                    }
                }
            }
        }
    };
}

// Mettre à jour les couleurs d'un graphique lors du changement de thème
function updateChartColors(chart) {
    const colors = AppUtils.getThemeColors();
    
    if (chart.options.scales) {
        if (chart.options.scales.x) {
            chart.options.scales.x.grid.color = colors.grid;
            chart.options.scales.x.ticks.color = colors.textSecondary;
        }
        if (chart.options.scales.y) {
            chart.options.scales.y.grid.color = colors.grid;
            chart.options.scales.y.ticks.color = colors.textSecondary;
        }
    }
    
    if (chart.options.plugins && chart.options.plugins.legend) {
        chart.options.plugins.legend.labels.color = colors.textSecondary;
    }
    
    chart.update();
}
