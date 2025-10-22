/**
 * Student Courses Management Module
 * Gestão de cursos do aluno
 */

class StudentCoursesManager {
    constructor() {
        this.courses = [];
        this.stats = {};
        this.init();
    }

    async init() {
        try {
            await this.loadStats();
            await this.loadCourses();
            this.setupEventListeners();
        } catch (error) {
            console.error('Erro ao inicializar StudentCoursesManager:', error);
            this.showError('Erro ao carregar dados dos cursos');
        }
    }

    async loadStats() {
        try {
            const response = await fetch('/api/dashboard', {
                headers: GMP_Security.getAuthHeaders()
            });
            const data = await response.json();
            
            if (data && data.progress) {
                // Calculate stats from progress data
                const totalCourses = data.progress.length;
                const completedCourses = data.progress.filter(p => p.progressPercentage >= 100).length;
                const totalTime = data.progress.reduce((sum, p) => sum + (p.duration || 0), 0);
                const avgProgress = totalCourses > 0 ? 
                    Math.round(data.progress.reduce((sum, p) => sum + (p.progressPercentage || 0), 0) / totalCourses) : 0;
                
                this.stats = {
                    totalCourses,
                    completedCourses,
                    totalTime,
                    avgProgress
                };
                
                this.renderStats();
            }
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        }
    }

    async loadCourses() {
        try {
            const response = await fetch('/api/dashboard', {
                headers: GMP_Security.getAuthHeaders()
            });
            const data = await response.json();
            
            if (data && data.progress) {
                this.courses = data.progress;
                this.renderCourses();
            }
        } catch (error) {
            console.error('Erro ao carregar cursos:', error);
            this.showError('Erro ao carregar lista de cursos');
        }
    }

    renderStats() {
        const statsContainer = document.querySelector('.modern-metrics-grid');
        if (!statsContainer) return;

        statsContainer.innerHTML = `
            <div class="modern-metric-card">
                <div class="metric-header">
                    <div class="metric-icon"><i class="fas fa-book-open"></i></div>
                </div>
                <div class="metric-value">${this.stats.totalCourses || 0}</div>
                <div class="metric-label">Cursos Ativos</div>
            </div>
            <div class="modern-metric-card">
                <div class="metric-header">
                    <div class="metric-icon"><i class="fas fa-clock"></i></div>
                </div>
                <div class="metric-value">${this.formatTime(this.stats.totalTime || 0)}</div>
                <div class="metric-label">Tempo Estudado</div>
            </div>
            <div class="modern-metric-card">
                <div class="metric-header">
                    <div class="metric-icon"><i class="fas fa-chart-line"></i></div>
                </div>
                <div class="metric-value">${this.stats.avgProgress || 0}%</div>
                <div class="metric-label">Progresso Médio</div>
            </div>
            <div class="modern-metric-card">
                <div class="metric-header">
                    <div class="metric-icon"><i class="fas fa-fire"></i></div>
                </div>
                <div class="metric-value">7</div>
                <div class="metric-label">Dias Consecutivos</div>
            </div>
        `;
    }

    renderCourses() {
        const coursesContainer = document.querySelector('.course-cards-horizontal');
        if (!coursesContainer) return;

        if (this.courses.length === 0) {
            coursesContainer.innerHTML = `
                <div class="text-center" style="padding: 3rem;">
                    <i class="fas fa-book" style="font-size: 4rem; color: var(--text-secondary); margin-bottom: 1rem;"></i>
                    <h3 style="color: var(--text-secondary); margin-bottom: 0.5rem;">Nenhum curso encontrado</h3>
                    <p style="color: var(--text-secondary);">Você ainda não se inscreveu em nenhum curso.</p>
                    <button class="btn-modern btn-modern-primary mt-3" onclick="window.location.href='../../admin/products.html'">
                        <i class="fas fa-plus"></i> Explorar Cursos
                    </button>
                </div>
            `;
            return;
        }

        coursesContainer.innerHTML = this.courses.map(course => `
            <div class="course-card-modern shadow-hover">
                <div class="course-image" style="background: linear-gradient(135deg, var(--primary-blue), var(--primary-green));">
                    <i class="fas fa-language"></i>
                </div>
                <div class="course-content">
                    <div class="course-header">
                        <h4>${course.title || 'Curso sem título'}</h4>
                        <div class="course-meta">Professor: ${course.instructor || 'Não atribuído'} • ${course.totalLessons || 0} aulas</div>
                    </div>
                    
                    <p style="color: var(--text-secondary); margin-bottom: var(--spacing-md); line-height: 1.4;">
                        ${course.description || 'Descrição não disponível'}
                    </p>

                    <div class="progress-section">
                        <div class="d-flex align-items-center justify-content-between margin-bottom: var(--spacing-xs);">
                            <span style="font-size: 14px; color: var(--text-secondary);">Progresso</span>
                            <span style="font-size: 14px; font-weight: 600;">${Math.round(course.progressPercentage || 0)}%</span>
                        </div>
                        <div class="progress-bar-modern">
                            <div class="progress-fill" style="width: ${course.progressPercentage || 0}%;"></div>
                        </div>
                        <small style="color: var(--text-secondary;">${course.lessonsCompleted || 0} de ${course.totalLessons || 0} aulas concluídas</small>
                    </div>

                    <div class="d-flex gap-2" style="margin-top: var(--spacing-md);">
                        <button class="btn-modern btn-modern-primary" onclick="window.location.href='../student/course-view.html?courseId=${course.courseId}'">
                            <i class="fas fa-play-circle"></i> ${course.progressPercentage > 0 ? 'Continuar' : 'Iniciar Curso'}
                        </button>
                        <button class="btn-modern btn-modern-secondary" onclick="window.location.href='../student/progress.html?courseId=${course.courseId}'">
                            <i class="fas fa-chart-line"></i> Progresso
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    formatTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    }

    setupEventListeners() {
        // Add any specific event listeners here
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
    window.studentCoursesManager = new StudentCoursesManager();
});