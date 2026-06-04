'use client'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import {
  LayoutDashboard, Circle, FileText, Users,
  ClipboardCheck, Calendar, BarChart3, LogOut, X
} from 'lucide-react'

const allMenus = {
  siswa: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Daftar Ekskul', href: '/ekskul', icon: Circle },
    { label: 'Pendaftaran Saya', href: '/pendaftaran', icon: FileText },
  ],
  pembina: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Data Ekskul', href: '/ekskul', icon: Circle },
    { label: 'Data Siswa', href: '/siswa', icon: Users },
    { label: 'Absensi', href: '/absensi', icon: ClipboardCheck },
    { label: 'Jadwal Latihan', href: '/jadwal', icon: Calendar },
    { label: 'Laporan', href: '/laporan', icon: BarChart3 },
  ],
  kepala_sekolah: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Data Ekskul', href: '/ekskul', icon: Circle },
    { label: 'Data Siswa', href: '/siswa', icon: Users },
    { label: 'Jadwal Latihan', href: '/jadwal', icon: Calendar },
    { label: 'Laporan', href: '/laporan', icon: BarChart3 },
  ],
}

export default function Sidebar({ profile, sudahDaftar, open, onClose }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const role = profile?.role || 'siswa'
  let menus = allMenus[role] || allMenus.siswa

  // Siswa: tambah Jadwal kalau sudah daftar
  if (role === 'siswa' && sudahDaftar) {
    menus = [...menus, { label: 'Jadwal Latihan', href: '/jadwal-siswa', icon: Calendar }]
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const roleLabel = {
    siswa: 'Akun Siswa',
    pembina: 'Pembina Ekskul',
    kepala_sekolah: 'Kepala Sekolah',
  }[role] || 'User'

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside className={`fixed top-0 left-0 h-full w-64 z-50 flex flex-col transition-transform duration-300
        lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: '#1C2333' }}>

        {/* Top */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#2563EB,#0EA5E9)' }}>
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <div className="font-display text-sm font-bold text-white">EkskulSD</div>
              <div className="text-xs text-white/30">Sekolah Dasar</div>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-white/40 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 overflow-y-auto">
          {menus.map(item => {
            const active = pathname === item.href
            return (
              <button key={item.href}
                onClick={() => { router.push(item.href); onClose?.() }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium mb-0.5 transition-all relative
                  ${active ? 'text-blue-300 bg-blue-600/20' : 'text-white/50 hover:text-white/80 hover:bg-white/5'}`}>
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-500 rounded-r" />}
                <item.icon size={15} />
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-white/5">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg mb-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-display font-bold"
              style={{ background: 'linear-gradient(135deg,#2563EB,#8B5CF6)' }}>
              {profile?.nama?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate">{profile?.nama || 'User'}</div>
              <div className="text-xs text-white/30">{roleLabel}</div>
            </div>
          </div>
          <button onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.15)' }}>
            <LogOut size={13} />
            Keluar
          </button>
        </div>
      </aside>
    </>
  )
}
