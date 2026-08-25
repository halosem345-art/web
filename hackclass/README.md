# HACKCLASS XII TKJ MAHASA — Struktur Baru (Self-hosted, PHP + SQLite)

## Apa yang berubah?

**Versi paling awal:** form login admin tampil di halaman publik, dengan
username/password bahkan sudah *ter-isi otomatis* di HTML — siapa pun
tinggal "View Page Source" untuk melihatnya, dan login-nya cuma dicek di
JavaScript browser (gampang dilewati).

**Versi kedua** sempat pakai Firebase, tapi itu berarti kamu (developer)
wajib punya & login pakai akun Google buat ngatur Firebase Console — dan
kamu bilang mau pakai **server sendiri** tanpa akun Google. Jadi sekarang
diganti total:

- **Database → SQLite.** Satu file database (`api/data/hackclass.sqlite`),
  otomatis dibuat sendiri oleh PHP saat pertama kali dipakai. Tidak perlu
  install MySQL/PostgreSQL terpisah, tidak perlu daftar akun cloud apa pun
  — literally cuma 1 file di server kamu. Ini seringan-ringannya database
  yang masih "beneran" (bukan sekadar file teks tanpa struktur).
- **Login admin → PHP session + password buatan sendiri.** Username &
  password kamu tentukan sendiri lewat `api/install.php` (dijalankan
  sekali), disimpan ter-enkripsi (hash) di database. Tidak ada Google,
  tidak ada Firebase, tidak ada pihak ketiga sama sekali.
- **Upload foto → disimpan sebagai file asli** di folder `/uploads`
  (bukan base64 raksasa di database), jadi lebih ringan & rapi.

## Struktur folder

```
hackclass/
├── index.html            <- halaman publik (Home, Anggota, Memori, dll)
├── admin.html             <- panel admin, TERPISAH, butuh login sungguhan
├── css/
│   └── style.css          <- style bersama
├── js/
│   ├── app-data.js         <- data contoh/fallback
│   ├── public-app.js       <- logika index.html (HANYA BACA data, via fetch)
│   └── admin-app.js         <- logika admin.html (baca + tulis, via fetch)
├── api/                    <- backend PHP (jalan di server, bukan di browser)
│   ├── config.php           <- koneksi database + helper (jangan diakses langsung)
│   ├── install.php          <- JALANKAN SEKALI untuk bikin akun admin, lalu HAPUS
│   ├── login.php / logout.php / me.php  <- autentikasi
│   ├── state.php             <- GET (publik, baca) / POST (admin, tulis)
│   ├── upload.php             <- upload foto (admin-only)
│   ├── delete_upload.php      <- hapus file foto lama (admin-only)
│   └── data/                   <- isi otomatis: hackclass.sqlite (JANGAN dihapus)
└── uploads/                <- foto-foto yang diupload lewat admin panel
```

**Kenapa aman:**
- `index.html` sama sekali tidak memuat kode tulis-data — tidak ada celah
  mengubah data dari halaman publik walau lewat DevTools.
- Yang menentukan siapa boleh menulis bukan JavaScript di browser (yang
  selalu bisa dibaca/diubah siapa saja), tapi **PHP di server** —
  `api/state.php` mengecek session PHP + token CSRF sebelum mengizinkan
  siapa pun mengubah data. Ini baru keamanan yang sesungguhnya.
- Password admin disimpan ter-hash (bukan teks polos), dan ada penguncian
  otomatis 5 menit kalau 5x salah login berturut-turut (anti brute-force).

---

## Syarat server

Server/hosting kamu **wajib mendukung PHP** (minimal PHP 7.4, idealnya 8.x)
dengan ekstensi `pdo_sqlite` aktif — ini hampir selalu sudah aktif secara
default di hosting cPanel biasa. Kalau saat ini kamu masih testing pakai
VS Code Live Server, itu **tidak bisa** menjalankan PHP (cuma static file).
Untuk testing di laptop, pakai salah satu:
- **Laragon** atau **XAMPP** (Windows) — taruh folder `hackclass` di
  `www`/`htdocs`, lalu buka `http://localhost/hackclass/`.
- Atau kalau di laptop sudah ada PHP terinstall, jalankan dari dalam folder
  `hackclass`: `php -S localhost:8000` lalu buka `http://localhost:8000/`.

## Langkah setup (WAJIB, sekali saja)

### 1. Upload semua file ke server
Upload seluruh isi folder `hackclass/` (termasuk `api/`, `css/`, `js/`,
`uploads/`) ke hosting kamu, jangan cuma `index.html`.

### 2. Pastikan folder berikut bisa DITULIS oleh server (permission 755/775)
- `api/data/` — tempat file database SQLite otomatis dibuat.
- `uploads/` — tempat foto yang diupload admin disimpan.

Di cPanel, klik kanan folder → Permissions → set ke `755` (atau `775`
kalau `755` masih gagal menulis).

### 3. Buka `api/install.php` sekali lewat browser
Contoh: `https://situskamu.com/api/install.php`. Isi username & password
untuk akun admin kelas, submit. Kalau berhasil, akan muncul konfirmasi.

### 4. HAPUS file `api/install.php` dari server
Ini penting — setelah akun admin dibuat, file ini tidak diperlukan lagi
dan sebaiknya dihapus supaya tidak ada yang iseng membukanya lagi.

---

## Cara pakai

- **Publik:** buka `index.html` seperti biasa — tidak perlu login apa pun.
- **Admin:** buka `admin.html` langsung (bookmark saja URL-nya, jangan
  disebar), login pakai username & password dari langkah 3.

## Catatan tambahan

- **Lupa password admin?** Paling gampang: hapus file
  `api/data/hackclass.sqlite` (otomatis akan dibuat ulang kosong — TAPI ini
  juga menghapus semua data situs, jadi backup dulu kalau isinya sudah
  banyak!), lalu jalankan lagi `api/install.php`. Cara lebih aman: edit
  tabel `admins` di file `.sqlite` itu langsung pakai aplikasi gratis
  **DB Browser for SQLite** di laptop.
- **Lebih dari satu admin:** jalankan `api/install.php` lagi untuk
  menambah admin baru sebelum menghapusnya (script ini mengunci diri
  otomatis setelah 1x pakai — hapus dulu `api/data/installed.lock` kalau
  mau menjalankannya lagi).
- **Backup data:** cukup download 1 file `api/data/hackclass.sqlite`
  secara berkala lewat cPanel File Manager/FTP — itu sudah berisi SEMUA
  data situs (kecuali foto-foto di folder `uploads/`, backup itu juga).
- **HTTPS:** kalau situs sudah pakai HTTPS, buka `api/config.php`, cari
  baris `// 'secure' => true,` dan hapus tanda komentarnya, supaya cookie
  session lebih aman.
