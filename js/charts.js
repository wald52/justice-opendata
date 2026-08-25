/**
 * Configuration et rendu des graphiques Chart.js
 */

// Variables globales pour stocker les instances de graphiques
let charts = {};
if (typeof window !== "undefined") window.charts = charts;

// Initialisation des graphiques de la page d'accueil
function initIndexCharts() {
    const fetchJson = (url) => fetch(url).then(r => { if (!r.ok) throw new Error(url + ' ' + r.status); return r.json(); });
    // Charger toutes les données en parallèle
    Promise.all([
        fetchJson('data/activite.json'),
        fetchJson('data/condamnations.json'),
        fetchJson('data/budget.json'),
        fetchJson('data/prisons.json'),
        fetchJson('data/vif.json'),
        fetchJson('data/aide_juridictionnelle.json'),
        fetchJson('data/delais.json'),
        fetchJson('data/civil.json')
    ]).then(([activite, condamnations, budget, prisons, vif, aj, delais, civil]) => {
        
        // Mettre à jour les KPIs - avec fallbacks sécurisés et clés correctes
        AppUtils.setText('idx-affaires', activite.metrics.affaires_nouvelles);
        AppUtils.setHTML('idx-affaires-trend', `<i class="fa-solid fa-arrow-up" aria-hidden="true"></i> Flux annuels`);
        
        AppUtils.setText('idx-condamnations', condamnations.metrics.total_condamnations);
        AppUtils.setHTML('idx-condamnations-trend', condamnations.metrics.trend_condamnations);
        
        AppUtils.setText('idx-budget', budget.metrics.budget_total);
        
        AppUtils.setText('idx-prisons', prisons.metrics.population_detenue);
        AppUtils.setHTML('idx-prisons-trend', (prisons.metrics.densite_carcerale || '') + " densité");
        
        AppUtils.setText('idx-vif', vif.metrics.ordonnances_accordees);
        AppUtils.setHTML('idx-vif-trend', "Accordées / " + vif.metrics.ordonnances_demandees + " dem.");
        
        AppUtils.setText('idx-aj', aj.metrics.total_admissions);
        
        AppUtils.setText('idx-delai', delais.metrics.delai_moyen_civil);
        AppUtils.setText('idx-css', activite.metrics.taux_classement_sans_suite);
        
        // Graphiques
        const ctxActivity = document.getElementById('activityChart');
        if (ctxActivity) {
            renderIndexActivityChart(ctxActivity, activite.flux_annuels);
        }
        
        const ctxRepartition = document.getElementById('repartitionChart');
        if (ctxRepartition) {
            renderIndexRepartitionChart(ctxRepartition);
        }
        
    }).catch(err => console.error("Erreur de chargement du cockpit :", err));
    
    window.addEventListener('themeChanged', () => {
        if (charts.indexActivity) updateChartColors(charts.indexActivity);
        if (charts.indexRepartition) updateChartColors(charts.indexRepartition);
    });
}

function renderIndexActivityChart(canvas, activiteFlux) {
    const colors = AppUtils.getThemeColors();
    if (charts.indexActivity) charts.indexActivity.destroy();
    
    charts.indexActivity = new Chart(canvas, {
        type: 'line',
        data: {
            labels: activiteFlux.labels,
            datasets: [
                {
                    label: 'Affaires Nouvelles (Entrées)',
                    data: activiteFlux.entrees,
                    borderColor: colors.primary,
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Affaires Terminées (Sorties)',
                    data: activiteFlux.sorties,
                    borderColor: colors.green,
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: getCommonOptions(colors)
    });
}

function renderIndexRepartitionChart(canvas) {
    const colors = AppUtils.getThemeColors();
    if (charts.indexRepartition) charts.indexRepartition.destroy();
    
    charts.indexRepartition = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: ['Affaires Civiles', 'Affaires Pénales', 'Contentieux Social', 'Autre'],
            datasets: [{
                data: [55, 30, 10, 5],
                backgroundColor: [colors.primary, colors.red, colors.yellow, colors.border],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { color: colors.textSecondary } }
            },
            cutout: '60%'
        }
    });
}

