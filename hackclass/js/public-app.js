/* ============================================================
   public-app.js
   ------------------------------------------------------------
   Logika untuk index.html (HALAMAN PUBLIK) SAJA.
   File ini sengaja TIDAK berisi kode login/admin/tulis-data
   sama sekali, supaya tidak ada celah apa pun untuk mengubah
   data dari halaman publik walau lewat DevTools sekalipun —
   satu-satunya jalan menulis data ada di admin.html + Firestore
   Security Rules.
   ============================================================ */

import { initialAppState } from "./app-data.js";

const LOCAL_CACHE_KEY = "hackclass_public_cache";
const POLL_INTERVAL_MS = 15000; // cek data baru tiap 15 detik

// Cache lokal dipakai HANYA supaya konten langsung tampil instan
// sebelum data server datang (tidak dipakai untuk menulis apa pun).
let appState = JSON.parse(localStorage.getItem(LOCAL_CACHE_KEY) || "null") || initialAppState;
let lastRawState = null;

/** Ambil data dari server (api/state.php). Read-only, tidak butuh login. */
async function fetchState() {
    try {
        const res = await fetch('api/state.php', { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const raw = await res.text();
        if (raw === lastRawState) return; // data belum berubah, skip render ulang

        const data = JSON.parse(raw);
        if (data) {
            lastRawState = raw;
            appState = data;
            localStorage.setItem(LOCAL_CACHE_KEY, raw);
            renderAllSections();
        }
    } catch (err) {
        console.warn("Menampilkan data cache/lokal, gagal ambil dari server:", err.message);
    }
}

/* ---------------- PARTICLE CANVAS BACKGROUND ---------------- */
function initParticleCanvas() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const count = Math.min(Math.floor(width / 20), 60);

    for (let i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.8,
            vy: (Math.random() - 0.5) * 0.8,
            size: Math.random() * 2 + 1
        });
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        for (let i = 0; i < particles.length; i++) {
            let p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > width) p.vx *= -1;
            if (p.y < 0 || p.y > height) p.vy *= -1;

            ctx.fillStyle = '#00F0FF';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();

            for (let j = i + 1; j < particles.length; j++) {
                let p2 = particles[j];
                let dx = p.x - p2.x;
                let dy = p.y - p2.y;
                let dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) {
                    ctx.strokeStyle = `rgba(0, 240, 255, ${1 - dist / 120})`;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(animate);
    }
    animate();
}

/* ---------------------- RENDER FUNCTIONS --------------------- */
function renderHero() {
    document.getElementById('hero-school-name').textContent = appState.hero.schoolName;
    document.getElementById('hero-title-1').textContent = appState.hero.title1;
    document.getElementById('hero-title-2').textContent = appState.hero.title2;
    document.getElementById('hero-description').textContent = appState.hero.description;
    document.getElementById('hero-quote').textContent = `"${appState.hero.heroQuote}"`;
}

function renderMotivations() {
    const container = document.getElementById('motivation-cards-container');
    container.innerHTML = appState.motivations.map(m => `
        <div class="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-cyan-500/50 hover:shadow-neon-cyan transition duration-300 flex flex-col justify-between group">
            <div>
                <i class="fa-solid fa-quote-left text-cyan-400 text-2xl mb-3 block group-hover:scale-110 transition"></i>
                <p class="text-sm text-slate-200 leading-relaxed italic">"${escapeHtml(m.text)}"</p>
            </div>
            <div class="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono text-cyan-400">
                <span>— ${escapeHtml(m.author)}</span>
            </div>
        </div>
    `).join('');
}

