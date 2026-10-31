// JADI.in Hub — projects.js
// PROJECTS PIPELINE RENDERING & KANBAN DRAG AND DROP
const VIEW_BTN_ON = 'px-3 py-1.5 rounded-lg text-xs font-semibold transition bg-blue-600 text-white';
const VIEW_BTN_OFF = 'px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-800 transition';

function toggleProjectView(mode) {
    window.projectViewMode = mode;
    document.getElementById('project-view-table').classList.toggle('hidden', mode !== 'table');
    document.getElementById('project-view-kanban').classList.toggle('hidden', mode === 'table');
    document.getElementById('view-btn-table').className = mode === 'table' ? VIEW_BTN_ON : VIEW_BTN_OFF;
    document.getElementById('view-btn-kanban').className = mode === 'table' ? VIEW_BTN_OFF : VIEW_BTN_ON;
    try { localStorage.setItem(`${STORAGE_PREFIX}projectView`, mode); } catch (e) {}
    renderProjects();
}

// Change status from a button/select (works on touch screens, where drag & drop does not).
function moveProjectStatus(projId, targetStatus, via) {
    const p = projects.find(item => item.id === projId);
    if (!p || !targetStatus || p.status === targetStatus) return;
    p.status = targetStatus;
    if (!p.logs) p.logs = [];
    p.logs.unshift({
        id: `log_${Date.now()}`,
        date: todayStr(),
        pic: p.pic || 'System',
        note: `Status updated to ${targetStatus}${via ? ` (${via})` : ''}`,
        statusUpdate: targetStatus
    });
    saveItem('projects', p);
    showToast(`Status ${p.client} -> ${targetStatus}`);
}

function statusSelectHTML(p) {
    return `<select onchange="moveProjectStatus('${p.id}', this.value, 'Kanban')" onclick="event.stopPropagation()" class="text-[11px] font-semibold bg-gray-50 dark:bg-gray-700 rounded-lg px-1.5 py-1 focus:outline-none" title="${esc(t('moveStatus'))}">
        ${PROJECT_STATUSES.map(s => `<option value="${s}" ${s === p.status ? 'selected' : ''}>${s}</option>`).join('')}
    </select>`;
}

function getStatusBadgeHTML(status) {
    switch(status) {
        case 'Lead / Pitching': return `<span class="whitespace-nowrap px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">Lead</span>`;
        case 'In Progress': return `<span class="whitespace-nowrap px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">In Progress</span>`;
        case 'In Review': return `<span class="whitespace-nowrap px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">In Review</span>`;
        case 'Invoiced': return `<span class="whitespace-nowrap px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">Invoiced</span>`;
        case 'Completed': return `<span class="whitespace-nowrap px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">Completed</span>`;
        default: return `<span class="whitespace-nowrap px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100">${status}</span>`;
    }
}

function renderProjects() {
    const searchQuery = document.getElementById('project-search').value.toLowerCase();
    const picFilter = document.getElementById('project-filter-pic').value;
    const catFilter = document.getElementById('project-filter-category').value;
    const statusFilter = document.getElementById('project-filter-status').value;

    const filtered = projects.filter(p => {
        const matchesSearch = String(p.client || '').toLowerCase().includes(searchQuery) || String(p.title || '').toLowerCase().includes(searchQuery);
        const matchesPic = picFilter === 'ALL' || (p.pic || '-') === picFilter;
        const matchesCat = catFilter === 'ALL' || p.category === catFilter;
        const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
        return matchesSearch && matchesPic && matchesCat && matchesStatus;
    });

    if (projectViewMode === 'table') renderProjectsTable(filtered);
    else renderProjectsKanban(filtered);
}

