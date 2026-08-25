/* ============================================================
   admin-app.js
   ------------------------------------------------------------
   Logika untuk admin.html SAJA. Semua baca/tulis data lewat API
   PHP sendiri (folder /api), bukan lagi Firebase. Login pakai
   username/password yang kamu buat sendiri lewat api/install.php
   (lihat README.md) — session-nya dijaga PHP di server, bukan di
   browser, jadi tidak bisa dilewati lewat DevTools.
   ============================================================ */

import { initialAppState } from "./app-data.js";

let appState = initialAppState;
let csrfToken = null;
let pollTimer = null;

/* ------------------------- API HELPERS -------------------------- */
async function api(path, options = {}) {
    const res = await fetch(path, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
            ...(options.headers || {})
        }
    });
    let data;
    try {
        data = await res.json();
    } catch {
        data = null;
    }
    if (!res.ok) {
        throw new Error((data && data.error) || `HTTP ${res.status}`);
    }
    return data;
}

async function fetchStateFromServer() {
    const res = await fetch('api/state.php', { cache: 'no-store' });
    if (!res.ok) throw new Error('Gagal mengambil data dari server.');
    return await res.json();
}

async function persist() {
    try {
        await api('api/state.php', { method: 'POST', body: JSON.stringify(appState) });
    } catch (err) {
        console.error("Gagal menyimpan:", err);
        alert('Gagal menyimpan ke server: ' + err.message);
        throw err;
    }
}

/* ------------------------- AUTH FLOW --------------------------- */
const loginView = document.getElementById('admin-login-view');
const dashboardView = document.getElementById('admin-dashboard-view');
const loginError = document.getElementById('login-error');
const loginForm = document.getElementById('admin-login-form');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.classList.add('hidden');
    const username = document.getElementById('admin-username').value.trim();
    const password = document.getElementById('admin-pass').value;
    const submitBtn = loginForm.querySelector('button[type="submit"]');

    submitBtn.disabled = true;
    submitBtn.textContent = 'MEMPROSES...';

    try {
        const data = await api('api/login.php', { method: 'POST', body: JSON.stringify({ username, password }) });
        csrfToken = data.csrfToken;
        await enterDashboard();
    } catch (err) {
        loginError.textContent = err.message || 'Login gagal.';
        loginError.classList.remove('hidden');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'LOGIN CONTROL PANEL';
    }
});

document.getElementById('logout-btn').addEventListener('click', async () => {
    try { await api('api/logout.php', { method: 'POST' }); } catch { /* abaikan */ }
    csrfToken = null;
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    loginView.classList.remove('hidden');
    dashboardView.classList.add('hidden');
    loginForm.reset();
});

async function enterDashboard() {
    loginView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    try {
        const data = await fetchStateFromServer();
        appState = data || initialAppState;
        renderAllAdminSections();
    } catch (err) {
        alert('Gagal membaca data dari server: ' + err.message);
    }
    if (!pollTimer) {
        pollTimer = setInterval(async () => {
            try {
                const data = await fetchStateFromServer();
                if (data) { appState = data; renderAllAdminSections(); }
            } catch { /* diamkan, coba lagi di interval berikutnya */ }
        }, 20000);
    }
}

// Cek status login saat halaman dibuka (misal admin belum logout dari sesi lalu)
(async function initSession() {
    try {
        const data = await api('api/me.php');
        if (data.loggedIn) {
            csrfToken = data.csrfToken;
            await enterDashboard();
        }
    } catch {
        // belum login, biarkan tampil form login
    }
})();

/* ------------------------- TAB SWITCH -------------------------- */
document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.admin-content-tab').forEach(t => t.classList.add('hidden'));
        document.querySelectorAll('.admin-tab-btn').forEach(b => {
            b.classList.remove('bg-cyan-500/10', 'text-cyan-400', 'font-semibold');
            b.classList.add('text-slate-400');
        });
        document.getElementById(btn.dataset.tab).classList.remove('hidden');
        btn.classList.add('bg-cyan-500/10', 'text-cyan-400', 'font-semibold');
    });
});

