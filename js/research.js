// JADI.in Hub — research.js
// ---------- RESEARCH ----------
function researchStatusLabel(status) {
    return t({ NOT_STARTED: 'resStatusNotStarted', IN_PROGRESS: 'resStatusInProgress', DONE: 'resStatusDone' }[status] || 'resStatusNotStarted');
}

function researchStatusClass(status) {
    return {
        NOT_STARTED: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
        IN_PROGRESS: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
        DONE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
    }[status] || 'bg-gray-100 text-gray-700';
}

function renderResearch() {
    const grid = document.getElementById('research-grid');
    if (!grid) return;

    const statusSel = document.getElementById('research-filter-status');
    const statusVal = statusSel.value || 'ALL';
    statusSel.innerHTML = `<option value="ALL">${t('allStatuses')}</option>` + RESEARCH_STATUSES.map(s => `<option value="${s}">${researchStatusLabel(s)}</option>`).join('');
    statusSel.value = statusVal;

    const topics = [...new Set(research.map(r => (r.topic || '').trim()).filter(Boolean))].sort();
    const topicSel = document.getElementById('research-filter-topic');
    const topicVal = topicSel.value || 'ALL';
    topicSel.innerHTML = `<option value="ALL">${t('resAllTopics')}</option>` + topics.map(tp => `<option value="${esc(tp)}">${esc(tp)}</option>`).join('');
    topicSel.value = topics.includes(topicVal) ? topicVal : 'ALL';
    document.getElementById('res-topic-list').innerHTML = topics.map(tp => `<option value="${esc(tp)}"></option>`).join('');

    document.getElementById('research-stats').innerHTML = RESEARCH_STATUSES.map(s => `
        <button onclick="document.getElementById('research-filter-status').value='${s}'; renderResearch();" class="text-left bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:ring-2 hover:ring-lime-500 transition">
            <span class="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${researchStatusClass(s)}">${researchStatusLabel(s)}</span>
            <div class="text-2xl font-black text-gray-900 dark:text-white mt-2">${research.filter(r => (r.status || 'NOT_STARTED') === s).length}</div>
        </button>`).join('');

    const search = document.getElementById('research-search').value.toLowerCase();
    const filtered = research.filter(r => {
        const haystack = [r.title, r.topic, r.summary, r.author].map(x => String(x || '').toLowerCase()).join(' ');
        return haystack.includes(search)
            && (topicSel.value === 'ALL' || (r.topic || '').trim() === topicSel.value)
            && (statusSel.value === 'ALL' || (r.status || 'NOT_STARTED') === statusSel.value);
    });

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center py-12 text-gray-400">${t('resEmpty')}</div>`;
        return;
    }

    grid.innerHTML = filtered.map(r => {
        const proj = r.projectId ? projects.find(p => p.id === r.projectId) : null;
        const safeLink = /^https?:\/\//i.test(r.link || '') ? r.link : '';
        const status = r.status || 'NOT_STARTED';
        return `
            <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col space-y-3">
                <div class="flex justify-between items-start gap-2">
                    <div class="min-w-0">
                        ${r.topic ? `<span class="text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-md bg-lime-50 text-lime-800 dark:bg-lime-950 dark:text-lime-300 border border-lime-200/50">${esc(r.topic)}</span>` : ''}
                        <h4 class="font-bold text-base text-gray-900 dark:text-white mt-1.5 flex items-center">${getDemoBadgeHTML(r.isDummy)}<span>${esc(r.title)}</span></h4>
                    </div>
                    <button onclick="cycleResearchStatus('${r.id}')" title="${esc(t('resCycleHint'))}" class="flex-shrink-0 text-xs px-2.5 py-1 rounded-full font-semibold ${researchStatusClass(status)}">${researchStatusLabel(status)}</button>
                </div>
                ${r.summary ? `<p class="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line line-clamp-5">${esc(r.summary)}</p>` : ''}
                <div class="text-xs text-gray-500 dark:text-gray-400 space-y-1 border-t border-gray-100 dark:border-gray-700 pt-3 mt-auto">
                    ${proj ? `<div><i class="fa-solid fa-diagram-project w-4"></i> ${esc(proj.client)} - ${esc(proj.title)}</div>` : ''}
                    <div><i class="fa-solid fa-user w-4"></i> ${esc(r.author || '-')} · ${esc(r.date || '-')}</div>
                </div>
                <div class="flex items-center justify-between">
                    ${safeLink ? `<a href="${esc(safeLink)}" target="_blank" rel="noopener" class="text-xs font-bold text-lime-700 dark:text-lime-400 hover:underline"><i class="fa-solid fa-link"></i> ${t('resOpenLink')}</a>` : '<span></span>'}
                    <div class="flex space-x-1">
                        ${attachmentsButtonHTML('research', r.id, (r.attachments || []).length)}
                        <button onclick="editResearch('${r.id}')" class="p-1.5 text-gray-400 hover:text-blue-500"><i class="fa-solid fa-pen text-xs"></i></button>
                        <button onclick="deleteResearch('${r.id}')" class="admin-only p-1.5 text-gray-400 hover:text-rose-500"><i class="fa-solid fa-trash-can text-xs"></i></button>
                    </div>
                </div>
            </div>`;
    }).join('');
}

