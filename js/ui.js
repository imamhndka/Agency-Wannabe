// JADI.in Hub — ui.js
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar.classList.contains('-translate-x-full')) {
        sidebar.classList.remove('-translate-x-full');
        overlay.classList.remove('hidden');
    } else {
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
    }
}


function refreshActiveUI() {
    populatePicDropdowns();
    renderDashboard();
    renderProjects();
    renderCalendar();
    renderPics();
    renderFreelancers();
    renderVendors();
    populateVendorCategoryOptions();
    renderResearch();
    renderSettings();
    renderInvoices();
    populateCalculatorVendorDropdown();
    renderProjectDetail();
    renderPartnerHistory();
    renderAttachmentsModal();
}


function setupCurrentDate() {
    document.getElementById('log-date').value = todayStr();
}

const APP_TABS = ['dashboard', 'projects', 'calendar', 'calculator', 'pics', 'freelancers', 'vendors', 'research', 'invoices', 'settings'];

function switchTab(tabId) {
    if (!APP_TABS.includes(tabId)) tabId = 'dashboard';
    window.currentTab = tabId;
    const tabs = APP_TABS;
    tabs.forEach(tName => {
        const el = document.getElementById(`tab-${tName}`);
        const nav = document.getElementById(`nav-${tName}`);
        if (tName === tabId) {
            el.classList.remove('hidden');
            if (nav) nav.classList.add('bg-slate-800', 'text-white');
        } else {
            el.classList.add('hidden');
            if (nav) nav.classList.remove('bg-slate-800', 'text-white');
        }
    });

    if (window.innerWidth < 768) {
        document.getElementById('sidebar').classList.add('-translate-x-full');
        document.getElementById('sidebar-overlay').classList.add('hidden');
    }

    if (location.hash !== `#${tabId}`) history.replaceState(null, '', `#${tabId}`);
    applyLanguage();
    refreshActiveUI();
}

function formatIDR(amount) {
    return new Intl.NumberFormat(currentLang === 'en' ? 'en-US' : 'id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-message').innerText = msg;
    toast.classList.remove('opacity-0', 'translate-x-8');
    clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(() => { toast.classList.add('opacity-0', 'translate-x-8'); }, 3000);
}

function toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle('dark');
    document.getElementById('theme-toggle-icon').className = isDark ? 'fa-solid fa-sun text-lg text-amber-400' : 'fa-solid fa-moon text-lg';
}

function getDemoBadgeHTML(isDummy) {
    if (!isDummy) return '';
    return `<span class="bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-black px-1.5 py-0.5 rounded border border-amber-500/30 mr-1.5 uppercase">${t('demoBadge')}</span>`;
}

function populatePicDropdowns() {
    const filterSelect = document.getElementById('project-filter-pic');
    const projPicSelect = document.getElementById('proj-pic');
    const logPicSelect = document.getElementById('log-pic');

    if (filterSelect) {
        const currentVal = filterSelect.value;
        filterSelect.innerHTML = `<option value="ALL">${t('allPics')}</option>`;
        pics.forEach(p => { filterSelect.innerHTML += `<option value="${esc(p.name)}">${esc(p.name)}</option>`; });
        if (currentVal) filterSelect.value = currentVal;
    }

    [projPicSelect, logPicSelect].forEach(select => {
        if (select) {
            const currentVal = select.value;
            select.innerHTML = '';
            pics.forEach(p => { select.innerHTML += `<option value="${esc(p.name)}">${esc(p.name)} (${esc(p.role || 'PIC')})</option>`; });
            if (currentVal) select.value = currentVal;
        }
    });
}

// ---------- CONFIRMATION DIALOG ----------
let pendingConfirm = null;
const CONFIRM_TONES = {
    danger: { icon: 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300', btn: 'bg-rose-600 hover:bg-rose-500' },
    warn: { icon: 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300', btn: 'bg-amber-600 hover:bg-amber-500' },
    info: { icon: 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300', btn: 'bg-blue-600 hover:bg-blue-500' }
};

// askConfirm({ title, message, button, tone: 'danger'|'warn'|'info', icon: 'fa-trash-can', typeToConfirm: 'RESET', onConfirm })
function askConfirm(opts) {
    const tone = CONFIRM_TONES[opts.tone || 'danger'];
    pendingConfirm = opts;
    const iconBox = document.getElementById('confirm-icon-container');
    iconBox.className = `w-14 h-14 rounded-full flex items-center justify-center mx-auto text-2xl ${tone.icon}`;
    iconBox.innerHTML = `<i class="fa-solid ${opts.icon || 'fa-trash-can'}"></i>`;
    document.getElementById('confirm-title').innerText = opts.title || '';
    document.getElementById('confirm-message').innerText = opts.message || '';
    const btn = document.getElementById('confirm-action-btn');
    btn.className = `px-5 py-2.5 text-sm font-bold text-white rounded-xl shadow-md transition disabled:opacity-40 ${tone.btn}`;
    btn.innerText = opts.button || t('execute');
    const typeBox = document.getElementById('confirm-type-box');
    const typeInput = document.getElementById('confirm-type-input');
    if (opts.typeToConfirm) {
        typeBox.classList.remove('hidden');
        document.getElementById('confirm-type-label').innerText = t('confirmTypeLabel', { word: opts.typeToConfirm });
        typeInput.value = '';
        btn.disabled = true;
        typeInput.oninput = () => { btn.disabled = typeInput.value.trim().toUpperCase() !== opts.typeToConfirm; };
    } else {
        typeBox.classList.add('hidden');
        btn.disabled = false;
    }
    document.getElementById('modal-confirm').classList.remove('hidden');
}

function closeConfirmModal() {
    document.getElementById('modal-confirm').classList.add('hidden');
    pendingConfirm = null;
}

function executeConfirmedAction() {
    const opts = pendingConfirm;
    if (!opts) return closeConfirmModal();
    if (opts.typeToConfirm && document.getElementById('confirm-type-input').value.trim().toUpperCase() !== opts.typeToConfirm) return;
    closeConfirmModal();
    if (typeof opts.onConfirm === 'function') opts.onConfirm();
}
