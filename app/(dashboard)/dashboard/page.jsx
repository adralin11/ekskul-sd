'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Users, Circle, FileText, TrendingUp } from 'lucide-react'

export default function DashboardPage() {
  const supabase = createClient()
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState({ ekskul: 0, siswa: 0, pendaftaran: 0, kehadiran: 0 })
  const [pendaftaranTerbaru, setPendaftaranTerbaru] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)

      const [{ count: cEkskul }, { count: cSiswa }, { count: cDaftar }] = await Promise.all([
        supabase.from('ekskul').select('*', { count: 'exact', head: true }).eq('aktif', true),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'siswa'),
        supabase.from('pendaftaran').select('*', { count: 'exact', head: true }),
      ])

      const { data: absensiData } = await supabase.from('absensi').select('status')
      const totalAbsen = absensiData?.length || 0
      const hadir = absensiData?.filter(a => a.status === 'hadir').length || 0
      const pctHadir = totalAbsen > 0 ? Math.round((hadir / totalAbsen) * 100) : 0

      setStats({ ekskul: cEkskul || 0, siswa: cSiswa || 0, pendaftaran: cDaftar || 0, kehadiran: pctHadir })

      if (prof?.role !== 'siswa') {
        const { data: daftar } = await supabase
          .from('pendaftaran')
          .select('*, profiles(nama, kelas), ekskul(nama)')
          .order('tanggal_daftar', { ascending: false })
          .limit(5)
        setPendaftaranTerbaru(daftar || [])
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>

  const role = profile?.role

  const statCards = role === 'siswa' ? [
    { label: 'Ekskul Tersedia', value: stats.ekskul, icon: Circle, color: 'blue', gradient: 'from-blue-500 to-cyan-400' },
    { label: 'Rata-rata Kehadiran', value: `${stats.kehadiran}%`, icon: TrendingUp, color: 'green', gradient: 'from-emerald-500 to-teal-400' },
  ] : [
    { label: 'Total Ekskul Aktif', value: stats.ekskul, icon: Circle, color: 'blue', gradient: 'from-blue-500 to-cyan-400' },
    { label: 'Siswa Terdaftar', value: stats.siswa, icon: Users, color: 'green', gradient: 'from-emerald-500 to-teal-400' },
    { label: 'Total Pendaftaran', value: stats.pendaftaran, icon: FileText, color: 'amber', gradient: 'from-amber-500 to-orange-400' },
    { label: 'Rata-rata Kehadiran', value: `${stats.kehadiran}%`, icon: TrendingUp, color: 'purple', gradient: 'from-violet-500 to-purple-400' },
  ]

  const bgColors = { blue: 'bg-blue-50 text-blue-600', green: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600', purple: 'bg-violet-50 text-violet-600' }

  return (
    <div>
      {/* Banner */}
      <div className="relative rounded-2xl p-6 mb-6 overflow-hidden text-white flex flex-wrap items-center justify-between gap-4"
        style={{ background: '#1C2333' }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-30 pointer-events-none"
          style={{ background: 'radial-gradient(circle,#2563EB 0%,transparent 70%)', transform: 'translate(30%,-50%)' }} />
        <div className="relative z-10">
          <h2 className="font-display text-xl font-bold mb-1">
            {role === 'siswa' ? `Halo, ${profile?.nama?.split(' ')[0]}! 👋` :
             role === 'kepala_sekolah' ? 'Selamat Datang, Kepala Sekolah' :
             'Selamat Datang, Pembina!'}
          </h2>
          <p className="text-white/50 text-sm">
            {role === 'siswa' ? 'Kembangkan bakatmu lewat ekstrakurikuler' :
             role === 'kepala_sekolah' ? 'Pantau kegiatan ekstrakurikuler sekolah' :
             'Kelola ekskul dan kehadiran siswa Anda'}
          </p>
        </div>
        <div className="flex gap-2 relative z-10 flex-wrap">
          {role === 'siswa' && (
            <button onClick={() => router.push('/ekskul')} className="btn-primary text-sm py-2">
              Lihat Ekskul
            </button>
          )}
          {role === 'pembina' && (
            <button onClick={() => router.push('/absensi')} className="btn-primary text-sm py-2">
              Isi Absensi
            </button>
          )}
          {role === 'kepala_sekolah' && (
            <button onClick={() => router.push('/laporan')} className="btn-ghost text-sm py-2">
              Lihat Laporan
            </button>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className={`grid gap-4 mb-6 ${statCards.length === 2 ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'}`}>
        {statCards.map((s, i) => (
          <div key={i} className="card p-5 hover:-translate-y-1 transition-transform">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgColors[s.color]}`}>
                <s.icon size={20} />
              </div>
              <div className={`w-1.5 h-12 rounded-full bg-gradient-to-b ${s.gradient} opacity-60`} />
            </div>
            <div className="font-display text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-400 font-medium mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent pendaftaran (non-siswa) */}
      {role !== 'siswa' && pendaftaranTerbaru.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="font-display font-bold text-gray-900">Pendaftaran Terbaru</h3>
              <p className="text-xs text-gray-400 mt-0.5">5 data terakhir masuk</p>
            </div>
            <button onClick={() => router.push('/pendaftaran')} className="btn-outline text-xs py-1.5 px-3">Lihat Semua</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr>
                <th className="table-th">Nama Siswa</th>
                <th className="table-th">Kelas</th>
                <th className="table-th">Ekskul</th>
                <th className="table-th">Status</th>
              </tr></thead>
              <tbody>{pendaftaranTerbaru.map(d => (
                <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                  <td className="table-td font-medium text-gray-800">{d.profiles?.nama}</td>
                  <td className="table-td">{d.profiles?.kelas || '-'}</td>
                  <td className="table-td">{d.ekskul?.nama}</td>
                  <td className="table-td">
                    <span className={d.status === 'diterima' ? 'badge-green' : d.status === 'proses' ? 'badge-amber' : 'badge-red'}>
                      {d.status === 'diterima' ? 'Diterima' : d.status === 'proses' ? 'Proses' : 'Ditolak'}
                    </span>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* Siswa: quick actions */}
      {role === 'siswa' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'Daftar Ekskul', sub: 'Pilih ekskul favoritmu', href: '/ekskul', color: 'blue' },
            { label: 'Pendaftaran Saya', sub: 'Cek status pendaftaran', href: '/pendaftaran', color: 'green' },
            { label: 'Jadwal Latihan', sub: 'Lihat jadwal ekskul', href: '/jadwal-siswa', color: 'amber' },
          ].map(q => (
            <button key={q.href} onClick={() => router.push(q.href)}
              className="card p-5 text-left hover:-translate-y-1 hover:shadow-md hover:border-blue-300 transition-all">
              <h4 className="font-display font-bold text-gray-800 text-sm mb-1">{q.label}</h4>
              <p className="text-xs text-gray-400">{q.sub}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
