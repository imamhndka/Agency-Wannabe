// JADI.in Hub — invoices.js
// Saved invoices with several items, discount, VAT (PPN), partial billing (DP / termin) and payment status.

window.invoiceDraft = null;

// ---------- CALCULATIONS ----------
function invoiceTotals(inv) {
    const items = inv.items || [];
    const subtotal = items.reduce((sum, it) => sum + Number(it.qty || 0) * Number(it.price || 0), 0);
    const discount = Math.min(Number(inv.discount || 0), subtotal);
    const dpp = subtotal - discount;
    const tax = Math.round(dpp * Number(inv.taxPercent || 0) / 100);
    const total = dpp + tax;
    const pct = Number(inv.billPercent || 100);
    const billed = Math.round(total * Math.min(Math.max(pct, 0), 100) / 100);
    return { subtotal, discount, dpp, tax, total, billed, pct };
}

function invoiceDisplayStatus(inv) {
    if (inv.status === 'PAID') return 'PAID';
    if (inv.status === 'SENT' && inv.dueDate && inv.dueDate < todayStr()) return 'OVERDUE';
    return inv.status || 'DRAFT';
}

function nextInvoiceNumber(dateStr) {
    const year = String(dateStr || todayStr()).slice(0, 4);
    const re = new RegExp(`^INV/${year}/(\\d+)$`);
    const max = invoices.reduce((m, inv) => {
        const match = String(inv.number || '').match(re);
        return match ? Math.max(m, Number(match[1])) : m;
    }, 0);
    return `INV/${year}/${String(max + 1).padStart(3, '0')}`;
}

function blankInvoice(projectId) {
    const p = projectId ? projects.find(x => x.id === projectId) : null;
    return {
        id: '',
        number: nextInvoiceNumber(todayStr()),
        projectId: p ? p.id : '',
        client: p ? p.client : '',
        clientAddress: '',
        date: todayStr(),
        dueDate: addDaysStr(14),
        items: [{ desc: p ? `${p.category ? p.category + ': ' : ''}${p.title}` : '', qty: 1, price: p ? Number(p.revenue || 0) : 0 }],
        discount: 0,
        taxPercent: 0,
        billPercent: 100,
        billLabel: '',
        notes: '',
        status: 'DRAFT',
        paidDate: ''
    };
}

// ---------- PAGE ----------
function renderInvoices() {
    if (!window.invoiceDraft) window.invoiceDraft = blankInvoice();
    // If the invoice being edited was changed on another device and is not dirty here, reload it.
    if (window.invoiceDraft.id && !window.invoiceDirty) {
        const fresh = invoices.find(x => x.id === window.invoiceDraft.id);
        if (fresh) window.invoiceDraft = JSON.parse(JSON.stringify(fresh));
    }
    renderInvoiceStats();
    renderInvoiceList();
    fillInvoiceEditor();
    renderInvoicePreview();
}

function renderInvoiceStats() {
    const box = document.getElementById('invoice-stats');
    if (!box) return;
    const unpaid = invoices.filter(i => i.status === 'SENT');
    const overdue = unpaid.filter(i => invoiceDisplayStatus(i) === 'OVERDUE');
    const year = todayStr().slice(0, 4);
    const paidYear = invoices.filter(i => i.status === 'PAID' && String(i.paidDate || i.date).startsWith(year));
    const sum = list => list.reduce((s, i) => s + invoiceTotals(i).billed, 0);
    const card = (label, value, sub, cls) => `<div class="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div class="text-[11px] font-bold uppercase tracking-wider text-gray-400">${label}</div>
        <div class="text-lg font-black mt-1 ${cls}">${value}</div><div class="text-[11px] text-gray-400">${sub}</div></div>`;
    box.innerHTML =
        card(t('invStatUnpaid'), formatIDR(sum(unpaid)), `${unpaid.length} invoice`, 'text-blue-600') +
        card(t('invStatOverdue'), formatIDR(sum(overdue)), `${overdue.length} invoice`, overdue.length ? 'text-rose-600' : 'text-gray-900 dark:text-white') +
        card(t('invStatPaidYear', { year }), formatIDR(sum(paidYear)), `${paidYear.length} invoice`, 'text-emerald-600') +
        card(t('invStatDraft'), invoices.filter(i => (i.status || 'DRAFT') === 'DRAFT').length, t('invStatDraftSub'), 'text-gray-900 dark:text-white');
}

