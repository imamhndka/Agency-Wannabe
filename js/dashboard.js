// JADI.in Hub — dashboard.js
// DASHBOARD RENDERING
function renderDashboard() {
    let totalRevenue = 0, totalExpenses = 0, activeCount = 0;
    projects.forEach(p => {
        totalRevenue += Number(p.revenue || 0);
        totalExpenses += projectCost(p);
        if (p.status === 'In Progress' || p.status === 'In Review') activeCount++;
    });

    const netProfit = totalRevenue - totalExpenses;
    const avgMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

    document.getElementById('kpi-revenue').innerText = formatIDR(totalRevenue);
    document.getElementById('kpi-expenses').innerText = formatIDR(totalExpenses);
    document.getElementById('kpi-profit').innerText = formatIDR(netProfit);
    document.getElementById('kpi-margin').innerText = `${avgMargin}%`;
    document.getElementById('kpi-active-count').innerText = activeCount;

    const recentList = document.getElementById('dashboard-recent-projects-list');
    recentList.innerHTML = '';

    if (projects.length === 0) {
        recentList.innerHTML = `<tr><td colspan="6" class="py-6 text-center text-xs text-gray-400">${t('noProjectsFound')}</td></tr>`;
    } else {
        projects.slice(0, 5).forEach(p => {
            const profit = Number(p.revenue || 0) - projectCost(p);
            const margin = p.revenue > 0 ? ((profit / p.revenue) * 100).toFixed(0) : 0;
            recentList.innerHTML += `
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                    <td class="py-3 px-4 font-semibold text-gray-800 dark:text-white">
                        <button onclick="openProjectDetail('${p.id}')" class="text-left hover:text-blue-600">
                            <div class="flex items-center">${getDemoBadgeHTML(p.isDummy)}<span>${esc(p.client)}</span></div>
                            <div class="text-xs text-gray-400 font-normal">${esc(p.title)}</div>
                        </button>
                    </td>
                    <td class="py-3 px-4"><span class="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">${esc(p.pic || '-')}</span></td>
                    <td class="py-3 px-4"><span class="text-xs px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700">${esc(p.category)}</span></td>
                    <td class="py-3 px-4 font-bold">${formatIDR(p.revenue)}</td>
                    <td class="py-3 px-4"><span class="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700">${margin}%</span></td>
                    <td class="py-3 px-4">${getStatusBadgeHTML(p.status)}</td>
                </tr>
            `;
        });
    }
    renderDashboardAttention();
    renderDashboardCharts();
}

function renderDashboardCharts() {
    const ctx1 = document.getElementById('chart-revenue-expenses').getContext('2d');
    const labels = projects.map(p => { const c = String(p.client || ''); return c.length > 10 ? c.substring(0, 10) + '...' : c; });
    // Chart styling follows the design tokens in css/theme.css.
    const ink = themeColor('--ink'), ink3 = themeColor('--ink3'), line = themeColor('--line');
    Chart.defaults.font.family = "'Plus Jakarta Sans', system-ui, sans-serif";
    Chart.defaults.color = ink3;
    const legend = { position: 'top', align: 'end', labels: { usePointStyle: true, pointStyle: 'rectRounded', boxWidth: 10, boxHeight: 10, color: ink, font: { weight: 600 } } };
    if (chartRevExp) chartRevExp.destroy();
    chartRevExp = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: labels.length ? labels : ['Workspace Empty'],
            datasets: [
                { label: currentLang === 'en' ? 'Revenue' : 'Omzet', data: projects.map(p => p.revenue), backgroundColor: ink, borderRadius: 8, maxBarThickness: 34 },
                { label: currentLang === 'en' ? 'Subcontract Cost' : 'Beban Sub-Kontrak', data: projects.map(p => projectCost(p)), backgroundColor: themeColor('--chart2'), borderRadius: 8, maxBarThickness: 34 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend },
            scales: { x: { grid: { display: false }, border: { display: false } }, y: { grid: { color: line }, border: { display: false } } }
        }
    });

    const ctx2 = document.getElementById('chart-categories').getContext('2d');
    const catCounts = {};
    projects.forEach(p => { catCounts[p.category] = (catCounts[p.category] || 0) + p.revenue; });
    if (chartCategory) chartCategory.destroy();
    chartCategory = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: Object.keys(catCounts).length ? Object.keys(catCounts) : ['No Data'],
            datasets: [{
                data: Object.values(catCounts).length ? Object.values(catCounts) : [1],
                backgroundColor: ['oklch(0.68 0.14 255)', 'oklch(0.68 0.15 305)', 'oklch(0.68 0.16 28)', 'oklch(0.74 0.14 80)', 'oklch(0.68 0.14 150)', 'oklch(0.68 0.11 200)', 'oklch(0.68 0.15 350)'],
                borderColor: themeColor('--surface'), borderWidth: 3, borderRadius: 6, spacing: 2
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { legend: { position: 'right', labels: { usePointStyle: true, pointStyle: 'circle', boxWidth: 8, color: ink, font: { weight: 600 } } } } }
    });
}


