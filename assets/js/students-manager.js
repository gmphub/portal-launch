// assets/js/students-manager.js
class StudentsManager {
    constructor() {
        this.API_BASE = '/api/admin';
        this.students = [];
        this.filtered = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
    }

    async loadStudents() {
        try {
            const url = new URL(`${this.API_BASE}/students`);
            url.searchParams.set('page', this.currentPage);
            url.searchParams.set('limit', this.itemsPerPage);
            
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
            });
            
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            
            this.students = data.students || [];
            this.filtered = [...this.students];
            this.render();
        } catch (err) {
            console.error('Fetch students error:', err);
            this.showNotification('Falha ao carregar alunos', 'error');
        }
    }

    render() {
        this.updateMetrics();
        this.updateTable();
        this.updatePagination();
    }

    // ... (rest of your StudentsManager methods)
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    if (window.securityManager?.isAuthenticated()) {
        window.studentsManager = new StudentsManager();
        window.studentsManager.loadStudents();
    }
});