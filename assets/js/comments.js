/**
 * Comments Management Module
 * Gestão completa de comentários e avaliações
 */

class CommentsManager {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 10;
        this.searchTerm = '';
        this.statusFilter = 'all';
        this.courseFilter = 'all';
        this.comments = [];
        this.stats = {};
        this.courses = [];
        this.init();
    }

    async init() {
        try {
            await this.loadStats();
            await this.loadCourses();
            await this.loadComments();
            this.setupEventListeners();
            this.setupSearchAndFilters();
        } catch (error) {
            console.error('Erro ao inicializar CommentsManager:', error);
            this.showError('Erro ao carregar dados de comentários');
        }
    }

    async loadStats() {
        try {
            const response = await fetch('/api/admin/comments/stats', {
                headers: GMP_Security.getAuthHeaders()
            });
            const data = await response.json();
            
            if (data.success) {
                this.stats = data.stats;
                this.renderStats();
            }
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        }
    }

    async loadCourses() {
        try {
            const response = await fetch('/api/admin/products', {
                headers: GMP_Security.getAuthHeaders()
            });
            const data = await response.json();
            
            if (data.success) {
                this.courses = data.products;
                this.populateCourseFilter();
            }
        } catch (error) {
            console.error('Erro ao carregar cursos:', error);
        }
    }

    async loadComments() {
        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.pageSize,
                status: this.statusFilter,
                courseId: this.courseFilter !== 'all' ? this.courseFilter : ''
            });

            if (this.searchTerm) {
                params.append('search', this.searchTerm);
            }

            const response = await fetch(`/api/admin/comments?${params}`, {
                headers: GMP_Security.getAuthHeaders()
            });
            const data = await response.json();
            
            if (data.success) {
                this.comments = data.comments;
                this.pagination = data.pagination;
                this.renderComments();
                this.renderPagination();
            }
        } catch (error) {
            console.error('Erro ao carregar comentários:', error);
            this.showError('Erro ao carregar lista de comentários');
        }
    }

    renderStats() {
        const statsContainer = document.getElementById('statsContainer');
        if (!statsContainer) return;

        statsContainer.innerHTML = `
            <div class="modern-metric-card">
                <div class="metric-header">
                    <div class="metric-icon"><i class="fas fa-comments"></i></div>
                </div>
                <div class="metric-value">${this.stats.total || 0}</div>
                <div class="metric-label">Total de Comentários</div>
            </div>
            <div class="modern-metric-card">
                <div class="metric-header">
                    <div class="metric-icon"><i class="fas fa-check-circle"></i></div>
                </div>
                <div class="metric-value">${this.stats.approved || 0}</div>
                <div class="metric-label">Comentários Aprovados</div>
            </div>
            <div class="modern-metric-card">
                <div class="metric-header">
                    <div class="metric-icon"><i class="fas fa-star"></i></div>
                </div>
                <div class="metric-value">${this.stats.avgRating || 0}</div>
                <div class="metric-label">Avaliação Média</div>
            </div>
            <div class="modern-metric-card">
                <div class="metric-header">
                    <div class="metric-icon"><i class="fas fa-users"></i></div>
                </div>
                <div class="metric-value">${this.stats.uniqueUsers || 0}</div>
                <div class="metric-label">Usuários Únicos</div>
            </div>
        `;
    }

    renderComments() {
        const commentsContainer = document.getElementById('commentsContainer');
        if (!commentsContainer) return;

        if (this.comments.length === 0) {
            commentsContainer.innerHTML = `
                <div class="text-center" style="padding: 3rem;">
                    <i class="fas fa-comments" style="font-size: 4rem; color: var(--text-secondary); margin-bottom: 1rem;"></i>
                    <h3 style="color: var(--text-secondary); margin-bottom: 0.5rem;">Nenhum comentário encontrado</h3>
                    <p style="color: var(--text-secondary);">Tente ajustar os filtros.</p>
                </div>
            `;
            return;
        }

        commentsContainer.innerHTML = this.comments.map(comment => `
            <div class="card shadow-hover mb-3">
                <div class="card-body">
                    <div class="d-flex justify-content-between">
                        <div>
                            <h5 class="card-title mb-1">${comment.userName || 'Usuário anônimo'}</h5>
                            <h6 class="card-subtitle mb-2 text-muted">${comment.courseTitle || 'Curso não identificado'}</h6>
                        </div>
                        <div class="text-end">
                            <div class="rating-stars mb-1">
                                ${this.renderRatingStars(comment.rating)}
                            </div>
                            <small class="text-muted">${new Date(comment.createdAt).toLocaleDateString('pt-BR')}</small>
                        </div>
                    </div>
                    <p class="card-text mt-2">${comment.content}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <span class="badge ${comment.isApproved ? 'badge-success' : 'badge-warning'}">
                                ${comment.isApproved ? 'Aprovado' : 'Pendente'}
                            </span>
                        </div>
                        <div>
                            ${
                                comment.isApproved ? 
                                `<button class="btn btn-sm btn-outline-warning me-2" onclick="commentsManager.rejectComment('${comment.id}')">
                                    <i class="fas fa-times"></i> Rejeitar
                                </button>` :
                                `<button class="btn btn-sm btn-outline-success me-2" onclick="commentsManager.approveComment('${comment.id}')">
                                    <i class="fas fa-check"></i> Aprovar
                                </button>`
                            }
                            <button class="btn btn-sm btn-outline-danger" onclick="commentsManager.deleteComment('${comment.id}')">
                                <i class="fas fa-trash"></i> Excluir
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderRatingStars(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                stars += '<i class="fas fa-star text-warning"></i>';
            } else {
                stars += '<i class="far fa-star text-warning"></i>';
            }
        }
        return stars;
    }

    populateCourseFilter() {
        const courseFilter = document.getElementById('courseFilter');
        if (!courseFilter) return;

        courseFilter.innerHTML = `
            <option value="all">Todos os cursos</option>
            ${this.courses.map(course => `
                <option value="${course.id}">${course.title}</option>
            `).join('')}
        `;
    }

    renderPagination() {
        const paginationContainer = document.getElementById('paginationContainer');
        if (!paginationContainer || !this.pagination) return;

        const { page, pages, total } = this.pagination;
        
        let paginationHTML = `
            <li class="page-item ${page === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="commentsManager.goToPage(${page - 1})">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
        `;

        // Show first page
        if (page > 2) {
            paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="commentsManager.goToPage(1)">1</a></li>`;
            if (page > 3) {
                paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }

        // Show pages around current
        for (let i = Math.max(1, page - 1); i <= Math.min(pages, page + 1); i++) {
            paginationHTML += `
                <li class="page-item ${i === page ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="commentsManager.goToPage(${i})">${i}</a>
                </li>
            `;
        }

        // Show last page
        if (page < pages - 1) {
            if (page < pages - 2) {
                paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
            paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="commentsManager.goToPage(${pages})">${pages}</a></li>`;
        }

        paginationHTML += `
            <li class="page-item ${page === pages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="commentsManager.goToPage(${page + 1})">
                    <i class="fas fa-chevron-right"></i>
                </a>
            </li>
        `;

        paginationContainer.innerHTML = paginationHTML;

        // Update pagination info
        const paginationInfo = document.getElementById('paginationInfo');
        if (paginationInfo) {
            const start = (page - 1) * this.pageSize + 1;
            const end = Math.min(page * this.pageSize, total);
            paginationInfo.innerHTML = `Mostrando ${start}-${end} de ${total} comentários`;
        }
    }

    goToPage(page) {
        if (page < 1 || page > this.pagination.pages) return;
        this.currentPage = page;
        this.loadComments();
    }

    setupEventListeners() {
        // Nothing specific for now
    }

    setupSearchAndFilters() {
        // Busca principal
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.searchTerm = e.target.value;
                    this.currentPage = 1;
                    this.loadComments();
                }, 500);
            });
        }

        // Filtro de status
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.statusFilter = e.target.value;
                this.currentPage = 1;
                this.loadComments();
            });
        }

        // Filtro de curso
        const courseFilter = document.getElementById('courseFilter');
        if (courseFilter) {
            courseFilter.addEventListener('change', (e) => {
                this.courseFilter = e.target.value;
                this.currentPage = 1;
                this.loadComments();
            });
        }

        // Botão filtrar
        const filterBtn = document.querySelector('button:has(.fa-filter), button[onclick*="loadComments"]');
        if (filterBtn) {
            filterBtn.addEventListener('click', () => {
                this.currentPage = 1;
                this.loadComments();
            });
        }
    }

    async approveComment(commentId) {
        try {
            const response = await fetch(`/api/admin/comments/${commentId}/approve`, {
                method: 'PUT',
                headers: GMP_Security.getAuthHeaders()
            });

            const data = await response.json();

            if (data.success) {
                this.showSuccess('Comentário aprovado com sucesso!');
                this.loadComments();
                this.loadStats();
            } else {
                this.showError(data.error || 'Erro ao aprovar comentário');
            }
        } catch (error) {
            console.error('Erro ao aprovar comentário:', error);
            this.showError('Erro ao aprovar comentário');
        }
    }

    async rejectComment(commentId) {
        try {
            const response = await fetch(`/api/admin/comments/${commentId}/reject`, {
                method: 'PUT',
                headers: GMP_Security.getAuthHeaders()
            });

            const data = await response.json();

            if (data.success) {
                this.showSuccess('Comentário rejeitado com sucesso!');
                this.loadComments();
                this.loadStats();
            } else {
                this.showError(data.error || 'Erro ao rejeitar comentário');
            }
        } catch (error) {
            console.error('Erro ao rejeitar comentário:', error);
            this.showError('Erro ao rejeitar comentário');
        }
    }

    async deleteComment(commentId) {
        if (!confirm('Tem certeza que deseja excluir este comentário? Esta ação não pode ser desfeita.')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/comments/${commentId}`, {
                method: 'DELETE',
                headers: GMP_Security.getAuthHeaders()
            });

            const data = await response.json();

            if (data.success) {
                this.showSuccess('Comentário excluído com sucesso!');
                this.loadComments();
                this.loadStats();
            } else {
                this.showError(data.error || 'Erro ao excluir comentário');
            }
        } catch (error) {
            console.error('Erro ao excluir comentário:', error);
            this.showError('Erro ao excluir comentário');
        }
    }

    showSuccess(message) {
        // Implementar notificação de sucesso
        alert('✅ ' + message);
    }

    showError(message) {
        // Implementar notificação de erro
        alert('❌ ' + message);
    }

    showInfo(message) {
        // Implementar notificação de informação
        alert('ℹ️ ' + message);
    }
}

// Inicializar o gerenciador quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    window.commentsManager = new CommentsManager();
});