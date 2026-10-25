// JADI.in Hub — freelancers.js
// FREELANCERS RENDERING
function renderFreelancers() {
    const grid = document.getElementById('freelancers-grid');
    const search = document.getElementById('freelancer-search').value.toLowerCase();
    const skillFilter = document.getElementById('freelancer-filter-skill').value;

    const filtered = freelancers.filter(f => {
        const matchesSearch = String(f.name || '').toLowerCase().includes(search) || String(f.skill || '').toLowerCase().includes(search);
        const matchesSkill = skillFilter === 'ALL' || f.skill === skillFilter;
        return matchesSearch && matchesSkill;
    });

    grid.innerHTML = '';
    if (filtered.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center py-12 text-gray-400">${t('noFreeFound')}</div>`;
        return;
    }

    filtered.forEach(f => {
        grid.innerHTML += `
            <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
                <div class="flex justify-between items-start">
                    <div class="flex items-center space-x-3">
                        <div class="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center text-lg">
                            ${esc(String(f.name || '?').charAt(0))}
                        </div>
                        <div>
                            <h4 class="font-bold text-base text-gray-900 dark:text-white flex items-center">${getDemoBadgeHTML(f.isDummy)}<span>${esc(f.name)}</span></h4>
                            <span class="text-xs text-blue-600 dark:text-blue-400 font-semibold">${esc(f.skill)}</span>
                        </div>
                    </div>
                    <span class="text-xs px-2.5 py-0.5 rounded-full font-bold ${f.status === 'Available' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}">${esc(f.status)}</span>
                </div>
                <div class="space-y-1 text-xs text-gray-500 dark:text-gray-400 border-t border-b py-3 border-gray-100 dark:border-gray-700">
                    <div class="flex justify-between"><span>Rate:</span><span class="font-bold text-gray-800 dark:text-gray-200">${esc(f.rate)}</span></div>
                    ${partnerRatingRowHTML('freelancer', f)}
                    ${partnerUsageRowHTML('freelancer', f.id)}
                </div>
                <div class="flex items-center justify-between pt-1">
                    <a href="https://wa.me/${esc(f.phone)}" target="_blank" class="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center space-x-2 transition">
                        <i class="fa-brands fa-whatsapp text-sm"></i><span>WA</span>
                    </a>
                    <div class="flex items-center space-x-1">
                        <button onclick="openPartnerHistory('freelancer', '${f.id}')" class="p-2 text-gray-400 hover:text-teal-600 text-xs" title="${esc(t('historyTitle'))}"><i class="fa-solid fa-clock-rotate-left"></i></button>
                        ${attachmentsButtonHTML('freelancers', f.id, (f.attachments || []).length)}
                        <button onclick="editFreelancer('${f.id}')" class="p-2 text-gray-400 hover:text-blue-500"><i class="fa-solid fa-pen text-xs"></i></button>
                        <button onclick="deleteFreelancer('${f.id}')" class="admin-only p-2 text-gray-400 hover:text-rose-500"><i class="fa-solid fa-trash-can text-xs"></i></button>
                    </div>
                </div>
            </div>
        `;
    });
}

function openFreelancerModal() {
    document.getElementById('form-freelancer').reset();
    document.getElementById('free-id').value = '';
    document.getElementById('modal-freelancer').classList.remove('hidden');
}

function closeFreelancerModal() { document.getElementById('modal-freelancer').classList.add('hidden'); }

function editFreelancer(id) {
    const f = freelancers.find(item => item.id === id);
    if (!f) return;
    document.getElementById('free-id').value = f.id;
    document.getElementById('free-name').value = f.name;
    document.getElementById('free-skill').value = f.skill;
    document.getElementById('free-status').value = f.status;
    document.getElementById('free-rate').value = f.rate;
    document.getElementById('free-phone').value = f.phone;
    document.getElementById('modal-freelancer').classList.remove('hidden');
}

function saveFreelancer(e) {
    e.preventDefault();
    const id = document.getElementById('free-id').value || `real_${Date.now()}`;
    const existing = freelancers.find(f => f.id === id);
    const newFree = {
        ...(existing || {}),
        id: id,
        name: document.getElementById('free-name').value,
        skill: document.getElementById('free-skill').value,
        status: document.getElementById('free-status').value,
        rate: document.getElementById('free-rate').value,
        phone: document.getElementById('free-phone').value,
        rating: existing && existing.rating ? existing.rating : 4.9,
        isDummy: existing ? existing.isDummy : false
    };
    const idx = freelancers.findIndex(f => f.id === id);
    if (idx !== -1) freelancers[idx] = newFree;
    else freelancers.unshift(newFree);

    closeFreelancerModal();
    saveItem('freelancers', newFree);
    showToast(t('toastFreeSaved'));
}

function deleteFreelancer(id) {
    if (!requireAdmin()) return;
    const item = freelancers.find(x => x.id === id);
    askConfirm({
        title: t('confirmTitleDelete'),
        message: t('confirmMsgDelete', { name: itemLabel(item) }),
        button: t('delete'),
        onConfirm: () => {
            removeItem('freelancers', id, { skipCheck: true });
            showToast(t('toastFreeDeleted'));
        }
    });
}
