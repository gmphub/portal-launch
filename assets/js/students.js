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
        this.levelFilter = 'all';
        this.students = [];
        this.stats = {};
        this.selectedStudent = null;
        this.editingStudentId = null;
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

    getAuthHeaders() {
        try {
            return (typeof GMP_Security !== 'undefined' && GMP_Security && typeof GMP_Security.getAuthHeaders === 'function')
                ? GMP_Security.getAuthHeaders()
                : {};
        } catch (error) {
            console.warn('GMP_Security not available, using empty headers');
            return {};
        }
    }

    async loadStats() {
        try {
            const response = await fetch('/api/admin/students/stats', {
                headers: this.getAuthHeaders()
            });
            const data = await response.json();
            if (data.success) {
                this.stats = data.stats;
                this.renderStats();
            }
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
            this.showError('Erro ao carregar estatísticas');
        }
    }

    async loadStudents() {
        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.pageSize,
                search: this.searchTerm,
                status: this.statusFilter,
                level: this.levelFilter
            });
            const response = await fetch(`/api/admin/students?${params}`, {
                headers: this.getAuthHeaders()
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
        const totalStudents = document.getElementById('totalStudents');
        const completionRate = document.getElementById('completionRate');
        const avgProgress = document.getElementById('avgProgress');
        const engagementLevel = document.getElementById('engagementLevel');
        
        if (totalStudents) totalStudents.textContent = this.stats.total || 0;
        if (completionRate) completionRate.textContent = `${this.stats.completionRate || 0}%`;
        if (avgProgress) avgProgress.textContent = `${this.stats.avgProgress || 0}%`;
        
        // Update engagement level
        if (engagementLevel && this.stats.avgEngagement !== undefined) {
            const engagement = this.stats.avgEngagement;
            const label = engagement >= 70 ? 'Alto' : engagement >= 40 ? 'Médio' : 'Baixo';
            const color = engagement >= 70 ? 'var(--success-green)' : engagement >= 40 ? 'var(--warning-yellow)' : 'var(--danger-red)';
            engagementLevel.textContent = label;
            engagementLevel.style.color = color;
        }
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
        studentsTableBody.innerHTML = this.students.map(student => {
            const initials = (student.name || '').split(' ').map(n => n ? n[0] : '').join('').substring(0, 2).toUpperCase();
            const lastLoginDate = student.lastLogin ? new Date(student.lastLogin) : null;
            const isOnline = lastLoginDate && (Date.now() - lastLoginDate.getTime()) < 5 * 60 * 1000;
            const status = (student.status || 'ACTIVE').toUpperCase();
            const statusLabel = status === 'ACTIVE' ? 'Ativo' : status === 'INACTIVE' ? 'Inativo' : 'Concluído';
            const engagement = typeof student.engagement === 'number' ? student.engagement : (student.engagementValue || 0);
            const engagementLabel = engagement >= 70 ? 'Alto' : engagement >= 40 ? 'Médio' : 'Baixo';
            const engagementColor = engagement >= 70 ? 'var(--success-green)' : engagement >= 40 ? 'var(--warning-yellow)' : 'var(--error-red)';
            const progress = typeof student.progress === 'number' ? student.progress : (student.progressValue || 0);
            const lastAccess = lastLoginDate ? lastLoginDate.toLocaleString('pt-BR') : 'Nunca';
            const showReactivate = status === 'INACTIVE';
            const showCertificate = status === 'COMPLETED' || progress === 100;

            // Generate unique ID for dropdown
            const dropdownId = `dropdown-${student.id}`;

            return `
                <tr>
                    <td>
                        <div class="d-flex align-items-center gap-3">
                            <div style="position: relative;">
                                <div class="user-avatar" style="width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;background:linear-gradient(135deg,var(--primary-blue),var(--primary-green));font-weight:600;">
                                    ${initials || 'U'}
                                </div>
                                ${isOnline ? '<div style="position: absolute; bottom: -2px; right: -2px; width: 12px; height: 12px; border-radius: 50%; background: var(--success-green); border: 2px solid white;"></div>' : ''}
                            </div>
                            <div>
                                <div style="font-weight: 500; font-size: 16px; color: var(--text-primary);">${student.name || '—'}</div>
                                <div style="font-size: 14px; color: var(--text-secondary);">${student.email || '—'}</div>
                                <small style="color: var(--text-muted);">ID: ${student.id}</small>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div style="font-weight: 500; color: var(--text-primary);">${lastAccess}</div>
                        <small style="color: ${isOnline ? 'var(--success-green)' : 'var(--text-secondary)'};">● ${isOnline ? 'Online' : 'Offline'}</small>
                    </td>
                    <td>
                        <span class="btn" style="font-size: 12px; padding: 6px 12px; border-radius: 20px; background: ${status === 'ACTIVE' ? 'var(--success-green)' : status === 'INACTIVE' ? 'var(--warning-yellow)' : 'var(--primary-blue)'}; color: white;">
                            ${statusLabel}
                        </span>
                    </td>
                    <td>
                        <div class="d-flex align-items-center gap-2">
                            <div class="progress" style="width: 60px; height: 6px; background: var(--border-color); border-radius: 3px;">
                                <div class="progress-bar" style="width: ${engagement}%; background: ${engagementColor}; border-radius: 3px;"></div>
                            </div>
                            <span style="font-size: 14px; font-weight: 500; color: ${engagementColor};">${engagementLabel} (${engagement}%)</span>
                        </div>
                    </td>
                    <td>
                        <div class="d-flex align-items-center gap-2">
                            <div class="progress" style="width: 80px; height: 6px; background: var(--border-color); border-radius: 3px;">
                                <div class="progress-bar" style="width: ${progress}%; background: linear-gradient(90deg, var(--primary-blue), var(--primary-yellow)); border-radius: 3px;"></div>
                            </div>
                            <span style="font-size: 14px; font-weight: 500;">${progress}%</span>
                        </div>
                    </td>
                    <td>
                        <div class="d-flex gap-1">
                            <button class="btn btn-outline btn-sm" title="Ver perfil" onclick="studentsManager.viewStudentDetails('${student.id}')">
                                <i class="fas fa-eye"></i>
                            </button>
                            ${showReactivate ? `
                                <button class="btn btn-outline btn-sm" title="Reativar aluno" onclick="studentsManager.reactivateStudent('${student.id}')">
                                    <i class="fas fa-play"></i>
                                </button>
                            ` : showCertificate ? `
                                <button class="btn btn-outline btn-sm" title="Enviar certificado" onclick="studentsManager.sendCertificate('${student.id}')">
                                    <i class="fas fa-certificate"></i>
                                </button>
                            ` : `
                                <button class="btn btn-outline btn-sm" title="Enviar mensagem" onclick="studentsManager.sendMessage('${student.id}')">
                                    <i class="fas fa-envelope"></i>
                                </button>
                            `}
                            <!-- Dropdown for More Options -->
                            <div class="dropdown">
                                <button class="btn btn-outline btn-sm dropdown-toggle" type="button" id="${dropdownId}" data-bs-toggle="dropdown" aria-expanded="false">
                                    <i class="fas fa-ellipsis-v"></i>
                                </button>
                                <ul class="dropdown-menu" aria-labelledby="${dropdownId}">
                                    <li><a class="dropdown-item" href="#" onclick="studentsManager.viewStudentDetails('${student.id}'); event.preventDefault();"><i class="fas fa-eye me-2"></i> Ver Perfil</a></li>
                                    <li><a class="dropdown-item" href="#" onclick="studentsManager.showEditStudentModal('${student.id}'); event.preventDefault();"><i class="fas fa-edit me-2"></i> Editar</a></li>
                                    <li><a class="dropdown-item" href="#" onclick="studentsManager.sendMessage('${student.id}'); event.preventDefault();"><i class="fas fa-envelope me-2"></i> Enviar Mensagem</a></li>
                                    <li><a class="dropdown-item" href="#" onclick="studentsManager.viewProgress('${student.id}'); event.preventDefault();"><i class="fas fa-chart-line me-2"></i> Ver Progresso</a></li>
                                    <li><a class="dropdown-item" href="#" onclick="studentsManager.uploadAvatar('${student.id}'); event.preventDefault();"><i class="fas fa-image me-2"></i> Alterar Avatar</a></li>
                                    <li><hr class="dropdown-divider"></li>
                                    <li><a class="dropdown-item text-danger" href="#" onclick="studentsManager.deleteStudent('${student.id}'); event.preventDefault();"><i class="fas fa-trash me-2"></i> Excluir</a></li>
                                </ul>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        const paginationInfo = document.getElementById('paginationInfo');
        if (paginationInfo) {
            const start = (this.currentPage - 1) * this.pageSize + 1;
            const end = start + this.students.length - 1;
            const total = this.pagination?.total || 0;
            paginationInfo.innerHTML = `<i class="fas fa-info-circle"></i> Mostrando ${start}-${end} de ${total} alunos`;
        }
    }

    renderPagination() {
        const paginationButtons = document.getElementById('paginationButtons');
        if (!paginationButtons) return;
        const totalPages = this.pagination?.totalPages || 1;
        const currentPage = this.currentPage || 1;
        let paginationHTML = `
            <button class="btn-modern btn-modern-secondary" ${currentPage === 1 ? 'disabled' : ''} onclick="studentsManager.goToPage(${currentPage - 1})">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) {
                paginationHTML += `
                    <button class="btn-modern ${i === currentPage ? 'btn-modern-primary' : 'btn-modern-secondary'}" onclick="studentsManager.goToPage(${i})">
                        ${i}
                    </button>
                `;
            }
        } else {
            paginationHTML += `<button class="btn-modern ${1 === currentPage ? 'btn-modern-primary' : 'btn-modern-secondary'}" onclick="studentsManager.goToPage(1)">1</button>`;
            if (currentPage > 4) paginationHTML += `<span style="padding: 0 0.5rem;">...</span>`;
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);
            for (let i = start; i <= end; i++) {
                paginationHTML += `
                    <button class="btn-modern ${i === currentPage ? 'btn-modern-primary' : 'btn-modern-secondary'}" onclick="studentsManager.goToPage(${i})">
                        ${i}
                    </button>
                `;
            }
            if (currentPage < totalPages - 3) paginationHTML += `<span style="padding: 0 0.5rem;">...</span>`;
            paginationHTML += `<button class="btn-modern ${totalPages === currentPage ? 'btn-modern-primary' : 'btn-modern-secondary'}" onclick="studentsManager.goToPage(${totalPages})">${totalPages}</button>`;
        }
        paginationHTML += `
            <button class="btn-modern btn-modern-secondary" ${currentPage === totalPages ? 'disabled' : ''} onclick="studentsManager.goToPage(${currentPage + 1})">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
        paginationButtons.innerHTML = paginationHTML;
    }

    goToPage(page) {
        if (page < 1 || page > (this.pagination?.totalPages || 1)) return;
        this.currentPage = page;
        this.loadStudents();
    }

    setupEventListeners() {
        const addStudentBtn = document.getElementById('addStudentBtn');
        if (addStudentBtn) addStudentBtn.addEventListener('click', () => this.showAddStudentModal());

        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) exportBtn.addEventListener('click', () => this.exportStudentsList());

        const settingsBtn = document.querySelector('button:has(.fa-cog), button[title*="Configurações"]');
        if (settingsBtn) settingsBtn.addEventListener('click', () => this.openSettings());

        // Event delegation for student actions (if you need it)
        const tableBody = document.getElementById("studentsTableBody");
        if (tableBody) {
            tableBody.addEventListener("click", (e) => {
                // Not needed anymore since we use direct onclick or dropdown
            });
        }

        this.setupModalEventListeners();
    }

    setupModalEventListeners() {
        const saveStudentBtn = document.getElementById('saveStudentBtn');
        if (saveStudentBtn) saveStudentBtn.addEventListener('click', () => this.saveStudent());

        const editFromViewBtn = document.getElementById('editFromViewBtn');
        if (editFromViewBtn) editFromViewBtn.addEventListener('click', () => this.editFromView());

        const saveSettingsBtn = document.getElementById('saveSettingsBtn');
        if (saveSettingsBtn) saveSettingsBtn.addEventListener('click', () => this.saveSettings());
    }

    setupSearchAndFilters() {
        const debounce = (func, delay) => {
            let timeoutId;
            return (...args) => {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => func.apply(this, args), delay);
            };
        };

        const handleSearch = (value) => {
            this.searchTerm = value;
            this.currentPage = 1;
            this.loadStudents();
        };

        // Find existing filter elements in HTML (don't create new ones)
        const searchInput = document.querySelector('.card-body input[placeholder="Buscar alunos..."]');
        const statusSelect = document.querySelector('.card-body select');
        const engagementSelect = document.querySelectorAll('.card-body select')[1];
        const filterBtn = document.querySelector('.card-body .btn-modern-primary');

        // Add event listeners to existing elements
        if (searchInput) {
            searchInput.addEventListener('input', debounce((e) => {
                this.searchTerm = e.target.value;
                this.currentPage = 1;
                this.loadStudents();
            }, 500));
        }

        if (statusSelect) {
            statusSelect.addEventListener('change', (e) => {
                this.statusFilter = e.target.value;
                this.currentPage = 1;
                this.loadStudents();
            });
        }

        if (engagementSelect) {
            engagementSelect.addEventListener('change', (e) => {
                this.levelFilter = e.target.value;
                this.currentPage = 1;
                this.loadStudents();
            });
        }

        if (filterBtn) {
            filterBtn.addEventListener('click', () => {
                const search = document.querySelector('.card-body input[placeholder="Buscar alunos..."]');
                const status = document.querySelector('.card-body select');
                const engagement = document.querySelectorAll('.card-body select')[1];
                
                if (search) this.searchTerm = search.value;
                if (status) this.statusFilter = status.value;
                if (engagement) this.levelFilter = engagement.value;
                
                this.currentPage = 1;
                this.loadStudents();
            });
        }
    }

    // Unified detail viewer
    async viewStudentDetails(studentId) {
        try {
            const response = await fetch(`/api/admin/students/${studentId}`, {
                headers: this.getAuthHeaders()
            });
            const data = await response.json();
            if (data.success) {
                const student = data.student;
                const viewStudentContent = document.getElementById('viewStudentContent');
                if (viewStudentContent) {
                    viewStudentContent.innerHTML = `
                        <div class="row">
                            <div class="col-md-4">
                                <div class="text-center mb-3">
                                    <div class="student-avatar-large" style="width: 100px; height: 100px; border-radius: 50%; background: var(--primary-blue); display: flex; align-items: center; justify-content: center; color: white; font-size: 2rem; font-weight: bold; margin: 0 auto;">
                                        ${student.name ? student.name.charAt(0).toUpperCase() : 'A'}
                                    </div>
                                    <h4 class="mt-2">${student.name || '—'}</h4>
                                    <p class="text-muted">${student.email || '—'}</p>
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
                }
                this.editingStudentId = studentId;
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
        const viewModal = bootstrap.Modal.getInstance(document.getElementById('viewStudentModal'));
        if (viewModal) viewModal.hide();
        this.showEditStudentModal(this.editingStudentId);
    }

    showEditStudentModal(studentId) {
        const student = this.students.find(s => s.id === studentId);
        if (!student) return;
        const modalHTML = `
            <div class="modal fade" id="studentModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Editar Aluno</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <form id="editStudentForm">
                            <div class="modal-body">
                                <div class="mb-3">
                                    <label for="studentName" class="form-label">Nome Completo</label>
                                    <input type="text" class="form-control" id="studentName" value="${student.name || ''}" required>
                                </div>
                                <div class="mb-3">
                                    <label for="studentEmail" class="form-label">Email</label>
                                    <input type="email" class="form-control" id="studentEmail" value="${student.email || ''}" required>
                                </div>
                                <div class="mb-3">
                                    <label for="studentPhone" class="form-label">Telefone</label>
                                    <input type="text" class="form-control" id="studentPhone" value="${student.phone || ''}">
                                </div>
                                <div class="mb-3">
                                    <label for="studentStatus" class="form-label">Status</label>
                                    <select class="form-control" id="studentStatus">
                                        <option value="active" ${student.status === 'active' ? 'selected' : ''}>Ativo</option>
                                        <option value="inactive" ${student.status === 'inactive' ? 'selected' : ''}>Inativo</option>
                                        <option value="completed" ${student.status === 'completed' ? 'selected' : ''}>Concluído</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="studentLevel" class="form-label">Nível</label>
                                    <select class="form-control" id="studentLevel">
                                        <option value="beginner" ${student.level === 'beginner' ? 'selected' : ''}>Iniciante</option>
                                        <option value="intermediate" ${student.level === 'intermediate' ? 'selected' : ''}>Intermediário</option>
                                        <option value="advanced" ${student.level === 'advanced' ? 'selected' : ''}>Avançado</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="studentPassword" class="form-label">Nova Senha (deixe em branco para manter)</label>
                                    <input type="password" class="form-control" id="studentPassword" minlength="8">
                                </div>
                                <div class="mb-3">
                                    <label for="studentNotes" class="form-label">Observações</label>
                                    <textarea class="form-control" id="studentNotes">${student.notes || ''}</textarea>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                                <button type="button" class="btn btn-primary" id="saveStudentBtn">Atualizar Aluno</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        const existingModal = document.getElementById('studentModal');
        if (existingModal) existingModal.remove();
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.getElementById('saveStudentBtn').addEventListener('click', () => this.saveStudent());
        this.editingStudentId = studentId;
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
        const existingModal = document.getElementById('addStudentModal');
        if (existingModal) existingModal.remove();
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const form = document.getElementById('addStudentForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addStudent();
        });
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
                    ...this.getAuthHeaders()
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

    async saveStudent() {
        const formData = {
            name: document.getElementById('studentName')?.value || '',
            email: document.getElementById('studentEmail')?.value || '',
            phone: document.getElementById('studentPhone')?.value || '',
            status: document.getElementById('studentStatus')?.value || 'active',
            level: document.getElementById('studentLevel')?.value || 'beginner',
            password: document.getElementById('studentPassword')?.value || '',
            notes: document.getElementById('studentNotes')?.value || ''
        };
        if (!formData.name || !formData.email || (!formData.password && !this.editingStudentId)) {
            this.showError('Preencha todos os campos obrigatórios');
            return;
        }
        try {
            const url = this.editingStudentId ? `/api/admin/students/${this.editingStudentId}` : '/api/admin/students';
            const method = this.editingStudentId ? 'PUT' : 'POST';
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders()
                },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            if (data.success) {
                this.showSuccess(this.editingStudentId ? 'Aluno atualizado com sucesso!' : 'Aluno adicionado com sucesso!');
                this.closeModal('studentModal');
                this.editingStudentId = null;
                this.loadStudents();
                this.loadStats();
            } else {
                this.showError(data.message || 'Erro ao salvar aluno');
            }
        } catch (error) {
            console.error('Erro ao salvar aluno:', error);
            this.showError('Erro ao salvar aluno');
        }
    }

    async deleteStudent(studentId) {
        if (!confirm('Tem certeza que deseja excluir este aluno? Esta ação não pode ser desfeita.')) return;
        try {
            const response = await fetch(`/api/admin/students/${studentId}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
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

    async reactivateStudent(studentId) {
        if (!confirm('Deseja reativar este aluno?')) return;
        try {
            const response = await fetch(`/api/admin/students/${studentId}/reactivate`, {
                method: 'POST',
                headers: this.getAuthHeaders()
            });
            const data = await response.json();
            if (data.success) {
                this.showSuccess('Aluno reativado com sucesso!');
                this.loadStudents();
            } else {
                this.showError(data.message || 'Erro ao reativar aluno');
            }
        } catch (error) {
            console.error('Erro ao reativar aluno:', error);
            this.showError('Erro ao reativar aluno');
        }
    }

    async sendCertificate(studentId) {
        if (!confirm('Deseja enviar o certificado para este aluno?')) return;
        try {
            const response = await fetch(`/api/admin/students/${studentId}/certificate`, {
                method: 'POST',
                headers: this.getAuthHeaders()
            });
            const data = await response.json();
            if (data.success) {
                this.showSuccess('Certificado enviado com sucesso!');
            } else {
                this.showError(data.message || 'Erro ao enviar certificado');
            }
        } catch (error) {
            console.error('Erro ao enviar certificado:', error);
            this.showError('Erro ao enviar certificado');
        }
    }

    async sendMessage(studentId) {
        const student = this.students.find(s => s.id === studentId);
        if (!student) {
            this.showError('Aluno não encontrado');
            return;
        }
        const modalHTML = `
            <div class="modal fade" id="sendMessageModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Enviar Mensagem para ${student.name}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label for="messageSubject" class="form-label">Assunto</label>
                                <input type="text" class="form-control" id="messageSubject" placeholder="Assunto da mensagem">
                            </div>
                            <div class="mb-3">
                                <label for="messageBody" class="form-label">Mensagem</label>
                                <textarea class="form-control" id="messageBody" rows="5" placeholder="Escreva sua mensagem aqui..."></textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" id="sendEmailBtn">Enviar Mensagem</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        const existingModal = document.getElementById('sendMessageModal');
        if (existingModal) existingModal.remove();
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.getElementById('sendEmailBtn').addEventListener('click', async () => {
            const subject = document.getElementById('messageSubject').value.trim();
            const body = document.getElementById('messageBody').value.trim();
            if (!subject || !body) {
                this.showError('Preencha assunto e mensagem');
                return;
            }
            try {
                const response = await fetch(`/api/admin/students/${studentId}/message`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...this.getAuthHeaders()
                    },
                    body: JSON.stringify({ subject, body })
                });
                const data = await response.json();
                if (data.success) {
                    this.showSuccess('Mensagem enviada com sucesso!');
                    const modal = bootstrap.Modal.getInstance(document.getElementById('sendMessageModal'));
                    modal.hide();
                } else {
                    this.showError(data.message || 'Erro ao enviar mensagem');
                }
            } catch (error) {
                console.error('Erro ao enviar mensagem:', error);
                this.showError('Erro ao enviar mensagem');
            }
        });
        const modal = new bootstrap.Modal(document.getElementById('sendMessageModal'));
        modal.show();
    }

    async exportStudentsList() {
        try {
            const headers = this.getAuthHeaders();
            if (!headers || !headers.Authorization) {
                throw new Error("Authentication token not available");
            }

            const response = await fetch('/api/admin/students/export', {
                method: 'GET',
                headers: headers
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server responded with ${response.status}: ${errorText}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            // Show success message
            this.showSuccess('Lista de alunos exportada com sucesso!');
        } catch (error) {
            console.error('Error exporting students:', error);
            this.showError(`Erro ao exportar lista: ${error.message}`);
        }
    }

    async importUsers() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv,.xlsx';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const formData = new FormData();
            formData.append('file', file);
            try {
                const response = await fetch('/api/admin/students/import', {
                    method: 'POST',
                    headers: this.getAuthHeaders(),
                    body: formData
                });
                const data = await response.json();
                if (data.success) {
                    this.showSuccess(`${data.imported} usuários importados!`);
                    this.loadStudents();
                } else {
                    this.showError(data.message || 'Erro ao importar usuários');
                }
            } catch (error) {
                console.error('Erro ao importar usuários:', error);
                this.showError('Erro ao importar usuários');
            }
        };
        input.click();
    }

    async createSegmentation() {
        const name = prompt('Nome da segmentação:');
        if (!name) return;
        const criteria = prompt('Critérios (ex: status=active,engagement>50):');
        if (!criteria) return;
        try {
            const response = await fetch('/api/admin/segments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders()
                },
                body: JSON.stringify({ name, criteria })
            });
            const data = await response.json();
            if (data.success) {
                this.showSuccess('Segmentação criada com sucesso!');
            } else {
                this.showError(data.message || 'Erro ao criar segmentação');
            }
        } catch (error) {
            console.error('Erro ao criar segmentação:', error);
            this.showError('Erro ao criar segmentação');
        }
    }

    showBulkMessageModal() {
        const message = prompt('Digite a mensagem para enviar a todos os alunos:');
        if (!message) return;
        if (confirm(`Enviar mensagem para todos os alunos?
"${message}"`)) {
            this.sendBulkMessage(message);
        }
    }

    async sendBulkMessage(message) {
        try {
            const response = await fetch('/api/admin/students/bulk-message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders()
                },
                body: JSON.stringify({ message })
            });
            const data = await response.json();
            if (data.success) {
                this.showSuccess(`Mensagem enviada para ${data.sent} alunos!`);
            } else {
                this.showError(data.message || 'Erro ao enviar mensagem');
            }
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            this.showError('Erro ao enviar mensagem em massa');
        }
    }

    showStudentOptions(studentId) {
        // This is now handled by the dropdown in renderStudents
    }

    async viewProgress(studentId) {
        this.showInfo('Funcionalidade de progresso será implementada em breve');
    }

    async uploadAvatar(studentId) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.style.display = 'none';
        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (file.size > 5 * 1024 * 1024) {
                this.showError('Arquivo muito grande. Máximo 5MB.');
                return;
            }
            if (!file.type.startsWith('image/')) {
                this.showError('Apenas arquivos de imagem são permitidos.');
                return;
            }
            try {
                const formData = new FormData();
                formData.append('avatar', file);
                const response = await fetch(`/api/admin/students/${studentId}/avatar`, {
                    method: 'POST',
                    headers: this.getAuthHeaders(),
                    body: formData
                });
                const data = await response.json();
                if (data.success) {
                    this.showSuccess('Avatar atualizado com sucesso!');
                    this.loadStudents();
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

    openSettings() {
        const savedSettings = JSON.parse(localStorage.getItem('studentSettings') || '{}');
        const modalHTML = `
            <div class="modal fade" id="settingsModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Configurações</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label for="itemsPerPage" class="form-label">Itens por página</label>
                                <select class="form-control" id="itemsPerPage">
                                    <option value="10" ${savedSettings.itemsPerPage === '10' ? 'selected' : ''}>10</option>
                                    <option value="25" ${savedSettings.itemsPerPage === '25' ? 'selected' : ''}>25</option>
                                    <option value="50" ${savedSettings.itemsPerPage === '50' ? 'selected' : ''}>50</option>
                                    <option value="100" ${savedSettings.itemsPerPage === '100' ? 'selected' : ''}>100</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="defaultSort" class="form-label">Ordenação padrão</label>
                                <select class="form-control" id="defaultSort">
                                    <option value="name" ${savedSettings.defaultSort === 'name' ? 'selected' : ''}>Nome</option>
                                    <option value="email" ${savedSettings.defaultSort === 'email' ? 'selected' : ''}>Email</option>
                                    <option value="lastLogin" ${savedSettings.defaultSort === 'lastLogin' ? 'selected' : ''}>Último acesso</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="notifyNewStudents" ${savedSettings.notifyNewStudents !== false ? 'checked' : ''}>
                                    <label class="form-check-label" for="notifyNewStudents">Notificar novos alunos</label>
                                </div>
                            </div>
                            <div class="mb-3">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="notifyInactiveStudents" ${savedSettings.notifyInactiveStudents !== false ? 'checked' : ''}>
                                    <label class="form-check-label" for="notifyInactiveStudents">Notificar alunos inativos</label>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" id="saveSettingsBtn">Salvar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        const existingModal = document.getElementById('settingsModal');
        if (existingModal) existingModal.remove();
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.getElementById('saveSettingsBtn').addEventListener('click', () => this.saveSettings());
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
        localStorage.setItem('studentSettings', JSON.stringify(settings));
        this.pageSize = parseInt(settings.itemsPerPage);
        this.currentPage = 1;
        this.showSuccess('Configurações salvas com sucesso!');
        this.closeModal('settingsModal');
        this.loadStudents();
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            const bootstrapModal = bootstrap.Modal.getInstance(modal);
            if (bootstrapModal) bootstrapModal.hide();
        }
    }

    showToast(message, type = 'success') {
        // Remove existing toast
        const existing = document.getElementById('toastContainer');
        if (existing) existing.remove();
        const toastHTML = `
            <div id="toastContainer" style="position: fixed; top: 20px; right: 20px; z-index: 9999;">
                <div class="alert alert-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info'} alert-dismissible fade show" role="alert">
                    ${message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', toastHTML);
        setTimeout(() => {
            const el = document.getElementById('toastContainer');
            if (el) el.remove();
        }, 5000);
    }

    showSuccess(message) { this.showToast(message, 'success'); }
    showError(message)  { this.showToast(message, 'error'); }
    showInfo(message)   { this.showToast(message, 'info'); }
}

document.addEventListener('DOMContentLoaded', function () {
    const session = typeof GMP_Security !== 'undefined' ? GMP_Security.getSession() : null;
    if (!session || session.user.role !== 'ADMIN') {
        window.location.href = '/gmp-portal/access-denied.html';
        return;
    }
    window.studentsManager = new StudentsManager();
});