function renderMembers() {
    const searchTerm = (document.getElementById('member-search-input')?.value || '').toLowerCase();

    const filterMember = (m) => {
        return m.name.toLowerCase().includes(searchTerm) ||
               m.role.toLowerCase().includes(searchTerm) ||
               m.nickname.toLowerCase().includes(searchTerm);
    };

    const wali = appState.members.filter(m => m.category === 'wali' && filterMember(m));
    const kaprodi = appState.members.filter(m => m.category === 'kaprodi' && filterMember(m));
    const guru = appState.members.filter(m => m.category === 'guru' && filterMember(m));
    const siswa = appState.members.filter(m => m.category === 'siswa' && filterMember(m));

    document.getElementById('wali-kelas-container').innerHTML = wali.map(m => `
        <div class="glass-panel p-8 rounded-3xl border border-cyan-500/30 flex flex-col md:flex-row items-center gap-8 shadow-neon-cyan">
            <img src="${m.photo}" alt="${escapeHtml(m.name)}" class="w-36 h-36 rounded-2xl object-cover border-2 border-cyan-400 shadow-lg">
            <div class="text-center md:text-left flex-1">
                <span class="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-xs font-bold border border-cyan-500/40 uppercase">
                    ${escapeHtml(m.role)}
                </span>
                <h4 class="text-2xl font-black text-white mt-3">${escapeHtml(m.name)}</h4>
                <p class="text-slate-300 text-sm italic mt-2">"${escapeHtml(m.quote)}"</p>
                <div class="mt-4 flex items-center justify-center md:justify-start gap-3">
                    <a href="${m.ig}" target="_blank" rel="noopener" class="w-9 h-9 rounded-xl bg-slate-800 hover:bg-cyan-500 hover:text-black flex items-center justify-center text-slate-300 transition">
                        <i class="fa-brands fa-instagram"></i>
                    </a>
                </div>
            </div>
        </div>
    `).join('') || `<p class="text-slate-500 text-xs font-mono">Tidak ada data ditemukan.</p>`;

    document.getElementById('kaprodi-container').innerHTML = kaprodi.map(m => `
        <div class="glass-panel p-8 rounded-3xl border border-purple-500/30 flex flex-col md:flex-row items-center gap-8 shadow-neon-purple">
            <img src="${m.photo}" alt="${escapeHtml(m.name)}" class="w-36 h-36 rounded-2xl object-cover border-2 border-purple-400 shadow-lg">
            <div class="text-center md:text-left flex-1">
                <span class="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 font-mono text-xs font-bold border border-purple-500/40 uppercase">
                    ${escapeHtml(m.role)}
                </span>
                <h4 class="text-2xl font-black text-white mt-3">${escapeHtml(m.name)}</h4>
                <p class="text-slate-300 text-sm italic mt-2">"${escapeHtml(m.quote)}"</p>
                <div class="mt-4 flex items-center justify-center md:justify-start gap-3">
                    <a href="${m.ig}" target="_blank" rel="noopener" class="w-9 h-9 rounded-xl bg-slate-800 hover:bg-purple-500 hover:text-white flex items-center justify-center text-slate-300 transition">
                        <i class="fa-brands fa-instagram"></i>
                    </a>
                </div>
            </div>
        </div>
    `).join('') || `<p class="text-slate-500 text-xs font-mono">Tidak ada data ditemukan.</p>`;

    document.getElementById('guru-container').innerHTML = guru.map(m => `
        <div class="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-emerald-500/40 transition duration-300 text-center">
            <img src="${m.photo}" alt="${escapeHtml(m.name)}" class="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-2 border-emerald-400">
            <h5 class="font-bold text-white text-base">${escapeHtml(m.name)}</h5>
            <p class="text-xs text-emerald-400 font-mono mt-1">${escapeHtml(m.role)}</p>
            <p class="text-xs text-slate-400 italic mt-3">"${escapeHtml(m.quote)}"</p>
        </div>
    `).join('') || `<p class="text-slate-500 text-xs font-mono col-span-3">Tidak ada data guru.</p>`;

    document.getElementById('siswa-container').innerHTML = siswa.map(m => `
        <div class="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-cyan-400/50 hover:shadow-neon-cyan transition duration-300 group flex flex-col justify-between">
            <div>
                <div class="relative overflow-hidden rounded-xl mb-4 aspect-square">
                    <img src="${m.photo}" alt="${escapeHtml(m.name)}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
                    <span class="absolute bottom-2 left-2 px-2 py-1 bg-black/80 backdrop-blur-md rounded text-[10px] font-mono text-cyan-400 border border-cyan-500/30">
                        ${escapeHtml(m.role || 'Siswa')}
                    </span>
                </div>
                <h5 class="font-bold text-white text-base leading-tight">${escapeHtml(m.name)}</h5>
                <p class="text-xs text-slate-400 font-mono">"${escapeHtml(m.nickname)}"</p>
                <p class="text-xs text-slate-300 italic mt-2">"${escapeHtml(m.quote)}"</p>
            </div>
            <div class="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <a href="${m.ig}" target="_blank" rel="noopener" class="text-slate-400 hover:text-cyan-400 text-sm transition">
                    <i class="fa-brands fa-instagram"></i>
                </a>
                <span class="text-[10px] font-mono text-slate-500">XII TKJ</span>
            </div>
        </div>
    `).join('') || `<p class="text-slate-500 text-xs font-mono col-span-4">Tidak ada anggota ditemukan.</p>`;
}

