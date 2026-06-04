'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'

const pageTitles = {
  '/dashboard': ['Dashboard', 'Ringkasan kegiatan ekstrakurikuler'],
  '/ekskul': ['Data Ekskul', 'Kelola ekstrakurikuler sekolah'],
  '/pendaftaran': ['Pendaftaran Saya', 'Status pendaftaran ekskul'],
  '/siswa': ['Data Siswa', 'Kelola data siswa terdaftar'],
  '/absensi': ['Absensi', 'Catat kehadiran sesi latihan'],
  '/jadwal': ['Jadwal Latihan', 'Jadwal kegiatan ekstrakurikuler'],
  '/jadwal-siswa': ['Jadwal Latihan Saya', 'Jadwal ekskul yang kamu ikuti'],
  '/laporan': ['Laporan Kehadiran', 'Rekap dan laporan kehadiran siswa'],
}

export default function DashboardLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [profile, setProfile] = useState(null)
  const [sudahDaftar, setSudahDaftar] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data: prof } = await supabase
        .from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)

      if (prof?.role === 'siswa') {
        const { data: daftar } = await supabase
          .from('pendaftaran').select('id').eq('siswa_id', user.id).eq('status', 'diterima').limit(1)
        setSudahDaftar((daftar?.length || 0) > 0)
      }
      setLoading(false)
    }
    init()
  }, [pathname])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const [title, subtitle] = pageTitles[pathname] || ['Halaman', '']

  return (
    <div className="flex min-h-screen">
      <Sidebar profile={profile} sudahDaftar={sudahDaftar}
        open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        <Topbar title={title} subtitle={subtitle} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-5 sm:p-6 lg:p-7">
          {children}
        </main>
      </div>
    </div>
  )
}