// Fonction utilitaire pour les options communes (couleurs qui s'adaptent au thème)
function getCommonOptions(colors) {
    const isDark = document.documentElement.classList.contains('dark');
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
                backgroundColor: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255,255,255,0.95)',
                titleColor: isDark ? '#fff' : '#0f172a',
                bodyColor: isDark ? '#fff' : '#0f172a',
                borderColor: colors.border,
                borderWidth: 1,
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

// Initialisation des graphiques de la page Prisons
function initPrisonCharts() {
    const btnRefresh = document.getElementById('refresh-data-btn');
    if(btnRefresh) {
        btnRefresh.addEventListener('click', () => {
            btnRefresh.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Actualisation...';
            setTimeout(() => {
                loadPrisonData();
                btnRefresh.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Actualiser les données';
            }, 800);
        });
    }

    // Charger les données JSON asynchrones
    loadPrisonData();
    
    window.addEventListener('themeChanged', () => {
        if (charts.prisonPop) updateChartColors(charts.prisonPop);
        if (charts.prisonCat) updateChartColors(charts.prisonCat);
    });
}

function loadPrisonData() {
    fetch('data/prisons.json')
        .then(response => { if (!response.ok) throw new Error('HTTP '+response.status); return response.json(); })
        .then(data => {
            // Mise à jour des KPIs
            AppUtils.setText('val-detenus', data.metrics.population_detenue);
            AppUtils.setText('trend-detenus', data.metrics.trend_detenus);
            AppUtils.setText('val-densite', data.metrics.densite_carcerale);
            AppUtils.setText('trend-densite', data.metrics.trend_densite);
            AppUtils.setText('val-amenagements', data.metrics.amenagements);
            
            // Graphiques
            const ctxPop = document.getElementById('prisonPopChart');
            if (ctxPop) renderPrisonPopChart(ctxPop, data.timeseries);
            
            const ctxCat = document.getElementById('prisonCategoryChart');
            if (ctxCat) renderPrisonCategoryChart(ctxCat, data.categories);
        })
        .catch(err => {
            console.error('Erreur lors du chargement des données pénitentiaires:', err);
            AppUtils.setText('val-detenus', 'Erreur');
        });
}

function renderPrisonPopChart(canvas, data) {
    const colors = AppUtils.getThemeColors();
    
    if (charts.prisonPop) charts.prisonPop.destroy();
    
    charts.prisonPop = new Chart(canvas, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Population détenue',
                    data: data.population,
                    borderColor: colors.red,
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Places opérationnelles',
                    data: data.places_operationnelles,
                    borderColor: colors.primary,
                    borderWidth: 2,
                    borderDash: [5, 5],
                    tension: 0.4,
                    fill: false
                }
            ]
        },
        options: getCommonOptions(colors)
    });
}

function renderPrisonCategoryChart(canvas, data) {
    const colors = AppUtils.getThemeColors();
    
    if (charts.prisonCat) charts.prisonCat.destroy();
    
    charts.prisonCat = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: data.labels,
            datasets: [{
                data: data.data,
                backgroundColor: [
                    colors.accent,
                    colors.primary,
                    colors.green,
                    colors.textSecondary
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: colors.textSecondary } }
            },
            cutout: '60%'
        }
    });
}

// Initialisation des graphiques de la page Aide Juridictionnelle
function initAJCharts() {
    const btnRefresh = document.getElementById('refresh-data-btn');
    if(btnRefresh) {
        btnRefresh.addEventListener('click', () => {
            btnRefresh.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Actualisation...';
            setTimeout(() => {
                loadAJData();
                btnRefresh.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Actualiser les données';
            }, 800);
        });
    }

    // Charger les données JSON asynchrones
    loadAJData();
    
    window.addEventListener('themeChanged', () => {
        if (charts.ajAdmissions) updateChartColors(charts.ajAdmissions);
        if (charts.ajRepartition) updateChartColors(charts.ajRepartition);
    });
}

