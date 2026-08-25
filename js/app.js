/**
 * Application logique (Navigation, Thème, Utilitaires)
 */
document.addEventListener('DOMContentLoaded', () => {
    // Gestion du thème
    const themeToggleBtn = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    
    // Check local storage for theme preference, sinon prefers-color-scheme
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'dark'); // défaut dark pour cohérence actuelle
    if (initialTheme === 'light') {
        htmlElement.classList.remove('dark');
        updateThemeButton(false);
    } else {
        htmlElement.classList.add('dark');
        updateThemeButton(true);
    }
    
    // Toggle theme on click
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const isDark = htmlElement.classList.contains('dark');
            if (isDark) {
                htmlElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
                updateThemeButton(false);
            } else {
                htmlElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
                updateThemeButton(true);
            }
            
            // Dispatch event for charts to redraw with new colors
            window.dispatchEvent(new Event('themeChanged'));
        });
    }
    
    function updateThemeButton(isDark) {
        if (!themeToggleBtn) return;
        themeToggleBtn.setAttribute('aria-label', isDark ? 'Passer en mode clair' : 'Passer en mode sombre');
        if (isDark) {
            themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun" aria-hidden="true"></i> Mode Clair';
        } else {
            themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon" aria-hidden="true"></i> Mode Sombre';
        }
    }

    // Navigation hamburger (mobile)
    const navToggle = document.getElementById('nav-toggle');
    const sidebar = document.querySelector('.sidebar');
    if (navToggle && sidebar) {
        navToggle.addEventListener('click', () => {
            const isOpen = sidebar.classList.toggle('open');
            navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
    }
});

/**
 * Utilitaires globaux pour l'application
 */
const AppUtils = {
    // Récupérer les couleurs du thème actuel
    getThemeColors: () => {
        const isDark = document.documentElement.classList.contains('dark');
        return {
            text: isDark ? '#f8fafc' : '#0f172a',
            textSecondary: isDark ? '#94a3b8' : '#475569',
            grid: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            border: isDark ? '#334155' : '#e2e8f0',
            primary: '#3b82f6',
            accent: '#f59e0b',
            yellow: '#f59e0b',
            red: '#ef4444',
            green: '#10b981'
        };
    },
    
    // Formater les nombres (ex: 1200000 -> 1.2M)
    formatNumber: (num) => {
        if (num == null || isNaN(num)) return '-';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return Number(num).toLocaleString('fr-FR');
    },

    // Setter sécurisé pour textContent
    setText: (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value ?? '-';
    },

    setHTML: (id, html) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
    }
};
