'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Download } from 'lucide-react'

export default function LaporanPage() {
  const supabase = createClient()
  const [ekskul, setEkskul] = useState([])
  const [selectedEkskul, setSelectedEkskul] = useState('')
  const [bulan, setBulan] = useState(new Date().toISOString().slice(0, 7))
  const [rekap, setRekap] = useState([])
  const [summary, setSummary] = useState({ hadir: 0, izin: 0, alfa: 0 })
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => { loadEkskul() }, [])

  async function loadEkskul() {
    const { data } = await supabase.from('ekskul').select('*').eq('aktif', true).order('nama')
    setEkskul(data || [])
  }

  async function loadLaporan() {
    setLoading(true); setLoaded(false)

    // Ambil sesi latihan di bulan dan ekskul yang dipilih
    const startDate = `${bulan}-01`
    const endDate = `${bulan}-31`

    let sesiQuery = supabase.from('sesi_latihan').select('id').gte('tanggal', startDate).lte('tanggal', endDate)
    if (selectedEkskul) sesiQuery = sesiQuery.eq('ekskul_id', selectedEkskul)
    const { data: sesi } = await sesiQuery
    const sesiIds = sesi?.map(s => s.id) || []

    if (sesiIds.length === 0) {
      setRekap([]); setSummary({ hadir: 0, izin: 0, alfa: 0 })
      setLoading(false); setLoaded(true); return
    }

    // Ambil semua absensi di sesi-sesi tersebut
    const { data: absenData } = await supabase
      .from('absensi')
      .select('*, profiles(nama, kelas, nis), sesi_latihan(ekskul_id, ekskul(nama))')
      .in('sesi_id', sesiIds)

    // Group by siswa
    const byStudent = {}
    absenData?.forEach(a => {
      const id = a.siswa_id
      if (!byStudent[id]) byStudent[id] = {
        nama: a.profiles?.nama, kelas: a.profiles?.kelas, nis: a.profiles?.nis,
        ekskul: a.sesi_latihan?.ekskul?.nama,
        hadir: 0, izin: 0, alfa: 0
      }
      byStudent[id][a.status]++
    })

    const rows = Object.values(byStudent)
    const totH = rows.reduce((s, r) => s + r.hadir, 0)
    const totI = rows.reduce((s, r) => s + r.izin, 0)
    const totA = rows.reduce((s, r) => s + r.alfa, 0)

    setRekap(rows)
    setSummary({ hadir: totH, izin: totI, alfa: totA })
    setLoading(false); setLoaded(true)
  }

  function pct(row) {
    const total = row.hadir + row.izin + row.alfa
    return total > 0 ? Math.round((row.hadir / total) * 100) : 0
  }

  function ket(p) {
    if (p >= 90) return { label: 'Sangat Baik', cls: 'badge-green' }
    if (p >= 75) return { label: 'Baik', cls: 'badge-green' }
    if (p >= 60) return { label: 'Cukup', cls: 'badge-amber' }
    return { label: 'Kurang', cls: 'badge-red' }
  }

  return (
    <div>
      {/* Filter */}
      <div className="card mb-5">
        <div className="card-body">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Ekskul</label>
              <select className="select" value={selectedEkskul} onChange={e => setSelectedEkskul(e.target.value)}>
                <option value="">Semua Ekskul</option>
                {ekskul.map(e => <option key={e.id} value={e.id}>{e.nama}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Bulan</label>
              <input type="month" className="input py-2 text-sm" value={bulan} onChange={e => setBulan(e.target.value)} />
            </div>
            <button onClick={loadLaporan} disabled={loading} className="btn-primary text-sm py-2">
              {loading ? 'Memuat...' : 'Tampilkan Laporan'}
            </button>
            {loaded && rekap.length > 0 && (
              <button className="btn-success text-sm py-2 ml-auto">
                <Download size={14} /> Download PDF
              </button>
            )}
          </div>
        </div>
      </div>

      {loaded && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-5">
            <div className="card p-5 text-center border-t-4 border-emerald-400">
              <div className="font-display text-3xl font-bold text-emerald-600">{summary.hadir}</div>
              <div className="text-xs text-gray-400 font-medium mt-1">Total Hadir</div>
            </div>
            <div className="card p-5 text-center border-t-4 border-amber-400">
              <div className="font-display text-3xl font-bold text-amber-600">{summary.izin}</div>
              <div className="text-xs text-gray-400 font-medium mt-1">Total Izin</div>
            </div>
            <div className="card p-5 text-center border-t-4 border-red-400">
              <div className="font-display text-3xl font-bold text-red-600">{summary.alfa}</div>
              <div className="text-xs text-gray-400 font-medium mt-1">Total Alfa</div>
            </div>
          </div>

          {/* Table */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="font-display font-bold text-gray-900">Rekap Kehadiran Per Siswa</h3>
                <p className="text-xs text-gray-400 mt-0.5">{rekap.length} siswa</p>
              </div>
            </div>
            {rekap.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">Tidak ada data absensi di periode ini.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr>
                    <th className="table-th">#</th>
                    <th className="table-th">Nama Siswa</th>
                    <th className="table-th">Kelas</th>
                    <th className="table-th">Ekskul</th>
                    <th className="table-th text-emerald-600">Hadir</th>
                    <th className="table-th text-amber-600">Izin</th>
                    <th className="table-th text-red-600">Alfa</th>
                    <th className="table-th">% Hadir</th>
                    <th className="table-th">Keterangan</th>
                  </tr></thead>
                  <tbody>
                    {rekap.sort((a,b) => pct(b) - pct(a)).map((r, i) => {
                      const p = pct(r)
                      const k = ket(p)
                      return (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="table-td text-gray-400">{i+1}</td>
                          <td className="table-td font-medium text-gray-800">{r.nama}</td>
                          <td className="table-td">{r.kelas || '-'}</td>
                          <td className="table-td">{r.ekskul || '-'}</td>
                          <td className="table-td font-bold text-emerald-600">{r.hadir}</td>
                          <td className="table-td font-bold text-amber-600">{r.izin}</td>
                          <td className="table-td font-bold text-red-600">{r.alfa}</td>
                          <td className="table-td">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden w-16">
                                <div className="h-full rounded-full bg-blue-500" style={{ width: `${p}%` }} />
                              </div>
                              <span className="text-xs font-semibold text-gray-700">{p}%</span>
                            </div>
                          </td>
                          <td className="table-td"><span className={k.cls}>{k.label}</span></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {!loaded && (
        <div className="text-center py-20 text-gray-400">
          <div className="text-4xl mb-3">📊</div>
          <p className="font-medium">Pilih ekskul dan bulan, lalu klik Tampilkan Laporan.</p>
        </div>
      )}
    </div>
  )
}
