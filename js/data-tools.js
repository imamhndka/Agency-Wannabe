// JADI.in Hub — data-tools.js
// Backup export/import, demo data and full reset. Everything except export is admin-only.

const DEMO_SAMPLES = {
    projects: SAMPLE_DEMO_PROJECTS,
    freelancers: SAMPLE_DEMO_FREELANCERS,
    vendors: SAMPLE_DEMO_VENDORS,
    research: SAMPLE_DEMO_RESEARCH,
    quotes: SAMPLE_DEMO_QUOTES,
    tasks: SAMPLE_DEMO_TASKS,
    invoices: SAMPLE_DEMO_INVOICES
};
const LINK_FIELDS = ['projectId', 'partnerId'];

function exportData() {
    const backupData = { exportedAt: nowISO(), settings: window.settings };
    CLOUD_COLLECTIONS.forEach(col => { backupData[col] = window[col]; });
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const dlAnchor = document.createElement('a');
    dlAnchor.href = url;
    dlAnchor.download = `jadiin_backup_${todayStr()}.json`;
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    logActivity('export', 'backup', '', t('exportBtn'));
    showToast(t('toastBackupDownloaded'));
}

function importData(event) {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file || !requireAdmin()) return;
    const fileReader = new FileReader();
    fileReader.onload = function (e) {
        let parsed;
        try { parsed = JSON.parse(e.target.result); } catch (err) { showToast(t('toastImportInvalid')); return; }
        if (!parsed || !Array.isArray(parsed.projects)) { showToast(t('toastImportInvalid')); return; }
        askConfirm({
            title: t('confirmTitleImport'),
            message: t('confirmMsgImport', { file: file.name }),
            button: t('importBtn'),
            tone: 'warn',
            icon: 'fa-upload',
            onConfirm: () => {
                CLOUD_COLLECTIONS.forEach(col => { if (Array.isArray(parsed[col])) replaceCollection(col, parsed[col]); });
                if (parsed.settings) {
                    saveCompanySettings({ ...DEFAULT_SETTINGS, ...parsed.settings });
                    if (Array.isArray(parsed.settings.vendorCategories)) saveListSettings(parsed.settings.vendorCategories);
                }
                logActivity('import', 'backup', '', file.name);
                showToast(t('toastImportSuccess'));
            }
        });
    };
    fileReader.readAsText(file);
}

// ---------- DEMO DATA ----------
function generateDemoData() {
    if (!requireAdmin()) return;
    const stamp = Date.now();
    const idMap = {};
    Object.values(DEMO_SAMPLES).flat().forEach(item => { idMap[item.id] = `demo_${stamp}_${Math.random().toString(36).slice(2, 7)}`; });
    Object.entries(DEMO_SAMPLES).forEach(([col, samples]) => {
        const fresh = samples.map(sample => {
            const item = JSON.parse(JSON.stringify(sample));
            item.id = idMap[sample.id];
            item.isDummy = true;
            LINK_FIELDS.forEach(f => { if (item[f] && idMap[item[f]]) item[f] = idMap[item[f]]; });
            return item;
        });
        window[col] = [...fresh, ...window[col]];
        fresh.forEach(item => saveItem(col, item, { silent: true }));
    });
    logActivity('create', 'demo', '', t('btnGenerateDemo'));
    showToast(t('toastDemoAdded'));
}

function askClearDemoData() {
    if (!requireAdmin()) return;
    askConfirm({
        title: t('confirmTitleDemo'),
        message: t('confirmMsgDemo'),
        button: t('confirmBtnDemo'),
        tone: 'warn',
        icon: 'fa-broom',
        onConfirm: () => {
            CLOUD_COLLECTIONS.forEach(col => {
                window[col].filter(x => x.isDummy).map(x => x.id).forEach(id => removeItem(col, id, { skipCheck: true, silent: true }));
            });
            logActivity('delete', 'demo', '', t('btnClearDemo'));
            showToast(t('toastDemoCleared'));
        }
    });
}

function askResetAllData() {
    if (!requireAdmin()) return;
    askConfirm({
        title: t('confirmTitleReset'),
        message: t('confirmMsgReset'),
        button: t('confirmBtnReset'),
        tone: 'danger',
        icon: 'fa-trash-can',
        typeToConfirm: 'RESET',
        onConfirm: () => {
            CLOUD_COLLECTIONS.forEach(col => replaceCollection(col, col === 'pics' ? [...DEFAULT_PICS] : []));
            logActivity('reset', 'workspace', '', t('btnResetAll'));
            showToast(t('toastResetAll'));
        }
    });
}