function renderInvoiceList() {
    const box = document.getElementById('invoice-list');
    if (!box) return;
    const statusSel = document.getElementById('invoice-filter-status');
    const val = statusSel.value || 'ALL';
    statusSel.innerHTML = `<option value="ALL">${t('allStatuses')}</option>` + ['DRAFT', 'SENT', 'OVERDUE', 'PAID'].map(s => `<option value="${s}">${esc(t(`inv_${s}`))}</option>`).join('');
    statusSel.value = val;
    const q = document.getElementById('invoice-search').value.toLowerCase();
    const list = invoices
        .filter(i => (val === 'ALL' || invoiceDisplayStatus(i) === val) && `${i.number} ${i.client}`.toLowerCase().includes(q))
        .slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || String(b.number).localeCompare(String(a.number)));
    box.innerHTML = list.map(inv => {
        const active = window.invoiceDraft && window.invoiceDraft.id === inv.id;
        return `<button onclick="openInvoice('${inv.id}')" class="w-full text-left p-3 rounded-xl mb-1.5 border transition ${active ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/30' : 'border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40'}">
            <div class="flex justify-between items-center gap-2">
                <span class="text-sm font-bold text-gray-900 dark:text-white flex items-center">${getDemoBadgeHTML(inv.isDummy)}${esc(inv.number)}</span>
                ${statusPill('inv', invoiceDisplayStatus(inv))}
            </div>
            <div class="flex justify-between items-center gap-2 mt-1">
                <span class="text-xs text-gray-500 truncate">${esc(inv.client || '-')}${inv.billLabel ? ` · ${esc(inv.billLabel)}` : ''}</span>
                <span class="text-xs font-bold">${formatIDR(invoiceTotals(inv).billed)}</span>
            </div>
        </button>`;
    }).join('') || `<p class="text-sm text-gray-400 text-center py-8">${t('invEmpty')}</p>`;
}

function fillInvoiceEditor() {
    const d = window.invoiceDraft;
    if (!document.getElementById('inv-project')) return;
    document.getElementById('inv-editor-title').innerText = d.id ? `${t('invEditTitle')} ${d.number}` : t('invNewTitle');
    document.getElementById('inv-delete-btn').classList.toggle('invisible', !d.id);
    const projSel = document.getElementById('inv-project');
    projSel.innerHTML = `<option value="">${t('invNoProject')}</option>` + projects.map(p => `<option value="${p.id}">${esc(p.client)} — ${esc(p.title)}</option>`).join('');
    projSel.value = d.projectId || '';
    document.getElementById('inv-status').innerHTML = INVOICE_STATUSES.map(s => `<option value="${s}">${esc(t(`inv_${s}`))}</option>`).join('');
    const map = {
        'inv-number': d.number, 'inv-date': d.date, 'inv-due-date': d.dueDate, 'inv-client-name': d.client,
        'inv-client-address': d.clientAddress, 'inv-discount': d.discount || '', 'inv-tax': d.taxPercent || '',
        'inv-bill-percent': d.billPercent || 100, 'inv-bill-label': d.billLabel, 'inv-notes': d.notes,
        'inv-status': d.status || 'DRAFT', 'inv-paid-date': d.paidDate
    };
    Object.entries(map).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el && document.activeElement !== el) el.value = value ?? '';
    });
    const itemsBox = document.getElementById('inv-items');
    if (!(document.activeElement && itemsBox.contains(document.activeElement))) renderInvoiceItemsEditor();
}

function renderInvoiceItemsEditor() {
    const box = document.getElementById('inv-items');
    if (!box) return;
    const active = document.activeElement && box.contains(document.activeElement) ? document.activeElement.id : null;
    box.innerHTML = window.invoiceDraft.items.map((it, i) => `
        <div class="grid grid-cols-12 gap-2 items-center">
            <input id="inv-item-desc-${i}" value="${esc(it.desc)}" oninput="onInvoiceItem(${i}, 'desc', this.value)" placeholder="${esc(t('invItemDescPlaceholder'))}" class="col-span-12 md:col-span-6 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-xl text-sm focus:outline-none">
            <input id="inv-item-qty-${i}" type="number" min="0" step="any" value="${esc(it.qty)}" oninput="onInvoiceItem(${i}, 'qty', this.value)" class="col-span-3 md:col-span-1 px-2 py-2 bg-gray-50 dark:bg-gray-700 rounded-xl text-sm focus:outline-none" title="Qty">
            <input id="inv-item-price-${i}" type="number" min="0" step="1" value="${esc(it.price)}" oninput="onInvoiceItem(${i}, 'price', this.value)" class="col-span-5 md:col-span-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-xl text-sm focus:outline-none" title="${esc(t('invTablePrice'))}">
            <span id="inv-item-total-${i}" class="col-span-3 md:col-span-2 text-right text-sm font-semibold">${formatIDR(Number(it.qty || 0) * Number(it.price || 0))}</span>
            <button onclick="removeInvoiceItem(${i})" class="col-span-1 text-gray-400 hover:text-rose-500" ${window.invoiceDraft.items.length <= 1 ? 'disabled' : ''}><i class="fa-solid fa-xmark"></i></button>
        </div>`).join('');
    if (active) { const el = document.getElementById(active); if (el) el.focus(); }
}