function loadAJData() {
    fetch('data/aide_juridictionnelle.json')
        .then(response => { if (!response.ok) throw new Error('HTTP '+response.status); return response.json(); })
        .then(data => {
            // Mise à jour des KPIs
            AppUtils.setText('val-admissions', data.metrics.total_admissions);
            AppUtils.setText('trend-admissions', data.metrics.trend_admissions);
            AppUtils.setText('val-budget', data.metrics.budget_total);
            AppUtils.setText('trend-budget', data.metrics.trend_budget);
            AppUtils.setText('val-acceptation', data.metrics.taux_acceptation);
            
            // Graphiques
            const ctxAdm = document.getElementById('ajAdmissionsChart');
            if (ctxAdm) renderAJAdmissionsChart(ctxAdm, data.timeseries);
            
            const ctxRep = document.getElementById('ajRepartitionChart');
            if (ctxRep) renderAJRepartitionChart(ctxRep, data.repartition_contentieux);
        })
        .catch(err => {
            console.error('Erreur lors du chargement des données de l\'AJ:', err);
            AppUtils.setText('val-admissions', 'Erreur');
        });
}

function renderAJAdmissionsChart(canvas, data) {
    const colors = AppUtils.getThemeColors();
    
    if (charts.ajAdmissions) charts.ajAdmissions.destroy();
    
    charts.ajAdmissions = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Admissions Totales',
                    data: data.admissions_totales,
                    backgroundColor: colors.primary,
                    borderRadius: 4
                }
            ]
        },
        options: getCommonOptions(colors)
    });
}

function renderAJRepartitionChart(canvas, data) {
    const colors = AppUtils.getThemeColors();
    
    if (charts.ajRepartition) charts.ajRepartition.destroy();
    
    charts.ajRepartition = new Chart(canvas, {
        type: 'pie',
        data: {
            labels: data.labels,
            datasets: [{
                data: data.data,
                backgroundColor: [
                    colors.primary,
                    colors.accent,
                    colors.red,
                    colors.yellow
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { color: colors.textSecondary } }
            }
        }
    });
}

// Initialisation des graphiques de la page Délais de Jugement
function initDelaisCharts() {
    const btnRefresh = document.getElementById('refresh-data-btn');
    if(btnRefresh) {
        btnRefresh.addEventListener('click', () => {
            btnRefresh.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Actualisation...';
            setTimeout(() => {
                loadDelaisData();
                btnRefresh.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Actualiser les données';
            }, 800);
        });
    }

    loadDelaisData();
    
    window.addEventListener('themeChanged', () => {
        if (charts.delaisEvolution) updateChartColors(charts.delaisEvolution);
        if (charts.delaisRepartition) updateChartColors(charts.delaisRepartition);
    });
}

function loadDelaisData() {
    fetch('data/delais.json')
        .then(response => { if (!response.ok) throw new Error('HTTP '+response.status); return response.json(); })
        .then(data => {
            // Mise à jour des KPIs
            AppUtils.setText('val-delai-civil', data.metrics.delai_moyen_civil);
            AppUtils.setText('trend-civil', data.metrics.trend_civil);
            AppUtils.setText('val-delai-penal', data.metrics.delai_moyen_penal);
            AppUtils.setText('trend-penal', data.metrics.trend_penal);
            AppUtils.setText('val-assises', data.metrics.cours_assises);
            
            const ctxEvo = document.getElementById('delaisEvolutionChart');
            if (ctxEvo) renderDelaisEvolutionChart(ctxEvo, data.timeseries);
            
            const ctxRep = document.getElementById('delaisRepartitionChart');
            if (ctxRep) renderDelaisRepartitionChart(ctxRep, data.repartition_instances);
        })
        .catch(err => {
            console.error('Erreur lors du chargement des données de délais:', err);
            AppUtils.setText('val-delai-civil', 'Erreur');
        });
}

function renderDelaisEvolutionChart(canvas, data) {
    const colors = AppUtils.getThemeColors();
    
    if (charts.delaisEvolution) charts.delaisEvolution.destroy();
    
    charts.delaisEvolution = new Chart(canvas, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Civil (mois)',
                    data: data.civil,
                    borderColor: colors.primary,
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Pénal (mois)',
                    data: data.penal,
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

function renderDelaisRepartitionChart(canvas, data) {
    const colors = AppUtils.getThemeColors();
    
    if (charts.delaisRepartition) charts.delaisRepartition.destroy();
    
    charts.delaisRepartition = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Délai moyen (mois)',
                data: data.data,
                backgroundColor: [
                    colors.primary,
                    colors.accent,
                    colors.yellow,
                    colors.green,
                    colors.red,
                    'rgba(239, 68, 68, 0.7)'
                ],
                borderRadius: 4
            }]
        },
        options: {
            ...getCommonOptions(colors),
            indexAxis: 'y',
            plugins: {
                ...getCommonOptions(colors).plugins,
                legend: { display: false }
            }
        }
    });
}