let selectedAlbum = 'All';

function renderGallery() {
    const albums = ['All', ...new Set(appState.photos.map(p => p.album))];

    document.getElementById('album-tabs-container').innerHTML = albums.map(a => `
        <button data-album="${escapeHtml(a)}" class="album-tab-btn px-4 py-2 rounded-xl transition ${selectedAlbum === a ? 'bg-purple-500 text-white font-bold shadow-neon-purple' : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-purple-400'}">
            ${escapeHtml(a)}
        </button>
    `).join('');

    document.querySelectorAll('.album-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedAlbum = btn.dataset.album;
            renderGallery();
        });
    });

    const filteredPhotos = selectedAlbum === 'All'
        ? appState.photos
        : appState.photos.filter(p => p.album === selectedAlbum);

    document.getElementById('gallery-container').innerHTML = filteredPhotos.map((p, idx) => `
        <div data-idx="${idx}" class="gallery-item glass-panel rounded-2xl overflow-hidden border border-slate-800 hover:border-purple-500/50 cursor-pointer group transition duration-300">
            <div class="relative overflow-hidden aspect-video">
                <img src="${p.url}" alt="${escapeHtml(p.caption)}" class="w-full h-full object-cover group-hover:scale-110 transition duration-500">
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-300 flex items-end p-4">
                    <div>
                        <span class="text-[10px] font-mono text-purple-300 bg-purple-900/60 px-2 py-0.5 rounded border border-purple-500/30">${escapeHtml(p.album)}</span>
                        <h5 class="text-white font-bold text-sm mt-1">${escapeHtml(p.caption)}</h5>
                        <p class="text-[10px] text-slate-400 font-mono">${p.date}</p>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.gallery-item').forEach(el => {
        el.addEventListener('click', () => openLightbox(parseInt(el.dataset.idx, 10), filteredPhotos));
    });
}

function renderDeveloper() {
    const dev = appState.developer;
    document.getElementById('behind-screen-container').innerHTML = `
        <div class="flex flex-col md:flex-row items-center gap-8 z-10 relative">
            <div class="w-32 h-32 rounded-2xl overflow-hidden border-2 border-cyan-400 shadow-neon-cyan shrink-0">
                <img src="${dev.photo}" alt="${escapeHtml(dev.name)}" class="w-full h-full object-cover">
            </div>
            <div class="text-center md:text-left flex-1">
                <span class="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-xs font-bold uppercase">
                    ${escapeHtml(dev.role)}
                </span>
                <h3 class="text-2xl font-black text-white mt-2">${escapeHtml(dev.name)}</h3>
                <p class="text-slate-300 text-sm mt-3 leading-relaxed font-light">
                    "${escapeHtml(dev.bio)}"
                </p>
                <div class="mt-4 flex items-center justify-center md:justify-start gap-3 text-lg">
                    <a href="${dev.ig}" target="_blank" rel="noopener" class="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-400 text-slate-300 hover:text-cyan-400 flex items-center justify-center transition">
                        <i class="fa-brands fa-instagram"></i>
                    </a>
                    <a href="${dev.github}" target="_blank" rel="noopener" class="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-400 text-slate-300 hover:text-cyan-400 flex items-center justify-center transition">
                        <i class="fa-brands fa-github"></i>
                    </a>
                </div>
            </div>
        </div>
    `;
}

function renderAllSections() {
    renderHero();
    renderMotivations();
    renderMembers();
    renderGallery();
    renderDeveloper();
}

function escapeHtml(str) {
    if (str === undefined || str === null) return '';
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

/* ------------------------- LIGHTBOX -------------------------- */
let currentPhotos = [];
let currentLightboxIndex = 0;

function openLightbox(idx, photosList) {
    currentPhotos = photosList;
    currentLightboxIndex = idx;
    const photo = currentPhotos[idx];
    document.getElementById('lightbox-img').src = photo.url;
    document.getElementById('lightbox-caption').textContent = photo.caption;
    document.getElementById('lightbox-date').textContent = `${photo.album} • ${photo.date}`;
    document.getElementById('lightbox-modal').classList.remove('hidden');
}

function closeLightbox() {
    document.getElementById('lightbox-modal').classList.add('hidden');
}

function prevLightbox() {
    currentLightboxIndex = (currentLightboxIndex - 1 + currentPhotos.length) % currentPhotos.length;
    openLightbox(currentLightboxIndex, currentPhotos);
}

function nextLightbox() {
    currentLightboxIndex = (currentLightboxIndex + 1) % currentPhotos.length;
    openLightbox(currentLightboxIndex, currentPhotos);
}

/* ------------------------- CATEGORY FILTER -------------------- */
function filterCategory(cat) {
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-cyan-500', 'text-black', 'font-bold');
        btn.classList.add('bg-slate-800', 'text-slate-300');
    });
    const selectedBtn = document.querySelector(`.cat-btn[data-cat="${cat}"]`);
    if (selectedBtn) selectedBtn.classList.add('active', 'bg-cyan-500', 'text-black', 'font-bold');

    const secWali = document.getElementById('section-wali-kelas');
    const secKaprodi = document.getElementById('section-kaprodi');
    const secGuru = document.getElementById('section-guru-produktif');
    const secSiswa = document.getElementById('section-siswa');
    const sections = { wali: secWali, kaprodi: secKaprodi, guru: secGuru, siswa: secSiswa };

    Object.entries(sections).forEach(([key, el]) => {
        if (cat === 'all' || cat === key) el.classList.remove('hidden');
        else el.classList.add('hidden');
    });
}

/* --------------------------- INIT ----------------------------- */
window.addEventListener('load', () => {
    // Loader bar
    const bar = document.getElementById('loader-bar');
    if (bar) bar.style.width = '100%';
    setTimeout(() => {
        const loader = document.getElementById('loader-screen');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.remove(), 700);
        }
    }, 800);

    initParticleCanvas();

    // Custom cursor
    const cursor = document.getElementById('custom-cursor');
    window.addEventListener('mousemove', (e) => {
        if (cursor) {
            cursor.style.left = `${e.clientX}px`;
            cursor.style.top = `${e.clientY}px`;
        }
    });

    // Mobile menu
    const toggleBtn = document.getElementById('mobile-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    toggleBtn?.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
    document.querySelectorAll('.mobile-nav-link').forEach(link => {
        link.addEventListener('click', () => mobileMenu.classList.add('hidden'));
    });

    // Category filter buttons
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.addEventListener('click', () => filterCategory(btn.dataset.cat));
    });

    // Member search
    document.getElementById('member-search-input')?.addEventListener('input', renderMembers);

    // Lightbox controls
    document.getElementById('lightbox-close')?.addEventListener('click', closeLightbox);
    document.getElementById('lightbox-prev')?.addEventListener('click', prevLightbox);
    document.getElementById('lightbox-next')?.addEventListener('click', nextLightbox);

    // First paint with cached/default data so the page never looks empty
    renderAllSections();

    // Ambil data terbaru dari server, lalu cek berkala supaya perubahan
    // dari admin.html ikut muncul tanpa perlu reload manual.
    fetchState();
    setInterval(fetchState, POLL_INTERVAL_MS);
});
