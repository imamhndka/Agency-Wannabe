// JADI.in Hub — team.js
// PIC / TEAM MANAGEMENT
function renderPics() {
    const grid = document.getElementById('pics-grid');
    if (!grid) return;
    const search = document.getElementById('pic-search').value.toLowerCase();

    const filtered = pics.filter(p => p.name.toLowerCase().includes(search) || p.role.toLowerCase().includes(search));

    grid.innerHTML = '';
    if (filtered.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center py-12 text-gray-400">${t('noPicsFound')}</div>`;
        return;
    }

    filtered.forEach(p => {
        const assignedProjects = projects.filter(proj => proj.pic === p.name).length;
        grid.innerHTML += `
            <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
                <div class="flex items-center space-x-3">
                    <div class="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-950 font-bold text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-lg border border-indigo-200 dark:border-indigo-800">
                        ${esc(p.name.charAt(0))}
                    </div>
                    <div>
                        <h4 class="font-bold text-base text-gray-900 dark:text-white">${esc(p.name)}</h4>
                        <span class="text-xs text-indigo-600 dark:text-indigo-400 font-medium block">${esc(p.role)}</span>
                    </div>
                </div>
                <div class="space-y-1.5 text-xs text-gray-500 dark:text-gray-400 border-t border-b py-3 border-gray-100 dark:border-gray-700">
                    <div class="flex justify-between"><span>Email:</span><span class="font-semibold text-gray-800 dark:text-gray-200">${esc(p.email || '-')}</span></div>
                    <div class="flex justify-between"><span>Active Projects:</span><span class="font-bold text-emerald-600">${assignedProjects}</span></div>
                </div>
                <div class="flex items-center justify-between pt-1">
                    <a href="https://wa.me/${esc(p.phone)}" target="_blank" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition">
                        <i class="fa-brands fa-whatsapp"></i><span>WA</span>
                    </a>
                    <div class="flex space-x-1">
                        <button onclick="editPic('${p.id}')" class="p-1.5 text-gray-400 hover:text-blue-500"><i class="fa-solid fa-pen text-xs"></i></button>
                        <button onclick="deletePic('${p.id}')" class="admin-only p-1.5 text-gray-400 hover:text-rose-500"><i class="fa-solid fa-trash-can text-xs"></i></button>
                    </div>
                </div>
            </div>
        `;
    });
}

function openPicModal() {
    document.getElementById('form-pic').reset();
    document.getElementById('pic-id').value = '';
    document.getElementById('modal-pic').classList.remove('hidden');
}

function closePicModal() {
    document.getElementById('modal-pic').classList.add('hidden');
}

function editPic(id) {
    const p = pics.find(item => item.id === id);
    if (!p) return;
    document.getElementById('pic-id').value = p.id;
    document.getElementById('pic-name').value = p.name;
    document.getElementById('pic-role').value = p.role;
    document.getElementById('pic-email').value = p.email || '';
    document.getElementById('pic-phone').value = p.phone || '';
    document.getElementById('modal-pic').classList.remove('hidden');
}

function savePic(e) {
    e.preventDefault();
    const id = document.getElementById('pic-id').value || `pic_${Date.now()}`;
    const newPic = {
        ...(pics.find(p => p.id === id) || {}),
        id: id,
        name: document.getElementById('pic-name').value,
        role: document.getElementById('pic-role').value,
        email: document.getElementById('pic-email').value,
        phone: document.getElementById('pic-phone').value
    };

    const idx = pics.findIndex(p => p.id === id);
    if (idx !== -1) pics[idx] = newPic;
    else pics.unshift(newPic);

    closePicModal();
    saveItem('pics', newPic);
    showToast(t('toastPicSaved'));
}

function deletePic(id) {
    if (!requireAdmin()) return;
    const item = pics.find(x => x.id === id);
    askConfirm({
        title: t('confirmTitleDelete'),
        message: t('confirmMsgDelete', { name: itemLabel(item) }),
        button: t('delete'),
        onConfirm: () => {
            removeItem('pics', id, { skipCheck: true });
            showToast(t('toastPicDeleted'));
        }
    });
}
