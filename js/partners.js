// JADI.in Hub — partners.js
// Vendor / freelancer track record built from the quotes selected on projects.

function partnerQuotes(type, id) {
    return quotes.filter(q => q.partnerType === type && q.partnerId === id);
}

function partnerStats(type, id) {
    const all = partnerQuotes(type, id);
    const used = all.filter(q => q.status === 'SELECTED');
    const rated = used.filter(q => Number(q.rating) > 0);
    return {
        offers: all.length,
        projects: new Set(used.map(q => q.projectId)).size,
        spend: used.reduce((sum, q) => sum + Number(q.amount || 0), 0),
        avgRating: rated.length ? rated.reduce((sum, q) => sum + Number(q.rating), 0) / rated.length : null,
        reviews: rated.length
    };
}

// Rating shown on cards: average of project reviews when there are any, otherwise the manual rating.
function partnerRatingRowHTML(type, p) {
    const st = partnerStats(type, p.id);
    const value = st.avgRating !== null ? st.avgRating.toFixed(1) : (p.rating ? Number(p.rating).toFixed(1) : '');
    if (!value) return '';
    const note = st.avgRating !== null ? ` <span class="text-gray-400 font-normal">(${st.reviews} ${t('reviews')})</span>` : '';
    return `<div class="flex justify-between"><span>Rating:</span><span class="font-semibold text-amber-500"><i class="fa-solid fa-star text-[10px]"></i> ${esc(value)}${note}</span></div>`;
}

function partnerUsageRowHTML(type, id) {
    const st = partnerStats(type, id);
    if (!st.offers) return '';
    return `<div class="flex justify-between"><span>${t('historyUsed')}:</span><span class="font-semibold text-gray-800 dark:text-white">${st.projects} ${t('historyProjects')} · ${formatIDR(st.spend)}</span></div>`;
}

window.historyTarget = null;

function openPartnerHistory(type, id) {
    window.historyTarget = { type, id };
    document.getElementById('modal-history').classList.remove('hidden');
    renderPartnerHistory();
}

function closePartnerHistory() {
    window.historyTarget = null;
    document.getElementById('modal-history').classList.add('hidden');
}

function renderPartnerHistory() {
    const target = window.historyTarget;
    const modal = document.getElementById('modal-history');
    if (!target || !modal || modal.classList.contains('hidden')) return;
    const source = target.type === 'vendor' ? vendors : freelancers;
    const partner = source.find(x => x.id === target.id);
    if (!partner) { closePartnerHistory(); return; }
    const st = partnerStats(target.type, target.id);
    document.getElementById('history-title').innerText = partner.name || '';
    document.getElementById('history-sub').innerText = target.type === 'vendor' ? (partner.category || '') : (partner.skill || '');
    const stat = (label, value) => `<div class="bg-gray-50 dark:bg-gray-700/40 p-3 rounded-xl"><div class="text-[10px] font-bold uppercase tracking-wider text-gray-400">${label}</div><div class="text-base font-black mt-0.5">${value}</div></div>`;
    const rows = partnerQuotes(target.type, target.id)
        .slice().sort((a, b) => String(b.createdAt || b.id).localeCompare(String(a.createdAt || a.id)))
        .map(q => {
            const p = projects.find(x => x.id === q.projectId);
            return `<div class="py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div class="flex justify-between items-start gap-3">
                    <div class="min-w-0">
                        ${p ? `<button onclick="closePartnerHistory(); openProjectDetail('${p.id}', 'quotes')" class="text-sm font-semibold text-gray-900 dark:text-white hover:underline text-left">${esc(p.client)} — ${esc(p.title)}</button>` : `<span class="text-sm text-gray-400">${t('projectDeleted')}</span>`}
                        <div class="text-[11px] text-gray-400">${esc(q.need || '')}${q.createdAt ? ` · ${esc(String(q.createdAt).slice(0, 10))}` : ''}</div>
                    </div>
                    <div class="text-right flex-shrink-0">
                        <div class="text-sm font-bold">${formatIDR(q.amount || 0)}</div>
                        ${statusPill('quote', q.status || 'PENDING')}
                    </div>
                </div>
                ${Number(q.rating) > 0 || q.review ? `<div class="mt-1 text-xs text-gray-600 dark:text-gray-300 flex items-center gap-2"><span>${starsHTML(q.rating)}</span><span>${esc(q.review || '')}</span></div>` : ''}
            </div>`;
        }).join('');
    document.getElementById('history-body').innerHTML = `
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            ${stat(t('historyOffers'), st.offers)}
            ${stat(t('historyUsed'), `${st.projects} ${t('historyProjects')}`)}
            ${stat(t('historySpend'), formatIDR(st.spend))}
            ${stat('Rating', st.avgRating !== null ? `${st.avgRating.toFixed(1)} ★` : '-')}
        </div>
        <div>${rows || `<p class="text-sm text-gray-400 text-center py-8">${t('historyEmpty')}</p>`}</div>`;
}
