// JADI.in Hub — sync.js
// Firebase login, role (admin / member), realtime sync of every collection, and the activity log.

function setSyncBadge(state) {
    const badge = document.getElementById('sync-badge');
    const syncText = document.getElementById('sync-text');
    if (!badge || !syncText) return;
    const base = 'hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold border ';
    const styles = {
        synced: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300',
        offline: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300',
        error: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
    };
    window.syncState = state;
    badge.className = base + styles[state];
    syncText.innerText = t({ synced: 'syncSynced', offline: 'syncOffline', error: 'syncError' }[state]);
    const dot = document.getElementById('sync-dot');
    if (dot) dot.className = `w-2 h-2 rounded-full ${{ synced: 'bg-emerald-500', offline: 'bg-blue-500', error: 'bg-rose-500 animate-pulse' }[state]}`;
    // Mobile shows the design's cloud icon instead of the dot + text.
    const icon = document.getElementById('sync-icon');
    if (icon) icon.className = `ph-bold ${{ synced: 'ph-cloud-check text-emerald-600', offline: 'ph-cloud-slash text-rose-600', error: 'ph-cloud-warning text-rose-600' }[state]}`;
}

window.cloudUnsubs = [];

function initFirebaseOrFallback() {
    if (typeof firebase === 'undefined' || !firebaseConfig.apiKey || !firebase.auth) {
        enableLocalMode();
        return;
    }

    try {
        if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
        window.db = firebase.firestore();
        window.auth = firebase.auth();
        window.auth.getRedirectResult().catch(showAuthError);
        window.auth.onAuthStateChanged(user => {
            if (user) {
                window.currentUser = { email: String(user.email || '').toLowerCase(), name: user.displayName || user.email || '' };
                showSignedIn(user);
                resolveRoleThenSync();
            } else {
                window.currentUser = null;
                stopCloudSync();
                setRole(null);
                showSignedOut();
            }
        });
    } catch (err) {
        console.error('Firebase init error', err);
        enableLocalMode();
    }
}

// ---------- ROLE ----------
// members/{email} = { email, role: 'admin' | 'member' }. The owner listed in firestore.rules is always admin;
// the first time the owner signs in, their own member document is created automatically.
async function resolveRoleThenSync() {
    const email = window.currentUser.email;
    const ref = window.db.collection('members').doc(email);
    try {
        const doc = await ref.get();
        if (doc.exists) {
            setRole(doc.data().role === 'admin' ? 'admin' : 'member');
        } else {
            await ref.set({ email, role: 'admin', addedBy: email, addedAt: new Date().toISOString() });
            setRole('admin');
        }
        startCloudSync();
    } catch (err) {
        denyAccess(err);
    }
}

function setRole(role) {
    window.currentRole = role;
    document.body.dataset.role = role || '';
    const label = document.getElementById('user-role');
    if (label) label.innerText = role ? t(role === 'admin' ? 'roleAdmin' : 'roleMember') : '';
}

function isAdmin() {
    return window.currentRole === 'admin';
}

// Guard for admin-only actions (the Firestore rules enforce the same on the server).
function requireAdmin() {
    if (isAdmin()) return true;
    showToast(t('toastAdminOnly'));
    return false;
}

function denyAccess(err) {
    console.error('Access error', err);
    if (err && err.code && err.code !== 'permission-denied') {
        window.isCloudMode = false;
        setSyncBadge('error');
        return;
    }
    const email = window.currentUser ? window.currentUser.email : '';
    stopCloudSync();
    setRole(null);
    clearLocalCache();
    showSignedOut(t('authDenied', { email }));
}

