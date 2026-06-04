-- ============================================================
-- SCHEMA DATABASE SI EKSTRAKURIKULER SD
-- Jalankan di: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. TABEL PROFIL USER (extend auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nama TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('siswa', 'pembina', 'kepala_sekolah')),
  kelas TEXT,         -- hanya untuk siswa (1A, 2B, dst)
  nis TEXT,           -- nomor induk siswa
  no_telp TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL EKSTRAKURIKULER
CREATE TABLE public.ekskul (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nama TEXT NOT NULL,
  deskripsi TEXT,
  pembina_id UUID REFERENCES public.profiles(id),
  hari TEXT NOT NULL,       -- contoh: 'Senin & Rabu'
  jam_mulai TIME NOT NULL,
  jam_selesai TIME NOT NULL,
  tempat TEXT,
  kuota INT DEFAULT 30,
  icon TEXT DEFAULT '🎽',
  warna TEXT DEFAULT 'blue', -- untuk styling card
  aktif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL PENDAFTARAN
CREATE TABLE public.pendaftaran (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  siswa_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ekskul_id UUID REFERENCES public.ekskul(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'proses' CHECK (status IN ('proses', 'diterima', 'ditolak')),
  tanggal_daftar TIMESTAMPTZ DEFAULT NOW(),
  catatan TEXT,
  UNIQUE(siswa_id, ekskul_id)
);

-- 4. TABEL SESI LATIHAN
CREATE TABLE public.sesi_latihan (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ekskul_id UUID REFERENCES public.ekskul(id) ON DELETE CASCADE,
  tanggal DATE NOT NULL,
  sesi_ke INT,
  catatan TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABEL ABSENSI
CREATE TABLE public.absensi (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sesi_id UUID REFERENCES public.sesi_latihan(id) ON DELETE CASCADE,
  siswa_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('hadir', 'izin', 'alfa')),
  keterangan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sesi_id, siswa_id)
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ekskul ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pendaftaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sesi_latihan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.absensi ENABLE ROW LEVEL SECURITY;

-- Profiles: semua user bisa lihat, hanya diri sendiri yang bisa edit
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Ekskul: semua bisa lihat
CREATE POLICY "ekskul_select" ON public.ekskul FOR SELECT USING (true);
CREATE POLICY "ekskul_insert" ON public.ekskul FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'pembina')
);
CREATE POLICY "ekskul_update" ON public.ekskul FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'pembina')
);

-- Pendaftaran: siswa lihat punya sendiri, pembina & kepsek lihat semua
CREATE POLICY "pendaftaran_select_siswa" ON public.pendaftaran FOR SELECT USING (
  siswa_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('pembina', 'kepala_sekolah'))
);
CREATE POLICY "pendaftaran_insert_siswa" ON public.pendaftaran FOR INSERT WITH CHECK (
  siswa_id = auth.uid() AND
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'siswa')
);
CREATE POLICY "pendaftaran_update_pembina" ON public.pendaftaran FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'pembina')
);

-- Sesi Latihan: semua bisa lihat, pembina bisa buat
CREATE POLICY "sesi_select" ON public.sesi_latihan FOR SELECT USING (true);
CREATE POLICY "sesi_insert" ON public.sesi_latihan FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'pembina')
);

-- Absensi: siswa lihat punya sendiri, pembina kelola semua
CREATE POLICY "absensi_select" ON public.absensi FOR SELECT USING (
  siswa_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('pembina', 'kepala_sekolah'))
);
CREATE POLICY "absensi_insert" ON public.absensi FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'pembina')
);
CREATE POLICY "absensi_update" ON public.absensi FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'pembina')
);

-- ============================================================
-- TRIGGER: Auto-buat profil saat user register
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nama, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nama', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'siswa')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- DATA AWAL (SEED)
-- ============================================================

-- Catatan: Insert user dulu lewat Supabase Auth Dashboard,
-- lalu update profiles dengan data lengkap.
-- Atau pakai fungsi di bawah ini untuk insert ekskul awal:

INSERT INTO public.ekskul (nama, deskripsi, hari, jam_mulai, jam_selesai, tempat, icon, warna, kuota) VALUES
('Sepak Bola', 'Latihan sepak bola untuk meningkatkan kemampuan fisik dan kerjasama tim', 'Senin & Rabu', '15:00', '17:00', 'Lapangan Utama', '⚽', 'blue', 30),
('Pramuka', 'Kegiatan kepramukaan untuk pembentukan karakter dan disiplin', 'Jumat', '14:00', '16:00', 'Aula Sekolah', '⚜️', 'amber', 40),
('Seni Lukis', 'Pengembangan bakat seni rupa dan kreativitas siswa', 'Selasa', '14:00', '15:30', 'Ruang Kelas 5', '🎨', 'green', 20),
('Musik', 'Latihan musik dan vokal untuk mengembangkan bakat seni musik', 'Kamis', '14:00', '15:30', 'Ruang Musik', '🎵', 'purple', 20),
('Karate', 'Latihan beladiri karate untuk membentuk fisik dan mental', 'Sabtu', '08:00', '10:00', 'Aula Sekolah', '🥋', 'red', 25),
('Tari Tradisional', 'Pelestarian budaya melalui seni tari tradisional Indonesia', 'Rabu', '14:00', '15:30', 'Aula Sekolah', '💃', 'pink', 20);