/* ---------------------- IMAGE RESIZE + UPLOAD ------------------------ */
/** Resize gambar di browser dulu (hemat bandwidth), lalu hasilkan Blob JPEG. */
function resizeImageToBlob(file, maxWidth = 1000, quality = 0.82) {
    return new Promise((resolve, reject) => {
        if (!file) { resolve(null); return; }
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                canvas.width = width;
                canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/** Upload Blob ke api/upload.php, balikin path relatif ("uploads/xxx.jpg"). */
async function uploadPhotoBlob(blob) {
    const formData = new FormData();
    formData.append('photo', blob, 'photo.jpg');
    const res = await fetch('api/upload.php', {
        method: 'POST',
        headers: { 'X-CSRF-Token': csrfToken },
        body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload gagal.');
    return data.url;
}

/** Kalau field file diisi: resize + upload, balikin URL baru.
 *  Kalau tidak diisi: balikin fallbackUrl (URL manual/lama) apa adanya. */
async function resolvePhotoUrl(fileInputEl, fallbackUrl) {
    if (fileInputEl?.files?.[0]) {
        const blob = await resizeImageToBlob(fileInputEl.files[0]);
        if (blob) return await uploadPhotoBlob(blob);
    }
    return fallbackUrl;
}

/** Best-effort hapus file lama di server (tidak menggagalkan proses utama kalau error). */
async function tryDeleteUploadedFile(url) {
    if (!url || !url.startsWith('uploads/')) return; // hanya file lokal, bukan URL luar
    try {
        await api('api/delete_upload.php', { method: 'POST', body: JSON.stringify({ path: url }) });
    } catch { /* abaikan */ }
}

/* --------------------------- HERO TAB ---------------------------- */
function renderHeroTab() {
    document.getElementById('edit-school-name').value = appState.hero.schoolName;
    document.getElementById('edit-title-1').value = appState.hero.title1;
    document.getElementById('edit-title-2').value = appState.hero.title2;
    document.getElementById('edit-description').value = appState.hero.description;
    document.getElementById('edit-hero-quote').value = appState.hero.heroQuote;
}

document.getElementById('save-hero-btn').addEventListener('click', async () => {
    appState.hero.schoolName = document.getElementById('edit-school-name').value;
    appState.hero.title1 = document.getElementById('edit-title-1').value;
    appState.hero.title2 = document.getElementById('edit-title-2').value;
    appState.hero.description = document.getElementById('edit-description').value;
    appState.hero.heroQuote = document.getElementById('edit-hero-quote').value;
    await persist();
    alert('Pengaturan Hero berhasil disimpan!');
});

/* -------------------------- QUOTES TAB ---------------------------- */
function renderQuotesTab() {
    const container = document.getElementById('admin-quotes-list');
    container.innerHTML = appState.motivations.map((m, idx) => `
        <div class="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs font-mono gap-3">
            <span class="text-slate-300 truncate">"${m.text}"</span>
            <button data-idx="${idx}" class="delete-quote-btn text-red-400 hover:text-red-300 shrink-0">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>
    `).join('');
    container.querySelectorAll('.delete-quote-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            appState.motivations.splice(parseInt(btn.dataset.idx, 10), 1);
            await persist();
        });
    });
}

document.getElementById('add-quote-btn').addEventListener('click', async () => {
    const text = prompt('Masukkan Kata Motivasi Baru:');
    if (text) {
        appState.motivations.push({ id: Date.now(), text, author: 'HACKCLASS' });
        await persist();
    }
});

/* -------------------------- MEMBERS TAB ---------------------------- */
const memberForm = document.getElementById('member-form-container');

function renderMembersTab() {
    const tbody = document.getElementById('admin-members-table-body');
    tbody.innerHTML = appState.members.map(m => `
        <tr>
            <td class="py-2.5 font-bold">${m.name}</td>
            <td class="py-2.5 uppercase text-cyan-400">${m.category}</td>
            <td class="py-2.5 text-slate-400">${m.role}</td>
            <td class="py-2.5 text-right space-x-2">
                <button data-id="${m.id}" class="edit-member-btn text-cyan-400 hover:underline">Edit</button>
                <button data-id="${m.id}" class="delete-member-btn text-red-400 hover:underline">Hapus</button>
            </td>
        </tr>
    `).join('');

    tbody.querySelectorAll('.edit-member-btn').forEach(btn => {
        btn.addEventListener('click', () => editMember(btn.dataset.id));
    });
    tbody.querySelectorAll('.delete-member-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteMember(btn.dataset.id));
    });
}

document.getElementById('add-member-btn').addEventListener('click', () => {
    memberForm.classList.remove('hidden');
    document.getElementById('member-form-title').textContent = 'Tambah Anggota Baru';
    document.getElementById('member-form-id').value = '';
    document.getElementById('m-name').value = '';
    document.getElementById('m-nickname').value = '';
    document.getElementById('m-category').value = 'siswa';
    document.getElementById('m-role').value = '';
    document.getElementById('m-photo').value = '';
    document.getElementById('m-quote').value = '';
    document.getElementById('m-ig').value = '';
    const fileInput = document.getElementById('m-photo-file');
    if (fileInput) fileInput.value = '';
});

document.getElementById('cancel-member-btn').addEventListener('click', () => {
    memberForm.classList.add('hidden');
});

document.getElementById('save-member-btn').addEventListener('click', async () => {
    const saveBtn = document.getElementById('save-member-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'MENYIMPAN...';
    try {
        const id = document.getElementById('member-form-id').value || 'm_' + Date.now();
        const fileInput = document.getElementById('m-photo-file');
        const urlField = document.getElementById('m-photo').value;
        const photoUrl = await resolvePhotoUrl(fileInput, urlField) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500';

        const memberObj = {
            id,
            name: document.getElementById('m-name').value,
            nickname: document.getElementById('m-nickname').value,
            category: document.getElementById('m-category').value,
            role: document.getElementById('m-role').value,
            photo: photoUrl,
            quote: document.getElementById('m-quote').value,
            ig: document.getElementById('m-ig').value || 'https://instagram.com'
        };

        const existingIdx = appState.members.findIndex(m => m.id === id);
        if (existingIdx > -1) appState.members[existingIdx] = memberObj;
        else appState.members.push(memberObj);

        await persist();
        memberForm.classList.add('hidden');
    } catch (err) {
        alert('Gagal menyimpan anggota: ' + err.message);
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'SIMPAN';
    }
});

function editMember(id) {
    const m = appState.members.find(x => x.id === id);
    if (!m) return;
    memberForm.classList.remove('hidden');
    document.getElementById('member-form-title').textContent = 'Edit Anggota';
    document.getElementById('member-form-id').value = m.id;
    document.getElementById('m-name').value = m.name;
    document.getElementById('m-nickname').value = m.nickname;
    document.getElementById('m-category').value = m.category;
    document.getElementById('m-role').value = m.role;
    document.getElementById('m-photo').value = m.photo;
    document.getElementById('m-quote').value = m.quote;
    document.getElementById('m-ig').value = m.ig;
}

async function deleteMember(id) {
    if (!confirm('Yakin hapus anggota ini?')) return;
    const m = appState.members.find(x => x.id === id);
    appState.members = appState.members.filter(x => x.id !== id);
    await persist();
    if (m) tryDeleteUploadedFile(m.photo);
}

/* -------------------------- PHOTOS TAB ---------------------------- */
const photoForm = document.getElementById('photo-form-container');

function renderPhotosTab() {
    const grid = document.getElementById('admin-photos-grid');
    grid.innerHTML = appState.photos.map(p => `
        <div class="relative bg-slate-950 rounded-xl overflow-hidden border border-slate-800 group">
            <img src="${p.url}" class="w-full h-24 object-cover">
            <button data-id="${p.id}" class="delete-photo-btn absolute top-1 right-1 bg-red-600 text-white p-1 rounded-md text-xs">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>
    `).join('');
    grid.querySelectorAll('.delete-photo-btn').forEach(btn => {
        btn.addEventListener('click', () => deletePhoto(btn.dataset.id));
    });
}

document.getElementById('add-photo-btn').addEventListener('click', () => {
    photoForm.classList.remove('hidden');
    document.getElementById('p-caption').value = '';
    document.getElementById('p-url').value = '';
    document.getElementById('p-album').value = 'Praktik & Pembelajaran';
    document.getElementById('p-date').value = '';
    const fileInput = document.getElementById('p-file');
    if (fileInput) fileInput.value = '';
});

document.getElementById('cancel-photo-btn').addEventListener('click', () => {
    photoForm.classList.add('hidden');
});

document.getElementById('save-photo-btn').addEventListener('click', async () => {
    const saveBtn = document.getElementById('save-photo-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'MENYIMPAN...';
    try {
        const fileInput = document.getElementById('p-file');
        const urlField = document.getElementById('p-url').value;
        const photoUrl = await resolvePhotoUrl(fileInput, urlField);

        if (!photoUrl) {
            alert('Silakan pilih foto dari galeri HP/Laptop Anda atau masukkan URL foto!');
            return;
        }

        const photoObj = {
            id: 'p_' + Date.now(),
            caption: document.getElementById('p-caption').value,
            url: photoUrl,
            album: document.getElementById('p-album').value,
            date: document.getElementById('p-date').value || new Date().toISOString().split('T')[0]
        };
        appState.photos.push(photoObj);
        await persist();
        photoForm.classList.add('hidden');
    } catch (err) {
        alert('Gagal menyimpan foto: ' + err.message);
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'SIMPAN FOTO';
    }
});

async function deletePhoto(id) {
    if (!confirm('Yakin hapus foto ini?')) return;
    const p = appState.photos.find(x => x.id === id);
    appState.photos = appState.photos.filter(x => x.id !== id);
    await persist();
    if (p) tryDeleteUploadedFile(p.url);
}

/* -------------------------- DEV INFO TAB ---------------------------- */
function renderDevTab() {
    const dev = appState.developer;
    document.getElementById('edit-dev-name').value = dev.name;
    document.getElementById('edit-dev-role').value = dev.role;
    document.getElementById('edit-dev-bio').value = dev.bio;
    document.getElementById('edit-dev-photo').value = dev.photo;
}

document.getElementById('save-dev-btn').addEventListener('click', async () => {
    const saveBtn = document.getElementById('save-dev-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'MENYIMPAN...';
    try {
        const fileInput = document.getElementById('edit-dev-photo-file');
        const urlField = document.getElementById('edit-dev-photo').value;
        const photoUrl = await resolvePhotoUrl(fileInput, urlField) || appState.developer.photo;

        appState.developer.name = document.getElementById('edit-dev-name').value;
        appState.developer.role = document.getElementById('edit-dev-role').value;
        appState.developer.bio = document.getElementById('edit-dev-bio').value;
        appState.developer.photo = photoUrl;
        await persist();
        alert('Profil Developer berhasil disimpan!');
    } catch (err) {
        alert('Gagal menyimpan profil developer: ' + err.message);
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'SIMPAN PROFIL DEVELOPER';
    }
});

/* --------------------------- RENDER ALL ------------------------------ */
function renderAllAdminSections() {
    renderHeroTab();
    renderQuotesTab();
    renderMembersTab();
    renderPhotosTab();
    renderDevTab();
}