function renderProjectCards(data) {
    const box = document.getElementById('project-cards');
    if (!box) return;
    box.innerHTML = data.map(p => {
        const cost = projectCost(p);
        const margin = p.revenue > 0 ? (((Number(p.revenue || 0) - cost) / p.revenue) * 100).toFixed(1) : 0;
        return `
        <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-3">
            <div class="flex justify-between items-start gap-3">
                <button onclick="openProjectDetail('${p.id}')" class="text-left min-w-0">
                    <div class="font-bold text-gray-900 dark:text-white flex items-center">${getDemoBadgeHTML(p.isDummy)}<span class="truncate">${esc(p.client)}</span></div>
                    <div class="text-xs text-gray-500">${esc(p.title)}</div>
                </button>
                ${getStatusBadgeHTML(p.status)}
            </div>
            ${progressBarHTML(p.id, true)}
            <div class="grid grid-cols-3 gap-2 text-xs">
                <div><div class="text-gray-400">${esc(t('colValue'))}</div><div class="font-bold text-gray-900 dark:text-white">${formatIDR(p.revenue || 0)}</div></div>
                <div><div class="text-gray-400">Margin</div><div class="font-bold ${margin >= 40 ? 'text-emerald-600' : margin >= 0 ? 'text-amber-600' : 'text-rose-600'}">${margin}%</div></div>
                <div><div class="text-gray-400">Deadline</div><div class="font-semibold ${p.deadline && p.deadline < todayStr() && !['Completed', 'Invoiced'].includes(p.status) ? 'text-rose-600' : 'text-gray-700 dark:text-gray-200'}">${esc(p.deadline || '-')}</div></div>
            </div>
            <div class="flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-2">
                <span class="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">${esc(p.pic || '-')}</span>
                <div class="flex items-center gap-1">
                    <button onclick="openDailyLogModal('${p.id}')" class="p-2 text-gray-400 hover:text-blue-600" title="Logs"><i class="fa-solid fa-comments"></i></button>
                    <button onclick="editProject('${p.id}')" class="p-2 text-gray-400 hover:text-blue-600"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button onclick="deleteProject('${p.id}')" class="admin-only p-2 text-gray-400 hover:text-rose-600"><i class="fa-solid fa-trash-can"></i></button>
                    <button onclick="openProjectDetail('${p.id}')" class="ml-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold">${esc(t('open'))}</button>
                </div>
            </div>
        </div>`;
    }).join('') || `<p class="text-center py-8 text-gray-400">${t('noProjectsFound')}</p>`;
}

