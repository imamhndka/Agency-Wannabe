// JADI.in Hub — attachments.js
// Links to files kept elsewhere (Google Drive, Dropbox, etc.) on projects, vendors, freelancers and research.

window.attachTarget = null; // { col, id } for the attachments modal

function safeUrl(url) {
    const value = String(url || '').trim();
    return /^https?:\/\//i.test(value) ? value : '';
}

function attachmentIcon(url) {
    const u = String(url).toLowerCase();
    if (u.includes('drive.google') || u.includes('docs.google')) return 'fa-brands fa-google-drive text-emerald-600';
    if (u.includes('dropbox')) return 'fa-brands fa-dropbox text-blue-600';
    if (u.includes('figma')) return 'fa-brands fa-figma text-purple-600';
    if (/\.pdf($|\?)/.test(u)) return 'fa-solid fa-file-pdf text-rose-600';
    if (/\.(png|jpe?g|webp|gif)($|\?)/.test(u)) return 'fa-solid fa-image text-sky-600';
    return 'fa-solid fa-link text-gray-500';
}

function attachmentsEditorHTML(col, id) {
    const item = (window[col] || []).find(x => x.id === id);
    if (!item) return '';
    const list = item.attachments || [];
    const rows = list.map((a, idx) => {
        const url = safeUrl(a.url);
        return `<div class="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
            <i class="${attachmentIcon(a.url)} w-5 text-center"></i>
            <div class="flex-1 min-w-0">
                ${url ? `<a href="${esc(url)}" target="_blank" rel="noopener" class="text-sm font-semibold text-gray-800 dark:text-gray-100 hover:underline truncate block">${esc(a.label || url)}</a>` : `<span class="text-sm">${esc(a.label || '-')}</span>`}
                <div class="text-[11px] text-gray-400 truncate">${esc(a.addedBy || '')}${a.addedAt ? ` · ${esc(String(a.addedAt).slice(0, 10))}` : ''}</div>
            </div>
            <button onclick="removeAttachment('${col}', '${id}', ${idx})" class="admin-only p-1.5 text-gray-400 hover:text-rose-500" title="${esc(t('delete'))}"><i class="fa-solid fa-trash-can text-xs"></i></button>
        </div>`;
    }).join('');
    return `
        <form onsubmit="addAttachment(event, '${col}', '${id}')" class="grid grid-cols-1 md:grid-cols-12 gap-2 bg-gray-50 dark:bg-gray-700/40 p-3 rounded-xl">
            <input id="attach-label" required placeholder="${esc(t('attachLabelPlaceholder'))}" class="md:col-span-4 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg text-sm focus:outline-none">
            <input id="attach-url" type="url" required placeholder="https://drive.google.com/..." class="md:col-span-6 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg text-sm focus:outline-none">
            <button type="submit" class="md:col-span-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold"><i class="fa-solid fa-plus mr-1"></i>${t('attachAddBtn')}</button>
        </form>
        <p class="text-xs text-gray-500 dark:text-gray-400">${t('attachHelp')}</p>
        <div>${rows || `<p class="text-sm text-gray-400 text-center py-6">${t('attachEmpty')}</p>`}</div>`;
}

function addAttachment(e, col, id) {
    e.preventDefault();
    const item = (window[col] || []).find(x => x.id === id);
    if (!item) return;
    const url = safeUrl(document.getElementById('attach-url').value);
    if (!url) { showToast(t('toastInvalidUrl')); return; }
    const label = document.getElementById('attach-label').value.trim();
    item.attachments = [...(item.attachments || []), { label, url, addedBy: myEmail(), addedAt: nowISO() }];
    window.detailResetForm = true;
    saveItem(col, item, { action: 'attach' });
    renderAttachmentsModal();
    showToast(t('toastAttachAdded'));
}

function removeAttachment(col, id, idx) {
    if (!requireAdmin()) return;
    const item = (window[col] || []).find(x => x.id === id);
    if (!item || !item.attachments || !item.attachments[idx]) return;
    askConfirm({
        title: t('confirmTitleDelete'),
        message: t('confirmMsgDelete', { name: item.attachments[idx].label || item.attachments[idx].url }),
        button: t('delete'),
        onConfirm: () => {
            item.attachments = item.attachments.filter((_, i) => i !== idx);
            saveItem(col, item, { action: 'detach' });
            renderAttachmentsModal();
        }
    });
}

function attachmentsButtonHTML(col, id, count) {
    return `<button onclick="openAttachments('${col}', '${id}')" class="p-1.5 text-gray-400 hover:text-blue-500 text-xs font-semibold" title="${esc(t('detailTab_attachments'))}"><i class="fa-solid fa-paperclip"></i>${count ? ` ${count}` : ''}</button>`;
}

// ---------- MODAL (vendors, freelancers, research) ----------
function openAttachments(col, id) {
    window.attachTarget = { col, id };
    document.getElementById('modal-attachments').classList.remove('hidden');
    renderAttachmentsModal();
}

function closeAttachments() {
    window.attachTarget = null;
    document.getElementById('modal-attachments').classList.add('hidden');
}

function renderAttachmentsModal() {
    const target = window.attachTarget;
    const modal = document.getElementById('modal-attachments');
    if (!target || !modal || modal.classList.contains('hidden')) return;
    const item = (window[target.col] || []).find(x => x.id === target.id);
    if (!item) { closeAttachments(); return; }
    document.getElementById('attach-modal-title').innerText = itemLabel(item);
    const body = document.getElementById('attach-modal-body');
    const keep = window.detailResetForm ? null : captureInputs(body);
    body.innerHTML = attachmentsEditorHTML(target.col, target.id);
    restoreInputs(body, keep);
}
