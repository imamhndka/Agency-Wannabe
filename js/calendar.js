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

window.calSelectedDay = null;

function selectCalDay(dateStr) {
    window.calSelectedDay = window.calSelectedDay === dateStr ? null : dateStr;
    renderCalendar();
}

// Everything that has a date in the given month: project deadlines, open tasks, unpaid invoice due dates.
function calendarEvents(year, month) {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}-`;
    const events = [];
    projects.filter(p => String(p.deadline || '').startsWith(prefix)).forEach(p => events.push({
        date: p.deadline, kind: 'project', title: p.client, sub: p.title, done: ['Completed', 'Invoiced'].includes(p.status),
        action: `openProjectDetail('${p.id}')`
    }));
    tasks.filter(x => String(x.dueDate || '').startsWith(prefix) && x.status !== 'DONE').forEach(x => {
        const p = projects.find(pr => pr.id === x.projectId);
        if (p) events.push({ date: x.dueDate, kind: 'task', title: x.title, sub: `${p.client} · ${x.assignee || '-'}`, action: `openProjectDetail('${p.id}', 'tasks')` });
    });
    invoices.filter(inv => String(inv.dueDate || '').startsWith(prefix) && inv.status === 'SENT').forEach(inv => events.push({
        date: inv.dueDate, kind: 'invoice', title: inv.number, sub: inv.client, action: `openInvoice('${inv.id}')`
    }));
    return events.sort((a, b) => a.date.localeCompare(b.date));
}

const CAL_STYLES = {
    project: { chip: 'bg-blue-600 text-white', dot: 'bg-blue-600', icon: 'fa-flag-checkered text-blue-600' },
    task: { chip: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200', dot: 'bg-sky-400', icon: 'fa-list-check text-sky-500' },
    invoice: { chip: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200', dot: 'bg-rose-500', icon: 'fa-file-invoice-dollar text-rose-500' }
};

function renderCalendar() {
    const year = currentCalDate.getFullYear();
    const month = currentCalDate.getMonth();
    const today = todayStr();
    const monthNames = t('monthsLong');
    document.getElementById('calendar-month-year').innerText = `${monthNames[month]} ${year}`;
    document.getElementById('calendar-header-grid').innerHTML = t('daysShort').map(d => `<div>${d}</div>`).join('');

    const events = calendarEvents(year, month);
    if (window.calSelectedDay && !window.calSelectedDay.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)) window.calSelectedDay = null;

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    let html = '';
    for (let i = 0; i < firstDayIndex; i++) {
        html += `<div class="h-14 sm:h-28 rounded-lg sm:rounded-xl border border-dashed border-gray-200 dark:border-gray-700/50 opacity-40"></div>`;
    }
    for (let day = 1; day <= totalDays; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayEvents = events.filter(e => e.date === dateStr);
        const isToday = today === dateStr;
        const isSelected = window.calSelectedDay === dateStr;
        const chips = dayEvents.map(e => `
            <div onclick="event.stopPropagation(); ${e.action}" class="hidden sm:block p-1 rounded-md ${CAL_STYLES[e.kind].chip} ${e.done ? 'opacity-50' : ''} text-[10px] font-semibold cursor-pointer truncate" title="${esc(e.title)} — ${esc(e.sub)}">
                <i class="fa-solid ${CAL_STYLES[e.kind].icon.split(' ')[0]} mr-1"></i>${esc(e.title)}
            </div>`).join('');
        const dots = dayEvents.slice(0, 4).map(e => `<span class="w-1.5 h-1.5 rounded-full ${CAL_STYLES[e.kind].dot}"></span>`).join('');
        html += `
            <button onclick="selectCalDay('${dateStr}')" class="h-14 sm:h-28 p-1 sm:p-2 rounded-lg sm:rounded-xl border text-left flex flex-col overflow-hidden transition
                ${isSelected ? 'border-2 border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30' : isToday ? 'border-2 border-blue-500 bg-blue-50/20' : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300'}">
                <span class="text-xs font-bold ${isToday ? 'bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center' : 'text-gray-700 dark:text-gray-300'}">${day}</span>
                <span class="sm:hidden flex flex-wrap gap-0.5 mt-auto">${dots}</span>
                <span class="hidden sm:block space-y-1 overflow-y-auto no-scrollbar mt-1">${chips}</span>
            </button>`;
    }
    document.getElementById('calendar-days-grid').innerHTML = html;

    // Agenda list under the grid (the main view on phones).
    const list = window.calSelectedDay ? events.filter(e => e.date === window.calSelectedDay) : events;
    document.getElementById('calendar-agenda-title').innerText = window.calSelectedDay
        ? t('calAgendaDay', { date: window.calSelectedDay })
        : t('calAgendaMonth', { month: `${monthNames[month]} ${year}` });
    document.getElementById('calendar-agenda-all').classList.toggle('hidden', !window.calSelectedDay);
    document.getElementById('calendar-agenda').innerHTML = list.map(e => `
        <button onclick="${e.action}" class="w-full text-left flex items-center gap-3 py-2.5 px-1 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30 rounded-lg ${e.done ? 'opacity-50' : ''}">
            <div class="w-11 text-center flex-shrink-0">
                <div class="text-base font-black leading-none ${e.date < today && !e.done ? 'text-rose-600' : 'text-gray-800 dark:text-gray-100'}">${Number(e.date.slice(8))}</div>
                <div class="text-[10px] uppercase text-gray-400">${esc(t('daysShort')[new Date(e.date + 'T00:00:00').getDay()])}</div>
            </div>
            <i class="fa-solid ${CAL_STYLES[e.kind].icon} w-4"></i>
            <div class="min-w-0 flex-1">
                <div class="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">${esc(e.title)}</div>
                <div class="text-[11px] text-gray-400 truncate">${esc(t(`calKind_${e.kind}`))} · ${esc(e.sub)}</div>
            </div>
        </button>`).join('') || `<p class="text-sm text-gray-400 text-center py-6">${t('calAgendaEmpty')}</p>`;
}