// ---------- NEEDS ATTENTION ----------
function relativeTime(iso) {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (!isFinite(diff)) return '';
    if (diff < 60) return t('timeJustNow');
    if (diff < 3600) return t('timeMinutes', { n: Math.floor(diff / 60) });
    if (diff < 86400) return t('timeHours', { n: Math.floor(diff / 3600) });
    return t('timeDays', { n: Math.floor(diff / 86400) });
}

function activityText(a) {
    const verb = t(`act_${a.action}`) !== `act_${a.action}` ? t(`act_${a.action}`) : a.action;
    const what = t(`col_${a.col}`) !== `col_${a.col}` ? t(`col_${a.col}`) : a.col;
    return `${verb} ${what}`;
}

function renderDashboardAttention() {
    const box = document.getElementById('dashboard-attention');
    if (!box) return;
    const today = todayStr();
    const in14 = addDaysStr(14);
    const openProjects = projects.filter(p => !['Completed', 'Invoiced'].includes(p.status));
    const overdueProjects = openProjects.filter(p => p.deadline && p.deadline < today);
    const upcomingProjects = openProjects.filter(p => p.deadline && p.deadline >= today && p.deadline <= in14);
    const openTasks = tasks.filter(x => x.status !== 'DONE' && projects.some(p => p.id === x.projectId));
    const overdueTasks = openTasks.filter(x => x.dueDate && x.dueDate < today);
    const upcomingTasks = openTasks.filter(x => x.dueDate && x.dueDate >= today && x.dueDate <= in14);
    const unpaid = invoices.filter(i => i.status === 'SENT');
    const overdueInv = unpaid.filter(i => invoiceDisplayStatus(i) === 'OVERDUE');
    const unpaidSum = unpaid.reduce((s, i) => s + invoiceTotals(i).billed, 0);

    const stat = (icon, cls, label, value, sub, onclick) => `
        <button onclick="${onclick}" class="text-left bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:ring-2 hover:ring-blue-500/40 transition">
            <div class="flex items-center justify-between"><span class="text-[11px] font-bold uppercase tracking-wider text-gray-400">${label}</span><i class="fa-solid ${icon} ${cls}"></i></div>
            <div class="text-xl font-black mt-1 ${cls}">${value}</div><div class="text-[11px] text-gray-400">${sub}</div>
        </button>`;
    document.getElementById('dashboard-attention-stats').innerHTML =
        stat('fa-triangle-exclamation', overdueProjects.length ? 'text-rose-600' : 'text-gray-400', t('attOverdueProjects'), overdueProjects.length, t('attOverdueProjectsSub'), "switchTab('projects')") +
        stat('fa-calendar-day', 'text-amber-500', t('attUpcoming'), upcomingProjects.length + upcomingTasks.length, t('attUpcomingSub'), "switchTab('calendar')") +
        stat('fa-list-check', overdueTasks.length ? 'text-rose-600' : 'text-gray-400', t('attOverdueTasks'), overdueTasks.length, t('attOverdueTasksSub'), "document.getElementById('dashboard-agenda').scrollIntoView({behavior:'smooth'})") +
        stat('fa-file-invoice-dollar', overdueInv.length ? 'text-rose-600' : 'text-blue-600', t('attUnpaid'), formatIDR(unpaidSum), t('attUnpaidSub', { n: unpaid.length, late: overdueInv.length }), "switchTab('invoices')");

    // Agenda: overdue first, then the next 14 days.
    const agenda = [
        ...overdueProjects.map(p => ({ date: p.deadline, late: true, kind: 'project', p, label: `${p.client} — ${p.title}` })),
        ...upcomingProjects.map(p => ({ date: p.deadline, late: false, kind: 'project', p, label: `${p.client} — ${p.title}` })),
        ...overdueTasks.map(x => ({ date: x.dueDate, late: true, kind: 'task', task: x, p: projects.find(p => p.id === x.projectId) })),
        ...upcomingTasks.map(x => ({ date: x.dueDate, late: false, kind: 'task', task: x, p: projects.find(p => p.id === x.projectId) }))
    ].sort((a, b) => (b.late - a.late) || a.date.localeCompare(b.date)).slice(0, 10);
    document.getElementById('dashboard-agenda').innerHTML = agenda.map(a => `
        <button onclick="openProjectDetail('${a.p.id}'${a.kind === 'task' ? ", 'tasks'" : ''})" class="w-full text-left flex items-center gap-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30 rounded-lg px-1">
            <div class="w-12 text-center flex-shrink-0"><div class="text-[10px] uppercase font-bold ${a.late ? 'text-rose-600' : 'text-gray-400'}">${a.late ? t('overdue') : esc(a.date.slice(5))}</div></div>
            <i class="fa-solid ${a.kind === 'task' ? 'fa-list-check text-blue-500' : 'fa-flag-checkered text-amber-500'} w-4"></i>
            <div class="min-w-0 flex-1">
                <div class="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">${esc(a.kind === 'task' ? a.task.title : a.label)}</div>
                <div class="text-[11px] text-gray-400 truncate">${a.kind === 'task' ? `${esc(a.p.client)} · ${esc(a.task.assignee || '-')}` : esc(a.p.pic || '-')} · ${esc(a.date)}</div>
            </div>
        </button>`).join('') || `<p class="text-sm text-gray-400 text-center py-6">${t('agendaEmpty')}</p>`;

    // Unpaid invoices
    document.getElementById('dashboard-unpaid').innerHTML = unpaid
        .slice().sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate))).slice(0, 6)
        .map(inv => `<button onclick="openInvoice('${inv.id}')" class="w-full text-left flex items-center justify-between gap-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30 rounded-lg px-1">
            <div class="min-w-0"><div class="text-sm font-semibold truncate">${esc(inv.number)} · ${esc(inv.client)}</div><div class="text-[11px] text-gray-400">${t('invDueDateLabel')}: ${esc(inv.dueDate || '-')}</div></div>
            <div class="text-right flex-shrink-0"><div class="text-sm font-bold">${formatIDR(invoiceTotals(inv).billed)}</div>${statusPill('inv', invoiceDisplayStatus(inv))}</div>
        </button>`).join('') || `<p class="text-sm text-gray-400 text-center py-6">${t('unpaidEmpty')}</p>`;

    // Research status
    document.getElementById('dashboard-research').innerHTML = RESEARCH_STATUSES.map(s => {
        const n = research.filter(r => (r.status || 'NOT_STARTED') === s).length;
        return `<button onclick="switchTab('research'); document.getElementById('research-filter-status').value='${s}'; renderResearch();" class="flex-1 text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40 hover:ring-2 hover:ring-lime-500/40">
            <div class="text-xl font-black">${n}</div><div class="text-[11px] text-gray-500">${researchStatusLabel(s)}</div></button>`;
    }).join('');

    // Activity
    const actBox = document.getElementById('dashboard-activity');
    actBox.innerHTML = window.isCloudMode
        ? (window.auditLog.slice(0, 12).map(a => `
            <div class="flex items-start gap-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div class="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[11px] font-bold flex-shrink-0">${esc(String(a.by || '?').charAt(0).toUpperCase())}</div>
                <div class="min-w-0 flex-1">
                    <div class="text-xs text-gray-700 dark:text-gray-200"><b>${esc(String(a.by || '').split('@')[0])}</b> ${esc(activityText(a))}${a.label ? `: <span class="font-semibold">${esc(a.label)}</span>` : ''}</div>
                    <div class="text-[10px] text-gray-400">${esc(relativeTime(a.at))}</div>
                </div>
            </div>`).join('') || `<p class="text-sm text-gray-400 text-center py-6">${t('activityEmpty')}</p>`)
        : `<p class="text-xs text-gray-400 text-center py-6">${t('activityLocal')}</p>`;
}
