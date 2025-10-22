/**
 * Products Management Module
 * Gestão completa de produtos/cursos
 */

class ProductsManager {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 10;
        this.searchTerm = '';
        this.statusFilter = 'all';
        this.products = [];
        this.stats = {};
        this.selectedProduct = null;
        this.init();
    }

    async init() {
        try {
            await this.loadStats();
            await this.loadProducts();
            this.setupEventListeners();
            this.setupSearchAndFilters();
        } catch (error) {
            console.error('Erro ao inicializar ProductsManager:', error);
            this.showError('Erro ao carregar dados dos produtos');
        }
    }

    async loadStats() {
        try {
            const response = await fetch('/api/admin/products/stats', {
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

    async loadProducts() {
        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.pageSize,
                search: this.searchTerm,
                status: this.statusFilter
            });

            const response = await fetch(`/api/admin/products?${params}`, {
                headers: GMP_Security.getAuthHeaders()
            });
            const data = await response.json();
            
            if (data.success) {
                this.products = data.products;
                this.pagination = data.pagination;
                this.renderProducts();
                this.renderPagination();
            }
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            this.showError('Erro ao carregar lista de produtos');
        }
    }

    renderStats() {
        const statsContainer = document.getElementById('statsContainer');
        if (!statsContainer) return;

        statsContainer.innerHTML = `
            <div class="modern-metric-card">
                <div class="metric-header">
                    <div class="metric-icon"><i class="fas fa-box"></i></div>
                </div>
                <div class="metric-value">${this.stats.total || 0}</div>
                <div class="metric-label">Total de Cursos</div>
            </div>
            <div class="modern-metric-card">
                <div class="metric-header">
                    <div class="metric-icon"><i class="fas fa-check-circle"></i></div>
                </div>
                <div class="metric-value">${this.stats.active || 0}</div>
                <div class="metric-label">Cursos Ativos</div>
            </div>
            <div class="modern-metric-card">
                <div class="metric-header">
                    <div class="metric-icon"><i class="fas fa-users"></i></div>
                </div>
                <div class="metric-value">${this.stats.enrollments || 0}</div>
                <div class="metric-label">Matrículas</div>
            </div>
            <div class="modern-metric-card">
                <div class="metric-header">
                    <div class="metric-icon"><i class="fas fa-tag"></i></div>
                </div>
                <div class="metric-value">R$${this.stats.avgPrice || 0}</div>
                <div class="metric-label">Preço Médio</div>
            </div>
        `;
    }

    renderProducts() {
        const productsContainer = document.getElementById('productsContainer');
        if (!productsContainer) return;

        if (this.products.length === 0) {
            productsContainer.innerHTML = `
                <div class="text-center" style="padding: 3rem;">
                    <i class="fas fa-box" style="font-size: 4rem; color: var(--text-secondary); margin-bottom: 1rem;"></i>
                    <h3 style="color: var(--text-secondary); margin-bottom: 0.5rem;">Nenhum curso encontrado</h3>
                    <p style="color: var(--text-secondary);">Tente ajustar os filtros ou adicionar novos cursos.</p>
                    <button class="btn-modern btn-modern-primary mt-3" onclick="productsManager.showAddProductModal()">
                        <i class="fas fa-plus"></i> Criar Novo Curso
                    </button>
                </div>
            `;
            return;
        }

        productsContainer.innerHTML = this.products.map(product => `
            <div class="card-horizontal shadow-hover" style="margin-bottom: 1rem;">
                <div class="card-icon" style="background: linear-gradient(135deg, var(--primary-blue), var(--primary-purple));">
                    <i class="fas fa-book"></i>
                </div>
                <div class="card-content">
                    <h3 class="card-title">${product.title}</h3>
                    <p class="card-description">${product.description || 'Sem descrição'}</p>
                    <div class="d-flex gap-3 mt-2">
                        <div>
                            <small class="text-muted">Preço</small>
                            <div class="font-weight-bold">R$${product.price || 0}</div>
                        </div>
                        <div>
                            <small class="text-muted">Categoria</small>
                            <div class="font-weight-bold">${product.category || 'Não definida'}</div>
                        </div>
                        <div>
                            <small class="text-muted">Nível</small>
                            <div class="font-weight-bold">${product.level || 'Não definido'}</div>
                        </div>
                        <div>
                            <small class="text-muted">Duração</small>
                            <div class="font-weight-bold">${product.duration || 0}h</div>
                        </div>
                        <div>
                            <small class="text-muted">Aulas</small>
                            <div class="font-weight-bold">${product.lessonsCount || 0}</div>
                        </div>
                        <div>
                            <small class="text-muted">Matrículas</small>
                            <div class="font-weight-bold">${product.enrollments || 0}</div>
                        </div>
                    </div>
                </div>
                <div class="card-actions">
                    <span class="badge-modern ${product.isActive ? 'badge-success' : 'badge-warning'}">
                        ${product.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                    <button class="btn-modern btn-modern-secondary btn-sm" onclick="productsManager.viewProductDetails('${product.id}')">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                    <button class="btn-modern btn-modern-primary btn-sm" onclick="productsManager.showEditProductModal('${product.id}')">
                        <i class="fas fa-edit"></i> Editar
                    </button>
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
                <a class="page-link" href="#" onclick="productsManager.goToPage(${page - 1})">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
        `;

        // Show first page
        if (page > 2) {
            paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="productsManager.goToPage(1)">1</a></li>`;
            if (page > 3) {
                paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }

        // Show pages around current
        for (let i = Math.max(1, page - 1); i <= Math.min(pages, page + 1); i++) {
            paginationHTML += `
                <li class="page-item ${i === page ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="productsManager.goToPage(${i})">${i}</a>
                </li>
            `;
        }

        // Show last page
        if (page < pages - 1) {
            if (page < pages - 2) {
                paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
            paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="productsManager.goToPage(${pages})">${pages}</a></li>`;
        }

        paginationHTML += `
            <li class="page-item ${page === pages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="productsManager.goToPage(${page + 1})">
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
            paginationInfo.innerHTML = `Mostrando ${start}-${end} de ${total} cursos`;
        }
    }

    goToPage(page) {
        if (page < 1 || page > this.pagination.pages) return;
        this.currentPage = page;
        this.loadProducts();
    }

    setupEventListeners() {
        // Botão adicionar produto
        const addProductBtn = document.getElementById('addProductBtn');
        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => this.showAddProductModal());
        }

        // Botão salvar produto
        const saveProductBtn = document.getElementById('saveProductBtn');
        if (saveProductBtn) {
            saveProductBtn.addEventListener('click', () => this.saveProduct());
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
                    this.loadProducts();
                }, 500);
            });
        }

        // Filtro de status
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.statusFilter = e.target.value;
                this.currentPage = 1;
                this.loadProducts();
            });
        }

        // Botão filtrar
        const filterBtn = document.querySelector('button:has(.fa-filter), button[onclick*="loadProducts"]');
        if (filterBtn) {
            filterBtn.addEventListener('click', () => {
                this.currentPage = 1;
                this.loadProducts();
            });
        }
    }

    showAddProductModal() {
        this.selectedProduct = null;
        this.showProductFormModal('Adicionar Novo Curso');
    }

    showEditProductModal(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;
        
        this.selectedProduct = product;
        this.showProductFormModal('Editar Curso', product);
    }

    showProductFormModal(title, productData = null) {
        const modalHTML = `
            <div class="modal fade" id="productFormModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-box"></i> ${title}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <form id="productForm">
                            <div class="modal-body">
                                <div class="mb-3">
                                    <label for="productTitle" class="form-label">Título *</label>
                                    <input type="text" class="form-control" id="productTitle" required value="${productData?.title || ''}">
                                </div>
                                <div class="mb-3">
                                    <label for="productDescription" class="form-label">Descrição</label>
                                    <textarea class="form-control" id="productDescription" rows="3">${productData?.description || ''}</textarea>
                                </div>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="productPrice" class="form-label">Preço (R$)</label>
                                            <input type="number" class="form-control" id="productPrice" step="0.01" value="${productData?.price || ''}">
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="productCategory" class="form-label">Categoria</label>
                                            <input type="text" class="form-control" id="productCategory" value="${productData?.category || ''}">
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="productLevel" class="form-label">Nível</label>
                                            <select class="form-control" id="productLevel">
                                                <option value="">Selecione um nível</option>
                                                <option value="beginner" ${productData?.level === 'beginner' ? 'selected' : ''}>Iniciante</option>
                                                <option value="intermediate" ${productData?.level === 'intermediate' ? 'selected' : ''}>Intermediário</option>
                                                <option value="advanced" ${productData?.level === 'advanced' ? 'selected' : ''}>Avançado</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="productStatus" class="form-label">Status</label>
                                            <select class="form-control" id="productStatus">
                                                <option value="1" ${productData?.isActive ? 'selected' : ''}>Ativo</option>
                                                <option value="0" ${productData && !productData.isActive ? 'selected' : ''}>Inativo</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="productDuration" class="form-label">Duração (horas)</label>
                                            <input type="number" class="form-control" id="productDuration" value="${productData?.duration || ''}">
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="productLessonsCount" class="form-label">Número de Aulas</label>
                                            <input type="number" class="form-control" id="productLessonsCount" value="${productData?.lessonsCount || ''}">
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                                <button type="button" class="btn btn-primary" id="saveProductBtn">
                                    <i class="fas fa-save"></i> Salvar Curso
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        // Remover modal existente
        const existingModal = document.getElementById('productFormModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Adicionar novo modal
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('productFormModal'));
        modal.show();
    }

    async saveProduct() {
        const formData = {
            title: document.getElementById('productTitle').value,
            description: document.getElementById('productDescription').value,
            price: document.getElementById('productPrice').value,
            category: document.getElementById('productCategory').value,
            level: document.getElementById('productLevel').value,
            duration: document.getElementById('productDuration').value,
            lessonsCount: document.getElementById('productLessonsCount').value,
            isActive: document.getElementById('productStatus').value === '1'
        };

        // Validação básica
        if (!formData.title) {
            this.showError('O título do curso é obrigatório');
            return;
        }

        try {
            const url = this.selectedProduct ? 
                `/api/admin/products/${this.selectedProduct.id}` : 
                '/api/admin/products';
            
            const method = this.selectedProduct ? 'PUT' : 'POST';

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
                this.showSuccess(this.selectedProduct ? 'Curso atualizado com sucesso!' : 'Curso adicionado com sucesso!');
                
                // Fechar modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('productFormModal'));
                if (modal) modal.hide();

                // Recarregar lista
                this.loadProducts();
                this.loadStats();
            } else {
                this.showError(data.error || 'Erro ao salvar curso');
            }
        } catch (error) {
            console.error('Erro ao salvar curso:', error);
            this.showError('Erro ao salvar curso');
        }
    }

    async viewProductDetails(productId) {
        try {
            const response = await fetch(`/api/admin/products/${productId}`, {
                headers: GMP_Security.getAuthHeaders()
            });
            const data = await response.json();
            
            if (data.success) {
                const product = data.product;
                
                const modalHTML = `
                    <div class="modal fade" id="productDetailsModal" tabindex="-1">
                        <div class="modal-dialog modal-lg">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title">
                                        <i class="fas fa-box"></i> Detalhes do Curso
                                    </h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                </div>
                                <div class="modal-body">
                                    <div class="row">
                                        <div class="col-md-12">
                                            <h4>${product.title}</h4>
                                            <p class="text-muted">${product.description || 'Sem descrição'}</p>
                                            
                                            <div class="row mt-4">
                                                <div class="col-md-4">
                                                    <div class="stat-item">
                                                        <div class="stat-label">Preço</div>
                                                        <div class="stat-value">R$${product.price || 0}</div>
                                                    </div>
                                                </div>
                                                <div class="col-md-4">
                                                    <div class="stat-item">
                                                        <div class="stat-label">Categoria</div>
                                                        <div class="stat-value">${product.category || 'Não definida'}</div>
                                                    </div>
                                                </div>
                                                <div class="col-md-4">
                                                    <div class="stat-item">
                                                        <div class="stat-label">Nível</div>
                                                        <div class="stat-value">${product.level || 'Não definido'}</div>
                                                    </div>
                                                </div>
                                                <div class="col-md-4">
                                                    <div class="stat-item">
                                                        <div class="stat-label">Duração</div>
                                                        <div class="stat-value">${product.duration || 0} horas</div>
                                                    </div>
                                                </div>
                                                <div class="col-md-4">
                                                    <div class="stat-item">
                                                        <div class="stat-label">Aulas</div>
                                                        <div class="stat-value">${product.lessonsCount || 0}</div>
                                                    </div>
                                                </div>
                                                <div class="col-md-4">
                                                    <div class="stat-item">
                                                        <div class="stat-label">Status</div>
                                                        <div class="stat-value">
                                                            <span class="badge ${product.isActive ? 'badge-success' : 'badge-warning'}">
                                                                ${product.isActive ? 'Ativo' : 'Inativo'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="col-md-4">
                                                    <div class="stat-item">
                                                        <div class="stat-label">Matrículas</div>
                                                        <div class="stat-value">${product.enrollments || 0}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                                    <button type="button" class="btn btn-primary" onclick="productsManager.showEditProductModal('${product.id}')">
                                        <i class="fas fa-edit"></i> Editar Curso
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                // Remover modal existente
                const existingModal = document.getElementById('productDetailsModal');
                if (existingModal) {
                    existingModal.remove();
                }

                // Adicionar novo modal
                document.body.insertAdjacentHTML('beforeend', modalHTML);
                
                // Mostrar modal
                const modal = new bootstrap.Modal(document.getElementById('productDetailsModal'));
                modal.show();
            }
        } catch (error) {
            console.error('Erro ao carregar detalhes do produto:', error);
            this.showError('Erro ao carregar detalhes do curso');
        }
    }

    async deleteProduct(productId) {
        if (!confirm('Tem certeza que deseja excluir este curso? Esta ação não pode ser desfeita.')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/products/${productId}`, {
                method: 'DELETE',
                headers: GMP_Security.getAuthHeaders()
            });

            const data = await response.json();

            if (data.success) {
                this.showSuccess('Curso excluído com sucesso!');
                this.loadProducts();
                this.loadStats();
            } else {
                this.showError(data.error || 'Erro ao excluir curso');
            }
        } catch (error) {
            console.error('Erro ao excluir curso:', error);
            this.showError('Erro ao excluir curso');
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
    window.productsManager = new ProductsManager();
});