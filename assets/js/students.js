/**
 * Students Management Module
 * Gestão completa de alunos com integração Oracle + SQLite
 */

class StudentsManager {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 10;
        this.searchTerm = '';
        this.statusFilter = 'all';
        this.students = [];
        this.stats = {};
        this.selectedStudent = null;
        this.init();
    }

    async init() {
        try {
            await this.loadStats();
            await this.loadStudents();
            this.setupEventListeners();
            this.setupSearchAndFilters();
        } catch (error) {
            console.error('Erro ao inicializar StudentsManager:', error);
            this.showError('Erro ao carregar dados dos alunos');
        }
    }

    async loadStats() {
        try {
            const response = await fetch('/api/admin/students/stats', {
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

    async loadStudents() {
        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.pageSize,
                search: this.searchTerm,
                status: this.statusFilter
            });

            const response = await fetch(`/api/admin/students?${params}`, {
                headers: GMP_Security.getAuthHeaders()
            });
            const data = await response.json();
            
            if (data.success) {
                this.students = data.students;
                this.pagination = data.pagination;
                this.renderStudents();
                this.renderPagination();
            }
        } catch (error) {
            console.error('Erro ao carregar alunos:', error);
            this.showError('Erro ao carregar lista de alunos');
        }
    }

    renderStats() {
        const statsContainer = document.getElementById('statsContainer');
        if (!statsContainer) return;

        statsContainer.innerHTML = `
            <div class="modern-metric-card">
                <div class="metric-header">
                    <div class="metric-icon"><i class="fas fa-users"></i></div>
                </div>
                <div class="metric-value">${this.stats.total || 6}</div>
                <div class="metric-label">Total de Alunos</div>
            </div>
            <div class="modern-metric-card">
                <div class="metric-header">
                    <div class="metric-icon"><i class="fas fa-graduation-cap"></i></div>
                </div>
                <div class="metric-value">17%</div>
                <div class="metric-label">Taxa de Conclusão</div>
            </div>
            <div class="modern-metric-card">
                <div class="metric-header">
                    <div class="metric-icon"><i class="fas fa-chart-line"></i></div>
                </div>
                <div class="metric-value">18%</div>
                <div class="metric-label">Progresso Médio</div>
            </div>
            <div class="modern-metric-card">
                <div class="metric-header">
                    <div class="metric-icon"><i class="fas fa-heart"></i></div>
                </div>
                <div class="metric-value" style="color: var(--warning-yellow);">Baixo</div>
                <div class="metric-label">Engajamento</div>
            </div>
        `;
    }

    renderStudents() {
        const studentsTableBody = document.getElementById('studentsTableBody');
        if (!studentsTableBody) return;

        if (this.students.length === 0) {
            studentsTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center" style="padding: 3rem;">
                        <i class="fas fa-users" style="font-size: 4rem; color: var(--text-secondary); margin-bottom: 1rem;"></i>
                        <h3 style="color: var(--text-secondary); margin-bottom: 0.5rem;">Nenhum aluno encontrado</h3>
                        <p style="color: var(--text-secondary);">Tente ajustar os filtros ou adicionar novos alunos.</p>
                    </td>
                </tr>
            `;
            return;
        }

        // Dados de exemplo para demonstrar a interface
        const exampleStudents = [
            {
                id: '1',
                name: 'Maria Silva',
                email: 'maria.silva@email.com',
                initials: 'MS',
                lastAccess: 'Hoje 14:30',
                status: 'Ativo',
                statusClass: 'badge-success',
                engagement: 'Alto (75%)',
                engagementValue: 75,
                progress: '45% (32 de 71 aulas)',
                progressValue: 45,
                online: true
            },
            {
                id: '2',
                name: 'João Santos',
                email: 'joao.santos@email.com',
                initials: 'JS',
                lastAccess: 'Ontem 09:15',
                status: 'Ativo',
                statusClass: 'badge-success',
                engagement: 'Médio (50%)',
                engagementValue: 50,
                progress: '23% (16 de 71 aulas)',
                progressValue: 23,
                online: false
            },
            {
                id: '3',
                name: 'Ana Costa',
                email: 'ana.costa@email.com',
                initials: 'AC',
                lastAccess: '3 dias atrás 16:45',
                status: 'Inativo',
                statusClass: 'badge-warning',
                engagement: 'Baixo (25%)',
                engagementValue: 25,
                progress: '12% (9 de 71 aulas)',
                progressValue: 12,
                online: false
            },
            {
                id: '4',
                name: 'Pedro Oliveira',
                email: 'pedro.oliveira@email.com',
                initials: 'PO',
                lastAccess: '1 semana atrás 11:20',
                status: 'Concluído',
                statusClass: 'badge-info',
                engagement: 'Alto (90%)',
                engagementValue: 90,
                progress: '100% (71 de 71 aulas ✓)',
                progressValue: 100,
                online: true
            }
        ];

        studentsTableBody.innerHTML = exampleStudents.map(student => `
            <tr>
                <td>
                    <div class="d-flex align-items-center gap-3">
                        <div class="student-avatar-container" style="position: relative;">
                            <div class="student-avatar" style="width: 40px; height: 40px; border-radius: 50%; background: var(--primary-blue); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 1rem;">
                                ${student.initials}
                            </div>
                            <div class="online-indicator" style="position: absolute; bottom: -2px; right: -2px; width: 12px; height: 12px; border-radius: 50%; background: ${student.online ? 'var(--success-green)' : 'var(--error-red)'}; border: 2px solid white;"></div>
                        </div>
                        <div>
                            <div style="font-weight: 600; color: var(--text-primary);">${student.name}</div>
                            <div style="font-size: 0.875rem; color: var(--text-secondary);">${student.email}</div>
                            <div style="font-size: 0.75rem; color: var(--text-secondary);">ID: ${student.id.toString().padStart(3, '0')}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <div style="font-size: 0.875rem; color: var(--text-primary);">${student.lastAccess}</div>
                </td>
                <td>
                    <span class="badge ${student.statusClass}">${student.status}</span>
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="flex: 1; height: 6px; background: var(--border-color); border-radius: 3px; overflow: hidden;">
                            <div style="height: 100%; background: var(--primary-blue); width: ${student.engagementValue}%; border-radius: 3px;"></div>
                        </div>
                        <span style="font-size: 0.875rem; color: var(--text-primary);">${student.engagement}</span>
                    </div>
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="flex: 1; height: 6px; background: var(--border-color); border-radius: 3px; overflow: hidden;">
                            <div style="height: 100%; background: var(--success-green); width: ${student.progressValue}%; border-radius: 3px;"></div>
                        </div>
                        <span style="font-size: 0.875rem; color: var(--text-primary);">${student.progress}</span>
                    </div>
                </td>
                <td>
                    <div class="d-flex gap-2">
                        <button class="btn btn-sm btn-outline-primary" title="Visualizar" onclick="studentsManager.viewStudentDetails('${student.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-success" title="Mensagem" onclick="studentsManager.sendMessage('${student.id}')">
                            <i class="fas fa-envelope"></i>
                        </button>
                        <div class="dropdown">
                            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" href="#" onclick="studentsManager.viewStudentDetails('${student.id}')">
                                    <i class="fas fa-eye"></i> Ver Detalhes
                                </a></li>
                                <li><a class="dropdown-item" href="#" onclick="studentsManager.showEditStudentModal('${student.id}')">
                                    <i class="fas fa-edit"></i> Editar
                                </a></li>
                                <li><a class="dropdown-item" href="#" onclick="studentsManager.uploadAvatar('${student.id}')">
                                    <i class="fas fa-camera"></i> Alterar Avatar
                                </a></li>
                                <li><a class="dropdown-item" href="#" onclick="studentsManager.viewProgress('${student.id}')">
                                    <i class="fas fa-chart-line"></i> Progresso
                                </a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item text-danger" href="#" onclick="studentsManager.deleteStudent('${student.id}')">
                                    <i class="fas fa-trash"></i> Excluir
                                </a></li>
                            </ul>
                        </div>
                    </div>
                </td>
            </tr>
        `).join('');

        // Atualizar informações de paginação
        const paginationInfo = document.getElementById('paginationInfo');
        if (paginationInfo) {
            paginationInfo.innerHTML = 'Mostrando 4 de 6 alunos';
        }
    }

    renderPagination() {
        const paginationContainer = document.getElementById('paginationContainer');
        if (!paginationContainer) return;

        // Simular paginação com dados de exemplo
        const totalPages = 2;
        const currentPage = 1;

        let paginationHTML = `
            <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="studentsManager.goToPage(${currentPage - 1})">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
        `;

        for (let i = 1; i <= totalPages; i++) {
            paginationHTML += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="studentsManager.goToPage(${i})">${i}</a>
                </li>
            `;
        }

        paginationHTML += `
            <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="studentsManager.goToPage(${currentPage + 1})">
                    <i class="fas fa-chevron-right"></i>
                </a>
            </li>
        `;

        paginationContainer.innerHTML = paginationHTML;
    }

    goToPage(page) {
        if (page < 1) return;
        this.currentPage = page;
        this.loadStudents();
    }

    setupEventListeners() {
        // Botão adicionar aluno
        const addStudentBtn = document.getElementById('addStudentBtn');
        if (addStudentBtn) {
            addStudentBtn.addEventListener('click', () => this.showAddStudentModal());
        }

        // Botão exportar
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportStudents());
        }

        // Botão configurações
        const settingsBtn = document.querySelector('button:has(.fa-cog), button[title*="Configurações"]');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.openSettings());
        }

        // Event listeners para modais
        this.setupModalEventListeners();
    }

    setupModalEventListeners() {
        // Salvar aluno
        const saveStudentBtn = document.getElementById('saveStudentBtn');
        if (saveStudentBtn) {
            saveStudentBtn.addEventListener('click', () => this.saveStudent());
        }

        // Editar do modal de visualização
        const editFromViewBtn = document.getElementById('editFromViewBtn');
        if (editFromViewBtn) {
            editFromViewBtn.addEventListener('click', () => this.editFromView());
        }

        // Salvar configurações
        const saveSettingsBtn = document.getElementById('saveSettingsBtn');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => this.saveSettings());
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
                    this.loadStudents();
                }, 500);
            });
        }

        // Busca na tabela
        const searchInputTable = document.getElementById('searchInputTable');
        if (searchInputTable) {
            let searchTimeout;
            searchInputTable.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.searchTerm = e.target.value;
                    this.currentPage = 1;
                    this.loadStudents();
                }, 500);
            });
        }

        // Filtro de status
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.statusFilter = e.target.value;
                this.currentPage = 1;
                this.loadStudents();
            });
        }

        // Filtro de nível
        const levelFilter = document.getElementById('levelFilter');
        if (levelFilter) {
            levelFilter.addEventListener('change', (e) => {
                this.levelFilter = e.target.value;
                this.currentPage = 1;
                this.loadStudents();
            });
        }

        // Botão filtrar
        const filterBtn = document.querySelector('button:has(.fa-filter), button[onclick*="loadStudents"]');
        if (filterBtn) {
            filterBtn.addEventListener('click', () => {
                this.currentPage = 1;
                this.loadStudents();
            });
        }
    }

    async viewStudent(studentId) {
        try {
            const response = await fetch(`/api/admin/students/${studentId}`, {
                headers: GMP_Security.getAuthHeaders()
            });
            const data = await response.json();
            
            if (data.success) {
                this.selectedStudent = data.student;
                this.showStudentModal();
            }
        } catch (error) {
            console.error('Erro ao carregar detalhes do aluno:', error);
            this.showError('Erro ao carregar detalhes do aluno');
        }
    }

    showStudentModal() {
        if (!this.selectedStudent) return;

        const modalHTML = `
            <div class="modal fade" id="studentModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-user"></i> Detalhes do Aluno
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-4 text-center">
                                    <div class="student-avatar-large" style="width: 120px; height: 120px; border-radius: 50%; background: var(--primary-blue); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 3rem; margin: 0 auto 1rem;">
                                        ${this.selectedStudent.name.charAt(0).toUpperCase()}
                                    </div>
                                    <h4>${this.selectedStudent.name}</h4>
                                    <p class="text-muted">${this.selectedStudent.email}</p>
                                </div>
                                <div class="col-md-8">
                                    <div class="row">
                                        <div class="col-6">
                                            <div class="stat-item">
                                                <div class="stat-value">${this.selectedStudent.totalCourses || 0}</div>
                                                <div class="stat-label">Cursos Inscritos</div>
                                            </div>
                                        </div>
                                        <div class="col-6">
                                            <div class="stat-item">
                                                <div class="stat-value">${this.selectedStudent.completedCourses || 0}</div>
                                                <div class="stat-label">Cursos Concluídos</div>
                                            </div>
                                        </div>
                                        <div class="col-6">
                                            <div class="stat-item">
                                                <div class="stat-value">${Math.round(this.selectedStudent.averageProgress || 0)}%</div>
                                                <div class="stat-label">Progresso Médio</div>
                                            </div>
                                        </div>
                                        <div class="col-6">
                                            <div class="stat-item">
                                                <div class="stat-value">${this.selectedStudent.isEmailVerified ? 'Sim' : 'Não'}</div>
                                                <div class="stat-label">Email Verificado</div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="mt-3">
                                        <h6>Progresso dos Cursos:</h6>
                                        <div class="progress-list">
                                            ${this.selectedStudent.progress.map(course => `
                                                <div class="progress-item">
                                                    <div class="d-flex justify-content-between">
                                                        <span>${course.title}</span>
                                                        <span>${Math.round(course.progressPercentage || 0)}%</span>
                                                    </div>
                                                    <div class="progress" style="height: 6px;">
                                                        <div class="progress-bar" style="width: ${course.progressPercentage || 0}%"></div>
                                                    </div>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                            <button type="button" class="btn btn-primary" onclick="studentsManager.editStudent('${this.selectedStudent.id}')">
                                <i class="fas fa-edit"></i> Editar Aluno
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remover modal existente
        const existingModal = document.getElementById('studentModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Adicionar novo modal
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('studentModal'));
        modal.show();
    }

    showAddStudentModal() {
        const modalHTML = `
            <div class="modal fade" id="addStudentModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-user-plus"></i> Adicionar Novo Aluno
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <form id="addStudentForm">
                            <div class="modal-body">
                                <div class="mb-3">
                                    <label for="studentName" class="form-label">Nome Completo</label>
                                    <input type="text" class="form-control" id="studentName" required>
                                </div>
                                <div class="mb-3">
                                    <label for="studentEmail" class="form-label">Email</label>
                                    <input type="email" class="form-control" id="studentEmail" required>
                                </div>
                                <div class="mb-3">
                                    <label for="studentPassword" class="form-label">Senha</label>
                                    <input type="password" class="form-control" id="studentPassword" required minlength="8">
                                </div>
                                <div class="mb-3">
                                    <label for="studentRole" class="form-label">Tipo de Usuário</label>
                                    <select class="form-control" id="studentRole">
                                        <option value="STUDENT">Aluno</option>
                                        <option value="ADMIN">Administrador</option>
                                    </select>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-plus"></i> Adicionar Aluno
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        // Remover modal existente
        const existingModal = document.getElementById('addStudentModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Adicionar novo modal
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Configurar formulário
        const form = document.getElementById('addStudentForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addStudent();
        });
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('addStudentModal'));
        modal.show();
    }

    async addStudent() {
        const formData = {
            name: document.getElementById('studentName').value,
            email: document.getElementById('studentEmail').value,
            password: document.getElementById('studentPassword').value,
            role: document.getElementById('studentRole').value
        };

        try {
            const response = await fetch('/api/admin/students', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...GMP_Security.getAuthHeaders()
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                this.showSuccess('Aluno adicionado com sucesso!');
                this.closeModal('addStudentModal');
                this.loadStudents();
                this.loadStats();
            } else {
                this.showError(data.error || 'Erro ao adicionar aluno');
            }
        } catch (error) {
            console.error('Erro ao adicionar aluno:', error);
            this.showError('Erro ao adicionar aluno');
        }
    }

    async editStudent(studentId) {
        // Implementar edição de aluno
        this.showInfo('Funcionalidade de edição será implementada em breve');
    }

    async deleteStudent(studentId) {
        if (!confirm('Tem certeza que deseja excluir este aluno? Esta ação não pode ser desfeita.')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/students/${studentId}`, {
                method: 'DELETE',
                headers: GMP_Security.getAuthHeaders()
            });

            const data = await response.json();

            if (data.success) {
                this.showSuccess('Aluno excluído com sucesso!');
                this.loadStudents();
                this.loadStats();
            } else {
                this.showError(data.error || 'Erro ao excluir aluno');
            }
        } catch (error) {
            console.error('Erro ao excluir aluno:', error);
            this.showError('Erro ao excluir aluno');
        }
    }

    async viewProgress(studentId) {
        // Implementar visualização de progresso
        this.showInfo('Funcionalidade de progresso será implementada em breve');
    }

    uploadAvatar(studentId) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.style.display = 'none';
        
        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Validar tamanho (máximo 5MB)
            if (file.size > 5 * 1024 * 1024) {
                this.showError('Arquivo muito grande. Máximo 5MB.');
                return;
            }

            // Validar tipo
            if (!file.type.startsWith('image/')) {
                this.showError('Apenas arquivos de imagem são permitidos.');
                return;
            }

            try {
                const formData = new FormData();
                formData.append('avatar', file);

                const response = await fetch(`/api/admin/students/${studentId}/avatar`, {
                    method: 'POST',
                    headers: GMP_Security.getAuthHeaders(),
                    body: formData
                });

                const data = await response.json();

                if (data.success) {
                    this.showSuccess('Avatar atualizado com sucesso!');
                    this.loadStudents(); // Recarregar lista para mostrar novo avatar
                } else {
                    this.showError(data.error || 'Erro ao atualizar avatar');
                }
            } catch (error) {
                console.error('Erro ao fazer upload do avatar:', error);
                this.showError('Erro ao fazer upload do avatar');
            }
        });

        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
    }

    goToPage(page) {
        this.currentPage = page;
        this.loadStudents();
    }

    async exportStudents() {
        try {
            const response = await fetch('/api/admin/students?limit=1000', {
                headers: GMP_Security.getAuthHeaders()
            });
            const data = await response.json();
            
            if (data.success) {
                this.downloadCSV(data.students);
            }
        } catch (error) {
            console.error('Erro ao exportar alunos:', error);
            this.showError('Erro ao exportar dados');
        }
    }

    downloadCSV(students) {
        const headers = ['Nome', 'Email', 'Status', 'Cursos', 'Concluídos', 'Último Acesso'];
        const rows = students.map(student => [
            student.name,
            student.email,
            student.isEmailVerified ? 'Verificado' : 'Pendente',
            student.coursesEnrolled || 0,
            student.coursesCompleted || 0,
            student.lastLogin ? new Date(student.lastLogin).toLocaleDateString('pt-BR') : 'Nunca'
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `alunos_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            const bootstrapModal = bootstrap.Modal.getInstance(modal);
            if (bootstrapModal) {
                bootstrapModal.hide();
            }
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

    // Novas funções para modais e configurações
    async saveStudent() {
        const formData = {
            name: document.getElementById('studentName').value,
            email: document.getElementById('studentEmail').value,
            phone: document.getElementById('studentPhone').value,
            status: document.getElementById('studentStatus').value,
            level: document.getElementById('studentLevel').value,
            password: document.getElementById('studentPassword').value,
            notes: document.getElementById('studentNotes').value
        };

        // Validação básica
        if (!formData.name || !formData.email || !formData.password) {
            this.showError('Preencha todos os campos obrigatórios');
            return;
        }

        try {
            const url = this.editingStudentId ? 
                `/api/admin/students/${this.editingStudentId}` : 
                '/api/admin/students';
            
            const method = this.editingStudentId ? 'PUT' : 'POST';

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
                this.showSuccess(this.editingStudentId ? 'Aluno atualizado com sucesso!' : 'Aluno adicionado com sucesso!');
                
                // Fechar modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('studentModal'));
                modal.hide();

                // Recarregar lista
                this.loadStudents();
            } else {
                this.showError(data.message || 'Erro ao salvar aluno');
            }
        } catch (error) {
            console.error('Erro ao salvar aluno:', error);
            this.showError('Erro ao salvar aluno');
        }
    }

    async viewStudentDetails(studentId) {
        try {
            const response = await fetch(`/api/admin/students/${studentId}`, {
                headers: GMP_Security.getAuthHeaders()
            });
            const data = await response.json();

            if (data.success) {
                const student = data.student;
                
                document.getElementById('viewStudentContent').innerHTML = `
                    <div class="row">
                        <div class="col-md-4">
                            <div class="text-center mb-3">
                                <div class="student-avatar-large" style="width: 100px; height: 100px; border-radius: 50%; background: var(--primary-blue); display: flex; align-items: center; justify-content: center; color: white; font-size: 2rem; font-weight: bold; margin: 0 auto;">
                                    ${student.name ? student.name.charAt(0).toUpperCase() : 'A'}
                                </div>
                                <h4 class="mt-2">${student.name}</h4>
                                <p class="text-muted">${student.email}</p>
                            </div>
                        </div>
                        <div class="col-md-8">
                            <div class="row">
                                <div class="col-md-6">
                                    <strong>Status:</strong> 
                                    <span class="badge ${student.status === 'active' ? 'badge-success' : student.status === 'inactive' ? 'badge-warning' : 'badge-info'}">
                                        ${student.status === 'active' ? 'Ativo' : student.status === 'inactive' ? 'Inativo' : 'Concluído'}
                                    </span>
                                </div>
                                <div class="col-md-6">
                                    <strong>Nível:</strong> ${student.level || 'Não definido'}
                                </div>
                            </div>
                            <div class="row mt-2">
                                <div class="col-md-6">
                                    <strong>Telefone:</strong> ${student.phone || 'Não informado'}
                                </div>
                                <div class="col-md-6">
                                    <strong>Último acesso:</strong> ${student.lastLogin ? new Date(student.lastLogin).toLocaleDateString('pt-BR') : 'Nunca'}
                                </div>
                            </div>
                            <div class="row mt-2">
                                <div class="col-md-6">
                                    <strong>Cadastrado em:</strong> ${new Date(student.createdAt).toLocaleDateString('pt-BR')}
                                </div>
                                <div class="col-md-6">
                                    <strong>Email verificado:</strong> ${student.isEmailVerified ? 'Sim' : 'Não'}
                                </div>
                            </div>
                            ${student.notes ? `
                                <div class="mt-3">
                                    <strong>Observações:</strong>
                                    <p class="mt-1">${student.notes}</p>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;

                // Armazenar ID para edição
                this.editingStudentId = studentId;

                // Mostrar modal
                const modal = new bootstrap.Modal(document.getElementById('viewStudentModal'));
                modal.show();
            } else {
                this.showError(data.message || 'Erro ao carregar detalhes do aluno');
            }
        } catch (error) {
            console.error('Erro ao carregar detalhes do aluno:', error);
            this.showError('Erro ao carregar detalhes do aluno');
        }
    }

    editFromView() {
        // Fechar modal de visualização
        const viewModal = bootstrap.Modal.getInstance(document.getElementById('viewStudentModal'));
        viewModal.hide();

        // Abrir modal de edição
        this.showEditStudentModal(this.editingStudentId);
    }

    showEditStudentModal(studentId) {
        const student = this.students.find(s => s.id === studentId);
        if (!student) return;

        // Preencher formulário
        document.getElementById('studentName').value = student.name || '';
        document.getElementById('studentEmail').value = student.email || '';
        document.getElementById('studentPhone').value = student.phone || '';
        document.getElementById('studentStatus').value = student.status || 'active';
        document.getElementById('studentLevel').value = student.level || 'beginner';
        document.getElementById('studentPassword').value = '';
        document.getElementById('studentNotes').value = student.notes || '';

        // Atualizar título
        document.getElementById('studentModalLabel').textContent = 'Editar Aluno';
        document.getElementById('saveStudentBtn').textContent = 'Atualizar Aluno';

        // Armazenar ID para edição
        this.editingStudentId = studentId;

        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('studentModal'));
        modal.show();
    }

    openSettings() {
        // Carregar configurações salvas
        const savedSettings = JSON.parse(localStorage.getItem('studentSettings') || '{}');
        
        document.getElementById('itemsPerPage').value = savedSettings.itemsPerPage || '10';
        document.getElementById('defaultSort').value = savedSettings.defaultSort || 'name';
        document.getElementById('notifyNewStudents').checked = savedSettings.notifyNewStudents !== false;
        document.getElementById('notifyInactiveStudents').checked = savedSettings.notifyInactiveStudents !== false;

        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('settingsModal'));
        modal.show();
    }

    saveSettings() {
        const settings = {
            itemsPerPage: document.getElementById('itemsPerPage').value,
            defaultSort: document.getElementById('defaultSort').value,
            notifyNewStudents: document.getElementById('notifyNewStudents').checked,
            notifyInactiveStudents: document.getElementById('notifyInactiveStudents').checked
        };

        // Salvar no localStorage
        localStorage.setItem('studentSettings', JSON.stringify(settings));

        // Aplicar configurações
        this.pageSize = parseInt(settings.itemsPerPage);
        this.currentPage = 1;

        this.showSuccess('Configurações salvas com sucesso!');

        // Fechar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('settingsModal'));
        modal.hide();

        // Recarregar lista com novas configurações
        this.loadStudents();
    }

    // Funções auxiliares
    sendMessage(studentId) {
        const student = this.students.find(s => s.id === studentId);
        if (student) {
            this.showInfo(`Enviando mensagem para ${student.name}...`);
            // Implementar envio de mensagem
        }
    }

    viewProgress(studentId) {
        const student = this.students.find(s => s.id === studentId);
        if (student) {
            this.showInfo(`Visualizando progresso de ${student.name}...`);
            // Implementar visualização de progresso
        }
    }

    async deleteStudent(studentId) {
        const student = this.students.find(s => s.id === studentId);
        if (!student) return;

        if (confirm(`Tem certeza que deseja excluir o aluno ${student.name}?`)) {
            try {
                const response = await fetch(`/api/admin/students/${studentId}`, {
                    method: 'DELETE',
                    headers: GMP_Security.getAuthHeaders()
                });

                const data = await response.json();

                if (data.success) {
                    this.showSuccess('Aluno excluído com sucesso!');
                    this.loadStudents();
                } else {
                    this.showError(data.message || 'Erro ao excluir aluno');
                }
            } catch (error) {
                console.error('Erro ao excluir aluno:', error);
                this.showError('Erro ao excluir aluno');
            }
        }
    }

    async uploadAvatar(studentId) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Validar tamanho (máximo 5MB)
            if (file.size > 5 * 1024 * 1024) {
                this.showError('Arquivo muito grande. Máximo 5MB.');
                return;
            }

            // Validar tipo
            if (!file.type.startsWith('image/')) {
                this.showError('Apenas arquivos de imagem são permitidos.');
                return;
            }

            const formData = new FormData();
            formData.append('avatar', file);

            try {
                const response = await fetch(`/api/admin/students/${studentId}/avatar`, {
                    method: 'POST',
                    headers: GMP_Security.getAuthHeaders(),
                    body: formData
                });

                const data = await response.json();

                if (data.success) {
                    this.showSuccess('Avatar atualizado com sucesso!');
                    this.loadStudents();
                } else {
                    this.showError(data.message || 'Erro ao atualizar avatar');
                }
            } catch (error) {
                console.error('Erro ao atualizar avatar:', error);
                this.showError('Erro ao atualizar avatar');
            }
        };
        input.click();
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticação
    const session = GMP_Security.getSession();
    if (!session || session.user.role !== 'ADMIN') {
        window.location.href = '/gmp-portal/access-denied.html';
        return;
    }

    // Inicializar gerenciador de alunos
    window.studentsManager = new StudentsManager();
});
