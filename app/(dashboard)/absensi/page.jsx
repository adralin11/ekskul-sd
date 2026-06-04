'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Save, Printer } from 'lucide-react'

export default function AbsensiPage() {
  const supabase = createClient()
  const [ekskul, setEkskul] = useState([])
  const [selectedEkskul, setSelectedEkskul] = useState('')
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0])
  const [siswaList, setSiswaList] = useState([])
  const [absensi, setAbsensi] = useState({}) // { siswa_id: 'hadir'|'izin'|'alfa' }
  const [sesiId, setSesiId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => { loadEkskul() }, [])
  useEffect(() => { if (selectedEkskul) loadSiswa() }, [selectedEkskul, tanggal])

  async function loadEkskul() {
    const { data } = await supabase.from('ekskul').select('*').eq('aktif', true).order('nama')
    setEkskul(data || [])
    if (data?.length) setSelectedEkskul(data[0].id)
  }

  async function loadSiswa() {
    setLoading(true); setSaved(false)
    // Ambil siswa yang terdaftar & diterima di ekskul ini
    const { data: daftar } = await supabase
      .from('pendaftaran')
      .select('siswa_id, profiles(id, nama, kelas)')
      .eq('ekskul_id', selectedEkskul)
      .eq('status', 'diterima')
    setSiswaList(daftar?.map(d => d.profiles) || [])

    // Cek sesi latihan hari ini
    const { data: sesi } = await supabase
      .from('sesi_latihan')
      .select('*')
      .eq('ekskul_id', selectedEkskul)
      .eq('tanggal', tanggal)
      .maybeSingle()

    if (sesi) {
      setSesiId(sesi.id)
      const { data: absen } = await supabase
        .from('absensi')
        .select('*')
        .eq('sesi_id', sesi.id)
      const map = {}
      absen?.forEach(a => { map[a.siswa_id] = a.status })
      setAbsensi(map)
    } else {
      setSesiId(null)
      // Default semua hadir
      const map = {}
      daftar?.forEach(d => { map[d.siswa_id] = 'hadir' })
      setAbsensi(map)
    }
    setLoading(false)
  }

  async function simpan() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    let id = sesiId

    if (!id) {
      // Hitung sesi ke berapa
      const { count } = await supabase.from('sesi_latihan').select('*', { count: 'exact', head: true }).eq('ekskul_id', selectedEkskul)
      const { data: sesi } = await supabase.from('sesi_latihan').insert({
        ekskul_id: selectedEkskul, tanggal, sesi_ke: (count || 0) + 1, created_by: user.id
      }).select().single()
      id = sesi.id
      setSesiId(id)
    }

    // Upsert absensi
    const rows = Object.entries(absensi).map(([siswa_id, status]) => ({
      sesi_id: id, siswa_id, status
    }))
    await supabase.from('absensi').upsert(rows, { onConflict: 'sesi_id,siswa_id' })
    setSaving(false); setSaved(true)
  }

  const setStatus = (siswa_id, status) => setAbsensi(prev => ({ ...prev, [siswa_id]: status }))

  const stats = {
    hadir: Object.values(absensi).filter(s => s === 'hadir').length,
    izin: Object.values(absensi).filter(s => s === 'izin').length,
    alfa: Object.values(absensi).filter(s => s === 'alfa').length,
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="card mb-5">
        <div className="card-body">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[160px]">
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Ekskul</label>
              <select className="select w-full" value={selectedEkskul} onChange={e => setSelectedEkskul(e.target.value)}>
                {ekskul.map(e => <option key={e.id} value={e.id}>{e.icon} {e.nama}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Tanggal</label>
              <input type="date" className="input py-2 text-sm" value={tanggal} onChange={e => setTanggal(e.target.value)} />
            </div>
            <div className="flex gap-2 ml-auto">
              <button className="btn-outline text-sm py-2"><Printer size={14} /> Cetak</button>
              <button onClick={simpan} disabled={saving || siswaList.length === 0} className="btn-success text-sm py-2">
                <Save size={14} /> {saving ? 'Menyimpan...' : saved ? 'Tersimpan ✓' : 'Simpan'}
              </button>
            </div>
          </div>

          {/* Stats */}
          {siswaList.length > 0 && (
            <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
              <div className="text-sm"><span className="font-bold text-emerald-600">{stats.hadir}</span> <span className="text-gray-400">Hadir</span></div>
              <div className="text-sm"><span className="font-bold text-amber-600">{stats.izin}</span> <span className="text-gray-400">Izin</span></div>
              <div className="text-sm"><span className="font-bold text-red-600">{stats.alfa}</span> <span className="text-gray-400">Alfa</span></div>
              <div className="text-sm text-gray-400">Total: {siswaList.length} siswa</div>
            </div>
          )}
        </div>
      </div>

      {/* Absensi grid */}
      {loading ? (
        <div className="flex items-center justify-center h-32"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : siswaList.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="font-medium">Belum ada siswa terdaftar di ekskul ini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {siswaList.map(s => {
            const status = absensi[s.id] || 'hadir'
            return (
              <div key={s.id} className={`flex items-center justify-between p-3.5 rounded-xl border-2 transition-all bg-white
                ${status === 'hadir' ? 'border-emerald-200' : status === 'izin' ? 'border-amber-200' : 'border-red-200'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-sm flex-shrink-0
                    ${status === 'hadir' ? 'bg-emerald-100 text-emerald-700' : status === 'izin' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                    {s.nama?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-gray-800">{s.nama}</div>
                    <div className="text-xs text-gray-400">Kelas {s.kelas || '-'}</div>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {[['hadir','H','emerald'], ['izin','I','amber'], ['alfa','A','red']].map(([val, label, color]) => (
                    <button key={val} onClick={() => setStatus(s.id, val)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all
                        ${status === val
                          ? `bg-${color}-500 text-white shadow-sm`
                          : `bg-${color}-50 text-${color}-600 hover:bg-${color}-500 hover:text-white`}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
