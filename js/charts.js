/**
 * Configuration et rendu des graphiques Chart.js
 */

// Variables globales pour stocker les instances de graphiques
let charts = {};

// Initialisation des graphiques de la page d'accueil
function initIndexCharts() {
    // Charger toutes les données en parallèle
    Promise.all([
        fetch('data/activite.json').then(res => res.json()),
        fetch('data/condamnations.json').then(res => res.json()),
        fetch('data/budget.json').then(res => res.json()),
        fetch('data/prisons.json').then(res => res.json()),
        fetch('data/vif.json').then(res => res.json()),
        fetch('data/aide_juridictionnelle.json').then(res => res.json()),
        fetch('data/delais.json').then(res => res.json()),
        fetch('data/civil.json').then(res => res.json())
    ]).then(([activite, condamnations, budget, prisons, vif, aj, delais, civil]) => {
        
        // Mettre à jour les KPIs
        document.getElementById('idx-affaires').textContent = activite.metrics.affaires_nouvelles;
        document.getElementById('idx-affaires-trend').innerHTML = `<i class="fa-solid fa-arrow-up"></i> Flux annuels`;
        
        document.getElementById('idx-condamnations').textContent = condamnations.metrics.total_condamnations;
        document.getElementById('idx-condamnations-trend').innerHTML = condamnations.metrics.trend_condamnations;
        
        document.getElementById('idx-budget').textContent = budget.metrics.total_budget;
        
        document.getElementById('idx-prisons').textContent = prisons.metrics.population_totale;
        document.getElementById('idx-prisons-trend').innerHTML = prisons.metrics.densite_globale + " densité";
        
        document.getElementById('idx-vif').textContent = vif.metrics.ordonnances_accordees;
        document.getElementById('idx-vif-trend').innerHTML = "Accordées / " + vif.metrics.ordonnances_demandees + " dem.";
        
        document.getElementById('idx-aj').textContent = aj.metrics.total_beneficiaires;
        
        document.getElementById('idx-delai').textContent = delais.metrics.delai_moyen_tj;
        document.getElementById('idx-css').textContent = activite.metrics.taux_classement_sans_suite;
        
        // Graphiques
        const ctxActivity = document.getElementById('activityChart');
        if (ctxActivity) {
            renderIndexActivityChart(ctxActivity, activite.flux_annuels, civil.evolution_tutelles);
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

function renderIndexActivityChart(canvas, activiteFlux, civilTutelles) {
    const colors = AppUtils.getThemeColors();
    if (charts.indexActivity) charts.indexActivity.destroy();
    
    charts.indexActivity = new Chart(canvas, {
        type: 'line',
        data: {
            labels: activiteFlux.labels,
            datasets: [
                {
                    label: 'Affaires Nouvelles (Global)',
                    data: activiteFlux.entrees,
                    borderColor: colors.primary,
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Mesures de Tutelles (Stock)',
                    data: civilTutelles.data.slice(-5),
                    borderColor: colors.accent,
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
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
        .then(response => response.json())
        .then(data => {
            // Mise à jour des KPIs
            document.getElementById('val-detenus').textContent = data.metrics.population_detenue;
            document.getElementById('trend-detenus').textContent = data.metrics.trend_detenus;
            document.getElementById('val-densite').textContent = data.metrics.densite_carcerale;
            document.getElementById('trend-densite').textContent = data.metrics.trend_densite;
            document.getElementById('val-amenagements').textContent = data.metrics.amenagements;
            
            // Graphiques
            const ctxPop = document.getElementById('prisonPopChart');
            if (ctxPop) renderPrisonPopChart(ctxPop, data.timeseries);
            
            const ctxCat = document.getElementById('prisonCategoryChart');
            if (ctxCat) renderPrisonCategoryChart(ctxCat, data.categories);
        })
        .catch(err => {
            console.error('Erreur lors du chargement des données pénitentiaires:', err);
            document.getElementById('val-detenus').textContent = 'Erreur';
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
        .then(response => response.json())
        .then(data => {
            // Mise à jour des KPIs
            document.getElementById('val-admissions').textContent = data.metrics.total_admissions;
            document.getElementById('trend-admissions').textContent = data.metrics.trend_admissions;
            document.getElementById('val-budget').textContent = data.metrics.budget_total;
            document.getElementById('trend-budget').textContent = data.metrics.trend_budget;
            document.getElementById('val-acceptation').textContent = data.metrics.taux_acceptation;
            
            // Graphiques
            const ctxAdm = document.getElementById('ajAdmissionsChart');
            if (ctxAdm) renderAJAdmissionsChart(ctxAdm, data.timeseries);
            
            const ctxRep = document.getElementById('ajRepartitionChart');
            if (ctxRep) renderAJRepartitionChart(ctxRep, data.repartition_contentieux);
        })
        .catch(err => {
            console.error('Erreur lors du chargement des données de l\'AJ:', err);
            document.getElementById('val-admissions').textContent = 'Erreur';
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
        .then(response => response.json())
        .then(data => {
            // Mise à jour des KPIs
            document.getElementById('val-delai-civil').textContent = data.metrics.delai_moyen_civil;
            document.getElementById('trend-civil').textContent = data.metrics.trend_civil;
            document.getElementById('val-delai-penal').textContent = data.metrics.delai_moyen_penal;
            document.getElementById('trend-penal').textContent = data.metrics.trend_penal;
            document.getElementById('val-assises').textContent = data.metrics.cours_assises;
            
            const ctxEvo = document.getElementById('delaisEvolutionChart');
            if (ctxEvo) renderDelaisEvolutionChart(ctxEvo, data.timeseries);
            
            const ctxRep = document.getElementById('delaisRepartitionChart');
            if (ctxRep) renderDelaisRepartitionChart(ctxRep, data.repartition_instances);
        })
        .catch(err => {
            console.error('Erreur lors du chargement des données de délais:', err);
            document.getElementById('val-delai-civil').textContent = 'Erreur';
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
        .then(response => response.json())
        .then(data => {
            // Mise à jour des KPIs
            document.getElementById('val-budget-total').textContent = data.metrics.budget_total;
            document.getElementById('trend-budget').textContent = data.metrics.trend_budget;
            document.getElementById('val-effectifs').textContent = data.metrics.effectifs_totaux;
            document.getElementById('trend-effectifs').textContent = data.metrics.creation_postes + " créations";
            document.getElementById('val-budget-prisons').textContent = data.metrics.budget_prisons;
            
            const ctxEvo = document.getElementById('budgetEvolutionChart');
            if (ctxEvo) renderBudgetEvolutionChart(ctxEvo, data.timeseries);
            
            const ctxRep = document.getElementById('budgetRepartitionChart');
            if (ctxRep) renderBudgetRepartitionChart(ctxRep, data.repartition_missions);
        })
        .catch(err => {
            console.error('Erreur lors du chargement des données budgétaires:', err);
            document.getElementById('val-budget-total').textContent = 'Erreur';
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
        .then(response => response.json())
        .then(data => {
            document.getElementById('val-condamnations').textContent = data.metrics.total_condamnations;
            document.getElementById('trend-condamnations').textContent = data.metrics.trend_condamnations;
            document.getElementById('val-top-infraction').textContent = data.metrics.top_infraction;
            document.getElementById('val-alternatives').textContent = data.metrics.peines_alternatives;
            
            const ctxInf = document.getElementById('infractionsChart');
            if (ctxInf) renderInfractionsChart(ctxInf, data.repartition_infractions);
            
            const ctxEvo = document.getElementById('peinesEvolutionChart');
            if (ctxEvo) renderPeinesEvolutionChart(ctxEvo, data.evolution_peines);
        })
        .catch(err => {
            console.error('Erreur lors du chargement des données de condamnations:', err);
            document.getElementById('val-condamnations').textContent = 'Erreur';
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
        .then(response => response.json())
        .then(data => {
            document.getElementById('val-total-affaires').textContent = data.metrics.total_affaires;
            document.getElementById('trend-affaires').textContent = data.metrics.trend_affaires;
            document.getElementById('val-divorces-amiables').textContent = data.metrics.divorces_consentement;
            document.getElementById('val-conciliation-cph').textContent = data.metrics.taux_conciliation_cph;
            
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
        .then(response => response.json())
        .then(data => {
            document.getElementById('val-entrees').textContent = data.metrics.affaires_nouvelles;
            document.getElementById('val-sorties').textContent = data.metrics.affaires_terminees;
            document.getElementById('trend-couverture').textContent = data.metrics.taux_couverture + " de couverture";
            document.getElementById('val-css').textContent = data.metrics.taux_classement_sans_suite;
            
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
            document.getElementById('val-op').textContent = data.metrics.ordonnances_accordees;
            document.getElementById('trend-op').textContent = data.metrics.taux_acceptation + " accordées";
            document.getElementById('val-tgd').textContent = data.metrics.tgd_deployes;
            document.getElementById('val-bar').textContent = data.metrics.bar_deployes;
            
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

