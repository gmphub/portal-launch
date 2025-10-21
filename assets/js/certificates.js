
/*
  certificates.js
  - Carrega templates e certificados emitidos do backend
  - Renderiza dinamicamente e conecta botões a chamadas reais (GET/POST/PUT/DELETE)
  - Usa headers de autenticação de window.securityManager.getAuthHeaders()
  - Event delegation para garantir funcionamento mesmo em conteúdo dinâmico
*/

(async function () {
  'use strict';

  // Headers helper (invocado por chamada)
  const headers = () => (window.securityManager && typeof window.securityManager.getAuthHeaders === 'function')
    ? window.securityManager.getAuthHeaders()
    : { 'Content-Type': 'application/json' };

  // Element references
  const templateContainer = document.getElementById('templateContainer');
  const issuedContainer = document.getElementById('issuedContainer');
  const novoBtn = document.getElementById('novoModeloBtn');
  const verTodosBtn = document.getElementById('verTodosBtn');

  // Basic DOM creation util
  function el(tag, attrs = {}, html = '') {
    const d = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') d.className = v;
      else if (k === 'style') d.setAttribute('style', v);
      else d.setAttribute(k, v);
    }
    if (html) d.innerHTML = html;
    return d;
  }

  // Escape helper
  function escapeHtml(str = '') {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  // Format date
  function formatDate(d) {
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt)) return d;
    return dt.toLocaleDateString();
  }

  // API wrapper with logs
  async function api(path, opts = {}) {
    const h = Object.assign({}, headers(), opts.headers || {});
    const options = Object.assign({}, opts, { headers: h });
    console.log('[certificates.js] API', path, options.method || 'GET', { headers: h });
    try {
      const res = await fetch(path, options);
      const text = await res.text();
      let json = null;
      try { json = text ? JSON.parse(text) : null; } catch (e) { json = null; }
      if (!res.ok) {
        console.error(`[certificates.js] API error ${res.status} ${path}`, json || text);
        return { ok: false, status: res.status, data: json, text };
      }
      return { ok: true, status: res.status, data: json };
    } catch (err) {
      console.error('[certificates.js] Network error', err);
      return { ok: false, error: err.message };
    }
  }

  // Loading / error blocks
  function loadingCard(text) {
    return '<div style="padding:1.5rem; text-align:center; color:var(--text-secondary);">' + escapeHtml(text) + '</div>';
  }
  function errorCard(text) {
    return '<div style="padding:1.5rem; text-align:center; color:var(--danger-color,#d9534f);">' + escapeHtml(text) + '</div>';
  }

  // Render functions
  function renderTemplates(templates) {
    templateContainer.innerHTML = '';
    if (!templates || templates.length === 0) {
      templateContainer.appendChild(el('div', { style: 'padding:1.5rem; text-align:center; color:var(--text-secondary);' }, 'Nenhum modelo encontrado.'));
      return;
    }
    templates.forEach(t => {
      const card = el('div', { class: 'template-card', style: 'background:var(--bg-secondary); border-radius:12px; padding:1.5rem; box-shadow:0 4px 12px rgba(0,0,0,0.06);' });
      const header = el('div', { style: 'display:flex; align-items:center; gap:1rem; margin-bottom:1rem;' });
      header.appendChild(el('div', { style: 'width:50px; height:50px; border-radius:10px; display:flex; align-items:center; justify-content:center; color:white; background:' + (t.status === 'active' ? 'linear-gradient(45deg,#4CAF50,#45a049)' : 'linear-gradient(45deg,#FF9800,#F57C00)') }, t.status === 'active' ? '<i class="fas fa-certificate"></i>' : '<i class="fas fa-medal"></i>'));
      const info = el('div', { style: 'flex:1;' });
      info.appendChild(el('h4', { style: 'margin:0; font-size:16px; color:var(--text-primary);' }, escapeHtml(t.title || '—')));
      info.appendChild(el('p', { style: 'margin:0.25rem 0 0 0; color:var(--text-secondary); font-size:14px;' }, 'ID: ' + escapeHtml(t.id || '—')));
      header.appendChild(info);
      header.appendChild(el('span', { class: 'badge-modern ' + (t.status === 'active' ? 'badge-success' : 'badge-warning') }, escapeHtml(t.status || '—')));
      card.appendChild(header);

      card.appendChild(el('div', { style: 'background:' + (t.status === 'active' ? 'rgba(76,175,80,0.08)' : 'rgba(255,152,0,0.08)') + '; padding:1rem; border-radius:8px; margin-bottom:1rem; color:var(--text-primary);' }, '<div style="font-size:14px;color:var(--text-secondary);margin-bottom:0.5rem;"><strong>Curso Associado:</strong></div>' + escapeHtml(t.course || '—')));

      const actions = el('div', { style: 'display:flex; gap:0.5rem; justify-content:flex-end;' });
      actions.appendChild(el('button', { class: 'btn-modern btn-modern-secondary btn-sm js-template-view', 'data-id': t.id }, '<i class="fas fa-eye"></i> Visualizar'));
      actions.appendChild(el('button', { class: 'btn-modern btn-modern-primary btn-sm js-template-edit', 'data-id': t.id }, '<i class="fas fa-edit"></i> Editar'));
      if (t.status === 'active') {
        actions.appendChild(el('button', { class: 'btn-modern btn-modern-danger btn-sm js-template-delete', 'data-id': t.id }, '<i class="fas fa-trash"></i> Excluir'));
      } else {
        actions.appendChild(el('button', { class: 'btn-modern btn-modern-success btn-sm js-template-activate', 'data-id': t.id }, '<i class="fas fa-check"></i> Ativar'));
        actions.appendChild(el('button', { class: 'btn-modern btn-modern-danger btn-sm js-template-delete', 'data-id': t.id }, '<i class="fas fa-trash"></i> Excluir'));
      }
      card.appendChild(actions);
      templateContainer.appendChild(card);
    });
  }

  function renderIssued(certificates) {
    issuedContainer.innerHTML = '';
    if (!certificates || certificates.length === 0) {
      issuedContainer.appendChild(el('div', { style: 'padding:1.5rem; text-align:center; color:var(--text-secondary);' }, 'Nenhum certificado emitido encontrado.'));
      return;
    }
    certificates.forEach(c => {
      const card = el('div', { style: 'background:var(--bg-secondary); border-radius:8px; padding:1.5rem; border-left:4px solid var(--primary-blue); display:flex; gap:1rem; align-items:center; justify-content:space-between;' });
      const left = el('div', { style: 'flex:1; display:flex; gap:1rem; align-items:center;' });
      left.appendChild(el('div', { style: 'width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; background:' + (c.templateId ? 'linear-gradient(45deg,#2196F3,#1976D2)' : 'linear-gradient(45deg,#9E9E9E,#757575)') }, '<i class="fas fa-award"></i>'));
      const info = el('div');
      info.appendChild(el('h4', { style: 'margin:0; font-size:16px;' }, escapeHtml(c.userName || c.id || '—')));
      info.appendChild(el('p', { style: 'margin:0.25rem 0 0 0; color:var(--text-secondary); font-size:14px;' }, escapeHtml((c.userName || '—') + ' • ' + (formatDate(c.issuedAt) || '—'))));
      info.appendChild(el('div', { style: 'background: rgba(0,0,0,0.03); padding:0.5rem; border-radius:6px; margin-top:0.5rem; font-size:13px; color:var(--text-primary);' }, '<strong style="font-size:13px;">Curso:</strong> ' + escapeHtml(c.course || '—')));
      left.appendChild(info);
      card.appendChild(left);

      const right = el('div', { style: 'display:flex; gap:0.5rem; margin-left:1rem;' });
      right.appendChild(el('button', { class: 'btn-modern btn-modern-secondary btn-sm js-issued-view', 'data-id': c.id }, '<i class="fas fa-eye"></i> Ver'));
      right.appendChild(el('button', { class: 'btn-modern btn-modern-primary btn-sm js-issued-download', 'data-id': c.id }, '<i class="fas fa-download"></i> Baixar'));
      card.appendChild(right);

      issuedContainer.appendChild(card);
    });
  }

  // CRUD helpers
  async function createTemplate(payload) {
    return api('/api/certificates/templates', { method: 'POST', body: JSON.stringify(payload) });
  }
  async function updateTemplate(id, payload) {
    return api(`/api/certificates/templates/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(payload) });
  }
  async function deleteTemplateById(id) {
    return api(`/api/certificates/templates/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }
  async function fetchTemplateById(id) {
    const r = await api('/api/certificates/templates', { method: 'GET' });
    if (r.ok && r.data && r.data.templates) return r.data.templates.find(t => t.id === id) || null;
    return null;
  }
  async function fetchCertificateFileUrl(id) {
    const r = await api(`/api/certificates/file/${encodeURIComponent(id)}`, { method: 'GET' });
    if (r.ok && r.data && r.data.url) return r.data.url;
    return `/certificados/${encodeURIComponent(id)}.pdf`;
  }

  // Delegated event handling
  document.addEventListener('click', async (ev) => {
    const viewTemplateBtn = ev.target.closest('.js-template-view');
    if (viewTemplateBtn) {
      const id = viewTemplateBtn.getAttribute('data-id');
      const tpl = await fetchTemplateById(id);
      if (tpl) {
        const html = `Título: ${escapeHtml(tpl.title||'—')}\nCurso: ${escapeHtml(tpl.course||'—')}\nStatus: ${escapeHtml(tpl.status||'—')}\nDescrição: ${escapeHtml(tpl.description||'—')}`;
        alert(html);
      } else alert('Modelo não encontrado.');
      return;
    }

    const editBtn = ev.target.closest('.js-template-edit');
    if (editBtn) {
      const id = editBtn.getAttribute('data-id');
      const tpl = await fetchTemplateById(id);
      if (!tpl) { alert('Template não encontrado'); return; }
      const title = prompt('Título do modelo:', tpl.title || '');
      if (title === null) return;
      const course = prompt('Curso associado:', tpl.course || '');
      if (course === null) return;
      const description = prompt('Descrição:', tpl.description || '');
      if (description === null) return;
      const status = prompt('Status (active/draft):', tpl.status || 'draft');
      if (status === null) return;
      const res = await updateTemplate(id, { title, course, description, status });
      if (res.ok) {
        await loadAll();
      } else alert('Falha ao atualizar modelo.');
      return;
    }

    const deleteBtn = ev.target.closest('.js-template-delete');
    if (deleteBtn) {
      const id = deleteBtn.getAttribute('data-id');
      if (!confirm('Excluir modelo de certificado? Esta ação não pode ser desfeita.')) return;
      const res = await deleteTemplateById(id);
      if (res.ok) await loadAll();
      else alert('Falha ao excluir modelo.');
      return;
    }

    const activateBtn = ev.target.closest('.js-template-activate');
    if (activateBtn) {
      const id = activateBtn.getAttribute('data-id');
      const res = await updateTemplate(id, { status: 'active' });
      if (res.ok) await loadAll();
      else alert('Falha ao ativar modelo.');
      return;
    }

    const issuedView = ev.target.closest('.js-issued-view');
    if (issuedView) {
      const id = issuedView.getAttribute('data-id');
      alert('Visualizar certificado: ' + id + '\n(implemente visualizador PDF/HTML se necessário)');
      return;
    }

    const issuedDownload = ev.target.closest('.js-issued-download');
    if (issuedDownload) {
      const id = issuedDownload.getAttribute('data-id');
      const url = await fetchCertificateFileUrl(id);
      const a = document.createElement('a'); a.href = url; a.download = `certificado-${id}.pdf`; document.body.appendChild(a); a.click(); a.remove();
      return;
    }
  });

  // Novo modelo click
  if (novoBtn) {
    novoBtn.addEventListener('click', async () => {
      const title = prompt('Título do modelo:');
      if (!title) return;
      const course = prompt('Curso associado:');
      if (!course) return;
      const description = prompt('Descrição:') || '';
      const payload = { title, course, description, status: 'draft' };
      const res = await createTemplate(payload);
      if (res.ok) await loadAll();
      else alert('Falha ao criar modelo.');
    });
  }

  // Ver todos (simplificado: abre página de listagem, se existir)
  if (verTodosBtn) {
    verTodosBtn.addEventListener('click', () => { window.location.href = '/gmp-portal/admin/certificates-list.html'; });
  }

  // Update stats
  function updateStatsFromTemplates(templates = []) {
    try {
      const active = templates.filter(t => t.status === 'active').length;
      const node = document.getElementById('estatAtivos');
      if (node) node.textContent = String(active);
    } catch (e) { console.warn(e); }
  }
  function updateStatsFromIssued(issued = []) {
    try {
      const total = issued.length;
      const node = document.getElementById('estatTotal');
      if (node) node.textContent = String(total);
      // compute month count
      const now = new Date();
      const thisMonth = issued.filter(i => {
        try { const d = new Date(i.issuedAt); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); } catch { return false; }
      }).length;
      const mesNode = document.getElementById('estatMes');
      if (mesNode) mesNode.textContent = String(thisMonth);
    } catch (e) { console.warn(e); }
  }

  // Load both sets
  async function loadAll() {
    if (!templateContainer || !issuedContainer) {
      console.error('[certificates.js] Containers not found in DOM');
      return;
    }
    templateContainer.innerHTML = loadingCard('Carregando modelos de certificado...');
    issuedContainer.innerHTML = loadingCard('Carregando certificados emitidos...');
    const [tRes, iRes] = await Promise.all([
      api('/api/certificates/templates', { method: 'GET' }),
      api('/api/certificates/issued', { method: 'GET' })
    ]);
    if (tRes.ok && tRes.data && tRes.data.templates) {
      renderTemplates(tRes.data.templates);
      updateStatsFromTemplates(tRes.data.templates);
    } else {
      templateContainer.innerHTML = errorCard('Erro ao carregar modelos');
      console.error('[certificates.js] templates response', tRes);
    }
    if (iRes.ok && iRes.data && iRes.data.certificates) {
      renderIssued(iRes.data.certificates);
      updateStatsFromIssued(iRes.data.certificates);
    } else {
      issuedContainer.innerHTML = errorCard('Erro ao carregar certificados emitidos');
      console.error('[certificates.js] issued response', iRes);
    }
  }

  // Initialization checks + logs
  console.log('[certificates.js] initializing. securityManager present:', !!window.securityManager, 'getAuthHeaders:', typeof (window.securityManager && window.securityManager.getAuthHeaders) === 'function');
  const initialHeaders = headers();
  console.log('[certificates.js] initial headers:', initialHeaders);

  // If auth header missing, show notice in templateContainer
  if (!initialHeaders || !initialHeaders.Authorization) {
    templateContainer && (templateContainer.innerHTML = '<div style="padding:1rem; color:var(--warning-yellow);">Atenção: token de autenticação não encontrado. Faça login para acessar dados reais.</div>');
    issuedContainer && (issuedContainer.innerHTML = '<div style="padding:1rem; color:var(--warning-yellow);">Atenção: token de autenticação não encontrado. Faça login para acessar dados reais.</div>');
    // still attempt load to show errors from backend if any
  }

  // Start load
  await loadAll();

})();