// Initialisation des graphiques de la page Budget
function initBudgetCharts() {
    const btnRefresh = document.getElementById('refresh-data-btn');
    if(btnRefresh) {
        btnRefresh.addEventListener('click', () => {
            btnRefresh.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Actualisation...';
            setTimeout(() => {
                loadBudgetData();
                btnRefresh.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Actualiser les données';
            }, 800);
        });
    }

    loadBudgetData();
    
    window.addEventListener('themeChanged', () => {
        if (charts.budgetEvolution) updateChartColors(charts.budgetEvolution);
        if (charts.budgetRepartition) updateChartColors(charts.budgetRepartition);
    });
}

function loadBudgetData() {
    fetch('data/budget.json')
        .then(response => { if (!response.ok) throw new Error('HTTP '+response.status); return response.json(); })
        .then(data => {
            // Mise à jour des KPIs
            AppUtils.setText('val-budget-total', data.metrics.budget_total);
            AppUtils.setText('trend-budget', data.metrics.trend_budget);
            AppUtils.setText('val-effectifs', data.metrics.effectifs_totaux);
            AppUtils.setText('trend-effectifs', data.metrics.creation_postes + " créations");
            AppUtils.setText('val-budget-prisons', data.metrics.budget_prisons);
            
            const ctxEvo = document.getElementById('budgetEvolutionChart');
            if (ctxEvo) renderBudgetEvolutionChart(ctxEvo, data.timeseries);
            
            const ctxRep = document.getElementById('budgetRepartitionChart');
            if (ctxRep) renderBudgetRepartitionChart(ctxRep, data.repartition_missions);
        })
        .catch(err => {
            console.error('Erreur lors du chargement des données budgétaires:', err);
            AppUtils.setText('val-budget-total', 'Erreur');
        });
}

function renderBudgetEvolutionChart(canvas, data) {
    const colors = AppUtils.getThemeColors();
    
    if (charts.budgetEvolution) charts.budgetEvolution.destroy();
    
    charts.budgetEvolution = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Budget (Milliards €)',
                    data: data.budget,
                    backgroundColor: colors.green,
                    borderRadius: 4
                }
            ]
        },
        options: getCommonOptions(colors)
    });
}

function renderBudgetRepartitionChart(canvas, data) {
    const colors = AppUtils.getThemeColors();
    
    if (charts.budgetRepartition) charts.budgetRepartition.destroy();
    
    charts.budgetRepartition = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: data.labels,
            datasets: [{
                data: data.data,
                backgroundColor: [
                    colors.red,
                    colors.primary,
                    colors.yellow,
                    colors.accent,
                    colors.green
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { color: colors.textSecondary } }
            },
            cutout: '50%'
        }
    });
}

