/**
 * Classes Management Module
 * Gestão completa de turmas com integração com cursos e alunos
 */

class ClassesManager {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 10;
        this.searchTerm = '';
        this.statusFilter = 'all';
        this.classes = [];
        this.stats = {};
        this.selectedClass = null;
        this.init();
    }

    async init() {
        try {
            await this.loadStats();
            await this.loadClasses();
            this.setupEventListeners();
            this.setupSearchAndFilters();
        } catch (error) {
            console.error('Erro ao inicializar ClassesManager:', error);
            this.showError('Erro ao carregar dados das turmas');
        }
    }

    async loadStats() {
        try {
            const response = await fetch('/api/admin/classes/stats', {
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

    async loadClasses() {
        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.pageSize,
                search: this.searchTerm,
                status: this.statusFilter
            });

            const response = await fetch(`/api/admin/classes?${params}`, {
                headers: GMP_Security.getAuthHeaders()
            });
            const data = await response.json();
            
            if (data.success) {
                this.classes = data.classes;
                this.pagination = data.pagination;
                this.renderClasses();
                this.renderPagination();
            }
        } catch (error) {
            console.error('Erro ao carregar turmas:', error);
            this.showError('Erro ao carregar lista de turmas');
        }
    }

    renderStats() {
        const statsContainer = document.getElementById('statsContainer');
        if (!statsContainer) return;

        statsContainer.innerHTML = `
            <div class="modern-metric-card">
                <div class="metric-header">
                    <div class="metric-icon"><i class="fas fa-users-class"></i></div>
                </div>
                <div class="metric-value">${this.stats.total || 0}</div>
                <div class="metric-label">Total de Turmas</div>
            </div>
            <div class="modern-metric-card">
                <div class="metric-header">
                    <div class="metric-icon"><i class="fas fa-check-circle"></i></div>
                </div>
                <div class="metric-value">${this.stats.active || 0}</div>
                <div class="metric-label">Turmas Ativas</div>
            </div>
            <div class="modern-metric-card">
                <div class="metric-header">
                    <div class="metric-icon"><i class="fas fa-user-graduate"></i></div>
                </div>
                <div class="metric-value">${this.stats.students || 0}</div>
                <div class="metric-label">Alunos Matriculados</div>
            </div>
            <div class="modern-metric-card">
                <div class="metric-header">
                    <div class="metric-icon"><i class="fas fa-calculator"></i></div>
                </div>
                <div class="metric-value">${this.stats.avgStudents || 0}</div>
                <div class="metric-label">Média por Turma</div>
            </div>
        `;
    }

    renderClasses() {
        const classesContainer = document.getElementById('classesContainer');
        if (!classesContainer) return;

        if (this.classes.length === 0) {
            classesContainer.innerHTML = `
                <div class="text-center" style="padding: 3rem;">
                    <i class="fas fa-chalkboard-teacher" style="font-size: 4rem; color: var(--text-secondary); margin-bottom: 1rem;"></i>
                    <h3 style="color: var(--text-secondary); margin-bottom: 0.5rem;">Nenhuma turma encontrada</h3>
                    <p style="color: var(--text-secondary);">Tente ajustar os filtros ou adicionar novas turmas.</p>
                    <button class="btn-modern btn-modern-primary mt-3" onclick="classesManager.showAddClassModal()">
                        <i class="fas fa-plus"></i> Criar Nova Turma
                    </button>
                </div>
            `;
            return;
        }

        classesContainer.innerHTML = this.classes.map(classItem => `
            <div style="background: var(--bg-secondary); border-radius: 12px; padding: 2rem; border-left: 6px solid ${classItem.isActive ? 'var(--success-green)' : 'var(--warning-yellow)'}; box-shadow: 0 4px 12px rgba(0,0,0,0.1); margin-bottom: 1.5rem;">
                <div style="display: flex; justify-content: between; align-items: start;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                            <div style="width: 60px; height: 60px; background: linear-gradient(45deg, #4CAF50, #45a049); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px;">
                                ${classItem.title.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 style="margin: 0; font-size: 20px; color: var(--text-primary);">${classItem.title}</h3>
                                <p style="margin: 0.5rem 0 0 0; color: var(--text-secondary);">${classItem.courseTitle || 'Curso não definido'} • ID: ${classItem.id.substring(0, 8)}</p>
                            </div>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1rem;">
                            <div style="text-align: center; padding: 1rem; background: rgba(76, 175, 80, 0.1); border-radius: 8px;">
                                <div style="font-size: 24px; font-weight: bold; color: var(--success-green);">${classItem.studentCount || 0}</div>
                                <div style="font-size: 14px; color: var(--text-secondary);">Alunos</div>
                            </div>
                            <div style="text-align: center; padding: 1rem; background: rgba(33, 150, 243, 0.1); border-radius: 8px;">
                                <div style="font-size: 24px; font-weight: bold; color: var(--primary-blue);">${classItem.instructorName || 'Não atribuído'}</div>
                                <div style="font-size: 14px; color: var(--text-secondary);">Instrutor</div>
                            </div>
                            <div style="text-align: center; padding: 1rem; background: rgba(255, 152, 0, 0.1); border-radius: 8px;">
                                <div style="font-size: 24px; font-weight: bold; color: var(--primary-orange);">${classItem.schedule || 'Não definido'}</div>
                                <div style="font-size: 14px; color: var(--text-secondary);">Horário</div>
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; margin-left: 2rem;">
                        <span class="badge-modern ${classItem.isActive ? 'badge-success' : 'badge-warning'}">
                            <i class="fas ${classItem.isActive ? 'fa-play' : 'fa-clock'}"></i> ${classItem.isActive ? 'Ativa' : 'Inativa'}
                        </span>
                        <button class="btn-modern btn-modern-secondary btn-sm" onclick="classesManager.viewClassDetails('${classItem.id}')">
                            <i class="fas fa-eye"></i> Ver Detalhes
                        </button>
                        <button class="btn-modern btn-modern-primary btn-sm" onclick="classesManager.showEditClassModal('${classItem.id}')">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderPagination() {
        const paginationContainer = document.getElementById('paginationContainer');
        if (!paginationContainer || !this.pagination) return;

        const { page, pages, total } = this.pagination;
        
        let paginationHTML = `
            <li class="page-item ${page === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="classesManager.goToPage(${page - 1})">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
        `;

        // Show first page
        if (page > 2) {
            paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="classesManager.goToPage(1)">1</a></li>`;
            if (page > 3) {
                paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }

        // Show pages around current
        for (let i = Math.max(1, page - 1); i <= Math.min(pages, page + 1); i++) {
            paginationHTML += `
                <li class="page-item ${i === page ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="classesManager.goToPage(${i})">${i}</a>
                </li>
            `;
        }

        // Show last page
        if (page < pages - 1) {
            if (page < pages - 2) {
                paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
            paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="classesManager.goToPage(${pages})">${pages}</a></li>`;
        }

        paginationHTML += `
            <li class="page-item ${page === pages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="classesManager.goToPage(${page + 1})">
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
            paginationInfo.innerHTML = `Mostrando ${start}-${end} de ${total} turmas`;
        }
    }

    goToPage(page) {
        if (page < 1 || page > this.pagination.pages) return;
        this.currentPage = page;
        this.loadClasses();
    }

    setupEventListeners() {
        // Botão adicionar turma
        const addClassBtn = document.getElementById('addClassBtn');
        if (addClassBtn) {
            addClassBtn.addEventListener('click', () => this.showAddClassModal());
        }

        // Botão salvar turma
        const saveClassBtn = document.getElementById('saveClassBtn');
        if (saveClassBtn) {
            saveClassBtn.addEventListener('click', () => this.saveClass());
        }

        // Event listeners para modais
        this.setupModalEventListeners();
    }

    setupModalEventListeners() {
        // Salvar turma
        const saveClassBtn = document.getElementById('saveClassBtn');
        if (saveClassBtn) {
            saveClassBtn.addEventListener('click', () => this.saveClass());
        }

        // Editar do modal de visualização
        const editFromViewBtn = document.getElementById('editFromViewBtn');
        if (editFromViewBtn) {
            editFromViewBtn.addEventListener('click', () => this.editFromView());
        }
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
                    this.loadClasses();
                }, 500);
            });
        }

        // Filtro de status
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.statusFilter = e.target.value;
                this.currentPage = 1;
                this.loadClasses();
            });
        }

        // Botão filtrar
        const filterBtn = document.querySelector('button:has(.fa-filter), button[onclick*="loadClasses"]');
        if (filterBtn) {
            filterBtn.addEventListener('click', () => {
                this.currentPage = 1;
                this.loadClasses();
            });
        }
    }

    async viewClass(classId) {
        try {
            const response = await fetch(`/api/admin/classes/${classId}`, {
                headers: GMP_Security.getAuthHeaders()
            });
            const data = await response.json();
            
            if (data.success) {
                this.selectedClass = data.class;
                this.showClassModal();
            }
        } catch (error) {
            console.error('Erro ao carregar detalhes da turma:', error);
            this.showError('Erro ao carregar detalhes da turma');
        }
    }

    showClassModal() {
        if (!this.selectedClass) return;

        const modalHTML = `
            <div class="modal fade" id="classModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-chalkboard-teacher"></i> Detalhes da Turma
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-12">
                                    <h4>${this.selectedClass.title}</h4>
                                    <p class="text-muted">${this.selectedClass.description || 'Sem descrição'}</p>
                                    
                                    <div class="row mt-4">
                                        <div class="col-md-6">
                                            <div class="stat-item">
                                                <div class="stat-label">Curso</div>
                                                <div class="stat-value">${this.selectedClass.courseTitle || 'Não definido'}</div>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="stat-item">
                                                <div class="stat-label">Instrutor</div>
                                                <div class="stat-value">${this.selectedClass.instructorName || 'Não atribuído'}</div>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="stat-item">
                                                <div class="stat-label">Horário</div>
                                                <div class="stat-value">${this.selectedClass.schedule || 'Não definido'}</div>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="stat-item">
                                                <div class="stat-label">Capacidade</div>
                                                <div class="stat-value">${this.selectedClass.maxStudents || 'Ilimitada'}</div>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="stat-item">
                                                <div class="stat-label">Status</div>
                                                <div class="stat-value">
                                                    <span class="badge ${this.selectedClass.isActive ? 'badge-success' : 'badge-warning'}">
                                                        ${this.selectedClass.isActive ? 'Ativa' : 'Inativa'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="stat-item">
                                                <div class="stat-label">Alunos Matriculados</div>
                                                <div class="stat-value">${this.selectedClass.studentCount || 0}</div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="mt-4">
                                        <h6>Alunos Matriculados:</h6>
                                        ${
                                            this.selectedClass.students && this.selectedClass.students.length > 0 
                                            ? `
                                                <div class="table-responsive">
                                                    <table class="table table-hover">
                                                        <thead>
                                                            <tr>
                                                                <th>Nome</th>
                                                                <th>Email</th>
                                                                <th>Data de Matrícula</th>
                                                                <th>Ações</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            ${this.selectedClass.students.map(student => `
                                                                <tr>
                                                                    <td>${student.name}</td>
                                                                    <td>${student.email}</td>
                                                                    <td>${new Date(student.enrolledAt).toLocaleDateString('pt-BR')}</td>
                                                                    <td>
                                                                        <button class="btn btn-sm btn-outline-danger" onclick="classesManager.removeStudent('${student.id}', '${this.selectedClass.id}')">
                                                                            <i class="fas fa-times"></i> Remover
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            `).join('')}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            `
                                            : '<p class="text-muted">Nenhum aluno matriculado nesta turma.</p>'
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                            <button type="button" class="btn btn-primary" id="editFromViewBtn">
                                <i class="fas fa-edit"></i> Editar Turma
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remover modal existente
        const existingModal = document.getElementById('classModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Adicionar novo modal
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('classModal'));
        modal.show();
    }

    showAddClassModal() {
        this.selectedClass = null;
        this.showClassFormModal('Adicionar Nova Turma');
    }

    showEditClassModal(classId) {
        const classItem = this.classes.find(c => c.id === classId);
        if (!classItem) return;
        
        this.selectedClass = classItem;
        this.showClassFormModal('Editar Turma', classItem);
    }

    showClassFormModal(title, classData = null) {
        const modalHTML = `
            <div class="modal fade" id="classFormModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-chalkboard-teacher"></i> ${title}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <form id="classForm">
                            <div class="modal-body">
                                <div class="mb-3">
                                    <label for="classTitle" class="form-label">Título *</label>
                                    <input type="text" class="form-control" id="classTitle" required value="${classData?.title || ''}">
                                </div>
                                <div class="mb-3">
                                    <label for="classDescription" class="form-label">Descrição</label>
                                    <textarea class="form-control" id="classDescription" rows="3">${classData?.description || ''}</textarea>
                                </div>
                                <div class="mb-3">
                                    <label for="classCourseId" class="form-label">Curso</label>
                                    <select class="form-control" id="classCourseId">
                                        <option value="">Selecione um curso</option>
                                        <!-- Options will be populated dynamically -->
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="classInstructorId" class="form-label">Instrutor</label>
                                    <select class="form-control" id="classInstructorId">
                                        <option value="">Selecione um instrutor</option>
                                        <!-- Options will be populated dynamically -->
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="classSchedule" class="form-label">Horário</label>
                                    <input type="text" class="form-control" id="classSchedule" value="${classData?.schedule || ''}">
                                </div>
                                <div class="mb-3">
                                    <label for="classMaxStudents" class="form-label">Capacidade Máxima</label>
                                    <input type="number" class="form-control" id="classMaxStudents" value="${classData?.maxStudents || ''}">
                                </div>
                                <div class="mb-3">
                                    <label for="classStatus" class="form-label">Status</label>
                                    <select class="form-control" id="classStatus">
                                        <option value="1" ${classData?.isActive ? 'selected' : ''}>Ativa</option>
                                        <option value="0" ${classData && !classData.isActive ? 'selected' : ''}>Inativa</option>
                                    </select>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                                <button type="button" class="btn btn-primary" id="saveClassBtn">
                                    <i class="fas fa-save"></i> Salvar Turma
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        // Remover modal existente
        const existingModal = document.getElementById('classFormModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Adicionar novo modal
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Carregar dados dinâmicos
        this.loadCourseOptions();
        this.loadInstructorOptions();
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('classFormModal'));
        modal.show();
        
        // Preencher valores se for edição
        if (classData) {
            document.getElementById('classCourseId').value = classData.courseId || '';
            document.getElementById('classInstructorId').value = classData.instructorId || '';
        }
    }

    async loadCourseOptions() {
        try {
            const response = await fetch('/api/admin/products', {
                headers: GMP_Security.getAuthHeaders()
            });
            const data = await response.json();
            
            if (data.success) {
                const courseSelect = document.getElementById('classCourseId');
                if (courseSelect) {
                    courseSelect.innerHTML = '<option value="">Selecione um curso</option>' + 
                        data.products.map(product => 
                            `<option value="${product.id}">${product.title}</option>`
                        ).join('');
                }
            }
        } catch (error) {
            console.error('Erro ao carregar cursos:', error);
        }
    }

    async loadInstructorOptions() {
        try {
            const response = await fetch('/api/admin/students', {
                headers: GMP_Security.getAuthHeaders()
            });
            const data = await response.json();
            
            if (data.success) {
                const instructorSelect = document.getElementById('classInstructorId');
                if (instructorSelect) {
                    instructorSelect.innerHTML = '<option value="">Selecione um instrutor</option>' + 
                        data.students
                            .filter(student => student.role === 'ADMIN' || student.role === 'INSTRUCTOR')
                            .map(student => 
                                `<option value="${student.id}">${student.name}</option>`
                            ).join('');
                }
            }
        } catch (error) {
            console.error('Erro ao carregar instrutores:', error);
        }
    }

    async saveClass() {
        const formData = {
            title: document.getElementById('classTitle').value,
            description: document.getElementById('classDescription').value,
            courseId: document.getElementById('classCourseId').value,
            instructorId: document.getElementById('classInstructorId').value,
            schedule: document.getElementById('classSchedule').value,
            maxStudents: document.getElementById('classMaxStudents').value,
            isActive: document.getElementById('classStatus').value === '1'
        };

        // Validação básica
        if (!formData.title) {
            this.showError('O título da turma é obrigatório');
            return;
        }

        try {
            const url = this.selectedClass ? 
                `/api/admin/classes/${this.selectedClass.id}` : 
                '/api/admin/classes';
            
            const method = this.selectedClass ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    ...GMP_Security.getAuthHeaders()
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                this.showSuccess(this.selectedClass ? 'Turma atualizada com sucesso!' : 'Turma adicionada com sucesso!');
                
                // Fechar modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('classFormModal'));
                if (modal) modal.hide();

                // Recarregar lista
                this.loadClasses();
                this.loadStats();
            } else {
                this.showError(data.error || 'Erro ao salvar turma');
            }
        } catch (error) {
            console.error('Erro ao salvar turma:', error);
            this.showError('Erro ao salvar turma');
        }
    }

    async removeStudent(studentId, classId) {
        if (!confirm('Tem certeza que deseja remover este aluno da turma?')) {
            return;
        }

        try {
            // Primeiro, precisamos encontrar o enrollmentId
            const response = await fetch(`/api/admin/enrollments?studentId=${studentId}&classId=${classId}`, {
                headers: GMP_Security.getAuthHeaders()
            });
            const data = await response.json();

            if (data.success && data.enrollments.length > 0) {
                const enrollmentId = data.enrollments[0].id;
                
                const deleteResponse = await fetch(`/api/admin/enrollments/${enrollmentId}`, {
                    method: 'DELETE',
                    headers: GMP_Security.getAuthHeaders()
                });

                const deleteData = await deleteResponse.json();

                if (deleteData.success) {
                    this.showSuccess('Aluno removido da turma com sucesso!');
                    // Recarregar detalhes da turma
                    this.viewClass(classId);
                    // Atualizar estatísticas
                    this.loadStats();
                } else {
                    this.showError(deleteData.error || 'Erro ao remover aluno da turma');
                }
            } else {
                this.showError('Matrícula não encontrada');
            }
        } catch (error) {
            console.error('Erro ao remover aluno da turma:', error);
            this.showError('Erro ao remover aluno da turma');
        }
    }

    async deleteClass(classId) {
        if (!confirm('Tem certeza que deseja excluir esta turma? Esta ação não pode ser desfeita.')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/classes/${classId}`, {
                method: 'DELETE',
                headers: GMP_Security.getAuthHeaders()
            });

            const data = await response.json();

            if (data.success) {
                this.showSuccess('Turma excluída com sucesso!');
                this.loadClasses();
                this.loadStats();
            } else {
                this.showError(data.error || 'Erro ao excluir turma');
            }
        } catch (error) {
            console.error('Erro ao excluir turma:', error);
            this.showError('Erro ao excluir turma');
        }
    }

    viewClassDetails(classId) {
        this.viewClass(classId);
    }

    editFromView() {
        // Fechar modal de visualização
        const viewModal = bootstrap.Modal.getInstance(document.getElementById('classModal'));
        if (viewModal) viewModal.hide();

        // Abrir modal de edição
        this.showEditClassModal(this.selectedClass.id);
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
    window.classesManager = new ClassesManager();
});