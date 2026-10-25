// JADI.in Hub — state.js
window.projects = [];
window.pics = [];
window.freelancers = [];
window.vendors = [];
window.research = [];
window.quotes = [];
window.tasks = [];
window.invoices = [];
window.members = [];
window.auditLog = [];
window.currentUser = null;
window.currentRole = null;
window.settings = { ...DEFAULT_SETTINGS };
window.currentTab = 'dashboard';
window.currentLang = 'id';
window.projectViewMode = 'table';
window.isCloudMode = false;
window.db = null;
window.currentCalDate = new Date();

let chartRevExp = null;
let chartCategory = null;


// ---------- CLOUD SYNC ----------
// Keys keep the old "3s_agency_" prefix so data already saved in browsers is not lost.
const STORAGE_PREFIX = '3s_agency_';
const CLOUD_COLLECTIONS = ['projects', 'pics', 'freelancers', 'vendors', 'research', 'quotes', 'tasks', 'invoices'];
window.cloudReady = {};

function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

// Newest first, using the timestamp inside ids like real_1729850000000 / demo_1729850000000_ab12.
function sortNewestFirst(items) {
    const ts = item => { const m = String(item.id || '').match(/(\d{13})/); return m ? Number(m[1]) : 0; };
    return items.map((item, i) => ({ item, i })).sort((a, b) => (ts(b.item) - ts(a.item)) || (a.i - b.i)).map(x => x.item);
}

function cacheLocal(colName) {
    localStorage.setItem(`${STORAGE_PREFIX}${colName}`, JSON.stringify(window[colName]));
}


function loadLocalData() {
    const read = key => { try { return JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}${key}`) || 'null'); } catch (e) { return null; } };
    CLOUD_COLLECTIONS.forEach(col => { const v = read(col); if (Array.isArray(v)) window[col] = v; });
    const s = read('settings');
    if (s) window.settings = { ...DEFAULT_SETTINGS, ...s };
    const lang = localStorage.getItem(`${STORAGE_PREFIX}lang`);
    if (lang) window.currentLang = lang;
    if (!read('pics')) {
        window.pics = [...DEFAULT_PICS];
        cacheLocal('pics');
    }
}
