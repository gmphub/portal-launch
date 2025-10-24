/**
 * StudentsManager - Complete working version matching students.html structure
 */

async function safeFetchJSON(url, options={}) {
  const res = await fetch(url, options);
  const ct = res.headers.get("content-type") || "";
  if (!res.ok || !ct.includes("application/json")) throw new Error("Non-JSON/404");
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
    this.stats = {};
    this.pagination = {page: 1, totalPages: 1, total: 0};
    this.init();
  }

  async init() {
    try {
      await this.loadStats();
      await this.loadStudents();
      this.setupEventListeners();
      this.setupSearchAndFilters();
    } catch(e) {
      console.error("Erro init:", e);
    }
  }

  async loadStats() {
    try {
      const data = await safeFetchJSON('/api/admin/students/stats', {
        headers: GMP_Security.getAuthHeaders()
      });
      if (data.success) this.stats = data.stats;
    } catch(e) {
      console.error("Erro stats:", e);
      this.stats = {total: 0, verified: 0, active: 0, newThisMonth: 0};
    }
    this.renderStats();
  }

  async loadStudents() {
    try {
      const params = new URLSearchParams({
        page: this.currentPage,
        limit: this.pageSize,
        search: this.searchTerm,
        status: this.statusFilter
      });
      const data = await safeFetchJSON(`/api/admin/students?${params}`, {
        headers: GMP_Security.getAuthHeaders()
      });
      if (data.success) {
        this.students = data.students;
        this.pagination = data.pagination;
      } else throw new Error("API sem success");
    } catch(e) {
      console.error("Erro alunos:", e);
      this.students = [];
      this.pagination = {page: 1, totalPages: 1, total: 0};
    }
    this.renderStudents();
    this.renderPagination();
  }

  renderStats() {
    // Update the metric cards in modern-metrics-grid
    const metricCards = document.querySelectorAll('.modern-metric-card');
    if (metricCards.length >= 4) {
      // Total students
      const totalValue = metricCards[0].querySelector('.metric-value');
      if (totalValue) totalValue.textContent = this.stats.total || 0;
      
      // Completion rate (calculate from active/total)
      const completionValue = metricCards[1].querySelector('.metric-value');
      if (completionValue) {
        const rate = this.stats.total > 0 ? Math.round((this.stats.verified / this.stats.total) * 100) : 0;
        completionValue.textContent = rate + '%';
      }
      
      // Average progress
      const progressValue = metricCards[2].querySelector('.metric-value');
      if (progressValue) {
        const avgProgress = this.stats.total > 0 ? Math.round((this.stats.active / this.stats.total) * 100) : 0;
        progressValue.textContent = avgProgress + '%';
      }
      
      // Engagement (based on active users)
      const engagementValue = metricCards[3].querySelector('.metric-value');
      if (engagementValue) {
        const engagement = this.stats.active > this.stats.total * 0.7 ? 'Alto' : 
                          this.stats.active > this.stats.total * 0.4 ? 'Médio' : 'Baixo';
        engagementValue.textContent = engagement;
      }
    }
  }

  renderStudents() {
    const tbody = document.querySelector('.table-modern tbody');
    if (!tbody) return;
    
    if (!this.students.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;">Nenhum aluno encontrado</td></tr>';
      return;
    }
    
    tbody.innerHTML = this.students.map(s => this.renderStudentRow(s)).join('');
    this.bindRowActions();
  }

  renderStudentRow(s) {
    const initials = (s.name || s.email || '?').split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
    const lastAccess = s.lastLogin ? new Date(s.lastLogin).toLocaleDateString('pt-BR') : 'Nunca';
    const status = s.status || 'Ativo';
    const statusClass = status === 'Ativo' ? 'btn-success' : status === 'Concluído' ? 'btn-primary' : 'btn-secondary';
    const progress = s.progressPercentage || 0;
    const engagement = progress > 70 ? 'Alto' : progress > 40 ? 'Médio' : 'Baixo';
    const engagementPct = progress > 70 ? 75 : progress > 40 ? 50 : 25;
    
    return `
      <tr data-id="${s.id}">
        <td>
          <div class="d-flex align-items-center gap-3">
            <div class="user-avatar">${initials}</div>
            <div>
              <div style="font-weight: 500; font-size: 16px;">${s.name || s.email}</div>
              <div style="font-size: 14px; color: var(--text-secondary);">${s.email}</div>
              <small style="color: var(--text-muted);">ID: ${s.id}</small>
            </div>
          </div>
        </td>
        <td>
          <div style="font-weight: 500;">${lastAccess}</div>
          <div style="font-size: 14px; color: var(--text-secondary);">${s.lastLogin ? new Date(s.lastLogin).toLocaleTimeString('pt-BR') : ''}</div>
          <small style="color: var(--text-secondary);">● ${s.isEmailVerified ? 'Verificado' : 'Não verificado'}</small>
        </td>
        <td>
          <span class="btn ${statusClass}" style="font-size: 12px; padding: 6px 12px; border-radius: 20px;">
            <i class="fas fa-check-circle"></i> ${status}
          </span>
        </td>
        <td>
          <div class="d-flex align-items-center gap-2">
            <span style="font-size: 14px; font-weight: 500;">${engagement} (${engagementPct}%)</span>
          </div>
        </td>
        <td>
          <div class="d-flex align-items-center gap-2">
            <div class="progress" style="width: 80px; height: 6px; background: var(--border-color); border-radius: 3px;">
              <div class="progress-bar" style="width: ${progress}%; background: linear-gradient(90deg, var(--primary-blue), var(--primary-yellow)); border-radius: 3px;"></div>
            </div>
            <span style="font-size: 14px; font-weight: 500;">${Math.round(progress)}%</span>
          </div>
        </td>
        <td>
          <div class="d-flex gap-1">
            <button class="btn btn-outline btn-sm js-view" data-id="${s.id}" title="Ver perfil"><i class="fas fa-eye"></i></button>
            <button class="btn btn-outline btn-sm js-message" data-id="${s.id}" title="Enviar mensagem"><i class="fas fa-envelope"></i></button>
            <button class="btn btn-outline btn-sm js-edit" data-id="${s.id}" title="Editar"><i class="fas fa-edit"></i></button>
            <button class="btn btn-outline btn-sm js-delete" data-id="${s.id}" title="Excluir"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `;
  }

  bindRowActions() {
    const tbody = document.querySelector('.table-modern tbody');
    if (!tbody) return;
    
    tbody.querySelectorAll('.js-view').forEach(btn => {
      btn.onclick = () => this.viewStudentDetails(btn.dataset.id);
    });
    
    tbody.querySelectorAll('.js-message').forEach(btn => {
      btn.onclick = () => this.sendMessage(btn.dataset.id);
    });
    
    tbody.querySelectorAll('.js-edit').forEach(btn => {
      btn.onclick = () => this.showEditStudentModal(btn.dataset.id);
    });
    
    tbody.querySelectorAll('.js-delete').forEach(btn => {
      btn.onclick = () => this.deleteStudent(btn.dataset.id);
    });
  }

  renderPagination() {
    const paginationText = document.querySelector('.d-flex.align-items-center.justify-content-between.mt-4 small');
    if (paginationText) {
      paginationText.textContent = `Mostrando ${this.students.length} de ${this.pagination.total} alunos`;
    }
    
    // Update pagination buttons
    const paginationBtns = document.querySelectorAll('.d-flex.gap-1 button');
    if (paginationBtns.length >= 4) {
      // Previous button
      paginationBtns[0].disabled = this.currentPage <= 1;
      paginationBtns[0].onclick = () => this.goToPage(this.currentPage - 1);
      
      // Page 1
      paginationBtns[1].textContent = '1';
      paginationBtns[1].className = this.currentPage === 1 ? 'btn-modern btn-modern-primary' : 'btn-modern btn-modern-secondary';
      paginationBtns[1].onclick = () => this.goToPage(1);
      
      // Page 2
      paginationBtns[2].textContent = '2';
      paginationBtns[2].className = this.currentPage === 2 ? 'btn-modern btn-modern-primary' : 'btn-modern btn-modern-secondary';
      paginationBtns[2].onclick = () => this.goToPage(2);
      
      // Next button
      paginationBtns[3].disabled = this.currentPage >= this.pagination.totalPages;
      paginationBtns[3].onclick = () => this.goToPage(this.currentPage + 1);
    }
  }

  goToPage(page) {
    if (page < 1 || page > this.pagination.totalPages) return;
    this.currentPage = page;
    this.loadStudents();
  }

  setupEventListeners() {
    // Export button
    const exportBtn = document.querySelector('button[onclick*="exportar"], .btn-modern-primary');
    if (exportBtn && exportBtn.textContent.includes('Exportar')) {
      exportBtn.onclick = () => this.exportStudents();
    }
    
    // New student button (the one with + icon)
    const newStudentBtns = document.querySelectorAll('.btn-modern-primary');
    newStudentBtns.forEach(btn => {
      if (btn.textContent.includes('Novo Aluno')) {
        btn.onclick = () => this.showAddStudentModal();
      }
    });
  }

  setupSearchAndFilters() {
    // Search input
    const searchInput = document.querySelector('input[placeholder*="Buscar"]');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchTerm = e.target.value;
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
          this.currentPage = 1;
          this.loadStudents();
        }, 500);
      });
    }
    
    // Status filter
    const statusSelect = document.querySelectorAll('select.form-control')[0];
    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => {
        this.statusFilter = e.target.value === 'Todos os status' ? 'all' : e.target.value;
        this.currentPage = 1;
        this.loadStudents();
      });
    }
    
    // Level/engagement filter
    const levelSelect = document.querySelectorAll('select.form-control')[1];
    if (levelSelect) {
      levelSelect.addEventListener('change', (e) => {
        this.levelFilter = e.target.value === 'Todos os níveis' ? 'all' : e.target.value;
        this.currentPage = 1;
        this.loadStudents();
      });
    }
    
    // Filter button
    const filterBtn = document.querySelector('button[onclick*="filtrar"], button .fa-filter');
    if (filterBtn) {
      const btn = filterBtn.tagName === 'BUTTON' ? filterBtn : filterBtn.closest('button');
      if (btn) btn.onclick = () => this.loadStudents();
    }
  }

  async exportStudents() {
    try {
      const data = await safeFetchJSON('/api/admin/students?limit=1000', {
        headers: GMP_Security.getAuthHeaders()
      });
      if (data.success) {
        this.downloadCSV(data.students);
      }
    } catch(e) {
      console.error("Erro exportar:", e);
      alert('Erro ao exportar alunos');
    }
  }

  downloadCSV(students) {
    const csv = [
      ['ID', 'Nome', 'Email', 'Status', 'Progresso', 'Último Acesso'],
      ...students.map(s => [
        s.id,
        s.name || '',
        s.email,
        s.status || 'Ativo',
        (s.progressPercentage || 0) + '%',
        s.lastLogin || 'Nunca'
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `alunos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }

  viewStudentDetails(id) {
    window.location.href = `student-profile.html?id=${id}`;
  }

  sendMessage(id) {
    const student = this.students.find(s => s.id == id);
    alert(`Enviar mensagem para ${student?.name || student?.email || id}\n\n(Funcionalidade em desenvolvimento)`);
  }

  async showEditStudentModal(id) {
    const student = this.students.find(s => s.id == id);
    if (!student) return;
    
    const newName = prompt('Nome do aluno:', student.name);
    if (!newName) return;
    
    try {
      const data = await safeFetchJSON(`/api/admin/students/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...GMP_Security.getAuthHeaders()
        },
        body: JSON.stringify({ name: newName })
      });
      
      if (data.success) {
        alert('Aluno atualizado com sucesso!');
        this.loadStudents();
      }
    } catch(e) {
      console.error('Erro ao atualizar:', e);
      alert('Erro ao atualizar aluno');
    }
  }

  async deleteStudent(id) {
    const student = this.students.find(s => s.id == id);
    if (!confirm(`Tem certeza que deseja excluir ${student?.name || student?.email || 'este aluno'}?`)) return;
    
    try {
      const response = await fetch(`/api/admin/students/${id}`, {
        method: 'DELETE',
        headers: GMP_Security.getAuthHeaders()
      });
      
      if (response.ok) {
        alert('Aluno excluído com sucesso!');
        this.loadStudents();
        this.loadStats();
      }
    } catch(e) {
      console.error('Erro ao excluir:', e);
      alert('Erro ao excluir aluno');
    }
  }

  showAddStudentModal() {
    const name = prompt('Nome do novo aluno:');
    if (!name) return;
    
    const email = prompt('Email do novo aluno:');
    if (!email) return;
    
    const password = prompt('Senha inicial:');
    if (!password) return;
    
    this.createStudent({ name, email, password });
  }

  async createStudent(data) {
    try {
      const response = await fetch('/api/admin/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...GMP_Security.getAuthHeaders()
        },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('Aluno criado com sucesso!');
        this.loadStudents();
        this.loadStats();
      } else {
        alert('Erro: ' + (result.error || 'Falha ao criar aluno'));
      }
    } catch(e) {
      console.error('Erro ao criar:', e);
      alert('Erro ao criar aluno');
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.studentsManager = new StudentsManager();
});
