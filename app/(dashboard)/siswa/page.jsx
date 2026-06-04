'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Search } from 'lucide-react'

export default function SiswaPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState(null)
  const [siswa, setSiswa] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [kelasFilter, setKelasFilter] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  useEffect(() => {
    let data = siswa
    if (search) data = data.filter(s => s.nama?.toLowerCase().includes(search.toLowerCase()) || s.nis?.includes(search))
    if (kelasFilter) data = data.filter(s => s.kelas === kelasFilter)
    setFiltered(data)
  }, [search, kelasFilter, siswa])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(prof)

    const { data } = await supabase
      .from('profiles')
      .select('*, pendaftaran(ekskul(nama), status)')
      .eq('role', 'siswa')
      .order('nama')
    setSiswa(data || [])
    setFiltered(data || [])
    setLoading(false)
  }

  if (loading) return <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>

  const role = profile?.role
  const kelasList = [...new Set(siswa.map(s => s.kelas).filter(Boolean))].sort()

  return (
    <div>
      {role === 'kepala_sekolah' && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
          Mode lihat saja — Kepala Sekolah tidak dapat mengedit data.
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="font-display font-bold text-gray-900">Daftar Siswa</h3>
            <p className="text-xs text-gray-400 mt-0.5">{filtered.length} dari {siswa.length} siswa</p>
          </div>
        </div>

        {/* Filter */}
        <div className="px-5 py-3 border-b border-gray-100 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-8 py-2 text-sm" placeholder="Cari nama atau NIS..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="select text-sm" value={kelasFilter} onChange={e => setKelasFilter(e.target.value)}>
            <option value="">Semua Kelas</option>
            {kelasList.map(k => <option key={k} value={k}>Kelas {k}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr>
              <th className="table-th">#</th>
              <th className="table-th">Nama Siswa</th>
              <th className="table-th">NIS</th>
              <th className="table-th">Kelas</th>
              <th className="table-th">Ekskul Diikuti</th>
              <th className="table-th">Status</th>
            </tr></thead>
            <tbody>
              {filtered.map((s, i) => {
                const ekskul = s.pendaftaran?.filter(p => p.status === 'diterima') || []
                return (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="table-td text-gray-400">{i + 1}</td>
                    <td className="table-td">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold font-display flex-shrink-0">
                          {s.nama?.[0]?.toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-800">{s.nama}</span>
                      </div>
                    </td>
                    <td className="table-td">{s.nis || '-'}</td>
                    <td className="table-td">{s.kelas || '-'}</td>
                    <td className="table-td">
                      {ekskul.length > 0
                        ? ekskul.map(e => <span key={e.ekskul?.nama} className="badge-blue mr-1">{e.ekskul?.nama}</span>)
                        : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="table-td">
                      <span className={ekskul.length > 0 ? 'badge-green' : 'badge-amber'}>
                        {ekskul.length > 0 ? 'Aktif' : 'Belum Daftar'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm">Tidak ada siswa ditemukan.</div>
          )}
        </div>
      </div>
    </div>
  )
}
