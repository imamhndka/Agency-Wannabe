# JADI.in Hub

Aplikasi internal JADI.in Digital Partner untuk mengelola proyek, vendor, freelancer, riset, dan invoice dalam satu tempat. Data tersimpan di Firebase Firestore dan tersinkron realtime ke semua anggota tim.

Live: https://agency-wannabe.vercel.app

## Fitur

- **Dashboard**: omzet, biaya, margin, proyek terlambat, deadline 14 hari ke depan, invoice belum dibayar, status riset, dan aktivitas terbaru tim.
- **Proyek & Pipeline**: tabel dan kanban. Klik nama proyek untuk membuka **Detail Proyek** yang berisi:
  - **Tugas**: checklist dengan status Belum Mulai / Berjalan / Selesai, penanggung jawab, dan tanggal target.
  - **Vendor & Penawaran**: bandingkan beberapa penawaran per kebutuhan. Saat satu penawaran dipilih, penawaran lain yang masih menunggu otomatis ditolak, dan biaya proyek dihitung dari penawaran terpilih. Setelah proyek selesai, beri nilai dan ulasan untuk vendor.
  - **Lampiran**: link ke Google Drive dan layanan sejenis.
  - **Invoice** proyek.
- **Vendor & Freelancer**: kategori bisa ditambah sendiri. Tiap vendor punya riwayat kerja sama (dipakai di proyek apa, total dibayar, rating dari ulasan) dan lampiran.
- **Riset & Catatan**: topik, status, proyek terkait, link sumber, dan lampiran.
- **Invoice**: banyak item, diskon, PPN, termin (DP / pelunasan), nomor otomatis, status Draft / Terkirim / Lunas, deteksi jatuh tempo, dan cetak ke PDF.
- **Kalender**: deadline proyek, tugas, dan jatuh tempo invoice.
- **Peran**: Admin dan Anggota (lihat di bawah). Semua perubahan tercatat di log aktivitas.
- **Bisa di-install** di HP dan laptop (PWA): buka situsnya, lalu pilih "Add to Home Screen" atau "Install".
- Bahasa Indonesia / English, mode gelap.

## Setup Firebase (sekali saja)

1. **Login Google**: Firebase Console → Authentication → Sign-in method → Google → Enable.
2. **Domain**: Authentication → Settings → Authorized domains → tambahkan `agency-wannabe.vercel.app` (dan domain lain jika ada).
3. **Aturan keamanan**: salin isi `firestore.rules` ke Firestore Database → Rules. Ganti `email-anda@gmail.com` dengan email Google pemilik, lalu Publish.
4. Buka aplikasi dan login dengan email pemilik. Akun ini otomatis menjadi **Admin**.
5. Tambahkan anggota tim lewat **Pengaturan → Akses Anggota Tim**.

## Peran

| Aksi | Anggota | Admin |
|---|---|---|
| Melihat semua data | ✓ | ✓ |
| Menambah & mengubah proyek, vendor, riset, penawaran, tugas, invoice | ✓ | ✓ |
| Menambah kategori vendor | ✓ | ✓ |
| Menghapus data, import, reset, data demo | | ✓ |
| Mengubah identitas perusahaan & rekening invoice | | ✓ |
| Mengatur anggota tim | | ✓ |

Aturan ini ditegakkan di dua tempat: tampilan aplikasi dan `firestore.rules` di server.

## Struktur kode

Tanpa framework dan tanpa build step di Vercel. Semua file disajikan apa adanya.

```
index.html              markup semua halaman dan modal
css/tailwind.css        CSS Tailwind hasil build (di-commit)
css/app.css             gaya tambahan, cetak, dan visibilitas per peran
js/config.js            konfigurasi Firebase
js/i18n.js              teks Indonesia / English
js/constants.js         nilai default dan data demo
js/state.js             data di memori dan cache browser
js/sync.js              login, peran, sinkronisasi realtime, log aktivitas
js/ui.js                navigasi, toast, dialog konfirmasi
js/dashboard.js         dashboard
js/projects.js          tabel / kanban proyek, log harian, form proyek
js/project-detail.js    panel detail proyek: tugas, penawaran, lampiran, invoice
js/partners.js          riwayat dan rating vendor / freelancer
js/attachments.js       lampiran berupa link
js/invoices.js          invoice
js/vendors.js, freelancers.js, team.js, research.js, calendar.js, calculator.js, settings.js, data-tools.js
js/app.js               start-up dan service worker
sw.js, manifest.webmanifest, icons/   PWA
firestore.rules         aturan keamanan Firestore
```

## Mengubah tampilan (Tailwind)

CSS hanya berisi class yang dipakai. Setelah menambah class Tailwind baru di `index.html` atau `js/`, build ulang:

```sh
./build-css.sh
```

Skrip ini memakai Tailwind standalone CLI v3 (unduh dari halaman rilis Tailwind dan simpan sebagai `./tailwindcss`) atau `npx tailwindcss@3` jika Node terpasang. Commit juga `css/tailwind.css` hasil build.

Saat merilis perubahan besar, naikkan versi `CACHE` di `sw.js` agar aplikasi yang sudah ter-install mengambil versi baru.
