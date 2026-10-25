// JADI.in Hub — settings.js
// Company identity (admin only), shared lists (vendor categories) and team access (admin only).

const COMPANY_FIELDS = ['companyName', 'tagline', 'contact', 'bankName', 'bankAccount', 'bankHolder'];

function cacheSettings() {
    localStorage.setItem(`${STORAGE_PREFIX}settings`, JSON.stringify(window.settings));
}

function saveCompanySettings(obj) {
    const company = {};
    COMPANY_FIELDS.forEach(k => { company[k] = obj[k] || ''; });
    window.settings = { ...window.settings, ...company };
    cacheSettings();
    scheduleRefresh();
    if (window.isCloudMode && window.db) {
        window.db.collection('settings').doc('company').set(company).catch(onCloudWriteError);
    }
}

function saveListSettings(vendorCategories) {
    window.settings = { ...window.settings, vendorCategories };
    cacheSettings();
    scheduleRefresh();
    if (window.isCloudMode && window.db) {
        window.db.collection('settings').doc('lists').set({ vendorCategories }).catch(onCloudWriteError);
    }
}

function renderSettings() {
    const s = window.settings;
    const fields = { 'set-company-name': 'companyName', 'set-tagline': 'tagline', 'set-contact': 'contact', 'set-bank-name': 'bankName', 'set-bank-account': 'bankAccount', 'set-bank-holder': 'bankHolder' };
    Object.entries(fields).forEach(([elId, key]) => {
        const el = document.getElementById(elId);
        if (!el) return;
        if (document.activeElement !== el) el.value = s[key] || '';
        el.disabled = !isAdmin();
    });

    const list = document.getElementById('set-cat-list');
    if (list) {
        list.innerHTML = getVendorCategories().map(cat => {
            const used = vendors.filter(v => v.category === cat).length;
            return `<span class="inline-flex items-center space-x-2 pl-3 pr-1 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-200/50">
                <span>${esc(cat)}${used ? ` <span class="text-teal-500">(${used})</span>` : ''}</span>
                <button type="button" data-cat="${esc(cat)}" onclick="removeVendorCategory(this.dataset.cat)" class="admin-only w-5 h-5 rounded-full hover:bg-teal-200 dark:hover:bg-teal-800" title="${esc(t('delete'))}"><i class="fa-solid fa-xmark text-[10px]"></i></button>
            </span>`;
        }).join('');
    }
    renderMembers();
}

function saveSettings(e) {
    e.preventDefault();
    if (!requireAdmin()) return;
    saveCompanySettings({
        companyName: document.getElementById('set-company-name').value.trim(),
        tagline: document.getElementById('set-tagline').value.trim(),
        contact: document.getElementById('set-contact').value.trim(),
        bankName: document.getElementById('set-bank-name').value.trim(),
        bankAccount: document.getElementById('set-bank-account').value.trim(),
        bankHolder: document.getElementById('set-bank-holder').value.trim()
    });
    logActivity('update', 'settings', 'company', t('setTitleCompany'));
    showToast(t('toastSettingsSaved'));
}

// ---------- TEAM ACCESS ----------
function renderMembers() {
    const box = document.getElementById('members-list');
    if (!box) return;
    if (!window.isCloudMode) {
        box.innerHTML = `<p class="text-xs text-gray-400">${t('membersLocalMode')}</p>`;
        return;
    }
    const me = myEmail();
    const sorted = [...window.members].sort((a, b) => (a.role === b.role ? a.id.localeCompare(b.id) : a.role === 'admin' ? -1 : 1));
    box.innerHTML = sorted.map(m => `
        <div class="flex items-center justify-between gap-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
            <div class="min-w-0">
                <div class="text-sm font-semibold text-gray-800 dark:text-white truncate">${esc(m.id)}${m.id === me ? ` <span class="text-xs text-gray-400">(${t('you')})</span>` : ''}</div>
                <div class="text-[11px] text-gray-400">${m.addedBy ? `${t('addedBy')} ${esc(m.addedBy)}` : ''}</div>
            </div>
            <div class="flex items-center space-x-2 flex-shrink-0">
                <select data-email="${esc(m.id)}" onchange="changeMemberRole(this.dataset.email, this.value)" ${m.id === me ? 'disabled' : ''} class="px-2 py-1 bg-gray-50 dark:bg-gray-700 rounded-lg text-xs">
                    <option value="member" ${m.role !== 'admin' ? 'selected' : ''}>${t('roleMember')}</option>
                    <option value="admin" ${m.role === 'admin' ? 'selected' : ''}>${t('roleAdmin')}</option>
                </select>
                ${m.id === me ? '' : `<button data-email="${esc(m.id)}" onclick="removeMember(this.dataset.email)" class="p-1.5 text-gray-400 hover:text-rose-500" title="${esc(t('delete'))}"><i class="fa-solid fa-user-minus text-xs"></i></button>`}
            </div>
        </div>`).join('') || `<p class="text-xs text-gray-400">-</p>`;
}

function addMember(e) {
    e.preventDefault();
    if (!requireAdmin()) return;
    const input = document.getElementById('member-email');
    const email = input.value.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast(t('toastInvalidEmail')); return; }
    if (window.members.some(m => m.id === email)) { showToast(t('toastMemberExists')); return; }
    const role = document.getElementById('member-role').value === 'admin' ? 'admin' : 'member';
    const entry = { email, role, addedBy: myEmail(), addedAt: nowISO() };
    window.members = [...window.members, { ...entry, id: email }];
    renderMembers();
    window.db.collection('members').doc(email).set(entry).catch(onCloudWriteError);
    logActivity('create', 'members', email, `${email} (${role})`);
    input.value = '';
    showToast(t('toastMemberAdded'));
}

function changeMemberRole(email, role) {
    if (!requireAdmin() || email === myEmail()) return;
    role = role === 'admin' ? 'admin' : 'member';
    window.db.collection('members').doc(email).set({ role }, { merge: true }).catch(onCloudWriteError);
    logActivity('update', 'members', email, `${email} → ${role}`);
}

function removeMember(email) {
    if (!requireAdmin() || email === myEmail()) return;
    askConfirm({
        title: t('confirmTitleRemoveMember'),
        message: t('confirmMsgRemoveMember', { email }),
        button: t('delete'),
        tone: 'danger',
        onConfirm: () => {
            window.members = window.members.filter(m => m.id !== email);
            renderMembers();
            window.db.collection('members').doc(email).delete().catch(onCloudWriteError);
            logActivity('delete', 'members', email, email);
        }
    });
}
