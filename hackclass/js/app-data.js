/* ============================================================
   app-data.js
   ------------------------------------------------------------
   Data awal (default/fallback). Dipakai:
   - index.html  -> ditampilkan sementara jika Firestore belum
                    bisa diakses (offline / belum ada data cloud)
   - admin.html  -> jadi "benih" data pertama kali saat admin
                    login dan dokumen cloud belum pernah dibuat
   ============================================================ */

export const initialAppState = {
    hero: {
        schoolName: "SMK Muhammadiyah 1 Sumberrejo",
        title1: "HACKCLASS",
        title2: "XII TKJ MAHASA",
        description: "Tempat kami belajar, berkembang, berproses, dan menciptakan cerita yang akan selalu dikenang.",
        heroQuote: "Bukan tentang siapa yang paling hebat, tetapi tentang siapa yang terus belajar dan tidak berhenti melangkah."
    },
    motivations: [
        { id: 1, text: "Berproses hari ini, menjadi cerita indah esok hari.", author: "HACKCLASS Team" },
        { id: 2, text: "Jangan takut gagal, takutlah jika berhenti mencoba hal baru.", author: "TKJ Mahasa" },
        { id: 3, text: "Belajar bersama, tumbuh bersama, sukses meraih impian bersama.", author: "XII TKJ" },
        { id: 4, text: "Setiap baris kode dan konfigurasi jaringan adalah bagian dari masa depan.", author: "Future Engineer" }
    ],
    members: [
        {
            id: 'm1',
            name: 'Drs. H. Mulyono, M.Pd.',
            nickname: 'Pak Mul',
            category: 'wali',
            role: 'WALI KELAS XII TKJ',
            photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
            quote: 'Tetaplah rendah hati dan kuasai teknologi dengan bijaksana.',
            ig: 'https://instagram.com'
        },
        {
            id: 'm2',
            name: 'Ahmad Syaifuddin, S.T.',
            nickname: 'Pak Ahmad',
            category: 'kaprodi',
            role: 'KAPRODI TKJ',
            photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
            quote: 'Jaringan bukan hanya menghubungkan perangkat, tapi juga gagasan.',
            ig: 'https://instagram.com'
        },
        {
            id: 'm3',
            name: 'Rina Wijaya, S.Kom.',
            nickname: 'Bu Rina',
            category: 'guru',
            role: 'Guru Administrasi Server',
            photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=80',
            quote: 'Pahami logika dasar sebelum mengonfigurasi hal besar.',
            ig: 'https://instagram.com'
        },
        {
            id: 'm4',
            name: 'Budi Santoso, M.Kom.',
            nickname: 'Pak Budi',
            category: 'guru',
            role: 'Guru Jaringan Komputer',
            photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
            quote: 'Troubleshooting adalah seni menyelesaikan masalah.',
            ig: 'https://instagram.com'
        },
        {
            id: 'm5',
            name: 'Muhammad Rizky',
            nickname: 'Rizky',
            category: 'siswa',
            role: 'Ketua Kelas',
            photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&auto=format&fit=crop&q=80',
            quote: 'Keep learning, keep growing.',
            ig: 'https://instagram.com'
        },
        {
            id: 'm6',
            name: 'Siti Nurhaliza',
            nickname: 'Siti',
            category: 'siswa',
            role: 'Wakil Ketua Kelas',
            photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=80',
            quote: 'Kerja keras tidak akan pernah mengkhianati hasil.',
            ig: 'https://instagram.com'
        },
        {
            id: 'm7',
            name: 'Fajar Pratama',
            nickname: 'Fajar',
            category: 'siswa',
            role: 'Sekretaris',
            photo: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=500&auto=format&fit=crop&q=80',
            quote: 'Catat semua impian, wujudkan satu per satu.',
            ig: 'https://instagram.com'
        },
        {
            id: 'm8',
            name: 'Dewi Anjani',
            nickname: 'Dewi',
            category: 'siswa',
            role: 'Bendahara',
            photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
            quote: 'Disiplin adalah kunci utama kebebasan.',
            ig: 'https://instagram.com'
        }
    ],
    photos: [
        {
            id: 'p1',
            caption: 'Praktik Konfigurasi Server Debian',
            album: 'Praktik & Pembelajaran',
            date: '2025-10-14',
            url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80'
        },
        {
            id: 'p2',
            caption: 'Momen Kebersamaan Acara Classmeeting',
            album: 'Kebersamaan',
            date: '2025-12-20',
            url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&auto=format&fit=crop&q=80'
        },
        {
            id: 'p3',
            caption: 'Upacara Hari Pahlawan di Sekolah',
            album: 'Kegiatan Sekolah',
            date: '2025-11-10',
            url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&auto=format&fit=crop&q=80'
        },
        {
            id: 'p4',
            caption: 'Persiapan Ujian Kompetensi Keahlian (UKK)',
            album: 'Last Chapter',
            date: '2026-02-05',
            url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80'
        }
    ],
    developer: {
        name: "Admin Developer XII TKJ",
        role: "Web Developer & Network Administrator",
        bio: "Satu website, ratusan cerita, dan banyak kenangan yang tidak akan pernah terlupakan di SMK Muhammadiyah 1 Sumberrejo.",
        photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
        ig: "https://instagram.com",
        github: "https://github.com"
    }
};
