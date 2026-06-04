'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function JadwalPage() {
  const supabase = createClient()
  const [ekskul, setEkskul] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(prof)
    const { data } = await supabase.from('ekskul').select('*, profiles(nama)').eq('aktif', true).order('hari')
    setEkskul(data || [])
    setLoading(false)
  }

  if (loading) return <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>

  const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

  return (
    <div>
      {profile?.role === 'kepala_sekolah' && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
          Mode lihat saja.
        </div>
      )}

      {/* Table view */}
      <div className="card mb-6">
        <div className="card-header">
          <div>
            <h3 className="font-display font-bold text-gray-900">Jadwal Semua Ekskul</h3>
            <p className="text-xs text-gray-400 mt-0.5">Semester Genap 2025/2026</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr>
              <th className="table-th">Ekskul</th>
              <th className="table-th">Pembina</th>
              <th className="table-th">Hari</th>
              <th className="table-th">Jam</th>
              <th className="table-th">Tempat</th>
              <th className="table-th">Kuota</th>
              <th className="table-th">Status</th>
            </tr></thead>
            <tbody>
              {ekskul.map(e => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="table-td">
                    <div className="flex items-center gap-2 font-medium text-gray-800">
                      <span>{e.icon}</span> {e.nama}
                    </div>
                  </td>
                  <td className="table-td">{e.profiles?.nama || '-'}</td>
                  <td className="table-td">{e.hari}</td>
                  <td className="table-td">{e.jam_mulai?.slice(0,5)} – {e.jam_selesai?.slice(0,5)}</td>
                  <td className="table-td">{e.tempat || '-'}</td>
                  <td className="table-td">{e.kuota} siswa</td>
                  <td className="table-td"><span className="badge-green">Aktif</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Weekly calendar view */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-display font-bold text-gray-900">Tampilan Mingguan</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {HARI.map(hari => {
              const ekskulHari = ekskul.filter(e => e.hari?.toLowerCase().includes(hari.toLowerCase()))
              return (
                <div key={hari} className="rounded-xl border border-gray-100 overflow-hidden">
                  <div className="bg-gray-50 px-3 py-2 border-b border-gray-100">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{hari}</span>
                  </div>
                  <div className="p-2 min-h-[80px]">
                    {ekskulHari.length === 0
                      ? <p className="text-xs text-gray-300 text-center pt-4">—</p>
                      : ekskulHari.map(e => (
                        <div key={e.id} className="mb-1.5 p-2 rounded-lg bg-blue-50 border border-blue-100">
                          <div className="text-xs font-semibold text-blue-800">{e.icon} {e.nama}</div>
                          <div className="text-xs text-blue-500">{e.jam_mulai?.slice(0,5)}</div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
