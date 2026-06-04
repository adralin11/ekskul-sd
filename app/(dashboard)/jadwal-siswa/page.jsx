'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function JadwalSiswaPage() {
  const supabase = createClient()
  const [data, setData] = useState([])
  const [absensiSaya, setAbsensiSaya] = useState({ hadir: 0, izin: 0, alfa: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()

    // Ekskul yang diterima
    const { data: daftar } = await supabase
      .from('pendaftaran')
      .select('*, ekskul(*, profiles(nama))')
      .eq('siswa_id', user.id)
      .eq('status', 'diterima')
    setData(daftar || [])

    // Rekap absensi saya
    const { data: absen } = await supabase
      .from('absensi')
      .select('status')
      .eq('siswa_id', user.id)

    const rekap = { hadir: 0, izin: 0, alfa: 0 }
    absen?.forEach(a => { rekap[a.status] = (rekap[a.status] || 0) + 1 })
    setAbsensiSaya(rekap)
    setLoading(false)
  }

  if (loading) return <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>

  const total = absensiSaya.hadir + absensiSaya.izin + absensiSaya.alfa
  const pct = total > 0 ? Math.round((absensiSaya.hadir / total) * 100) : 0

  return (
    <div>
      {/* Rekap kehadiran */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="card p-4 text-center border-t-4 border-emerald-400">
          <div className="font-display text-3xl font-bold text-emerald-600">{absensiSaya.hadir}</div>
          <div className="text-xs text-gray-400 font-medium mt-1">Total Hadir</div>
        </div>
        <div className="card p-4 text-center border-t-4 border-amber-400">
          <div className="font-display text-3xl font-bold text-amber-600">{absensiSaya.izin}</div>
          <div className="text-xs text-gray-400 font-medium mt-1">Total Izin</div>
        </div>
        <div className="card p-4 text-center border-t-4 border-red-400">
          <div className="font-display text-3xl font-bold text-red-600">{absensiSaya.alfa}</div>
          <div className="text-xs text-gray-400 font-medium mt-1">Total Alfa</div>
        </div>
      </div>

      {/* Persentase kehadiran */}
      <div className="card mb-5">
        <div className="card-body">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-700">Persentase Kehadiran</span>
            <span className="font-display font-bold text-blue-600">{pct}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#2563EB,#0EA5E9)' }} />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {pct >= 75 ? '✅ Kehadiran kamu baik, pertahankan!' : '⚠️ Kehadiran kamu perlu ditingkatkan.'}
          </p>
        </div>
      </div>

      {/* Jadwal ekskul saya */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="font-display font-bold text-gray-900">Jadwal Ekskul Saya</h3>
            <p className="text-xs text-gray-400 mt-0.5">{data.length} ekskul aktif</p>
          </div>
        </div>
        {data.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="font-medium text-sm">Belum ada ekskul yang diterima.</p>
          </div>
        ) : (
          <div className="card-body grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.map(d => (
              <div key={d.id} className="p-4 rounded-xl border-2 border-gray-100 hover:border-blue-200 transition-all">
                <div className="text-2xl mb-2">{d.ekskul?.icon}</div>
                <h4 className="font-display font-bold text-gray-900 mb-1">{d.ekskul?.nama}</h4>
                <p className="text-xs text-gray-400 mb-3">Pembina: {d.ekskul?.profiles?.nama || '-'}</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="w-14 text-gray-400 font-medium">Hari</span>
                    <span>{d.ekskul?.hari}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="w-14 text-gray-400 font-medium">Jam</span>
                    <span>{d.ekskul?.jam_mulai?.slice(0,5)} – {d.ekskul?.jam_selesai?.slice(0,5)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="w-14 text-gray-400 font-medium">Tempat</span>
                    <span>{d.ekskul?.tempat || '-'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
