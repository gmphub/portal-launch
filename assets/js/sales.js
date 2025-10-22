/**
 * Sales Management Module
 * Gestão completa de vendas e transações
 */

class SalesManager {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 10;
        this.searchTerm = '';
        this.statusFilter = 'all';
        this.sales = [];
        this.stats = {};
        this.init();
    }

    async init() {
        try {
            await this.loadStats();
            await this.loadSales();
            this.setupEventListeners();
            this.setupSearchAndFilters();
        } catch (error) {
            console.error('Erro ao inicializar SalesManager:', error);
            this.showError('Erro ao carregar dados de vendas');
        }
    }

    async loadStats() {
        try {
            const response = await fetch('/api/admin/sales/stats', {
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

    async loadSales() {
        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.pageSize,
                search: this.searchTerm,
                status: this.statusFilter
            });

            const response = await fetch(`/api/admin/sales?${params}`, {
                headers: GMP_Security.getAuthHeaders()
            });
            const data = await response.json();
            
            if (data.success) {
                this.sales = data.sales;
                this.pagination = data.pagination;
                this.renderSales();
                this.renderPagination();
            }
        } catch (error) {
            console.error('Erro ao carregar vendas:', error);
            this.showError('Erro ao carregar lista de vendas');
        }
    }

    renderStats() {
        const statsContainer = document.getElementById('statsContainer');
        if (!statsContainer) return;

        statsContainer.innerHTML = `
            <div class="modern-metric-card">
                <div class="metric-header">
                    <div class="metric-icon"><i class="fas fa-shopping-cart"></i></div>
                </div>
                <div class="metric-value">${this.stats.total || 0}</div>
                <div class="metric-label">Total de Vendas</div>
            </div>
            <div class="modern-metric-card">
                <div class="metric-header">
                    <div class="metric-icon"><i class="fas fa-check-circle"></i></div>
                </div>
                <div class="metric-value">${this.stats.completed || 0}</div>
                <div class="metric-label">Vendas Concluídas</div>
            </div>
            <div class="modern-metric-card">
                <div class="metric-header">
                    <div class="metric-icon"><i class="fas fa-money-bill-wave"></i></div>
                </div>
                <div class="metric-value">R$${this.stats.revenue || 0}</div>
                <div class="metric-label">Receita Total</div>
            </div>
            <div class="modern-metric-card">
                <div class="metric-header">
                    <div class="metric-icon"><i class="fas fa-calculator"></i></div>
                </div>
                <div class="metric-value">R$${this.stats.avgSale || 0}</div>
                <div class="metric-label">Ticket Médio</div>
            </div>
        `;
    }

    renderSales() {
        const salesContainer = document.getElementById('salesContainer');
        if (!salesContainer) return;

        if (this.sales.length === 0) {
            salesContainer.innerHTML = `
                <div class="text-center" style="padding: 3rem;">
                    <i class="fas fa-shopping-cart" style="font-size: 4rem; color: var(--text-secondary); margin-bottom: 1rem;"></i>
                    <h3 style="color: var(--text-secondary); margin-bottom: 0.5rem;">Nenhuma venda encontrada</h3>
                    <p style="color: var(--text-secondary);">Tente ajustar os filtros.</p>
                </div>
            `;
            return;
        }

        salesContainer.innerHTML = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>ID da Transação</th>
                            <th>Cliente</th>
                            <th>Produto</th>
                            <th>Valor</th>
                            <th>Status</th>
                            <th>Método de Pagamento</th>
                            <th>Data</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.sales.map(sale => `
                            <tr>
                                <td>${sale.transactionId || sale.id.substring(0, 8)}</td>
                                <td>
                                    <div>${sale.customerName || 'Cliente não identificado'}</div>
                                    <small class="text-muted">${sale.customerEmail || ''}</small>
                                </td>
                                <td>${sale.productTitle || 'Produto não identificado'}</td>
                                <td>R$${sale.amount || 0}</td>
                                <td>
                                    <span class="badge ${this.getStatusBadgeClass(sale.status)}">
                                        ${this.getStatusText(sale.status)}
                                    </span>
                                </td>
                                <td>${sale.paymentMethod || 'Não especificado'}</td>
                                <td>${new Date(sale.createdAt).toLocaleDateString('pt-BR')}</td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary" onclick="salesManager.viewSaleDetails('${sale.id}')">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    getStatusBadgeClass(status) {
        switch (status) {
            case 'completed': return 'badge-success';
            case 'pending': return 'badge-warning';
            case 'cancelled': return 'badge-danger';
            case 'refunded': return 'badge-info';
            default: return 'badge-secondary';
        }
    }

    getStatusText(status) {
        switch (status) {
            case 'completed': return 'Concluída';
            case 'pending': return 'Pendente';
            case 'cancelled': return 'Cancelada';
            case 'refunded': return 'Reembolsada';
            default: return status;
        }
    }

    renderPagination() {
        const paginationContainer = document.getElementById('paginationContainer');
        if (!paginationContainer || !this.pagination) return;

        const { page, pages, total } = this.pagination;
        
        let paginationHTML = `
            <li class="page-item ${page === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="salesManager.goToPage(${page - 1})">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
        `;

        // Show first page
        if (page > 2) {
            paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="salesManager.goToPage(1)">1</a></li>`;
            if (page > 3) {
                paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }

        // Show pages around current
        for (let i = Math.max(1, page - 1); i <= Math.min(pages, page + 1); i++) {
            paginationHTML += `
                <li class="page-item ${i === page ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="salesManager.goToPage(${i})">${i}</a>
                </li>
            `;
        }

        // Show last page
        if (page < pages - 1) {
            if (page < pages - 2) {
                paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
            paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="salesManager.goToPage(${pages})">${pages}</a></li>`;
        }

        paginationHTML += `
            <li class="page-item ${page === pages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="salesManager.goToPage(${page + 1})">
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
            paginationInfo.innerHTML = `Mostrando ${start}-${end} de ${total} vendas`;
        }
    }

    goToPage(page) {
        if (page < 1 || page > this.pagination.pages) return;
        this.currentPage = page;
        this.loadSales();
    }

    setupEventListeners() {
        // Botão exportar
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportSales());
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
                    this.loadSales();
                }, 500);
            });
        }

        // Filtro de status
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.statusFilter = e.target.value;
                this.currentPage = 1;
                this.loadSales();
            });
        }

        // Botão filtrar
        const filterBtn = document.querySelector('button:has(.fa-filter), button[onclick*="loadSales"]');
        if (filterBtn) {
            filterBtn.addEventListener('click', () => {
                this.currentPage = 1;
                this.loadSales();
            });
        }
    }

    async viewSaleDetails(saleId) {
        try {
            const response = await fetch(`/api/admin/sales?search=${saleId}`, {
                headers: GMP_Security.getAuthHeaders()
            });
            const data = await response.json();
            
            if (data.success && data.sales.length > 0) {
                const sale = data.sales[0];
                
                const modalHTML = `
                    <div class="modal fade" id="saleDetailsModal" tabindex="-1">
                        <div class="modal-dialog modal-lg">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title">
                                        <i class="fas fa-receipt"></i> Detalhes da Venda
                                    </h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                </div>
                                <div class="modal-body">
                                    <div class="row">
                                        <div class="col-md-12">
                                            <div class="row">
                                                <div class="col-md-6">
                                                    <div class="stat-item">
                                                        <div class="stat-label">ID da Transação</div>
                                                        <div class="stat-value">${sale.transactionId || sale.id}</div>
                                                    </div>
                                                </div>
                                                <div class="col-md-6">
                                                    <div class="stat-item">
                                                        <div class="stat-label">Data</div>
                                                        <div class="stat-value">${new Date(sale.createdAt).toLocaleString('pt-BR')}</div>
                                                    </div>
                                                </div>
                                                <div class="col-md-6">
                                                    <div class="stat-item">
                                                        <div class="stat-label">Cliente</div>
                                                        <div class="stat-value">${sale.customerName || 'Cliente não identificado'}</div>
                                                        <div class="stat-value">${sale.customerEmail || ''}</div>
                                                    </div>
                                                </div>
                                                <div class="col-md-6">
                                                    <div class="stat-item">
                                                        <div class="stat-label">Produto</div>
                                                        <div class="stat-value">${sale.productTitle || 'Produto não identificado'}</div>
                                                    </div>
                                                </div>
                                                <div class="col-md-6">
                                                    <div class="stat-item">
                                                        <div class="stat-label">Valor</div>
                                                        <div class="stat-value">R$${sale.amount || 0}</div>
                                                    </div>
                                                </div>
                                                <div class="col-md-6">
                                                    <div class="stat-item">
                                                        <div class="stat-label">Status</div>
                                                        <div class="stat-value">
                                                            <span class="badge ${this.getStatusBadgeClass(sale.status)}">
                                                                ${this.getStatusText(sale.status)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="col-md-6">
                                                    <div class="stat-item">
                                                        <div class="stat-label">Método de Pagamento</div>
                                                        <div class="stat-value">${sale.paymentMethod || 'Não especificado'}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                                    ${
                                        sale.status === 'pending' ? 
                                        `<button type="button" class="btn btn-success" onclick="salesManager.updateSaleStatus('${sale.id}', 'completed')">
                                            <i class="fas fa-check"></i> Marcar como Concluída
                                        </button>` : ''
                                    }
                                    ${
                                        sale.status === 'completed' ? 
                                        `<button type="button" class="btn btn-warning" onclick="salesManager.updateSaleStatus('${sale.id}', 'refunded')">
                                            <i class="fas fa-undo"></i> Reembolsar
                                        </button>` : ''
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                // Remover modal existente
                const existingModal = document.getElementById('saleDetailsModal');
                if (existingModal) {
                    existingModal.remove();
                }

                // Adicionar novo modal
                document.body.insertAdjacentHTML('beforeend', modalHTML);
                
                // Mostrar modal
                const modal = new bootstrap.Modal(document.getElementById('saleDetailsModal'));
                modal.show();
            }
        } catch (error) {
            console.error('Erro ao carregar detalhes da venda:', error);
            this.showError('Erro ao carregar detalhes da venda');
        }
    }

    async updateSaleStatus(saleId, newStatus) {
        try {
            const response = await fetch(`/api/admin/sales/${saleId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...GMP_Security.getAuthHeaders()
                },
                body: JSON.stringify({ status: newStatus })
            });

            const data = await response.json();

            if (data.success) {
                this.showSuccess('Status da venda atualizado com sucesso!');
                
                // Fechar modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('saleDetailsModal'));
                if (modal) modal.hide();

                // Recarregar lista
                this.loadSales();
                this.loadStats();
            } else {
                this.showError(data.error || 'Erro ao atualizar status da venda');
            }
        } catch (error) {
            console.error('Erro ao atualizar status da venda:', error);
            this.showError('Erro ao atualizar status da venda');
        }
    }

    async exportSales() {
        try {
            // Exportar todas as vendas
            const response = await fetch('/api/admin/sales?limit=1000', {
                headers: GMP_Security.getAuthHeaders()
            });
            const data = await response.json();
            
            if (data.success) {
                this.downloadCSV(data.sales);
            }
        } catch (error) {
            console.error('Erro ao exportar vendas:', error);
            this.showError('Erro ao exportar dados de vendas');
        }
    }

    downloadCSV(sales) {
        const headers = ['ID da Transação', 'Cliente', 'Email', 'Produto', 'Valor', 'Status', 'Método de Pagamento', 'Data'];
        const rows = sales.map(sale => [
            sale.transactionId || sale.id,
            sale.customerName || 'Cliente não identificado',
            sale.customerEmail || '',
            sale.productTitle || 'Produto não identificado',
            `R$${sale.amount || 0}`,
            this.getStatusText(sale.status),
            sale.paymentMethod || 'Não especificado',
            new Date(sale.createdAt).toLocaleDateString('pt-BR')
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `vendas_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
    window.salesManager = new SalesManager();
});