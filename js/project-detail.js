// JADI.in Hub — project-detail.js
// One place per project: summary, tasks, vendor quotes, daily log, attachments and invoices.

window.detailProjectId = null;
window.detailTab = 'summary';
const DETAIL_TABS = ['summary', 'tasks', 'quotes', 'attachments', 'invoices'];

// ---------- SHARED HELPERS ----------
function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDaysStr(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function selectedQuotes(projectId) {
    return quotes.filter(q => q.projectId === projectId && q.status === 'SELECTED');
}

// Sub-contract cost: the sum of selected quotes when there are any, otherwise the manual figure.
function projectCost(p) {
    const sel = selectedQuotes(p.id);
    if (sel.length) return sel.reduce((sum, q) => sum + Number(q.amount || 0), 0);
    return Number(p.cost || 0);
}

function projectTasks(projectId) {
    return tasks.filter(x => x.projectId === projectId);
}

function projectProgress(projectId) {
    const list = projectTasks(projectId);
    if (!list.length) return null;
    const done = list.filter(x => x.status === 'DONE').length;
    return { done, total: list.length, pct: Math.round((done / list.length) * 100) };
}

function progressBarHTML(projectId, compact) {
    const pr = projectProgress(projectId);
    if (!pr) return '';
    return `<div class="${compact ? 'mt-1.5' : 'mt-2'} flex items-center gap-2" title="${pr.done}/${pr.total} ${esc(t('tasksDone'))}">
        <div class="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden"><div class="h-full rounded-full ${pr.pct === 100 ? 'bg-emerald-500' : 'bg-blue-500'}" style="width:${pr.pct}%"></div></div>
        <span class="text-[10px] font-semibold text-gray-400">${pr.done}/${pr.total}</span>
    </div>`;
}

function statusPill(kind, status) {
    const styles = {
        NOT_STARTED: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
        IN_PROGRESS: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
        DONE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
        PENDING: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
        SELECTED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
        REJECTED: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300',
        DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
        SENT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        PAID: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
        OVERDUE: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300'
    };
    return `<span class="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full ${styles[status] || styles.NOT_STARTED}">${esc(t(`${kind}_${status}`))}</span>`;
}

function starsHTML(value, onclickFn) {
    const v = Math.round(Number(value || 0));
    return [1, 2, 3, 4, 5].map(n => onclickFn
        ? `<button type="button" onclick="${onclickFn}(${n})" class="${n <= v ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'} hover:text-amber-500"><i class="fa-solid fa-star text-xs"></i></button>`
        : `<i class="fa-solid fa-star text-[10px] ${n <= v ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'}"></i>`).join('');
}

// ---------- PANEL ----------
function openProjectDetail(id, tab) {
    const p = projects.find(x => x.id === id);
    if (!p) return;
    window.detailProjectId = id;
    window.detailTab = tab || 'summary';
    document.getElementById('modal-project-detail').classList.remove('hidden');
    renderProjectDetail();
}

function closeProjectDetail() {
    window.detailProjectId = null;
    document.getElementById('modal-project-detail').classList.add('hidden');
}

function switchDetailTab(tab) {
    window.detailTab = tab;
    renderProjectDetail();
}

function renderProjectDetail() {
    const modal = document.getElementById('modal-project-detail');
    if (!modal || modal.classList.contains('hidden') || !window.detailProjectId) return;
    const p = projects.find(x => x.id === window.detailProjectId);
    if (!p) { closeProjectDetail(); return; }

    document.getElementById('detail-client').innerText = p.client || '';
    document.getElementById('detail-title').innerText = p.title || '';
    document.getElementById('detail-meta').innerHTML = `${getStatusBadgeHTML(p.status)}
        <span class="text-xs text-gray-500 dark:text-gray-400"><i class="fa-solid fa-user mr-1"></i>${esc(p.pic || '-')}</span>
        <span class="text-xs text-gray-500 dark:text-gray-400"><i class="fa-solid fa-flag-checkered mr-1"></i>${esc(p.deadline || '-')}</span>`;

    const counts = {
        tasks: projectTasks(p.id).length,
        quotes: quotes.filter(q => q.projectId === p.id).length,
        attachments: (p.attachments || []).length,
        invoices: invoices.filter(i => i.projectId === p.id).length
    };
    document.getElementById('detail-tabs').innerHTML = DETAIL_TABS.map(tab => `
        <button onclick="switchDetailTab('${tab}')" class="px-3 py-2 text-sm font-semibold rounded-lg whitespace-nowrap transition ${tab === window.detailTab ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}">
            ${esc(t(`detailTab_${tab}`))}${counts[tab] ? ` <span class="ml-1 text-[10px] opacity-75">${counts[tab]}</span>` : ''}
        </button>`).join('');

    const body = document.getElementById('detail-body');
    const renderers = { summary: renderDetailSummary, tasks: renderDetailTasks, quotes: renderDetailQuotes, attachments: renderDetailAttachments, invoices: renderDetailInvoices };
    // Live updates re-render the panel; keep whatever the user is typing unless a form was just submitted.
    const keep = window.detailResetForm || body.dataset.tab !== window.detailTab ? null : captureInputs(body);
    window.detailResetForm = false;
    body.dataset.tab = window.detailTab;
    body.innerHTML = renderers[window.detailTab](p);
    restoreInputs(body, keep);
    toggleQuoteOtherName();
}

function captureInputs(container) {
    const values = {};
    container.querySelectorAll('input[id], select[id], textarea[id]').forEach(el => { values[el.id] = el.value; });
    const active = document.activeElement;
    return { values, focus: active && container.contains(active) ? active.id : null };
}

function restoreInputs(container, state) {
    if (!state) return;
    Object.entries(state.values).forEach(([id, value]) => {
        const el = container.querySelector(`#${CSS.escape(id)}`);
        if (el && el.type !== 'file') el.value = value;
    });
    if (state.focus) {
        const el = container.querySelector(`#${CSS.escape(state.focus)}`);
        if (el) el.focus();
    }
}

// ---------- SUMMARY ----------
function renderDetailSummary(p) {
    const cost = projectCost(p);
    const profit = Number(p.revenue || 0) - cost;
    const margin = p.revenue > 0 ? ((profit / p.revenue) * 100).toFixed(1) : 0;
    const sel = selectedQuotes(p.id);
    const pr = projectProgress(p.id);
    const lastLogs = (p.logs || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 3);
    const card = (label, value, cls = '') => `<div class="bg-gray-50 dark:bg-gray-700/40 p-4 rounded-xl"><div class="text-[11px] font-bold uppercase tracking-wider text-gray-400">${label}</div><div class="text-lg font-black mt-1 ${cls}">${value}</div></div>`;
    return `
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            ${card(t('detailRevenue'), formatIDR(p.revenue || 0), 'text-gray-900 dark:text-white')}
            ${card(t('detailCost'), formatIDR(cost), 'text-gray-700 dark:text-gray-200')}
            ${card(t('detailProfit'), formatIDR(profit), profit >= 0 ? 'text-emerald-600' : 'text-rose-600')}
            ${card(t('detailMargin'), `${margin}%`, margin >= 40 ? 'text-emerald-600' : 'text-amber-600')}
        </div>
        <p class="text-xs text-gray-500 dark:text-gray-400">${sel.length ? t('costFromQuotes', { n: sel.length }) : t('costManual')}</p>
        <div class="grid md:grid-cols-2 gap-4">
            <div class="border border-gray-100 dark:border-gray-700 rounded-xl p-4 space-y-2">
                <div class="flex justify-between items-center"><h4 class="font-bold text-sm">${t('detailTab_tasks')}</h4><button onclick="switchDetailTab('tasks')" class="text-xs text-blue-600 font-semibold">${t('viewAll')}</button></div>
                ${pr ? `${progressBarHTML(p.id)}<p class="text-xs text-gray-500">${pr.done}/${pr.total} ${t('tasksDone')}</p>` : `<p class="text-xs text-gray-400">${t('tasksEmpty')}</p>`}
            </div>
            <div class="border border-gray-100 dark:border-gray-700 rounded-xl p-4 space-y-2">
                <div class="flex justify-between items-center"><h4 class="font-bold text-sm">${t('detailPartners')}</h4><button onclick="switchDetailTab('quotes')" class="text-xs text-blue-600 font-semibold">${t('viewAll')}</button></div>
                ${sel.length ? sel.map(q => `<div class="flex justify-between text-xs"><span><span class="text-gray-400">${esc(q.need)}:</span> <b>${esc(q.partnerName)}</b></span><span class="font-semibold">${formatIDR(q.amount)}</span></div>`).join('')
                    : `<p class="text-xs text-gray-400">${p.freelancer ? esc(p.freelancer) : t('quotesNoneSelected')}</p>`}
            </div>
        </div>
        <div class="border border-gray-100 dark:border-gray-700 rounded-xl p-4 space-y-2">
            <div class="flex justify-between items-center"><h4 class="font-bold text-sm">${t('detailLatestLogs')}</h4><button onclick="openDailyLogModal('${p.id}')" class="text-xs text-blue-600 font-semibold"><i class="fa-solid fa-plus mr-1"></i>${t('addDailyLog')}</button></div>
            ${lastLogs.length ? lastLogs.map(l => `<div class="text-xs"><span class="text-gray-400">${esc(l.date)} · ${esc(l.pic)}</span><p class="text-gray-700 dark:text-gray-200">${esc(l.note)}</p></div>`).join('') : `<p class="text-xs text-gray-400">${t('noLogsFound')}</p>`}
        </div>
        <div class="flex flex-wrap gap-2">
            <button onclick="editProject('${p.id}')" class="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-sm font-semibold"><i class="fa-solid fa-pen mr-1"></i>${t('editProject')}</button>
            <button onclick="newInvoiceForProject('${p.id}')" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold"><i class="fa-solid fa-file-invoice-dollar mr-1"></i>${t('invCreateBtn')}</button>
        </div>`;
}

// ---------- TASKS ----------
function renderDetailTasks(p) {
    const list = projectTasks(p.id).slice().sort((a, b) =>
        (a.status === 'DONE') - (b.status === 'DONE') || String(a.dueDate || '9999').localeCompare(String(b.dueDate || '9999')));
    const today = todayStr();
    const picOptions = pics.map(x => `<option value="${esc(x.name)}">${esc(x.name)}</option>`).join('');
    const rows = list.map(task => {
        const overdue = task.status !== 'DONE' && task.dueDate && task.dueDate < today;
        const icon = { NOT_STARTED: 'fa-regular fa-circle text-gray-400', IN_PROGRESS: 'fa-solid fa-circle-half-stroke text-amber-500', DONE: 'fa-solid fa-circle-check text-emerald-500' }[task.status || 'NOT_STARTED'];
        return `
        <div class="flex items-center gap-3 py-2.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
            <button onclick="cycleTaskStatus('${task.id}')" title="${esc(t('resCycleHint'))}" class="text-lg"><i class="${icon}"></i></button>
            <div class="flex-1 min-w-0">
                <div class="text-sm font-medium ${task.status === 'DONE' ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-100'}">${esc(task.title)}</div>
                <div class="text-[11px] ${overdue ? 'text-rose-600 font-semibold' : 'text-gray-400'}">${esc(task.assignee || '-')} · ${task.dueDate ? esc(task.dueDate) : t('noDueDate')}${overdue ? ` · ${t('overdue')}` : ''}</div>
            </div>
            ${statusPill('task', task.status || 'NOT_STARTED')}
            <button onclick="editTask('${task.id}')" class="p-1.5 text-gray-400 hover:text-blue-500"><i class="fa-solid fa-pen text-xs"></i></button>
            <button onclick="deleteTask('${task.id}')" class="admin-only p-1.5 text-gray-400 hover:text-rose-500"><i class="fa-solid fa-trash-can text-xs"></i></button>
        </div>`;
    }).join('');
    return `
        <form onsubmit="saveTask(event)" class="grid grid-cols-1 md:grid-cols-12 gap-2 bg-gray-50 dark:bg-gray-700/40 p-3 rounded-xl">
            <input type="hidden" id="task-id">
            <input id="task-title" required placeholder="${esc(t('taskTitlePlaceholder'))}" class="md:col-span-5 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg text-sm focus:outline-none">
            <select id="task-assignee" class="md:col-span-2 px-2 py-2 bg-white dark:bg-gray-800 rounded-lg text-sm">${picOptions}</select>
            <input type="date" id="task-due" class="md:col-span-2 px-2 py-2 bg-white dark:bg-gray-800 rounded-lg text-sm">
            <select id="task-status" class="md:col-span-2 px-2 py-2 bg-white dark:bg-gray-800 rounded-lg text-sm">${TASK_STATUSES.map(s => `<option value="${s}">${esc(t(`task_${s}`))}</option>`).join('')}</select>
            <button type="submit" class="md:col-span-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold"><i class="fa-solid fa-plus"></i></button>
        </form>
        <div>${rows || `<p class="text-sm text-gray-400 text-center py-8">${t('tasksEmpty')}</p>`}</div>`;
}

function saveTask(e) {
    e.preventDefault();
    const id = document.getElementById('task-id').value || `real_${Date.now()}`;
    const existing = tasks.find(x => x.id === id);
    const item = {
        ...(existing || {}),
        id,
        projectId: window.detailProjectId,
        title: document.getElementById('task-title').value.trim(),
        assignee: document.getElementById('task-assignee').value,
        dueDate: document.getElementById('task-due').value,
        status: document.getElementById('task-status').value,
        isDummy: existing ? !!existing.isDummy : false
    };
    if (existing) tasks[tasks.indexOf(existing)] = item; else tasks.unshift(item);
    window.detailResetForm = true;
    saveItem('tasks', item);
    showToast(t('toastTaskSaved'));
}

function editTask(id) {
    const task = tasks.find(x => x.id === id);
    if (!task) return;
    document.getElementById('task-id').value = task.id;
    document.getElementById('task-title').value = task.title || '';
    document.getElementById('task-assignee').value = task.assignee || '';
    document.getElementById('task-due').value = task.dueDate || '';
    document.getElementById('task-status').value = task.status || 'NOT_STARTED';
    document.getElementById('task-title').focus();
}

function cycleTaskStatus(id) {
    const task = tasks.find(x => x.id === id);
    if (!task) return;
    task.status = TASK_STATUSES[(TASK_STATUSES.indexOf(task.status || 'NOT_STARTED') + 1) % TASK_STATUSES.length];
    saveItem('tasks', task);
}

function deleteTask(id) {
    if (!requireAdmin()) return;
    const task = tasks.find(x => x.id === id);
    askConfirm({
        title: t('confirmTitleDelete'),
        message: t('confirmMsgDelete', { name: itemLabel(task) }),
        button: t('delete'),
        onConfirm: () => removeItem('tasks', id, { skipCheck: true })
    });
}

// ---------- QUOTES (vendor offers) ----------
function partnerOptionsHTML() {
    const vOpts = vendors.map(v => `<option value="vendor:${v.id}">${esc(v.name)}${v.category ? ` — ${esc(v.category)}` : ''}</option>`).join('');
    const fOpts = freelancers.map(f => `<option value="freelancer:${f.id}">${esc(f.name)}${f.skill ? ` — ${esc(f.skill)}` : ''}</option>`).join('');
    return `<option value="other:">${esc(t('quotePartnerOther'))}</option>
        ${vOpts ? `<optgroup label="${esc(t('navVendors'))}">${vOpts}</optgroup>` : ''}
        ${fOpts ? `<optgroup label="${esc(t('navFreelancers'))}">${fOpts}</optgroup>` : ''}`;
}

function renderDetailQuotes(p) {
    const list = quotes.filter(q => q.projectId === p.id);
    const needs = [...new Set(list.map(q => q.need || '-'))];
    const allNeeds = [...new Set(quotes.map(q => q.need).filter(Boolean))].sort();
    const groups = needs.map(need => {
        const items = list.filter(q => (q.need || '-') === need).sort((a, b) => Number(a.amount || 0) - Number(b.amount || 0));
        const open = items.filter(q => q.status !== 'REJECTED');
        const cheapest = open.length ? Math.min(...open.map(q => Number(q.amount || 0))) : null;
        return `
        <div class="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
            <div class="px-4 py-2 bg-gray-50 dark:bg-gray-700/40 flex justify-between items-center">
                <h4 class="font-bold text-sm">${esc(need)}</h4>
                <span class="text-xs text-gray-400">${items.length} ${t('quotesCount')}</span>
            </div>
            ${items.map(q => quoteRowHTML(q, cheapest)).join('')}
        </div>`;
    }).join('');
    return `
        <form onsubmit="saveQuote(event)" class="grid grid-cols-1 md:grid-cols-12 gap-2 bg-gray-50 dark:bg-gray-700/40 p-3 rounded-xl">
            <input type="hidden" id="quote-id">
            <input id="quote-need" list="quote-need-list" required placeholder="${esc(t('quoteNeedPlaceholder'))}" class="md:col-span-3 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg text-sm focus:outline-none">
            <datalist id="quote-need-list">${allNeeds.map(n => `<option value="${esc(n)}"></option>`).join('')}</datalist>
            <select id="quote-partner" onchange="toggleQuoteOtherName()" class="md:col-span-3 px-2 py-2 bg-white dark:bg-gray-800 rounded-lg text-sm">${partnerOptionsHTML()}</select>
            <input id="quote-partner-name" placeholder="${esc(t('quotePartnerNamePlaceholder'))}" class="md:col-span-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg text-sm focus:outline-none">
            <input type="number" id="quote-amount" required min="0" step="1000" placeholder="${esc(t('quoteAmountPlaceholder'))}" class="md:col-span-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg text-sm focus:outline-none">
            <input type="url" id="quote-link" placeholder="${esc(t('quoteLinkPlaceholder'))}" class="md:col-span-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg text-sm focus:outline-none">
            <input id="quote-notes" placeholder="${esc(t('quoteNotesPlaceholder'))}" class="md:col-span-10 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg text-sm focus:outline-none">
            <button type="submit" class="md:col-span-2 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-bold"><i class="fa-solid fa-plus mr-1"></i>${t('quoteAddBtn')}</button>
        </form>
        <p class="text-xs text-gray-500 dark:text-gray-400">${t('quotesHelp')}</p>
        ${groups || `<p class="text-sm text-gray-400 text-center py-8">${t('quotesEmpty')}</p>`}`;
}

function quoteRowHTML(q, cheapest) {
    const isCheapest = q.status !== 'REJECTED' && cheapest !== null && Number(q.amount || 0) === cheapest;
    const safeLink = /^https?:\/\//i.test(q.link || '') ? q.link : '';
    const partnerBtn = q.partnerId ? `onclick="openPartnerHistory('${q.partnerType}', '${q.partnerId}')" class="font-semibold text-gray-900 dark:text-white hover:text-teal-600 hover:underline"` : 'class="font-semibold text-gray-900 dark:text-white"';
    return `
    <div class="px-4 py-3 border-t border-gray-100 dark:border-gray-700 ${q.status === 'REJECTED' ? 'opacity-60' : ''} ${q.status === 'SELECTED' ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''}">
        <div class="flex flex-wrap items-center gap-2 justify-between">
            <div class="flex items-center gap-2 min-w-0">
                <button ${partnerBtn}>${esc(q.partnerName || '-')}</button>
                ${statusPill('quote', q.status || 'PENDING')}
                ${isCheapest ? `<span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300">${t('quoteCheapest')}</span>` : ''}
            </div>
            <div class="flex items-center gap-1">
                <span class="font-black text-sm mr-2">${formatIDR(q.amount || 0)}</span>
                ${q.status === 'SELECTED'
                    ? `<button onclick="setQuoteStatus('${q.id}', 'PENDING')" class="px-2 py-1 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 font-semibold">${t('quoteUnselect')}</button>`
                    : `<button onclick="setQuoteStatus('${q.id}', 'SELECTED')" class="px-2 py-1 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">${t('quoteSelect')}</button>`}
                ${q.status === 'PENDING' ? `<button onclick="setQuoteStatus('${q.id}', 'REJECTED')" class="px-2 py-1 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 font-semibold">${t('quoteReject')}</button>` : ''}
                <button onclick="editQuote('${q.id}')" class="p-1.5 text-gray-400 hover:text-blue-500"><i class="fa-solid fa-pen text-xs"></i></button>
                <button onclick="deleteQuote('${q.id}')" class="admin-only p-1.5 text-gray-400 hover:text-rose-500"><i class="fa-solid fa-trash-can text-xs"></i></button>
            </div>
        </div>
        ${q.notes || safeLink ? `<div class="text-xs text-gray-500 dark:text-gray-400 mt-1">${esc(q.notes || '')} ${safeLink ? `<a href="${esc(safeLink)}" target="_blank" rel="noopener" class="text-teal-600 font-semibold hover:underline ml-1"><i class="fa-solid fa-link"></i> ${t('resOpenLink')}</a>` : ''}</div>` : ''}
        ${q.status === 'SELECTED' ? `
        <div class="mt-2 flex flex-wrap items-center gap-2">
            <span class="text-[11px] text-gray-500">${t('quoteRatingLabel')}</span>
            <span class="flex items-center gap-0.5">${[1, 2, 3, 4, 5].map(n => `<button type="button" onclick="rateQuote('${q.id}', ${n})" class="${n <= Number(q.rating || 0) ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'} hover:text-amber-500"><i class="fa-solid fa-star text-xs"></i></button>`).join('')}</span>
            <input value="${esc(q.review || '')}" onchange="reviewQuote('${q.id}', this.value)" placeholder="${esc(t('quoteReviewPlaceholder'))}" class="flex-1 min-w-[180px] px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:outline-none">
        </div>` : ''}
    </div>`;
}

function toggleQuoteOtherName() {
    const sel = document.getElementById('quote-partner');
    const name = document.getElementById('quote-partner-name');
    if (!sel || !name) return;
    const isOther = sel.value.startsWith('other:');
    name.classList.toggle('hidden', !isOther);
    name.required = isOther;
}

function saveQuote(e) {
    e.preventDefault();
    const id = document.getElementById('quote-id').value || `real_${Date.now()}`;
    const existing = quotes.find(x => x.id === id);
    const [partnerType, partnerId] = document.getElementById('quote-partner').value.split(':');
    let partnerName = document.getElementById('quote-partner-name').value.trim();
    if (partnerType === 'vendor') partnerName = (vendors.find(v => v.id === partnerId) || {}).name || partnerName;
    if (partnerType === 'freelancer') partnerName = (freelancers.find(f => f.id === partnerId) || {}).name || partnerName;
    const item = {
        status: 'PENDING', rating: 0, review: '',
        ...(existing || {}),
        id,
        projectId: window.detailProjectId,
        need: document.getElementById('quote-need').value.trim(),
        partnerType, partnerId: partnerId || '', partnerName,
        amount: Number(document.getElementById('quote-amount').value) || 0,
        link: document.getElementById('quote-link').value.trim(),
        notes: document.getElementById('quote-notes').value.trim(),
        isDummy: existing ? !!existing.isDummy : false
    };
    if (existing) quotes[quotes.indexOf(existing)] = item; else quotes.unshift(item);
    window.detailResetForm = true;
    saveItem('quotes', item);
    showToast(t('toastQuoteSaved'));
}

function editQuote(id) {
    const q = quotes.find(x => x.id === id);
    if (!q) return;
    document.getElementById('quote-id').value = q.id;
    document.getElementById('quote-need').value = q.need || '';
    const sel = document.getElementById('quote-partner');
    const val = `${q.partnerType || 'other'}:${q.partnerId || ''}`;
    sel.value = [...sel.options].some(o => o.value === val) ? val : 'other:';
    document.getElementById('quote-partner-name').value = q.partnerName || '';
    document.getElementById('quote-amount').value = q.amount || '';
    document.getElementById('quote-link').value = q.link || '';
    document.getElementById('quote-notes').value = q.notes || '';
    toggleQuoteOtherName();
    document.getElementById('quote-need').focus();
}

// Selecting a quote rejects the other still-pending offers for the same need.
function setQuoteStatus(id, status) {
    const q = quotes.find(x => x.id === id);
    if (!q) return;
    q.status = status;
    saveItem('quotes', q, { action: status === 'SELECTED' ? 'select' : 'update' });
    if (status === 'SELECTED') {
        quotes.filter(x => x.projectId === q.projectId && x.need === q.need && x.id !== q.id && x.status === 'PENDING')
            .forEach(x => { x.status = 'REJECTED'; saveItem('quotes', x, { silent: true }); });
        showToast(t('toastQuoteSelected', { name: q.partnerName }));
    }
}

function rateQuote(id, rating) {
    const q = quotes.find(x => x.id === id);
    if (!q) return;
    q.rating = rating;
    saveItem('quotes', q, { action: 'review' });
}

function reviewQuote(id, text) {
    const q = quotes.find(x => x.id === id);
    if (!q) return;
    q.review = String(text || '').trim();
    saveItem('quotes', q, { action: 'review' });
}

function deleteQuote(id) {
    if (!requireAdmin()) return;
    const q = quotes.find(x => x.id === id);
    askConfirm({
        title: t('confirmTitleDelete'),
        message: t('confirmMsgDelete', { name: `${q ? q.need : ''} — ${q ? q.partnerName : ''}` }),
        button: t('delete'),
        onConfirm: () => removeItem('quotes', id, { skipCheck: true })
    });
}

// ---------- ATTACHMENTS TAB ----------
function renderDetailAttachments(p) {
    return attachmentsEditorHTML('projects', p.id);
}

// ---------- INVOICES TAB ----------
function renderDetailInvoices(p) {
    const list = invoices.filter(i => i.projectId === p.id);
    const rows = list.map(inv => {
        const calc = invoiceTotals(inv);
        return `<div class="flex items-center justify-between gap-3 py-2.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
            <div><div class="text-sm font-semibold">${esc(inv.number)}</div><div class="text-[11px] text-gray-400">${esc(inv.date || '-')} · ${esc(inv.billLabel || '')}</div></div>
            <div class="flex items-center gap-2">${statusPill('inv', invoiceDisplayStatus(inv))}<span class="font-bold text-sm">${formatIDR(calc.billed)}</span>
            <button onclick="openInvoice('${inv.id}')" class="px-2 py-1 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 font-semibold">${t('open')}</button></div>
        </div>`;
    }).join('');
    return `<div class="flex justify-end"><button onclick="newInvoiceForProject('${p.id}')" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold"><i class="fa-solid fa-plus mr-1"></i>${t('invCreateBtn')}</button></div>
        <div>${rows || `<p class="text-sm text-gray-400 text-center py-8">${t('invEmpty')}</p>`}</div>`;
}
