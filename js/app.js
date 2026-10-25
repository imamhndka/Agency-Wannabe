// JADI.in Hub — app.js
window.onload = function () {
    loadLocalData();
    setupCurrentDate();
    applyLanguage();
    const startTab = (location.hash || '').replace('#', '');
    if (startTab && startTab !== 'dashboard') switchTab(startTab); else refreshActiveUI();
    updateCalculator();
    initFirebaseOrFallback();
    registerServiceWorker();
};

// Close the top-most open dialog with Escape.
document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const order = ['modal-confirm', 'modal-attachments', 'modal-history', 'modal-daily-log', 'modal-project', 'modal-vendor', 'modal-freelancer', 'modal-pic', 'modal-research', 'modal-project-detail'];
    const open = order.find(id => { const el = document.getElementById(id); return el && !el.classList.contains('hidden'); });
    if (!open) return;
    const closers = { 'modal-confirm': closeConfirmModal, 'modal-attachments': closeAttachments, 'modal-history': closePartnerHistory, 'modal-daily-log': closeDailyLogModal, 'modal-project': closeProjectModal, 'modal-vendor': closeVendorModal, 'modal-freelancer': closeFreelancerModal, 'modal-pic': closePicModal, 'modal-research': closeResearchModal, 'modal-project-detail': closeProjectDetail };
    closers[open]();
});

// Installable app (PWA). Only on http(s); skipped when opening the file directly.
function registerServiceWorker() {
    if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
    navigator.serviceWorker.register('sw.js').catch(err => console.warn('Service worker not registered', err));
}
