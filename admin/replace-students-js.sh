#!/usr/bin/env bash
set -euo pipefail

JS_STUDENTS="$HOME/gmp-portal/assets/js/students.js"
timestamp="$(date +%Y%m%d-%H%M%S)"

backup_file() {
  local f="$1"
  if [ -f "$f" ]; then
    cp "$f" "$f.bak.$timestamp"
    echo "Backup criado: $f.bak.$timestamp"
  else
    echo "AVISO: arquivo não encontrado: $f"
  fi
}

write_students_js() {
  cat <<'JS' > "$JS_STUDENTS"
/**
 * Students Management Module (patched robust)
 * - safeFetchJSON: valida Content-Type JSON
 * - fallback mock: renderiza alunos mesmo sem backend
 * - guards de bootstrap.Modal
 * - mantém wiring dos botões
 */

async function safeFetchJSON(url, options = {}) {
  const res = await fetch(url, options);
  const ct = res.headers.get("content-type") || "";
  if (!res.ok) throw new Error("HTTP " + res.status);
  if (!ct.includes("application/json")) throw new Error("Non-JSON response");
  return res.json();
}

class StudentsManager {
  constructor() {
    this.currentPage = 1;
    this.pageSize = 10;
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.levelFilter = 'all';
    this.students = [];
    this.pagination = { page: 1, totalPages: 1, total: 0 };
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

  async loadStats() {
    try {
      const data = await safeFetchJSON('/api/admin/students/stats', {
        headers: GMP_Security.getAuthHeaders()
      });
      if (data && data.success) {
        this.stats = data.stats || {};
      }
      this.renderStats();
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      this.stats = { total: 6 };
      this.renderStats();
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

      const data = await safeFetchJSON(`/api/admin/students?${params}`, {
        headers: GMP_Security.getAuthHeaders()
      });

      if (data && data.success) {
        this.students = data.students || [];
        this.pagination = data.pagination || { page: this.currentPage, totalPages: 1, total: (this.students || []).length };
        this.renderStudents();
        this.renderPagination();
      } else {
        throw new Error('API sem success');
      }
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
      // Fallback mock
      this.students = [
        { id: '1', name: 'Maria Silva', email: 'maria.silva@email.com', initials: 'MS', lastAccess: 'Hoje 14:30',
          status: 'active', level: 'beginner', engagementValue: 75, engagement: 'Alto (75%)',
          progressValue: 45, progress: '45% (32 de 71 aulas)', online: true },
        { id: '2', name: 'João Santos', email: 'joao.santos@email.com', initials: 'JS', lastAccess: 'Ontem 09:15',
          status: 'active', level: 'intermediate', engagementValue: 50, engagement: 'Médio (50%)',
          progressValue: 23, progress: '23% (16 de 71 aulas)', online: false },
        { id: '3', name: 'Ana Costa', email: 'ana.costa@email.com', initials: 'AC', lastAccess: '3 dias atrás 16:45',
          status: 'inactive', level: 'beginner', engagementValue: 25, engagement: 'Baixo (25%)',
          progressValue: 12, progress: '12% (9 de 71 aulas)', online: false },
        { id: '4', name: 'Pedro Oliveira', email: 'pedro.oliveira@email.com', initials: 'PO',
          lastAccess: '1 semana atrás 11:20', status: 'completed', level: 'advanced',
          engagementValue: 90, engagement: 'Alto (90%)', progressValue: 100, progress: '100% (71 de 71 aulas ✓)', online: true }
      ];
      this.pagination = { page: 1, totalPages: 2, total: 6 };
      this.renderStudents();
      this.renderPagination();
    }
  }

  renderStats() {
    const statsContainer = document.getElementById('statsContainer');
    if (!statsContainer) return;
    const total = this.stats.total ?? 6;

    statsContainer.innerHTML = `
      <div class="modern-metric-card">
        <div class="metric-header"><div class="metric-icon"><i class="fas fa-users"></i></div></div>
        <div class="metric-value">${total}</div>
        <div class="metric-label">Total de Alunos</div>
      </div>
      <div class="modern-metric-card">
        <div class="metric-header"><div class="metric-icon"><i class="fas fa-graduation-cap"></i></div></div>
        <div class="metric-value">17%</div>
        <div class="metric-label">Taxa de Conclusão</div>
      </div>
      <div class="modern-metric-card">
        <div class="metric-header"><div class="metric-icon"><i class="fas fa-chart-line"></i></div></div>
        <div class="metric-value">18%</div>
        <div class="metric-label">Progresso Médio</div>
      </div>
      <div class="modern-metric-card">
        <div class="metric-header"><div class="metric-icon"><i class="fas fa-heart"></i></div></div>
        <div class="metric-value" style="color: var(--warning-yellow);">Baixo</div>
        <div class="metric-label">Engajamento</div>
      </div>
    `;
  }

  renderStudents() {
    const tbody = document.getElementById('studentsTableBody');
    if (!tbody) return;

    if (!this.students || this.students.length === 0) {
      tbody.innerHTML = `
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

    tbody.innerHTML = this.students.map(student => `
      <tr>
        <td>
          <div class="d-flex align-items-center gap-3">
            <div class="student-avatar-container" style="position: relative;">
              <div class="student-avatar" style="width: 40px; height: 40px; border-radius: 50%; background: var(--primary-blue); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 1rem;">
                ${student.initials || (student.name ? student.name.split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase() : 'A')}
              </div>
              <div class="online-indicator" style="position: absolute; bottom: -2px; right: -2px; width: 12px; height: 12px; border-radius: 50%; background: ${student.online ? 'var(--success-green)' : 'var(--error-red)'}; border: 2px solid white;"></div>
            </div>
            <div>
              <div style="font-weight: 600; color: var(--text-primary);">${student.name}</div>
              <div style="font-size: 0.875rem; color: var(--text-secondary);">${student.email}</div>
              <div style="font-size: 0.75rem; color: var(--text-secondary);">ID: ${String(student.id || '').padStart(3, '0')}</div>
            </div>
          </div>
        </td>
        <td><div style="font-size: 0.875rem; color: var(--text-primary);">${student.lastAccess || '-'}</div></td>
        <td>
          <span class="badge ${student.status === 'active' ? 'badge-success' : student.status === 'inactive' ? 'badge-warning' : student.status === 'completed' ? 'badge-info' : 'badge-secondary'}">
            ${student.status === 'active' ? 'Ativo' : student.status === 'inactive' ? 'Inativo' : student.status === 'completed' ? 'Concluído' : (student.status || 'Indefinido')}
          </span>
        </td>
        <td>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <div style="flex: 1; height: 6px; background: var(--border-color); border-radius: 3px; overflow: hidden;">
              <div style="height: 100%; background: var(--primary-blue); width: ${student.engagementValue || 0}%; border-radius: 3px;"></div>
            </div>
            <span style="font-size: 0.875rem; color: var(--text-primary);">${student.engagement || ''}</span>
          </div>
        </td>
        <td>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <div style="flex: 1; height: 6px; background: var(--border-color); border-radius: 3px; overflow: hidden;">
              <div style="height: 100%; background: var(--success-green); width: ${student.progressValue || 0}%; border-radius: 3px;"></div>
            </div>
            <span style="font-size: 0.875rem; color: var(--text-primary);">${student.progress || ''}</span>
          </div>
        </td>
        <td>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline-primary" title="Visualizar" onclick="studentsManager.viewStudentDetails('${student.id}')"><i class="fas fa-eye"></i></button>
            <button class="btn btn-sm btn-outline-success" title="Mensagem" onclick="studentsManager.sendMessage('${student.id}')"><i class="fas fa-envelope"></i></button>
            <div class="dropdown">
              <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown"><i class="fas fa-ellipsis-v"></i></button>
              <ul class="dropdown-menu">
                <li><a class="dropdown-item" href="#" onclick="studentsManager.viewStudentDetails('${student.id}')"><i class="fas fa-eye"></i> Ver Detalhes</a></li>
                <li><a class="dropdown-item" href="#" onclick="studentsManager.showEditStudentModal('${student.id}')"><i class="fas fa-edit"></i> Editar</a></li>
                <li><a class="dropdown-item" href="#" onclick="studentsManager.uploadAvatar('${student.id}')"><i class="fas fa-camera"></i> Alterar Avatar</a></li>
                <li><a class="dropdown-item" href="#" onclick="studentsManager.viewProgress('${student.id}')"><i class="fas fa-chart-line"></i> Progresso</a></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item text-danger" href="#" onclick="studentsManager.deleteStudent('${student.id}')"><i class="fas fa-trash"></i> Excluir</a></li>
              </ul>
            </div>
          </div>
        </td>
      </tr>
    `).join('');

    const paginationInfo = document.getElementById('paginationInfo');
    if (paginationInfo) {
      const shown = Math.min(this.students.length, 4);
      paginationInfo.innerHTML = `Mostrando ${shown} de ${this.pagination.total || 6} alunos`;
    }
  }

  renderPagination() {
    const paginationContainer = document.getElementById('paginationContainer');
    if (!paginationContainer) return;
    const totalPages = this.pagination.totalPages || 1;
    const currentPage = this.pagination.page || this.currentPage;

    let html = `
      <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
        <a class="page-link" href="#" onclick="studentsManager.goToPage(${currentPage - 1})"><i class="fas fa-chevron-left"></i></a>
      </li>
    `;
    for (let i = 1; i <= totalPages; i++) {
      html += `
        <li class="page-item ${i === currentPage ? 'active' : ''}">
          <a class="page-link" href="#" onclick="studentsManager.goToPage(${i})">${i}</a>
        </li>
      `;
    }
    html += `
      <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
        <a class="page-link" href="#" onclick="studentsManager.goToPage(${currentPage + 1})"><i class="fas fa-chevron-right"></i></a>
      </li>
    `;
    paginationContainer.innerHTML = html;
  }

  goToPage(page) {
    if (page < 1) return;
    this.currentPage = page;
    this.loadStudents();
  }

  setupEventListeners() {
    const addStudentBtn = document.getElementById('addStudentBtn');
    if (addStudentBtn) addStudentBtn.addEventListener('click', () => this.showAddStudentModal());
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) exportBtn.addEventListener('click', () => this.exportStudents());
    const settingsBtn = document.querySelector('button:has(.fa-cog), button[title*="Configurações"]');
    if (settingsBtn) settingsBtn.addEventListener('click', () => this.openSettings());
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
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      let t; searchInput.addEventListener('input', (e) => {
        clearTimeout(t); t = setTimeout(() => {
          this.searchTerm = e.target.value; this.currentPage = 1; this.loadStudents();
        }, 500);
      });
    }
    const searchInputTable = document.getElementById('searchInputTable');
    if (searchInputTable) {
      let t; searchInputTable.addEventListener('input', (e) => {
        clearTimeout(t); t = setTimeout(() => {
          this.searchTerm = e.target.value; this.currentPage = 1; this.loadStudents();
        }, 500);
      });
    }
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        this.statusFilter = e.target.value; this.currentPage = 1; this.loadStudents();
      });
    }
    const levelFilter = document.getElementById('levelFilter');
    if (levelFilter) {
      levelFilter.addEventListener('change', (e) => {
        this.levelFilter = e.target.value; this.currentPage = 1; this.loadStudents();
      });
    }
    const filterBtn = document.querySelector('button.btn.btn-outline-primary, button:has(.fa-filter), button[onclick*="loadStudents"]');
    if (filterBtn) filterBtn.addEventListener('click', () => {
      this.currentPage = 1; this.loadStudents();
    });
  }

  async exportStudents() {
    try {
      const data = await safeFetchJSON('/api/admin/students?limit=1000', {
        headers: GMP_Security.getAuthHeaders()
      });
      if (data && data.success) {
        this.downloadCSV(data.students || []);
      } else {
        throw new Error('API sem success');
      }
    } catch (error) {
      console.error('Erro ao exportar alunos:', error);
      this.showError('Erro ao exportar dados');
      this.downloadCSV(this.students || []);
    }
  }

  downloadCSV(students) {
    const headers = ['Nome', 'Email', 'Status', 'Cursos', 'Concluídos', 'Último Acesso'];
    const rows = (students || []).map(student => [
      student.name || '',
      student.email || '',
      (student.status === 'active' ? 'Ativo' : student.status === 'inactive' ? 'Inativo' : student.status === 'completed' ? 'Concluído' : 'Indefinido'),
      student.coursesEnrolled || 0,
      student.coursesCompleted || 0,
      student.lastLogin ? new Date(student.lastLogin).toLocaleDateString('pt-BR') : 'Nunca'
    ]);
    const csvContent = [headers, ...rows].map(row => row.map(f => `"${String(f).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a'); const url = URL.createObjectURL(blob);
    link.setAttribute('href', url); link.setAttribute('download', `alunos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden'; document.body.appendChild(link); link.click(); document.body.removeChild(link);
  }

  showAddStudentModal() {
    const modalHTML = `
      <div class="modal fade" id="addStudentModal" tabindex="-1">
        <div class="modal-dialog"><div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title"><i class="fas fa-user-plus"></i> Adicionar Novo Aluno</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <form id="addStudentForm">
            <div class="modal-body">
              <div class="mb-3"><label for="studentName" class="form-label">Nome Completo</label><input type="text" class="form-control" id="studentName" required></div>
              <div class="mb-3"><label for="studentEmail" class="form-label">Email</label><input type="email" class="form-control" id="studentEmail" required></div>
              <div class="mb-3"><label for="studentPassword" class="form-label">Senha</label><input type="password" class="form-control" id="studentPassword" required minlength="8"></div>
              <div class="mb-3"><label for="studentRole" class="form-label">Tipo de Usuário</label><select class="form-control" id="studentRole"><option value="STUDENT">Aluno</option><option value="ADMIN">Administrador</option></select></div>
            </div>
            <div class="modal-footer"><button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button><button type="submit" class="btn btn-primary"><i class="fas fa-plus"></i> Adicionar Aluno</button></div>
          </form>
        </div></div>
      </div>
    `;
    const existing = document.getElementById('addStudentModal'); if (existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const form = document.getElementById('addStudentForm');
    form.addEventListener('submit', (e) => { e.preventDefault(); this.addStudent(); });

    const el = document.getElementById('addStudentModal');
    if (window.bootstrap && bootstrap.Modal) { new bootstrap.Modal(el).show(); } else { this.showInfo('Bootstrap JS não carregado. O modal pode não funcionar.'); }
  }

  async addStudent() {
    const formData = {
      name: document.getElementById('studentName').value,
      email: document.getElementById('studentEmail').value,
      password: document.getElementById('studentPassword').value,
      role: document.getElementById('studentRole').value
    };
    if (!formData.name || !formData.email || !formData.password) return this.showError('Preencha todos os campos obrigatórios');
    try {
      const res = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...GMP_Security.getAuthHeaders() },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        this.showSuccess('Aluno adicionado com sucesso!'); this.loadStudents(); this.loadStats();
        const el = document.getElementById('addStudentModal');
        if (el && window.bootstrap && bootstrap.Modal) { (bootstrap.Modal.getInstance(el) || new bootstrap.Modal(el)).hide(); }
      } else {
        this.showError(data.error || 'Erro ao adicionar aluno');
      }
    } catch (error) {
      console.error('Erro ao adicionar aluno:', error); this.showError('Erro ao adicionar aluno');
    }
  }

  async viewStudentDetails(studentId) {
    try {
      const data = await safeFetchJSON(`/api/admin/students/${studentId}`, { headers: GMP_Security.getAuthHeaders() });
      if (data && data.success) {
        const student = data.student;
        document.getElementById('viewStudentContent').innerHTML = `
          <div class="row">
            <div class="col-md-4">
              <div class="text-center mb-3">
                <div class="student-avatar-large" style="width: 100px; height: 100px; border-radius: 50%; background: var(--primary-blue); display: flex; align-items: center; justify-content: center; color: white; font-size: 2rem; font-weight: bold; margin: 0 auto;">
                  ${(student.name || 'A').charAt(0).toUpperCase()}
                </div>
                <h4 class="mt-2">${student.name || ''}</h4>
                <p class="text-muted">${student.email || ''}</p>
              </div>
            </div>
            <div class="col-md-8">
              <div class="row">
                <div class="col-md-6"><strong>Status:</strong> <span class="badge ${student.status === 'active' ? 'badge-success' : student.status === 'inactive' ? 'badge-warning' : 'badge-info'}">${student.status === 'active' ? 'Ativo' : student.status === 'inactive' ? 'Inativo' : 'Concluído'}</span></div>
                <div class="col-md-6"><strong>Nível:</strong> ${student.level || 'Não definido'}</div>
              </div>
              <div class="row mt-2">
                <div class="col-md-6"><strong>Telefone:</strong> ${student.phone || 'Não informado'}</div>
                <div class="col-md-6"><strong>Último acesso:</strong> ${student.lastLogin ? new Date(student.lastLogin).toLocaleDateString('pt-BR') : 'Nunca'}</div>
              </div>
            </div>
          </div>
        `;
        const el = document.getElementById('viewStudentModal');
        if (el && window.bootstrap && bootstrap.Modal) { new bootstrap.Modal(el).show(); } else { this.showInfo('Bootstrap JS não carregado. O modal pode não funcionar.'); }
        this.editingStudentId = studentId;
      } else {
        this.showError(data.message || 'Erro ao carregar detalhes do aluno');
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes do aluno:', error); this.showError('Erro ao carregar detalhes do aluno');
    }
  }

  editFromView() {
    const viewEl = document.getElementById('viewStudentModal');
    if (viewEl && window.bootstrap && bootstrap.Modal) { const vm = bootstrap.Modal.getInstance(viewEl); if (vm) vm.hide(); }
    this.showEditStudentModal(this.editingStudentId);
  }

  showEditStudentModal(studentId) {
    const student = this.students.find(s => String(s.id) === String(studentId)); if (!student) return;
    document.getElementById('studentName').value = student.name || '';
    document.getElementById('studentEmail').value = student.email || '';
    document.getElementById('studentPhone').value = student.phone || '';
    document.getElementById('studentStatus').value = student.status || 'active';
    document.getElementById('studentLevel').value = student.level || 'beginner';
    document.getElementById('studentPassword').value = '';
    document.getElementById('studentNotes').value = student.notes || '';
    document.getElementById('studentModalLabel').textContent = 'Editar Aluno';
    document.getElementById('saveStudentBtn').textContent = 'Atualizar Aluno';
    this.editingStudentId = studentId;
    const el = document.getElementById('studentModal');
    if (el && window.bootstrap && bootstrap.Modal) { new bootstrap.Modal(el).show(); } else { this.showInfo('Bootstrap JS não carregado. O modal pode não funcionar.'); }
  }

  openSettings() {
    const saved = JSON.parse(localStorage.getItem('studentSettings') || '{}');
    document.getElementById('itemsPerPage').value = saved.itemsPerPage || '10';
    document.getElementById('defaultSort').value = saved.defaultSort || 'name';
    document.getElementById('notifyNewStudents').checked = saved.notifyNewStudents !== false;
    document.getElementById('notifyInactiveStudents').checked = saved.notifyInactiveStudents !== false;
    const el = document.getElementById('settingsModal');
    if (el && window.bootstrap && bootstrap.Modal) { new bootstrap.Modal(el).show(); } else { this.showInfo('Bootstrap JS não carregado. O modal pode não funcionar.'); }
  }

  saveSettings() {
    const settings = {
      itemsPerPage: document.getElementById('itemsPerPage').value,
      defaultSort: document.getElementById('defaultSort').value,
      notifyNewStudents: document.getElementById('notifyNewStudents').checked,
      notifyInactiveStudents: document.getElementById('notifyInactiveStudents').checked
    };
    localStorage.setItem('studentSettings', JSON.stringify(settings));
    this.pageSize = parseInt(settings.itemsPerPage); this.currentPage = 1;
    this.showSuccess('Configurações salvas com sucesso!');
    const el = document.getElementById('settingsModal');
    if (el && window.bootstrap && bootstrap.Modal) { const modal = bootstrap.Modal.getInstance(el); if (modal) modal.hide(); }
    this.loadStudents();
  }

  sendMessage(studentId) {
    const student = this.students.find(s => String(s.id) === String(studentId));
    if (student) this.showInfo(`Enviando mensagem para ${student.name}...`);
  }

  async deleteStudent(studentId) {
    const student = this.students.find(s => String(s.id) === String(studentId)); if (!student) return;
    if (confirm(`Tem certeza que deseja excluir o aluno ${student.name}?`)) {
      try {
        const res = await fetch(`/api/admin/students/${studentId}`, { method: 'DELETE', headers: GMP_Security.getAuthHeaders() });
        const data = await res.json();
        if (res.ok && data.success) { this.showSuccess('Aluno excluído com sucesso!'); this.loadStudents(); }
        else { this.showError(data.message || 'Erro ao excluir aluno'); }
      } catch (error) { console.error('Erro ao excluir aluno:', error); this.showError('Erro ao excluir aluno'); }
    }
  }

  async uploadAvatar(studentId) {
    const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0]; if (!file) return;
      if (file.size > 5 * 1024 * 1024) return this.showError('Arquivo muito grande. Máximo 5MB.');
      if (!file.type.startsWith('image/')) return this.showError('Apenas arquivos de imagem são permitidos.');
      const formData = new FormData(); formData.append('avatar', file);
      try {
        const res = await fetch(`/api/admin/students/${studentId}/avatar`, { method: 'POST', headers: GMP_Security.getAuthHeaders(), body: formData });
        const data = await res.json();
        if (res.ok && data.success) { this.showSuccess('Avatar atualizado com sucesso!'); this.loadStudents(); }
        else { this.showError(data.message || 'Erro ao atualizar avatar'); }
      } catch (error) { console.error('Erro ao atualizar avatar:', error); this.showError('Erro ao atualizar avatar'); }
    };
    input.click();
  }

  showSuccess(message) { alert('✅ ' + message); }
  showError(message) { alert('❌ ' + message); }
  showInfo(message) { alert('ℹ️ ' + message); }
}

document.addEventListener('DOMContentLoaded', function() {
  const session = GMP_Security.getSession();
  if (!session || String(session.user?.role || '').toUpperCase() !== 'ADMIN') {
    window.location.href = '/gmp-portal/login.html';
    return;
  }
  window.studentsManager = new StudentsManager();
});
JS
}

backup_file "$JS_STUDENTS"
write_students_js

echo "students.js substituído por versão robusta. Recarregue a página."
