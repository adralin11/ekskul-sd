# EkskulSD — Sistem Informasi Ekstrakurikuler SD

## Tech Stack
- Next.js 14 + Tailwind CSS
- Supabase (PostgreSQL + Auth)
- Deploy: Vercel

---

## LANGKAH 1: Setup Supabase

1. Buka https://supabase.com → login → New Project
2. Buka SQL Editor → paste isi `supabase-schema.sql` → Run
3. Buka Settings > API → copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

---

## LANGKAH 2: Upload ke GitHub

1. Buat repo baru di github.com
2. Upload semua file project ini
3. JANGAN upload file `.env.local`

---

## LANGKAH 3: Deploy ke Vercel

1. Buka vercel.com → Add New Project → pilih repo GitHub
2. Sebelum deploy, isi Environment Variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```
3. Klik Deploy → tunggu 2-3 menit
4. Tambahkan URL Vercel ke Supabase:
   Authentication > URL Configuration > Redirect URLs

---

## LANGKAH 4: Buat Akun

Buka URL Vercel → klik Daftar Akun Baru → pilih role → isi data

---

## Fitur Per Role

**Siswa:** Daftar ekskul, cek status, lihat jadwal (setelah diterima)

**Pembina:** Kelola ekskul, terima/tolak pendaftaran, input absensi, laporan

**Kepala Sekolah:** Lihat semua data (read-only), download laporan

---

## Troubleshooting

- Error "relation does not exist" → jalankan supabase-schema.sql dulu
- Error "Invalid API key" → cek environment variables di Vercel
- Login loop → tambahkan URL Vercel ke Supabase Redirect URLs
