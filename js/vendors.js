// JADI.in Hub — vendors.js
// VENDORS RENDERING
function renderVendors() {
    const grid = document.getElementById('vendors-grid');
    const search = document.getElementById('vendor-search').value.toLowerCase();
    const catFilter = document.getElementById('vendor-filter-category').value;

    const filtered = vendors.filter(v => {
        const haystack = [v.name, v.pic, v.location, v.notes, v.category].map(x => String(x || '').toLowerCase()).join(' ');
        const matchesSearch = haystack.includes(search);
        const matchesCat = catFilter === 'ALL' || v.category === catFilter;
        return matchesSearch && matchesCat;
    });

    grid.innerHTML = '';
    if (filtered.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center py-12 text-gray-400">${t('noVendorsFound')}</div>`;
        return;
    }

    filtered.forEach(v => {
        grid.innerHTML += `
            <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
                <div class="flex justify-between items-start">
                    <div>
                        <span class="text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border border-teal-200/50">${esc(v.category)}</span>
                        <h4 class="font-bold text-base text-gray-900 dark:text-white mt-1.5 flex items-center">${getDemoBadgeHTML(v.isDummy)}<span>${esc(v.name)}</span></h4>
                    </div>
                    <span class="text-xs px-2.5 py-1 rounded-full font-semibold bg-teal-100 text-teal-800">${esc(v.status)}</span>
                </div>
                <div class="space-y-2 text-xs text-gray-600 dark:text-gray-300 border-t border-b py-3 border-gray-100 dark:border-gray-700">
                    <div class="flex justify-between"><span>PIC:</span><span class="font-semibold text-gray-800 dark:text-white">${esc(v.pic)}</span></div>
                    <div class="flex justify-between"><span>Cost:</span><span class="font-bold text-emerald-600">${v.cost ? formatIDR(v.cost) : '-'}</span></div>
                    ${v.location ? `<div class="flex justify-between"><span>${t('labelVendorLocationShort')}:</span><span class="font-semibold text-gray-800 dark:text-white">${esc(v.location)}</span></div>` : ''}
                    ${partnerRatingRowHTML('vendor', v)}
                    ${partnerUsageRowHTML('vendor', v.id)}
                </div>
                ${v.notes ? `<p class="text-xs text-gray-500 dark:text-gray-400 whitespace-pre-line">${esc(v.notes)}</p>` : ''}
                <div class="flex items-center justify-between pt-1">
                    <a href="https://wa.me/${esc(v.phone)}" target="_blank" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition">
                        <i class="fa-brands fa-whatsapp"></i><span>WA</span>
                    </a>
                    <div class="flex items-center space-x-1">
                        <button onclick="openPartnerHistory('vendor', '${v.id}')" class="p-1.5 text-gray-400 hover:text-teal-600 text-xs font-semibold" title="${esc(t('historyTitle'))}"><i class="fa-solid fa-clock-rotate-left"></i></button>
                        ${attachmentsButtonHTML('vendors', v.id, (v.attachments || []).length)}
                        <button onclick="editVendor('${v.id}')" class="p-1.5 text-gray-400 hover:text-blue-500"><i class="fa-solid fa-pen text-xs"></i></button>
                        <button onclick="deleteVendor('${v.id}')" class="admin-only p-1.5 text-gray-400 hover:text-rose-500"><i class="fa-solid fa-trash-can text-xs"></i></button>
                    </div>
                </div>
            </div>
        `;
    });
}

function openVendorModal() {
    document.getElementById('form-vendor').reset();
    document.getElementById('vendor-id').value = '';
    populateVendorCategoryOptions();
    document.getElementById('modal-vendor').classList.remove('hidden');
}

function closeVendorModal() { document.getElementById('modal-vendor').classList.add('hidden'); }

function editVendor(id) {
    const v = vendors.find(item => item.id === id);
    if (!v) return;
    populateVendorCategoryOptions();
    document.getElementById('vendor-id').value = v.id;
    document.getElementById('vendor-name').value = v.name;
    document.getElementById('vendor-category').value = v.category;
    document.getElementById('vendor-status').value = v.status;
    document.getElementById('vendor-pic').value = v.pic;
    document.getElementById('vendor-phone').value = v.phone;
    document.getElementById('vendor-cost').value = v.cost || '';
    document.getElementById('vendor-rating').value = v.rating || 4.8;
    document.getElementById('vendor-location').value = v.location || '';
    document.getElementById('vendor-notes').value = v.notes || '';
    document.getElementById('modal-vendor').classList.remove('hidden');
}