function renderProjectsTable(data) {
    renderProjectCards(data);
    const tbody = document.getElementById('project-table-body');
    tbody.innerHTML = '';
    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="py-8 text-center text-gray-400">${t('noProjectsFound')}</td></tr>`;
        return;
    }

    data.forEach(p => {
        const cost = projectCost(p);
        const profit = Number(p.revenue || 0) - cost;
        const margin = p.revenue > 0 ? ((profit / p.revenue) * 100).toFixed(1) : 0;
        const logsCount = (p.logs || []).length;

        tbody.innerHTML += `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                <td class="py-3 px-4 font-semibold text-gray-800 dark:text-white min-w-[200px]">
                    <button onclick="openProjectDetail('${p.id}')" class="text-left hover:text-blue-600">
                        <div class="flex items-center">${getDemoBadgeHTML(p.isDummy)}<span>${esc(p.client)}</span></div>
                        <div class="text-xs text-gray-400 font-normal">${esc(p.title)}</div>
                    </button>
                    ${progressBarHTML(p.id, true)}
                </td>
                <td class="py-3 px-4"><span class="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">${esc(p.pic || '-')}</span></td>
                <td class="py-3 px-4"><span class="text-xs px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700">${esc(p.category)}</span></td>
                <td class="py-3 px-4 font-bold text-gray-900 dark:text-white">${formatIDR(p.revenue)}</td>
                <td class="py-3 px-4 text-gray-500">${formatIDR(cost)}${selectedQuotes(p.id).length ? ` <i class="fa-solid fa-handshake text-teal-500 text-[10px]" title="${esc(t('costFromQuotes', { n: selectedQuotes(p.id).length }))}"></i>` : ''}</td>
                <td class="py-3 px-4 font-bold ${margin >= 40 ? 'text-emerald-600' : margin >= 0 ? 'text-amber-600' : 'text-rose-600'}">${margin}%</td>
                <td class="py-3 px-4">${getStatusBadgeHTML(p.status)}</td>
                <td class="py-3 px-4">
                    <button onclick="openDailyLogModal('${p.id}')" class="px-2.5 py-1.5 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 text-blue-600 dark:text-blue-300 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition">
                        <i class="fa-solid fa-list-check text-xs"></i>
                        <span>${logsCount} Update</span>
                    </button>
                </td>
                <td class="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                    <button onclick="openProjectDetail('${p.id}')" class="p-1.5 text-gray-400 hover:text-blue-600" title="${esc(t('projectDetail'))}"><i class="fa-solid fa-folder-open"></i></button>
                    <button onclick="editProject('${p.id}')" class="p-1.5 text-gray-400 hover:text-blue-600"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button onclick="deleteProject('${p.id}')" class="admin-only p-1.5 text-gray-400 hover:text-rose-600"><i class="fa-solid fa-trash-can"></i></button>
                </td>
            </tr>
        `;
    });
}

function renderProjectsKanban(data) {
    const cols = {
        'Lead / Pitching': { el: document.getElementById('kanban-col-lead'), countEl: document.getElementById('count-kanban-lead'), items: [] },
        'In Progress': { el: document.getElementById('kanban-col-progress'), countEl: document.getElementById('count-kanban-progress'), items: [] },
        'In Review': { el: document.getElementById('kanban-col-review'), countEl: document.getElementById('count-kanban-review'), items: [] },
        'Invoiced': { el: document.getElementById('kanban-col-invoiced'), countEl: document.getElementById('count-kanban-invoiced'), items: [] },
        'Completed': { el: document.getElementById('kanban-col-completed'), countEl: document.getElementById('count-kanban-completed'), items: [] }
    };

    Object.keys(cols).forEach(k => { cols[k].el.innerHTML = ''; cols[k].items = []; });
    data.forEach(p => { if (cols[p.status]) cols[p.status].items.push(p); });

    Object.keys(cols).forEach(k => {
        const col = cols[k];
        col.countEl.innerText = col.items.length;
        if (col.items.length === 0) {
            col.el.innerHTML = `<div class="text-center py-10 text-xs text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700/50 rounded-xl">${t('dragHere')}</div>`;
            return;
        }
        col.items.forEach(p => {
            col.el.innerHTML += `
                <div draggable="true" ondragstart="handleDragStart(event, '${p.id}')" class="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-3 cursor-grab active:cursor-grabbing hover:shadow-md transition">
                    <div class="flex justify-between items-start">
                        <h4 class="font-bold text-sm text-gray-900 dark:text-white flex items-center">${getDemoBadgeHTML(p.isDummy)}<span>${esc(p.client)}</span></h4>
                        <span class="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">${esc(p.pic || '-')}</span>
                    </div>
                    <button onclick="openProjectDetail('${p.id}')" class="text-xs text-gray-500 hover:text-blue-600 text-left">${esc(p.title)}</button>
                    ${progressBarHTML(p.id, true)}
                    <div class="flex justify-between items-center text-xs font-bold text-gray-900 dark:text-white pt-1">
                        <span>${formatIDR(p.revenue)}</span>
                        <span class="text-[10px] font-semibold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">${esc(p.category)}</span>
                    </div>
                    <div class="flex justify-between items-center text-xs border-t pt-2 border-gray-100 dark:border-gray-700">
                        ${statusSelectHTML(p)}
                        <div class="flex space-x-1">
                            <button onclick="openDailyLogModal('${p.id}')" class="p-1 text-gray-400 hover:text-blue-500" title="Logs"><i class="fa-solid fa-comments text-xs"></i>${(p.logs || []).length ? `<span class="text-[10px] ml-0.5">${(p.logs || []).length}</span>` : ''}</button>
                            <button onclick="openProjectDetail('${p.id}')" class="p-1 text-gray-400 hover:text-blue-500"><i class="fa-solid fa-folder-open text-xs"></i></button>
                            <button onclick="editProject('${p.id}')" class="p-1 text-gray-400 hover:text-blue-500"><i class="fa-solid fa-pen text-xs"></i></button>
                            <button onclick="deleteProject('${p.id}')" class="admin-only p-1 text-gray-400 hover:text-rose-500"><i class="fa-solid fa-trash-can text-xs"></i></button>
                        </div>
                    </div>
                </div>
            `;
        });
    });
}

function handleDragStart(e, projId) {
    e.dataTransfer.setData('text/plain', projId);
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('ring-2', 'ring-blue-500', 'bg-blue-50/30');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('ring-2', 'ring-blue-500', 'bg-blue-50/30');
}

function handleDrop(e, targetStatus) {
    e.preventDefault();
    e.currentTarget.classList.remove('ring-2', 'ring-blue-500', 'bg-blue-50/30');
    const projId = e.dataTransfer.getData('text/plain');
    if (!projId) return;

    moveProjectStatus(projId, targetStatus, 'Drag & Drop');
}

// DAILY UPDATE PIC FEATURE
function openDailyLogModal(projId) {
    const p = projects.find(item => item.id === projId);
    if (!p) return;

    document.getElementById('daily-log-proj-id').value = p.id;
    document.getElementById('daily-log-proj-title').innerText = `${p.client} - ${p.title}`;
    document.getElementById('daily-log-proj-sub').innerText = `PIC: ${p.pic || '-'} | Status: ${p.status}`;
    document.getElementById('form-daily-log').reset();
    document.getElementById('log-date').value = todayStr();

    renderDailyLogsHistory(p);
    document.getElementById('modal-daily-log').classList.remove('hidden');
}

function closeDailyLogModal() {
    document.getElementById('modal-daily-log').classList.add('hidden');
}

function renderDailyLogsHistory(p) {
    const container = document.getElementById('daily-logs-history');
    container.innerHTML = '';

    const logs = p.logs || [];
    if (logs.length === 0) {
        container.innerHTML = `<div class="p-4 text-center text-xs text-gray-400 italic bg-gray-50 dark:bg-gray-700/30 rounded-xl">${t('noLogsFound')}</div>`;
        return;
    }

    logs.sort((a,b) => new Date(b.date) - new Date(a.date)).forEach(log => {
        container.innerHTML += `
            <div class="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-1 text-xs">
                <div class="flex justify-between items-center text-gray-400">
                    <span class="font-bold text-slate-700 dark:text-slate-200"><i class="fa-solid fa-user-circle mr-1"></i>${esc(log.pic)}</span>
                    <span>${log.date}</span>
                </div>
                <p class="text-gray-800 dark:text-gray-200 font-medium">${esc(log.note)}</p>
                ${log.statusUpdate && log.statusUpdate !== 'SAME' ? `<span class="inline-block px-2 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700 font-bold">Status: ${esc(log.statusUpdate)}</span>` : ''}
            </div>
        `;
    });
}

function saveDailyLog(e) {
    e.preventDefault();
    const projId = document.getElementById('daily-log-proj-id').value;
    const p = projects.find(item => item.id === projId);
    if (!p) return;

    const newLog = {
        id: `log_${Date.now()}`,
        date: document.getElementById('log-date').value,
        pic: document.getElementById('log-pic').value,
        note: document.getElementById('log-note').value,
        statusUpdate: document.getElementById('log-status-update').value
    };

    if (!p.logs) p.logs = [];
    p.logs.unshift(newLog);

    if (newLog.statusUpdate && newLog.statusUpdate !== 'SAME') {
        p.status = newLog.statusUpdate;
    }

    saveItem('projects', p);
    renderDailyLogsHistory(p);
    document.getElementById('form-daily-log').reset();
    document.getElementById('log-date').value = todayStr();
    showToast(t('toastLogSaved'));
}


// PROJECT MODAL HANDLERS
function openProjectModal() {
    document.getElementById('modal-project-title').innerText = t('modalProjAddTitle');
    document.getElementById('form-project').reset();
    document.getElementById('proj-id').value = '';
    updateProjectCostHint(null);
    document.getElementById('modal-project').classList.remove('hidden');
}

function closeProjectModal() { document.getElementById('modal-project').classList.add('hidden'); }

function editProject(id) {
    const p = projects.find(item => item.id === id);
    if (!p) return;
    document.getElementById('proj-id').value = p.id;
    document.getElementById('proj-client').value = p.client;
    document.getElementById('proj-title').value = p.title;
    document.getElementById('proj-pic').value = p.pic || (pics[0] ? pics[0].name : '');
    document.getElementById('proj-category').value = p.category;
    document.getElementById('proj-status').value = p.status;
    document.getElementById('proj-revenue').value = p.revenue;
    document.getElementById('proj-cost').value = p.cost;
    document.getElementById('proj-freelancer').value = p.freelancer || '';
    document.getElementById('proj-deadline').value = p.deadline || '';
    updateProjectCostHint(p);
    document.getElementById('modal-project').classList.remove('hidden');
}

function saveProject(e) {
    e.preventDefault();
    const id = document.getElementById('proj-id').value || `real_${Date.now()}`;
    const existing = projects.find(p => p.id === id);
    const newProj = {
        ...(existing || {}),
        id: id,
        client: document.getElementById('proj-client').value,
        title: document.getElementById('proj-title').value,
        pic: document.getElementById('proj-pic').value,
        category: document.getElementById('proj-category').value,
        status: document.getElementById('proj-status').value,
        revenue: Number(document.getElementById('proj-revenue').value),
        cost: Number(document.getElementById('proj-cost').value),
        freelancer: document.getElementById('proj-freelancer').value,
        deadline: document.getElementById('proj-deadline').value,
        logs: existing ? (existing.logs || []) : [],
        isDummy: existing ? existing.isDummy : false
    };

    const idx = projects.findIndex(p => p.id === id);
    if (idx !== -1) projects[idx] = newProj;
    else projects.unshift(newProj);

    closeProjectModal();
    saveItem('projects', newProj);
    showToast(t('toastProjSaved'));
}

function deleteProject(id) {
    if (!requireAdmin()) return;
    const item = projects.find(x => x.id === id);
    askConfirm({
        title: t('confirmTitleDelete'),
        message: t('confirmMsgDelete', { name: itemLabel(item) }),
        button: t('delete'),
        onConfirm: () => {
            removeItem('projects', id, { skipCheck: true });
            // Tasks and quotes belong to the project; invoices are kept as financial records.
            (window.tasks || []).filter(x => x.projectId === id).forEach(x => removeItem('tasks', x.id, { skipCheck: true, silent: true }));
            (window.quotes || []).filter(x => x.projectId === id).forEach(x => removeItem('quotes', x.id, { skipCheck: true, silent: true }));
            showToast(t('toastProjDeleted'));
        }
    });
}

// When quotes are selected for the project, its sub-contract cost comes from them.
function updateProjectCostHint(p) {
    const input = document.getElementById('proj-cost');
    const hint = document.getElementById('proj-cost-hint');
    const sel = p ? selectedQuotes(p.id) : [];
    if (sel.length) {
        input.value = projectCost(p);
        input.readOnly = true;
        input.classList.add('opacity-60');
        hint.innerText = t('costFromQuotes', { n: sel.length });
        hint.classList.remove('hidden');
    } else {
        input.readOnly = false;
        input.classList.remove('opacity-60');
        hint.classList.add('hidden');
    }
}
