// JADI.in Hub — calendar.js
// KALENDER MONITORING FEATURE
function changeCalMonth(offset) {
    window.currentCalDate.setMonth(window.currentCalDate.getMonth() + offset);
    renderCalendar();
}

function resetCalToToday() {
    window.currentCalDate = new Date();
    renderCalendar();
}

function renderCalendar() {
    const year = currentCalDate.getFullYear();
    const month = currentCalDate.getMonth();

    const monthNames = t('monthsLong');
    document.getElementById('calendar-month-year').innerText = `${monthNames[month]} ${year}`;

    const headerGrid = document.getElementById('calendar-header-grid');
    headerGrid.innerHTML = '';
    t('daysShort').forEach(d => {
        headerGrid.innerHTML += `<div>${d}</div>`;
    });

    const grid = document.getElementById('calendar-days-grid');
    grid.innerHTML = '';

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDayIndex; i++) {
        grid.innerHTML += `<div class="h-28 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-700/50 opacity-40"></div>`;
    }

    const today = todayStr();

    for (let day = 1; day <= totalDays; day++) {
        const dayDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isToday = today === dayDateStr;

        const dayProjects = projects.filter(p => p.deadline === dayDateStr);

        let projectsHTML = '';
        dayProjects.forEach(dp => {
            projectsHTML += `
                <div onclick="openProjectDetail('${dp.id}')" class="p-1.5 rounded-lg bg-blue-600 text-white text-[10px] font-bold cursor-pointer hover:bg-blue-500 transition shadow-sm truncate" title="${esc(dp.client)} - ${esc(dp.title)}">
                    <i class="fa-solid fa-flag-checkered mr-1"></i>${esc(dp.client)}
                </div>
            `;
        });

        tasks.filter(x => x.dueDate === dayDateStr && x.status !== 'DONE').forEach(task => {
            const p = projects.find(x => x.id === task.projectId);
            if (!p) return;
            projectsHTML += `
                <div onclick="openProjectDetail('${p.id}', 'tasks')" class="p-1 rounded-md bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200 text-[10px] font-semibold cursor-pointer truncate" title="${esc(task.title)} — ${esc(p.client)}">
                    <i class="fa-solid fa-list-check mr-1"></i>${esc(task.title)}
                </div>`;
        });
        invoices.filter(inv => inv.dueDate === dayDateStr && inv.status === 'SENT').forEach(inv => {
            projectsHTML += `
                <div onclick="openInvoice('${inv.id}')" class="p-1 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200 text-[10px] font-semibold cursor-pointer truncate" title="${esc(inv.number)} — ${esc(inv.client)}">
                    <i class="fa-solid fa-file-invoice-dollar mr-1"></i>${esc(inv.number)}
                </div>`;
        });

        grid.innerHTML += `
            <div class="h-28 p-2 rounded-xl border ${isToday ? 'border-2 border-blue-500 bg-blue-50/20' : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800'} flex flex-col justify-between overflow-hidden">
                <div class="flex justify-between items-center">
                    <span class="text-xs font-bold ${isToday ? 'bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center' : 'text-gray-700 dark:text-gray-300'}">${day}</span>
                    ${dayProjects.length > 0 ? `<span class="text-[9px] font-extrabold bg-amber-500 text-white px-1.5 py-0.5 rounded-full">${dayProjects.length} DL</span>` : ''}
                </div>
                <div class="space-y-1 overflow-y-auto no-scrollbar my-1">
                    ${projectsHTML}
                </div>
            </div>
        `;
    }
}
