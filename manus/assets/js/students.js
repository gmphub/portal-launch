// API Configuration
const API_BASE_URL = '/api';
const STUDENTS_API = `${API_BASE_URL}/students`;

// Global state
let studentsData = [];
let filteredStudents = [];
let currentPage = 1;
const itemsPerPage = 10;

// Utility Functions
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? 'var(--success-green)' : type === 'error' ? 'var(--danger-red)' : 'var(--primary-blue)'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
    `;
    notification.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i> ${message}`;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function showLoading(show = true) {
    let loader = document.getElementById('globalLoader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'globalLoader';
        loader.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        `;
        loader.innerHTML = '<style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style><div class="spinner" style="border: 4px solid rgba(255,255,255,0.3); border-top: 4px solid white; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite;"></div>';
        document.body.appendChild(loader);
    }
    loader.style.display = show ? 'flex' : 'none';
}

// API Functions
async function fetchStudents() {
    try {
        showLoading(true);
        const response = await fetch(STUDENTS_API, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (!response.ok) throw new Error('Failed to fetch students');

        const data = await response.json();
        studentsData = data.students || [];
        filteredStudents = [...studentsData];
        updateUI();
        showLoading(false);
    } catch (error) {
        console.error('Error fetching students:', error);
        showNotification('Erro ao carregar alunos', 'error');
        showLoading(false);
    }
}

async function exportStudentsList() {
    try {
        showLoading(true);
        const response = await fetch(`${STUDENTS_API}/export`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (!response.ok) throw new Error('Failed to export');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();

        showNotification('Lista exportada com sucesso!', 'success');
        showLoading(false);
    } catch (error) {
        console.error('Error exporting:', error);
        showNotification('Erro ao exportar lista', 'error');
        showLoading(false);
    }
}

async function importUsers() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            showLoading(true);
            const response = await fetch(`${STUDENTS_API}/import`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: formData
            });

            if (!response.ok) throw new Error('Failed to import');

            const result = await response.json();
            showNotification(`${result.imported} usuários importados com sucesso!`, 'success');
            fetchStudents();
            showLoading(false);
        } catch (error) {
            console.error('Error importing:', error);
            showNotification('Erro ao importar usuários', 'error');
            showLoading(false);
        }
    };
    input.click();
}

async function createSegmentation() {
    // Show modal for segmentation creation
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    `;
    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 12px; max-width: 500px; width: 90%;">
            <h3 style="margin-bottom: 20px;">Nova Segmentação</h3>
            <input type="text" id="segmentName" placeholder="Nome da segmentação" style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid var(--border-color); border-radius: 6px;">
            <select id="segmentCriteria" style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid var(--border-color); border-radius: 6px;">
                <option value="">Selecione o critério</option>
                <option value="engagement">Por Engajamento</option>
                <option value="progress">Por Progresso</option>
                <option value="status">Por Status</option>
            </select>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button id="cancelSegment" class="btn-modern btn-modern-secondary">Cancelar</button>
                <button id="saveSegment" class="btn-modern btn-modern-primary">Criar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('cancelSegment').onclick = () => modal.remove();
    document.getElementById('saveSegment').onclick = async () => {
        const name = document.getElementById('segmentName').value;
        const criteria = document.getElementById('segmentCriteria').value;

        if (!name || !criteria) {
            showNotification('Preencha todos os campos', 'error');
            return;
        }

        try {
            const response = await fetch(`${STUDENTS_API}/segments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({ name, criteria })
            });

            if (!response.ok) throw new Error('Failed to create segment');

            showNotification('Segmentação criada com sucesso!', 'success');
            modal.remove();
        } catch (error) {
            console.error('Error creating segment:', error);
            showNotification('Erro ao criar segmentação', 'error');
        }
    };
}

async function sendMessage(studentId) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    `;
    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 12px; max-width: 500px; width: 90%;">
            <h3 style="margin-bottom: 20px;">Enviar Mensagem</h3>
            <input type="text" id="messageSubject" placeholder="Assunto" style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid var(--border-color); border-radius: 6px;">
            <textarea id="messageBody" placeholder="Mensagem" rows="5" style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid var(--border-color); border-radius: 6px;"></textarea>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button id="cancelMessage" class="btn-modern btn-modern-secondary">Cancelar</button>
                <button id="sendMessageBtn" class="btn-modern btn-modern-success">Enviar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('cancelMessage').onclick = () => modal.remove();
    document.getElementById('sendMessageBtn').onclick = async () => {
        const subject = document.getElementById('messageSubject').value;
        const body = document.getElementById('messageBody').value;

        if (!subject || !body) {
            showNotification('Preencha todos os campos', 'error');
            return;
        }

        try {
            const response = await fetch(`${STUDENTS_API}/${studentId}/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({ subject, body })
            });

            if (!response.ok) throw new Error('Failed to send message');

            showNotification('Mensagem enviada com sucesso!', 'success');
            modal.remove();
        } catch (error) {
            console.error('Error sending message:', error);
            showNotification('Erro ao enviar mensagem', 'error');
        }
    };
}

async function viewStudentProfile(studentId) {
    window.location.href = `student-profile.html?id=${studentId}`;
}

async function reactivateStudent(studentId) {
    if (!confirm('Deseja reativar este aluno?')) return;

    try {
        const response = await fetch(`${STUDENTS_API}/${studentId}/reactivate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (!response.ok) throw new Error('Failed to reactivate');

        showNotification('Aluno reativado com sucesso!', 'success');
        fetchStudents();
    } catch (error) {
        console.error('Error reactivating student:', error);
        showNotification('Erro ao reativar aluno', 'error');
    }
}

async function sendCertificate(studentId) {
    if (!confirm('Deseja enviar o certificado para este aluno?')) return;

    try {
        const response = await fetch(`${STUDENTS_API}/${studentId}/certificate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (!response.ok) throw new Error('Failed to send certificate');

        showNotification('Certificado enviado com sucesso!', 'success');
    } catch (error) {
        console.error('Error sending certificate:', error);
        showNotification('Erro ao enviar certificado', 'error');
    }
}

function filterStudents() {
    const searchTerm = document.querySelector('input[placeholder="Buscar alunos..."]').value.toLowerCase();
    const statusFilter = document.querySelectorAll('select.form-control')[0].value;
    const engagementFilter = document.querySelectorAll('select.form-control')[1].value;

    filteredStudents = studentsData.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchTerm) ||
                            student.email.toLowerCase().includes(searchTerm);
        const matchesStatus = !statusFilter || statusFilter === 'Todos os status' || student.status === statusFilter;
        const matchesEngagement = !engagementFilter || engagementFilter === 'Todos os níveis' || student.engagement === engagementFilter;

        return matchesSearch && matchesStatus && matchesEngagement;
    });

    currentPage = 1;
    updateUI();
}

function updateUI() {
    updateMetrics();
    updateStudentsTable();
    updatePagination();
}

function updateMetrics() {
    const totalStudents = studentsData.length;
    const completedStudents = studentsData.filter(s => s.progress === 100).length;
    const avgProgress = studentsData.reduce((sum, s) => sum + s.progress, 0) / totalStudents || 0;
    const avgEngagement = studentsData.reduce((sum, s) => sum + s.engagementScore, 0) / totalStudents || 0;

    document.querySelector('.modern-metric-card:nth-child(1) .metric-value').textContent = totalStudents;
    document.querySelector('.modern-metric-card:nth-child(2) .metric-value').textContent = `${Math.round((completedStudents / totalStudents) * 100)}%`;
    document.querySelector('.modern-metric-card:nth-child(3) .metric-value').textContent = `${Math.round(avgProgress)}%`;

    const engagementLevel = avgEngagement > 70 ? 'Alto' : avgEngagement > 40 ? 'Médio' : 'Baixo';
    const engagementColor = avgEngagement > 70 ? 'var(--success-green)' : avgEngagement > 40 ? 'var(--warning-yellow)' : 'var(--danger-red)';
    const engagementElement = document.querySelector('.modern-metric-card:nth-child(4) .metric-value');
    engagementElement.textContent = engagementLevel;
    engagementElement.style.color = engagementColor;
}

function updateStudentsTable() {
    const tbody = document.querySelector('.table-modern tbody');
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageStudents = filteredStudents.slice(start, end);

    if (pageStudents.length === 0) {
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

    tbody.innerHTML = pageStudents.map(student => {
        // Fallback for missing data
        const name = student.name || 'Nome Desconhecido';
        const email = student.email || 'email@desconhecido.com';
        const initials = name.split(' ').map(n => n[0] ? n[0].toUpperCase() : '').join('').substring(0, 2) || '??';
        const status = student.status || 'Ativo';
        const engagementScore = student.engagementScore || 0;
        const engagement = student.engagement || 'Baixo';
        const progress = student.progress || 0;
        const lastAccess = student.lastAccess || 'Nunca';
        const lastAccessTime = student.lastAccessTime || '';
        const onlineStatus = student.onlineStatus || 'Offline';
        const completedLessons = student.completedLessons || 0;
        const totalLessons = student.totalLessons || 0;
        const avatarColor = student.avatarColor || '#007bff'; // Default color

        let engagementColor;
        if (engagementScore > 70) {
            engagementColor = 'var(--success-green)';
        } else if (engagementScore > 40) {
            engagementColor = 'var(--warning-yellow)';
        } else {
            engagementColor = 'var(--danger-red)';
        }

        return `
            <tr>
                <td>
                    <div class="d-flex align-items-center gap-3">
                        <div class="user-avatar" style="background: ${avatarColor}">${initials}</div>
                        <div>
                            <div style="font-weight: 500; font-size: 16px;">${name}</div>
                            <div style="font-size: 14px; color: var(--text-secondary);">${email}</div>
                            <small style="color: var(--text-muted);">ID: ${student.id}</small>
                        </div>
                    </div>
                </td>
                <td>
                    <div style="font-weight: 500;">${lastAccess}</div>
                    <div style="font-size: 14px; color: var(--text-secondary);">${lastAccessTime}</div>
                    <small style="color: ${onlineStatus === 'Online' ? 'var(--success-green)' : 'var(--text-secondary)'};">● ${onlineStatus}</small>
                </td>
                <td>
                    <span class="btn ${status === 'Ativo' ? 'btn-success' : status === 'Concluído' ? 'btn-primary' : 'btn'}" style="font-size: 12px; padding: 6px 12px; border-radius: 20px; ${status === 'Inativo' ? 'background: var(--warning-yellow); color: #333;' : ''}">
                        <i class="fas fa-${status === 'Ativo' ? 'check-circle' : status === 'Concluído' ? 'trophy' : 'exclamation-triangle'}"></i> ${status}
                    </span>
                </td>
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <div class="progress" style="width: 60px; height: 6px; background: var(--border-color); border-radius: 3px;">
                            <div class="progress-bar" style="width: ${engagementScore}%; background: ${engagementColor}; border-radius: 3px;"></div>
                        </div>
                        <span style="font-size: 14px; font-weight: 500; color: ${engagementColor};">${engagement} (${engagementScore}%)</span>
                    </div>
                </td>
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <div class="progress" style="width: 80px; height: 6px; background: var(--border-color); border-radius: 3px;">
                            <div class="progress-bar" style="width: ${progress}%; background: linear-gradient(90deg, var(--primary-blue), var(--primary-yellow)); border-radius: 3px;"></div>
                        </div>
                        <span style="font-size: 14px; font-weight: 500;">${progress}%</span>
                    </div>
                    <small style="color: var(--text-secondary);">${completedLessons} de ${totalLessons} aulas</small>
                </td>
                <td>
                    <div class="d-flex gap-1">
                        <button class="btn btn-outline btn-sm" title="Ver perfil" onclick="viewStudentProfile('${student.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${status === 'Inativo' ?
                            `<button class="btn btn-outline btn-sm" title="Reativar aluno" onclick="reactivateStudent('${student.id}')">
                                <i class="fas fa-play"></i>
                            </button>` :
                            status === 'Concluído' ?
                            `<button class="btn btn-outline btn-sm" title="Enviar certificado" onclick="sendCertificate('${student.id}')">
                                <i class="fas fa-certificate"></i>
                            </button>` :
                            `<button class="btn btn-outline btn-sm" title="Enviar mensagem" onclick="sendMessage('${student.id}')">
                                <i class="fas fa-envelope"></i>
                            </button>`
                        }
                        <button class="btn btn-outline btn-sm" title="Mais opções">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function updatePagination() {
    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
    const paginationInfo = document.querySelector('.d-flex.align-items-center.justify-content-between.mt-4 > div:first-child');
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, filteredStudents.length);

    if (filteredStudents.length === 0) {
        paginationInfo.innerHTML = '';
    } else {
        paginationInfo.innerHTML = `<i class="fas fa-info-circle"></i> Mostrando ${start}-${end} de ${filteredStudents.length} alunos`;
    }

    const paginationButtons = document.querySelector('.d-flex.align-items-center.justify-content-between.mt-4 > div:last-child');
    if (!paginationButtons) return;

    let buttonsHtml = '';
    if (totalPages > 1) {
        buttonsHtml = `
            <button class="btn-modern btn-modern-secondary" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">
                <i class="fas fa-chevron-left"></i>
            </button>
            ${Array.from({length: totalPages}, (_, i) => i + 1).map(page => `
                <button class="btn-modern ${page === currentPage ? 'btn-modern-primary' : 'btn-modern-secondary'}" onclick="changePage(${page})">${page}</button>
            `).join('')}
            <button class="btn-modern btn-modern-secondary" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
    }
    paginationButtons.innerHTML = buttonsHtml;
}

function changePage(page) {
    if (page < 1 || page > Math.ceil(filteredStudents.length / itemsPerPage)) return;
    currentPage = page;
    updateStudentsTable();
    updatePagination();
}

// Enhanced horizontal scrolling for admin navigation tabs
document.addEventListener('DOMContentLoaded', function() {
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

    // Initial data fetch
    fetchStudents();

    // Event listeners for filter and search
    document.querySelector('input[placeholder="Buscar alunos..."]').addEventListener('input', filterStudents);
    document.querySelectorAll('select.form-control').forEach(select => {
        select.addEventListener('change', filterStudents);
    });

    // Event listener for Import button
    const importBtn = document.querySelector('.btn-modern-secondary[onclick="importUsers()"]');
    if (importBtn) {
        importBtn.addEventListener('click', importUsers);
        importBtn.removeAttribute('onclick'); // Remove inline handler
    }
    
    // Event listener for Export button
    const exportBtn = document.querySelector('.btn-modern-secondary[onclick="exportStudentsList()"]');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportStudentsList);
        exportBtn.removeAttribute('onclick'); // Remove inline handler
    }

    // Event listener for New Segmentation button
    const segmentBtn = document.querySelector('.btn-modern-primary[onclick="createSegmentation()"]');
    if (segmentBtn) {
        segmentBtn.addEventListener('click', createSegmentation);
        segmentBtn.removeAttribute('onclick'); // Remove inline handler
    }
});
