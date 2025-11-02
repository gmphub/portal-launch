/**
 * Students Page Initialization
 * Connects students.html with StudentsManager class
 */

// Initialize Security Manager
const GMP_Security = new SecurityManager();

// Initialize Students Manager when DOM is ready
let studentsManager;

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!GMP_Security.isAuthenticated()) {
        window.location.href = '../login.html';
        return;
    }
    
    // Initialize students manager
    studentsManager = new StudentsManager();
    
    // Setup button event listeners
    setupButtonListeners();
    setupNavigationScroll();
    setupMoreDropdown();
    addAnimationStyles();
});

function setupButtonListeners() {
    // Header buttons
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => studentsManager.exportStudentsList());
    }
    
    const importBtn = document.getElementById('importBtn');
    if (importBtn) {
        importBtn.addEventListener('click', () => studentsManager.importUsers());
    }
    
    const segmentBtn = document.getElementById('segmentBtn');
    if (segmentBtn) {
        segmentBtn.addEventListener('click', () => studentsManager.createSegmentation());
    }
    
    const newStudentBtn = document.getElementById('newStudentBtn');
    if (newStudentBtn) {
        newStudentBtn.addEventListener('click', () => studentsManager.showAddStudentModal());
    }
    
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => studentsManager.openSettings());
    }
    
    // Search and filter
    const searchInput = document.querySelector('input[placeholder="Buscar alunos..."]');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                studentsManager.searchTerm = searchInput.value;
                studentsManager.currentPage = 1;
                studentsManager.loadStudents();
            }, 300);
        });
    }
    
    const filterSelects = document.querySelectorAll('select.form-control');
    filterSelects.forEach((select, index) => {
        select.addEventListener('change', () => {
            if (index === 0) studentsManager.statusFilter = select.value;
            if (index === 1) studentsManager.engagementFilter = select.value;
            studentsManager.currentPage = 1;
            studentsManager.loadStudents();
        });
    });
    
    const filterBtn = document.querySelector('.btn-modern.btn-modern-primary:has(.fa-filter)');
    if (filterBtn) {
        filterBtn.addEventListener('click', () => {
            studentsManager.currentPage = 1;
            studentsManager.loadStudents();
        });
    }
    
    // Action card buttons
    const actionCards = document.querySelectorAll('.card-horizontal .btn-modern');
    actionCards.forEach(btn => {
        const card = btn.closest('.card-horizontal');
        if (card) {
            if (card.querySelector('.fa-search')) {
                btn.addEventListener('click', () => {
                    document.querySelector('input[placeholder="Buscar alunos..."]')?.focus();
                });
            } else if (card.querySelector('.fa-chart-pie')) {
                btn.addEventListener('click', () => {
                    window.location.href = 'analytics.html';
                });
            } else if (card.querySelector('.fa-envelope')) {
                btn.addEventListener('click', () => studentsManager.showBulkMessageModal());
            }
        }
    });
}

function setupNavigationScroll() {
    const navContainer = document.querySelector('.admin-nav-tabs-container');
    const leftFade = document.querySelector('.scroll-fade-left');
    const rightFade = document.querySelector('.scroll-fade-right');

    if (navContainer && leftFade && rightFade) {
        function updateFades() {
            const scrollLeft = navContainer.scrollLeft;
            const maxScroll = navContainer.scrollWidth - navContainer.clientWidth;

            leftFade.style.opacity = scrollLeft > 10 ? '1' : '0';
            rightFade.style.opacity = scrollLeft < maxScroll - 10 ? '1' : '0';
        }

        updateFades();
        navContainer.addEventListener('scroll', updateFades);

        navContainer.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                navContainer.scrollBy({ left: -100, behavior: 'smooth' });
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                navContainer.scrollBy({ left: 100, behavior: 'smooth' });
            }
        });
    }
}

function setupMoreDropdown() {
    const moreBtn = document.getElementById('moreDropdown');
    const moreMenu = document.getElementById('moreDropdownMenu');

    if (moreBtn && moreMenu) {
        let isOpen = false;

        moreBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            isOpen = !isOpen;
            moreMenu.style.display = isOpen ? 'block' : 'none';

            const chevron = moreBtn.querySelector('.fa-chevron-down');
            if (chevron) {
                chevron.style.transform = isOpen ? 'rotate(180deg)' : 'rotate(0deg)';
            }
        });

        document.addEventListener('click', function(e) {
            if (!moreBtn.contains(e.target) && !moreMenu.contains(e.target)) {
                isOpen = false;
                moreMenu.style.display = 'none';
                const chevron = moreBtn.querySelector('.fa-chevron-down');
                if (chevron) {
                    chevron.style.transform = 'rotate(0deg)';
                }
            }
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && isOpen) {
                isOpen = false;
                moreMenu.style.display = 'none';
                const chevron = moreBtn.querySelector('.fa-chevron-down');
                if (chevron) {
                    chevron.style.transform = 'rotate(0deg)';
                }
                moreBtn.focus();
            }
        });
    }
}

function addAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}