function renderInvoicePreview() {
    const d = window.invoiceDraft;
    if (!d || !document.getElementById('invoice-paper')) return;
    const c = invoiceTotals(d);
    const s = window.settings;
    document.getElementById('inv-co-name').innerText = s.companyName || 'JADI.in';
    document.getElementById('inv-co-tagline').innerText = s.tagline || '';
    document.getElementById('inv-co-contact').innerText = s.contact || '';
    const bankEl = document.getElementById('inv-co-bank');
    if (s.bankAccount) {
        bankEl.innerText = `${s.bankName || 'Bank'} - ${s.bankAccount} a.n ${s.bankHolder || s.companyName || ''}`;
        bankEl.className = '';
    } else {
        bankEl.innerText = t('invBankMissing');
        bankEl.className = 'text-rose-600 font-semibold no-print';
    }
    document.getElementById('prev-inv-number').innerText = d.number || '';
    document.getElementById('prev-inv-date').innerText = `${t('invDateLabel')}: ${d.date || '-'}`;
    document.getElementById('prev-inv-client').innerText = d.client || '-';
    document.getElementById('prev-inv-client-address').innerText = d.clientAddress || '';
    document.getElementById('prev-inv-due').innerText = d.dueDate || '-';
    document.getElementById('prev-inv-items').innerHTML = d.items.filter(it => it.desc || Number(it.price)).map(it => `
        <tr class="border-b border-gray-100">
            <td class="py-3 font-medium text-gray-800">${esc(it.desc)}</td>
            <td class="py-3 text-right">${esc(it.qty)}</td>
            <td class="py-3 text-right">${formatIDR(Number(it.price || 0))}</td>
            <td class="py-3 text-right font-bold text-gray-900">${formatIDR(Number(it.qty || 0) * Number(it.price || 0))}</td>
        </tr>`).join('');
    const line = (label, value, cls = '') => `<div class="flex justify-between ${cls}"><span>${label}</span><span>${value}</span></div>`;
    const partial = c.pct < 100;
    document.getElementById('prev-inv-totals').innerHTML =
        line(t('invSubtotal'), formatIDR(c.subtotal), 'text-gray-600') +
        (c.discount ? line(t('invDiscountLabel').replace(' (Rp)', ''), `- ${formatIDR(c.discount)}`, 'text-gray-600') : '') +
        (Number(d.taxPercent) ? line(`PPN ${Number(d.taxPercent)}%`, formatIDR(c.tax), 'text-gray-600') : '') +
        line(t('invGrandTotal'), formatIDR(c.total), `font-bold text-gray-900 ${partial ? '' : 'border-t pt-2 border-gray-200 text-base'}`) +
        (partial ? line(d.billLabel && /%/.test(d.billLabel) ? esc(d.billLabel) : `${esc(d.billLabel || t('invBilledNow'))} (${c.pct}%)`, formatIDR(c.billed), 'font-black text-base text-blue-600 border-t pt-2 border-gray-200') : '');
    document.getElementById('prev-inv-notes').innerText = d.notes || '';
    document.getElementById('inv-paid-stamp').classList.toggle('hidden', d.status !== 'PAID');
}

// ---------- EDITOR EVENTS ----------
function onInvoiceField() {
    const d = window.invoiceDraft;
    const val = id => document.getElementById(id).value;
    const oldDate = d.date;
    Object.assign(d, {
        number: val('inv-number').trim(),
        date: val('inv-date'),
        dueDate: val('inv-due-date'),
        client: val('inv-client-name'),
        clientAddress: val('inv-client-address'),
        discount: Number(val('inv-discount')) || 0,
        taxPercent: Number(val('inv-tax')) || 0,
        billPercent: Number(val('inv-bill-percent')) || 100,
        billLabel: val('inv-bill-label'),
        notes: val('inv-notes'),
        paidDate: val('inv-paid-date')
    });
    // New invoice: keep the number in step with the year of the invoice date.
    if (!d.id && oldDate && d.date && oldDate.slice(0, 4) !== d.date.slice(0, 4)) {
        d.number = nextInvoiceNumber(d.date);
        document.getElementById('inv-number').value = d.number;
    }
    window.invoiceDirty = true;
    renderInvoicePreview();
}