function saveVendor(e) {
    e.preventDefault();
    const id = document.getElementById('vendor-id').value || `real_${Date.now()}`;
    const existing = vendors.find(v => v.id === id);
    const newVendor = {
        ...(existing || {}),
        id: id,
        name: document.getElementById('vendor-name').value,
        category: document.getElementById('vendor-category').value,
        status: document.getElementById('vendor-status').value,
        pic: document.getElementById('vendor-pic').value,
        phone: document.getElementById('vendor-phone').value,
        cost: Number(document.getElementById('vendor-cost').value) || 0,
        rating: Number(document.getElementById('vendor-rating').value) || 4.8,
        location: document.getElementById('vendor-location').value,
        notes: document.getElementById('vendor-notes').value,
        isDummy: existing ? existing.isDummy : false
    };
    const idx = vendors.findIndex(v => v.id === id);
    if (idx !== -1) vendors[idx] = newVendor;
    else vendors.unshift(newVendor);

    closeVendorModal();
    saveItem('vendors', newVendor);
    showToast(t('toastVendorSaved'));
}

function deleteVendor(id) {
    if (!requireAdmin()) return;
    const item = vendors.find(x => x.id === id);
    askConfirm({
        title: t('confirmTitleDelete'),
        message: t('confirmMsgDelete', { name: itemLabel(item) }),
        button: t('delete'),
        onConfirm: () => {
            removeItem('vendors', id, { skipCheck: true });
            showToast(t('toastVendorDeleted'));
        }
    });
}


// ---------- VENDOR CATEGORIES ----------
function getVendorCategories() {
    const saved = Array.isArray(window.settings.vendorCategories) ? window.settings.vendorCategories : DEFAULT_VENDOR_CATEGORIES;
    const inUse = vendors.map(v => v.category).filter(Boolean);
    return [...new Set([...saved, ...inUse])];
}

function addVendorCategory(name) {
    const cat = String(name || '').trim();
    if (!cat) return false;
    const current = Array.isArray(window.settings.vendorCategories) ? window.settings.vendorCategories : DEFAULT_VENDOR_CATEGORIES;
    if (current.some(c => c.toLowerCase() === cat.toLowerCase())) return false;
    saveListSettings([...current, cat]);
    logActivity('create', 'settings', 'lists', cat);
    return true;
}

function addVendorCategoryFromSettings() {
    const input = document.getElementById('set-new-cat');
    if (addVendorCategory(input.value)) showToast(t('toastCatAdded'));
    input.value = '';
}

function quickAddVendorCategory() {
    const name = prompt(t('promptNewCategory'));
    if (!name || !name.trim()) return;
    addVendorCategory(name);
    populateVendorCategoryOptions();
    document.getElementById('vendor-category').value = getVendorCategories().find(c => c.toLowerCase() === name.trim().toLowerCase()) || '';
}

function removeVendorCategory(cat) {
    if (!requireAdmin()) return;
    if (vendors.some(v => v.category === cat)) {
        showToast(t('toastCatInUse'));
        return;
    }
    const current = Array.isArray(window.settings.vendorCategories) ? window.settings.vendorCategories : DEFAULT_VENDOR_CATEGORIES;
    saveListSettings(current.filter(c => c !== cat));
    logActivity('delete', 'settings', 'lists', cat);
}

function populateVendorCategoryOptions() {
    const cats = getVendorCategories();
    const filter = document.getElementById('vendor-filter-category');
    if (filter) {
        const val = filter.value || 'ALL';
        filter.innerHTML = `<option value="ALL">${t('allCategories')}</option>` + cats.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
        filter.value = cats.includes(val) ? val : 'ALL';
    }
    const select = document.getElementById('vendor-category');
    if (select) {
        const val = select.value;
        select.innerHTML = cats.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
        if (val && cats.includes(val)) select.value = val;
    }
}
