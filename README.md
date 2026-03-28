# 📚 Sistem Manajemen Guru

Aplikasi web untuk mengelola absensi guru, SPTJM, dan rekapitulasi kehadiran.

![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black)
![React](https://img.shields.io/badge/React-19.0.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38B2AC)

## ✨ Fitur Utama

### 📋 Tab Absensi
- Input data sekolah dan kepala sekolah
- Daftar guru dengan status (PNS/PPPK/Honorer)
- Checklist kehadiran per bulan
- Otomatis menandai hari libur dan Minggu
- Tombol "Ceklis Semua" untuk absensi cepat
- Cetak daftar hadir

### 📄 Tab SPTJM 2026
- Buat SPTJM untuk guru PNS/PPPK
- Buat SPTJM khusus untuk guru Honorer (dengan info rekening bank)
- Preview dan cetak dokumen SPTJM

### 📊 Tab Rekap
- Rekapitulasi kehadiran per bulan
- Tabel checklist kehadiran
- Tabel rekapitulasi (Sakit/Izin/Cuti/Hadir)
- Cetak laporan rekap

### ⚙️ Tab Setting Tanggal
- Kalender interaktif untuk set tahun 2026
- Tandai hari libur nasional (warna oranye)
- Tandai cuti bersama (warna biru muda)
- Minggu otomatis berwarna merah

### 📖 Tab Petunjuk Pengisian
- Panduan penggunaan aplikasi

## 💾 Penyimpanan Data

Aplikasi ini menggunakan **LocalStorage + Export/Import Excel**:

- **Auto-save**: Data otomatis tersimpan di browser
- **Export Excel**: Download semua data ke file `.xlsx`
- **Import Excel**: Restore data dari file Excel

## 🛠️ Teknologi

| Teknologi | Fungsi |
|-----------|--------|
| Next.js 16 | Framework React |
| React 19 | Library UI |
| TypeScript | Type safety |
| Tailwind CSS 4 | Styling |
| shadcn/ui | Komponen UI |
| XLSX | Export/Import Excel |
| Lucide React | Icons |

## 🚀 Cara Menjalankan

### Development
```bash
# Install dependencies
bun install

# Jalankan development server
bun run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

### Production Build
```bash
# Build untuk production
bun run build

# Jalankan production server
bun run start
```

## 📤 Deploy ke GitHub Pages

1. **Push ke GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/USERNAME/app-absensi-guru.git
   git push -u origin main
   ```

2. **Aktifkan GitHub Pages**
   - Buka repository di GitHub
   - Pergi ke **Settings** → **Pages**
   - Source: pilih **GitHub Actions**
   - Deploy otomatis akan berjalan

3. **Akses Aplikasi**
   - URL: `https://USERNAME.github.io/app-absensi-guru/`

> ⚠️ **Penting**: Jika menggunakan GitHub Pages, uncomment `basePath` di `next.config.ts` dan sesuaikan dengan nama repository.

## 📁 Struktur Folder

```
├── app/
│   └── page.tsx          # Komponen utama aplikasi
├── components/ui/        # Komponen shadcn/ui
├── lib/                  # Utility functions
├── public/              # Static assets
├── .github/workflows/   # GitHub Actions
├── next.config.ts       # Konfigurasi Next.js
├── tailwind.config.ts   # Konfigurasi Tailwind
└── package.json         # Dependencies
```

## ⚠️ Catatan Penting

- Data disimpan di **LocalStorage browser** - akan hilang jika cache browser dihapus
- Gunakan fitur **Export Excel** secara berkala untuk backup data
- Untuk hosting statis (GitHub Pages), tidak ada backend/database
- Aplikasi cocok untuk penggunaan individual atau satu sekolah

## 📝 Lisensi

MIT License - bebas digunakan dan dimodifikasi.