// Initialisation des graphiques de la page Justice Pénale
function initCondamnationsCharts() {
    loadCondamnationsData();
    
    window.addEventListener('themeChanged', () => {
        if (charts.infractions) updateChartColors(charts.infractions);
        if (charts.peinesEvolution) updateChartColors(charts.peinesEvolution);
    });
}

function loadCondamnationsData() {
    fetch('data/condamnations.json')
        .then(response => { if (!response.ok) throw new Error('HTTP '+response.status); return response.json(); })
        .then(data => {
            AppUtils.setText('val-condamnations', data.metrics.total_condamnations);
            AppUtils.setText('trend-condamnations', data.metrics.trend_condamnations);
            AppUtils.setText('val-top-infraction', data.metrics.top_infraction);
            AppUtils.setText('val-alternatives', data.metrics.peines_alternatives);
            
            const ctxInf = document.getElementById('infractionsChart');
            if (ctxInf) renderInfractionsChart(ctxInf, data.repartition_infractions);
            
            const ctxEvo = document.getElementById('peinesEvolutionChart');
            if (ctxEvo) renderPeinesEvolutionChart(ctxEvo, data.evolution_peines);
        })
        .catch(err => {
            console.error('Erreur lors du chargement des données de condamnations:', err);
            AppUtils.setText('val-condamnations', 'Erreur');
        });
}

function renderInfractionsChart(canvas, data) {
    const colors = AppUtils.getThemeColors();
    if (charts.infractions) charts.infractions.destroy();
    
    charts.infractions = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: data.labels,
            datasets: [{
                data: data.data,
                backgroundColor: [
                    colors.red,
                    colors.primary,
                    colors.yellow,
                    colors.accent,
                    colors.green,
                    colors.border
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { color: colors.textSecondary } }
            },
            cutout: '60%'
        }
    });
}

function renderPeinesEvolutionChart(canvas, data) {
    const colors = AppUtils.getThemeColors();
    if (charts.peinesEvolution) charts.peinesEvolution.destroy();
    
    charts.peinesEvolution = new Chart(canvas, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Prison ferme',
                    data: data.ferme,
                    borderColor: colors.red,
                    backgroundColor: colors.red,
                    tension: 0.3,
                    borderWidth: 2
                },
                {
                    label: 'Sursis',
                    data: data.sursis,
                    borderColor: colors.primary,
                    backgroundColor: colors.primary,
                    tension: 0.3,
                    borderWidth: 2
                },
                {
                    label: 'Peines alternatives (TIG, amendes...)',
                    data: data.alternatives,
                    borderColor: colors.green,
                    backgroundColor: colors.green,
                    tension: 0.3,
                    borderWidth: 2
                }
            ]
        },
        options: getCommonOptions(colors)
    });
}

// ==========================================
// JUSTICE CIVILE
// ==========================================
function initCivilCharts() {
    fetch('data/civil.json')
        .then(response => { if (!response.ok) throw new Error('HTTP '+response.status); return response.json(); })
        .then(data => {
            AppUtils.setText('val-total-affaires', data.metrics.total_affaires);
            AppUtils.setText('trend-affaires', data.metrics.trend_affaires);
            AppUtils.setText('val-divorces-amiables', data.metrics.divorces_consentement);
            AppUtils.setText('val-conciliation-cph', data.metrics.taux_conciliation_cph);
            
            const ctxDivorces = document.getElementById('divorcesChart');
            if (ctxDivorces) renderDoughnutChart('civilDivorces', ctxDivorces, data.repartition_divorces);
            
            const ctxTutelles = document.getElementById('tutellesChart');
            if (ctxTutelles) renderLineChart('civilTutelles', ctxTutelles, data.evolution_tutelles, 'Stock de mesures de tutelles');
        })
        .catch(err => console.error('Erreur données civiles:', err));
}