function fillResearchSelects() {
    document.getElementById('res-status').innerHTML = RESEARCH_STATUSES.map(s => `<option value="${s}">${researchStatusLabel(s)}</option>`).join('');
    document.getElementById('res-project').innerHTML = `<option value="">${t('resNoProject')}</option>` + projects.map(p => `<option value="${p.id}">${esc(p.client)} - ${esc(p.title)}</option>`).join('');
    document.getElementById('res-author').innerHTML = pics.map(p => `<option value="${esc(p.name)}">${esc(p.name)}</option>`).join('');
}

function openResearchModal() {
    document.getElementById('form-research').reset();
    fillResearchSelects();
    document.getElementById('res-id').value = '';
    document.getElementById('res-date').value = todayStr();
    document.getElementById('modal-research-title').innerText = t('modalResAddTitle');
    document.getElementById('modal-research').classList.remove('hidden');
}

function closeResearchModal() { document.getElementById('modal-research').classList.add('hidden'); }

function editResearch(id) {
    const r = research.find(item => item.id === id);
    if (!r) return;
    fillResearchSelects();
    document.getElementById('res-id').value = r.id;
    document.getElementById('res-title').value = r.title || '';
    document.getElementById('res-topic').value = r.topic || '';
    document.getElementById('res-status').value = r.status || 'NOT_STARTED';
    document.getElementById('res-project').value = r.projectId || '';
    if (r.author && ![...document.getElementById('res-author').options].some(o => o.value === r.author)) {
        document.getElementById('res-author').innerHTML += `<option value="${esc(r.author)}">${esc(r.author)}</option>`;
    }
    document.getElementById('res-author').value = r.author || '';
    document.getElementById('res-date').value = r.date || '';
    document.getElementById('res-link').value = r.link || '';
    document.getElementById('res-summary').value = r.summary || '';
    document.getElementById('modal-research-title').innerText = t('modalResEditTitle');
    document.getElementById('modal-research').classList.remove('hidden');
}

function saveResearch(e) {
    e.preventDefault();
    const id = document.getElementById('res-id').value || `real_${Date.now()}`;
    const existing = research.find(r => r.id === id);
    const item = {
        ...(existing || {}),
        id,
        title: document.getElementById('res-title').value.trim(),
        topic: document.getElementById('res-topic').value.trim(),
        status: document.getElementById('res-status').value,
        projectId: document.getElementById('res-project').value,
        author: document.getElementById('res-author').value,
        date: document.getElementById('res-date').value,
        link: document.getElementById('res-link').value.trim(),
        summary: document.getElementById('res-summary').value,
        isDummy: existing ? !!existing.isDummy : false
    };
    const idx = research.findIndex(r => r.id === id);
    if (idx !== -1) research[idx] = item;
    else research.unshift(item);
    closeResearchModal();
    saveItem('research', item);
    showToast(t('toastResSaved'));
}

function cycleResearchStatus(id) {
    const r = research.find(item => item.id === id);
    if (!r) return;
    const next = RESEARCH_STATUSES[(RESEARCH_STATUSES.indexOf(r.status || 'NOT_STARTED') + 1) % RESEARCH_STATUSES.length];
    r.status = next;
    saveItem('research', r);
}

function deleteResearch(id) {
    if (!requireAdmin()) return;
    const item = research.find(x => x.id === id);
    askConfirm({
        title: t('confirmTitleDelete'),
        message: t('confirmMsgDelete', { name: itemLabel(item) }),
        button: t('delete'),
        onConfirm: () => {
            removeItem('research', id, { skipCheck: true });
            showToast(t('toastResDeleted'));
        }
    });
}