// ---------- REALTIME SYNC ----------
function startCloudSync() {
    if (window.cloudUnsubs.length) return;
    window.isCloudMode = true;

    CLOUD_COLLECTIONS.forEach(colName => {
        const unsub = window.db.collection(colName).onSnapshot((snapshot) => {
            const migratedKey = `${STORAGE_PREFIX}cloud_synced_${colName}`;
            if (!window.cloudReady[colName]) {
                window.cloudReady[colName] = true;
                // First time this browser meets an empty cloud collection: upload what it has locally
                // instead of wiping it. After that, the cloud is the single source of truth.
                if (snapshot.empty && window[colName].length && !localStorage.getItem(migratedKey)) {
                    localStorage.setItem(migratedKey, '1');
                    uploadCollection(colName, window[colName]);
                    return;
                }
            }
            localStorage.setItem(migratedKey, '1');
            window[colName] = sortNewestFirst(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
            cacheLocal(colName);
            scheduleRefresh();
            setSyncBadge('synced');
        }, onCloudReadError);
        window.cloudUnsubs.push(unsub);
    });

    // Company identity: only admins can write it.
    window.cloudUnsubs.push(window.db.collection('settings').doc('company').onSnapshot((doc) => {
        if (doc.exists) {
            const { vendorCategories, ...company } = doc.data();
            window.settings = { ...window.settings, ...company };
            if (vendorCategories && !window.listsLoaded) window.settings.vendorCategories = vendorCategories;
            cacheSettings();
            scheduleRefresh();
        } else if (isAdmin()) {
            saveCompanySettings(window.settings);
        }
    }, onCloudReadError));

    // Shared lists (vendor categories): every member can write.
    window.cloudUnsubs.push(window.db.collection('settings').doc('lists').onSnapshot((doc) => {
        if (doc.exists) {
            window.listsLoaded = true;
            window.settings = { ...window.settings, vendorCategories: doc.data().vendorCategories || DEFAULT_VENDOR_CATEGORIES };
            cacheSettings();
            scheduleRefresh();
        } else {
            saveListSettings(window.settings.vendorCategories || DEFAULT_VENDOR_CATEGORIES);
        }
    }, onCloudReadError));

    // Team members (for the admin page) and our own role changes.
    window.cloudUnsubs.push(window.db.collection('members').onSnapshot((snapshot) => {
        window.members = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        const me = window.members.find(m => m.id === window.currentUser.email);
        if (!me) { denyAccess({ code: 'permission-denied' }); return; }
        setRole(me.role === 'admin' ? 'admin' : 'member');
        scheduleRefresh();
    }, onCloudReadError));

    // Latest activity.
    window.cloudUnsubs.push(window.db.collection('auditLog').orderBy('at', 'desc').limit(60).onSnapshot((snapshot) => {
        window.auditLog = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        scheduleRefresh();
    }, err => console.error('Activity log error', err)));
}

// Many snapshots arrive at once on start-up; render once per animation frame instead of once per snapshot.
let refreshQueued = false;
function scheduleRefresh() {
    if (refreshQueued) return;
    refreshQueued = true;
    requestAnimationFrame(() => { refreshQueued = false; refreshActiveUI(); });
}

function stopCloudSync() {
    window.cloudUnsubs.forEach(unsub => { try { unsub(); } catch (e) {} });
    window.cloudUnsubs = [];
    window.cloudReady = {};
    window.listsLoaded = false;
    window.isCloudMode = false;
}

function onCloudReadError(err) {
    console.error('Sync error', err);
    if (err && err.code === 'permission-denied') {
        denyAccess(err);
        return;
    }
    window.isCloudMode = false;
    setSyncBadge('error');
}

// ---------- LOGIN ----------
function signInWithGoogle() {
    if (!window.auth) return;
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    document.getElementById('auth-error').classList.add('hidden');
    window.auth.signInWithPopup(provider).catch(err => {
        if (err && (err.code === 'auth/popup-blocked' || err.code === 'auth/operation-not-supported-in-this-environment')) {
            return window.auth.signInWithRedirect(provider);
        }
        showAuthError(err);
    });
}

function clearLocalCache() {
    [...CLOUD_COLLECTIONS, 'settings'].forEach(col => localStorage.removeItem(`${STORAGE_PREFIX}${col}`));
    CLOUD_COLLECTIONS.forEach(col => { window[col] = []; });
    window.members = [];
    window.auditLog = [];
    window.settings = { ...DEFAULT_SETTINGS };
    refreshActiveUI();
}

function signOutUser() {
    stopCloudSync();
    // Clear this browser's cached copy so the next person on this device does not see it.
    clearLocalCache();
    setRole(null);
    if (window.auth) window.auth.signOut();
    else showSignedOut();
}

function showAuthError(err) {
    if (!err || err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') return;
    console.error('Auth error', err);
    const map = {
        'auth/operation-not-allowed': 'authErrNotEnabled',
        'auth/configuration-not-found': 'authErrNotEnabled',
        'auth/unauthorized-domain': 'authErrDomain'
    };
    const box = document.getElementById('auth-error');
    box.innerText = t(map[err.code] || 'authErrGeneric', { domain: location.hostname, code: err.code || '' });
    box.classList.remove('hidden');
}

function showSignedIn(user) {
    document.getElementById('auth-screen').classList.add('hidden');
    const box = document.getElementById('user-box');
    box.classList.remove('hidden');
    box.classList.add('flex');
    document.getElementById('user-email').innerText = user.email || '';
    const initials = String(user.displayName || user.email || '?').split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
    document.getElementById('user-avatar').innerText = initials || '?';
}

function showSignedOut(message) {
    document.getElementById('auth-screen').classList.remove('hidden');
    const box = document.getElementById('user-box');
    box.classList.add('hidden');
    box.classList.remove('flex');
    const err = document.getElementById('auth-error');
    const switchBtn = document.getElementById('auth-switch-btn');
    if (message) {
        err.innerText = message;
        err.classList.remove('hidden');
        switchBtn.classList.remove('hidden');
    } else {
        err.classList.add('hidden');
        switchBtn.classList.add('hidden');
    }
    setSyncBadge('offline');
}

// Without Firebase (e.g. offline file) the app runs on this browser only, with full rights.
function enableLocalMode() {
    window.isCloudMode = false;
    window.currentUser = window.currentUser || { email: 'local', name: 'Local' };
    setRole('admin');
    setSyncBadge('offline');
    refreshActiveUI();
}

function onCloudWriteError(err) {
    console.error('Cloud write failed', err);
    setSyncBadge('error');
    if (err && err.code === 'permission-denied') showToast(t('toastNoPermission'));
}

// ---------- WRITES ----------
function nowISO() { return new Date().toISOString(); }
function myEmail() { return window.currentUser ? window.currentUser.email : ''; }

function itemLabel(item) {
    if (!item) return '';
    return item.title || item.name || item.number || item.client || item.need || item.id;
}

// Stamp who created / last changed an item.
function stampItem(item) {
    const by = myEmail();
    if (!item.createdAt) { item.createdAt = nowISO(); item.createdBy = by; }
    item.updatedAt = nowISO();
    item.updatedBy = by;
    return item;
}

function logActivity(action, colName, docId, label, extra = {}) {
    if (!window.isCloudMode || !window.db) return;
    const entry = { action, col: colName, docId: docId || '', label: String(label || '').slice(0, 140), by: myEmail(), at: nowISO(), ...extra };
    const id = `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    window.db.collection('auditLog').doc(id).set(entry).catch(err => console.error('Activity log write failed', err));
}

function saveItem(colName, item, opts = {}) {
    const isNew = !item.createdAt;
    stampItem(item);
    cacheLocal(colName);
    scheduleRefresh();
    if (window.isCloudMode && window.db) {
        window.db.collection(colName).doc(item.id).set(item, { merge: true }).catch(onCloudWriteError);
    }
    if (!opts.silent) logActivity(opts.action || (isNew ? 'create' : 'update'), colName, item.id, itemLabel(item));
}

// Removes an item locally and in the cloud. Deleting is admin-only.
function removeItem(colName, itemId, opts = {}) {
    if (!opts.skipCheck && !requireAdmin()) return false;
    const item = (window[colName] || []).find(x => x.id === itemId);
    window[colName] = (window[colName] || []).filter(x => x.id !== itemId);
    deleteItem(colName, itemId);
    if (!opts.silent) logActivity('delete', colName, itemId, itemLabel(item));
    return true;
}

function deleteItem(colName, itemId) {
    cacheLocal(colName);
    scheduleRefresh();
    if (window.isCloudMode && window.db) {
        window.db.collection(colName).doc(itemId).delete().catch(onCloudWriteError);
    }
}

// Write many docs (and optionally delete others) in batches of up to 400 operations.
async function uploadCollection(colName, items, idsToDelete = []) {
    if (!window.isCloudMode || !window.db) return;
    const ops = [
        ...idsToDelete.map(id => batch => batch.delete(window.db.collection(colName).doc(id))),
        ...items.map(item => batch => batch.set(window.db.collection(colName).doc(item.id), item))
    ];
    try {
        for (let i = 0; i < ops.length; i += 400) {
            const batch = window.db.batch();
            ops.slice(i, i + 400).forEach(op => op(batch));
            await batch.commit();
        }
    } catch (err) {
        onCloudWriteError(err);
    }
}

// Replace a whole collection (used by Import and Reset) both locally and in the cloud.
async function replaceCollection(colName, items) {
    window[colName] = items;
    cacheLocal(colName);
    scheduleRefresh();
    if (!window.isCloudMode || !window.db) return;
    try {
        const keep = new Set(items.map(item => item.id));
        const existing = await window.db.collection(colName).get();
        const toDelete = existing.docs.map(doc => doc.id).filter(id => !keep.has(id));
        await uploadCollection(colName, items, toDelete);
    } catch (err) {
        onCloudWriteError(err);
    }
}