// ==========================================
// FLUX & ACTIVITE
// ==========================================
function initActiviteCharts() {
    fetch('data/activite.json')
        .then(response => { if (!response.ok) throw new Error('HTTP '+response.status); return response.json(); })
        .then(data => {
            AppUtils.setText('val-entrees', data.metrics.affaires_nouvelles);
            AppUtils.setText('val-sorties', data.metrics.affaires_terminees);
            AppUtils.setText('trend-couverture', data.metrics.taux_couverture + " de couverture");
            AppUtils.setText('val-css', data.metrics.taux_classement_sans_suite);
            
            const ctxFlux = document.getElementById('fluxChart');
            if (ctxFlux) renderFluxChart(ctxFlux, data.flux_annuels);
            
            const ctxCss = document.getElementById('cssChart');
            if (ctxCss) renderDoughnutChart('activiteCss', ctxCss, data.motifs_classement);
        })
        .catch(err => console.error('Erreur données activité:', err));
}

function renderFluxChart(canvas, data) {
    const colors = AppUtils.getThemeColors();
    if (charts.activiteFlux) charts.activiteFlux.destroy();
    
    charts.activiteFlux = new Chart(canvas, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Affaires Nouvelles (Entrées)',
                    data: data.entrees,
                    borderColor: colors.red,
                    backgroundColor: colors.red,
                    tension: 0.3
                },
                {
                    label: 'Affaires Terminées (Sorties)',
                    data: data.sorties,
                    borderColor: colors.green,
                    backgroundColor: colors.green,
                    tension: 0.3
                }
            ]
        },
        options: getCommonOptions(colors)
    });
}

// ==========================================
// VIOLENCES INTRAFAMILIALES (VIF)
// ==========================================
function initVifCharts() {
    fetch('data/vif.json')
        .then(response => response.json())
        .then(data => {
            const colors = AppUtils.getThemeColors();
            AppUtils.setText('val-op', data.metrics.ordonnances_accordees);
            AppUtils.setText('trend-op', data.metrics.taux_acceptation + " accordées");
            AppUtils.setText('val-tgd', data.metrics.tgd_deployes);
            AppUtils.setText('val-bar', data.metrics.bar_deployes);
            
            const ctxOp = document.getElementById('opChart');
            if (ctxOp) renderOpChart(ctxOp, data.evolution_op);
            
            const ctxCondamnations = document.getElementById('condamnationsVifChart');
            if (ctxCondamnations) renderLineChart('vifCondamnations', ctxCondamnations, data.condamnations_vif, 'Condamnations pour VIF', colors.primary);
        })
        .catch(err => console.error('Erreur données VIF:', err));
}

function renderOpChart(canvas, data) {
    const colors = AppUtils.getThemeColors();
    if (charts.vifOp) charts.vifOp.destroy();
    
    charts.vifOp = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Demandées',
                    data: data.demandees,
                    backgroundColor: colors.border
                },
                {
                    label: 'Accordées',
                    data: data.accordees,
                    backgroundColor: colors.green
                }
            ]
        },
        options: getCommonOptions(colors)
    });
}

// Utilitaires génériques
function renderDoughnutChart(chartKey, canvas, data) {
    const colors = AppUtils.getThemeColors();
    if (charts[chartKey]) charts[chartKey].destroy();
    
    charts[chartKey] = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: data.labels,
            datasets: [{
                data: data.data,
                backgroundColor: [colors.primary, colors.green, colors.yellow, colors.red, colors.accent, colors.border],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'right', labels: { color: colors.textSecondary } } },
            cutout: '50%'
        }
    });
}

function renderLineChart(chartKey, canvas, data, label, color) {
    const colors = AppUtils.getThemeColors();
    if (charts[chartKey]) charts[chartKey].destroy();
    const activeColor = color || colors.primary;
    
    charts[chartKey] = new Chart(canvas, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: label,
                data: data.data,
                borderColor: activeColor,
                backgroundColor: activeColor,
                tension: 0.3
            }]
        },
        options: getCommonOptions(colors)
    });
}

