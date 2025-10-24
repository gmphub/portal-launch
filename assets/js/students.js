/**
 * StudentsManager - Complete working version
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
    const metricCards = document.querySelectorAll('.modern-metric-card');
    if (metricCards.length >= 4) {
      const totalValue = metricCards[0].querySelector('.metric-value');
      if (totalValue) totalValue.textContent = this.stats.total || 0;
      
      const completionValue = metricCards[1].querySelector('.metric-value');
      if (completionValue) {
        const rate = this.stats.total > 0 ? Math.round((this.stats.verified / this.stats.total) * 100) : 0;
        completionValue.textContent = rate + '%';
      }
      
      const progressValue = metricCards[2].querySelector('.metric-value');
      if (progressValue) {
        const avgProgress = this.stats.total > 0 ? Math.round((this.stats.active / this.stats.total) * 100) : 0;
        progressValue.textContent = avgProgress + '%';
      }
      
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
    const lastAccessTime = s.lastLogin ? new Date(s.lastLogin).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}) : '';
    const status = s.isEmailVerified ? 'Ativo' : 'Inativo';
    const statusClass = s.isEmailVerified ? 'btn-success' : 'btn-secondary';
    
    // Calculate progress from coursesEnrolled and coursesCompleted
    const coursesEnrolled = s.coursesEnrolled || 0;
    const coursesCompleted = s.coursesCompleted || 0;
    const progress = coursesEnrolled > 0 ? Math.round((coursesCompleted / coursesEnrolled) * 100) : 0;
    const engagement = progress > 70 ? 'Alto' : progress > 40 ? 'Médio' : 'Baixo';
    const engagementPct = progress > 70 ? 75 : progress > 40 ? 50 : 25;
    
    return `
      <tr data-id="${s.id}">
        <td>
          <div class="d-flex align-items-center gap-3">
            <div class="user-avatar" style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, var(--primary-blue), var(--primary-yellow)); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">${initials}</div>
            <div>
              <div style="font-weight: 500; font-size: 16px;">${s.name || s.email}</div>
              <div style="font-size: 14px; color: var(--text-secondary);">${s.email}</div>
              <small style="color: var(--text-muted);">ID: ${s.id}</small>
            </div>
          </div>
        </td>
        <td>
          <div style="font-weight: 500;">${lastAccess}</div>
          ${lastAccessTime ? `<div style="font-size: 14px; color: var(--text-secondary);">${lastAccessTime}</div>` : ''}
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
            <span style="font-size: 14px; font-weight: 500;">${progress}%</span>
          </div>
          <small style="color: var(--text-muted);">${coursesCompleted} de ${coursesEnrolled} cursos</small>
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
    
    const paginationBtns = document.querySelectorAll('.d-flex.gap-1 button');
    if (paginationBtns.length >= 4) {
      paginationBtns[0].disabled = this.currentPage <= 1;
      paginationBtns[0].onclick = () => this.goToPage(this.currentPage - 1);
      
      paginationBtns[1].textContent = '1';
      paginationBtns[1].className = this.currentPage === 1 ? 'btn-modern btn-modern-primary' : 'btn-modern btn-modern-secondary';
      paginationBtns[1].onclick = () => this.goToPage(1);
      
      paginationBtns[2].textContent = '2';
      paginationBtns[2].className = this.currentPage === 2 ? 'btn-modern btn-modern-primary' : 'btn-modern btn-modern-secondary';
      paginationBtns[2].onclick = () => this.goToPage(2);
      paginationBtns[2].style.display = this.pagination.totalPages >= 2 ? '' : 'none';
      
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
    const exportBtn = document.querySelector('button[onclick*="exportar"], .btn-modern-primary');
    if (exportBtn && exportBtn.textContent.includes('Exportar')) {
      exportBtn.onclick = (e) => {
        e.preventDefault();
        this.exportStudents();
      };
    }
    
    const newStudentBtns = document.querySelectorAll('.btn-modern-primary');
    newStudentBtns.forEach(btn => {
      if (btn.textContent.includes('Novo Aluno')) {
        btn.onclick = (e) => {
          e.preventDefault();
          this.showAddStudentModal();
        };
      }
    });
  }

  setupSearchAndFilters() {
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
    
    const statusSelect = document.querySelectorAll('select.form-control')[0];
    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => {
        const value = e.target.value;
        if (value === 'Todos os status') this.statusFilter = 'all';
        else if (value === 'Ativo') this.statusFilter = 'verified';
        else if (value === 'Inativo') this.statusFilter = 'unverified';
        else this.statusFilter = 'all';
        
        this.currentPage = 1;
        this.loadStudents();
      });
    }
    
    const filterBtn = document.querySelector('button .fa-filter');
    if (filterBtn) {
      const btn = filterBtn.closest('button');
      if (btn) {
        btn.onclick = (e) => {
          e.preventDefault();
          this.loadStudents();
        };
      }
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
      ['ID', 'Nome', 'Email', 'Status', 'Cursos Matriculados', 'Cursos Concluídos', 'Último Acesso'],
      ...students.map(s => [
        s.id,
        s.name || '',
        s.email,
        s.isEmailVerified ? 'Ativo' : 'Inativo',
        s.coursesEnrolled || 0,
        s.coursesCompleted || 0,
        s.lastLogin || 'Nunca'
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `alunos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }

  async viewStudentDetails(id) {
    try {
      const data = await safeFetchJSON(`/api/admin/students/${id}`, {
        headers: GMP_Security.getAuthHeaders()
      });
      
      if (data.success && data.student) {
        this.showStudentModal(data.student);
      }
    } catch(e) {
      console.error('Erro ao buscar detalhes:', e);
      alert('Erro ao carregar detalhes do aluno');
    }
  }

  showStudentModal(student) {
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 9999;';
    
    const coursesEnrolled = student.totalCourses || 0;
    const coursesCompleted = student.completedCourses || 0;
    const avgProgress = student.averageProgress || 0;
    
    modal.innerHTML = `
      <div style="background: white; border-radius: 12px; padding: 30px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h2 style="margin: 0;">Detalhes do Aluno</h2>
          <button class="btn btn-outline" onclick="this.closest('div[style*=fixed]').remove()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div style="display: grid; gap: 15px;">
          <div>
            <strong>Nome:</strong> ${student.name || 'N/A'}
          </div>
          <div>
            <strong>Email:</strong> ${student.email}
          </div>
          <div>
            <strong>ID:</strong> ${student.id}
          </div>
          <div>
            <strong>Status:</strong> ${student.isEmailVerified ? '✅ Verificado' : '❌ Não verificado'}
          </div>
          <div>
            <strong>Último acesso:</strong> ${student.lastLogin ? new Date(student.lastLogin).toLocaleString('pt-BR') : 'Nunca'}
          </div>
          <div>
            <strong>Cadastrado em:</strong> ${student.createdAt ? new Date(student.createdAt).toLocaleString('pt-BR') : 'N/A'}
          </div>
          
          <hr style="margin: 10px 0;">
          
          <h3>Progresso</h3>
          <div>
            <strong>Cursos matriculados:</strong> ${coursesEnrolled}
          </div>
          <div>
            <strong>Cursos concluídos:</strong> ${coursesCompleted}
          </div>
          <div>
            <strong>Progresso médio:</strong> ${Math.round(avgProgress)}%
          </div>
          
          ${student.progress && student.progress.length > 0 ? `
            <hr style="margin: 10px 0;">
            <h3>Cursos</h3>
            ${student.progress.map(p => `
              <div style="padding: 10px; background: #f5f5f5; border-radius: 8px; margin-bottom: 10px;">
                <div><strong>${p.title}</strong></div>
                <div style="font-size: 14px; color: #666;">${p.category} - ${p.level}</div>
                <div style="margin-top: 5px;">
                  <div class="progress" style="width: 100%; height: 8px; background: #ddd; border-radius: 4px;">
                    <div style="width: ${p.progressPercentage || 0}%; height: 100%; background: linear-gradient(90deg, #4A90E2, #F5A623); border-radius: 4px;"></div>
                  </div>
                  <small>${Math.round(p.progressPercentage || 0)}% - ${p.lessonsCompleted || 0} de ${p.totalLessons || 0} aulas</small>
                </div>
              </div>
            `).join('')}
          ` : '<p style="color: #666;">Nenhum curso matriculado</p>'}
        </div>
        
        <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
          <button class="btn btn-outline" onclick="this.closest('div[style*=fixed]').remove()">Fechar</button>
          <button class="btn btn-primary" onclick="window.studentsManager.showEditStudentModal('${student.id}'); this.closest('div[style*=fixed]').remove();">Editar</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    modal.onclick = (e) => {
      if (e.target === modal) modal.remove();
    };
  }

  sendMessage(id) {
    const student = this.students.find(s => s.id == id);
    alert(`Enviar mensagem para ${student?.name || student?.email || id}\n\n(Funcionalidade em desenvolvimento)`);
  }

  async showEditStudentModal(id) {
    const student = this.students.find(s => s.id == id);
    if (!student) return;
    
    const newName = prompt('Nome do aluno:', student.name);
    if (!newName || newName === student.name) return;
    
    try {
      const response = await fetch(`/api/admin/students/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...GMP_Security.getAuthHeaders()
        },
        body: JSON.stringify({ name: newName })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Aluno atualizado com sucesso!');
        this.loadStudents();
      } else {
        alert('Erro: ' + (data.error || 'Falha ao atualizar'));
      }
    } catch(e) {
      console.error('Erro ao atualizar:', e);
      alert('Erro ao atualizar aluno');
    }
  }

  async deleteStudent(id) {
    const student = this.students.find(s => s.id == id);
    if (!confirm(`Tem certeza que deseja excluir ${student?.name || student?.email || 'este aluno'}?\n\nEsta ação não pode ser desfeita.`)) return;
    
    try {
      const response = await fetch(`/api/admin/students/${id}`, {
        method: 'DELETE',
        headers: GMP_Security.getAuthHeaders()
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        alert('Aluno excluído com sucesso!');
        this.loadStudents();
        this.loadStats();
      } else {
        alert('Erro: ' + (data.error || 'Falha ao excluir aluno'));
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
    
    const password = prompt('Senha inicial (mínimo 8 caracteres):');
    if (!password || password.length < 8) {
      alert('Senha deve ter no mínimo 8 caracteres');
      return;
    }
    
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

document.addEventListener('DOMContentLoaded', () => {
  window.studentsManager = new StudentsManager();
});