function onInvoiceStatusChange() {
    const d = window.invoiceDraft;
    d.status = document.getElementById('inv-status').value;
    if (d.status === 'PAID' && !d.paidDate) {
        d.paidDate = todayStr();
        document.getElementById('inv-paid-date').value = d.paidDate;
    }
    window.invoiceDirty = true;
    renderInvoicePreview();
}

function onInvoiceProjectChange() {
    const d = window.invoiceDraft;
    const p = projects.find(x => x.id === document.getElementById('inv-project').value);
    d.projectId = p ? p.id : '';
    if (p) {
        d.client = p.client;
        document.getElementById('inv-client-name').value = p.client;
        const emptyItems = d.items.every(it => !it.desc && !Number(it.price));
        if (emptyItems || !d.id) {
            d.items = [{ desc: `${p.category ? p.category + ': ' : ''}${p.title}`, qty: 1, price: Number(p.revenue || 0) }];
            renderInvoiceItemsEditor();
        }
    }
    window.invoiceDirty = true;
    renderInvoicePreview();
}

function onInvoiceItem(i, field, value) {
    const it = window.invoiceDraft.items[i];
    if (!it) return;
    it[field] = field === 'desc' ? value : Number(value) || 0;
    const totalEl = document.getElementById(`inv-item-total-${i}`);
    if (totalEl) totalEl.innerText = formatIDR(Number(it.qty || 0) * Number(it.price || 0));
    window.invoiceDirty = true;
    renderInvoicePreview();
}

function addInvoiceItem() {
    window.invoiceDraft.items.push({ desc: '', qty: 1, price: 0 });
    window.invoiceDirty = true;
    renderInvoiceItemsEditor();
    const last = document.getElementById(`inv-item-desc-${window.invoiceDraft.items.length - 1}`);
    if (last) last.focus();
}

function removeInvoiceItem(i) {
    if (window.invoiceDraft.items.length <= 1) return;
    window.invoiceDraft.items.splice(i, 1);
    window.invoiceDirty = true;
    renderInvoiceItemsEditor();
    renderInvoicePreview();
}

// ---------- ACTIONS ----------
function newInvoice(projectId) {
    window.invoiceDraft = blankInvoice(projectId);
    window.invoiceDirty = false;
    renderInvoices();
}

function newInvoiceForProject(projectId) {
    closeProjectDetail();
    switchTab('invoices');
    newInvoice(projectId);
}

function openInvoice(id) {
    const inv = invoices.find(x => x.id === id);
    if (!inv) return;
    closeProjectDetail();
    if (window.currentTab !== 'invoices') switchTab('invoices');
    window.invoiceDraft = JSON.parse(JSON.stringify(inv));
    window.invoiceDirty = false;
    renderInvoices();
}

function saveInvoice() {
    const d = window.invoiceDraft;
    onInvoiceField();
    if (!d.number) { showToast(t('toastInvNumberRequired')); return; }
    if (invoices.some(x => x.number === d.number && x.id !== d.id)) { showToast(t('toastInvNumberTaken', { number: d.number })); return; }
    if (!d.items.some(it => it.desc && Number(it.price))) { showToast(t('toastInvItemsRequired')); return; }
    const isNew = !d.id;
    if (isNew) d.id = `real_${Date.now()}`;
    const existing = invoices.find(x => x.id === d.id);
    const item = { ...(existing || {}), ...JSON.parse(JSON.stringify(d)) };
    item.items = item.items.filter(it => it.desc || Number(it.price));
    if (existing) invoices[invoices.indexOf(existing)] = item; else invoices.unshift(item);
    const becamePaid = item.status === 'PAID' && (!existing || existing.status !== 'PAID');
    saveItem('invoices', item, { action: becamePaid ? 'paid' : undefined });
    window.invoiceDraft = JSON.parse(JSON.stringify(item));
    window.invoiceDirty = false;
    showToast(t('toastInvSaved', { number: item.number }));
}

function printInvoice() {
    onInvoiceField();
    const prev = document.title;
    document.title = (window.invoiceDraft.number || 'invoice').replace(/\//g, '-');
    window.print();
    document.title = prev;
}

function deleteInvoice() {
    const d = window.invoiceDraft;
    if (!d || !d.id || !requireAdmin()) return;
    askConfirm({
        title: t('confirmTitleDelete'),
        message: t('confirmMsgDelete', { name: d.number }),
        button: t('delete'),
        onConfirm: () => {
            removeItem('invoices', d.id, { skipCheck: true });
            newInvoice();
        }
    });
}
