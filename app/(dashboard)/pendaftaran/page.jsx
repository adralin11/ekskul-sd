'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { CheckCircle, Clock, XCircle, Plus } from 'lucide-react'

export default function PendaftaranPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState(null)
  const [pendaftaran, setPendaftaran] = useState([])
  const [ekskul, setEkskul] = useState([])
  const [loading, setLoading] = useState(true)
  const [mendaftar, setMendaftar] = useState(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(prof)

    if (prof?.role === 'siswa') {
      const { data: daftar } = await supabase
        .from('pendaftaran')
        .select('*, ekskul(*)')
        .eq('siswa_id', user.id)
        .order('tanggal_daftar', { ascending: false })
      setPendaftaran(daftar || [])

      const { data: eks } = await supabase.from('ekskul').select('*').eq('aktif', true).order('nama')
      setEkskul(eks || [])
    } else {
      // Pembina / Kepsek lihat semua
      const { data: daftar } = await supabase
        .from('pendaftaran')
        .select('*, profiles(nama, kelas, nis), ekskul(nama)')
        .order('tanggal_daftar', { ascending: false })
      setPendaftaran(daftar || [])
    }
    setLoading(false)
  }

  async function daftar(ekskul_id) {
    setSaving(true); setMsg('')
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('pendaftaran').insert({ siswa_id: user.id, ekskul_id, status: 'proses' })
    setSaving(false)
    if (error) { setMsg('Kamu sudah mendaftar ekskul ini!'); return }
    setMsg('Pendaftaran berhasil! Menunggu konfirmasi pembina.')
    setMendaftar(null)
    load()
  }

  async function ubahStatus(id, status) {
    await supabase.from('pendaftaran').update({ status }).eq('id', id)
    load()
  }

  const role = profile?.role
  const sudahDaftar = pendaftaran.filter(p => p.status === 'diterima').map(p => p.ekskul_id)

  if (loading) return <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      {msg && (
        <div className={`mb-4 p-3 rounded-xl text-sm ${msg.includes('berhasil') ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {msg}
        </div>
      )}

      {/* SISWA VIEW */}
      {role === 'siswa' && (
        <>
          {/* Form daftar */}
          <div className="card mb-5">
            <div className="card-header">
              <div>
                <h3 className="font-display font-bold text-gray-900">Daftar Ekskul Baru</h3>
                <p className="text-xs text-gray-400 mt-0.5">Pilih ekskul yang ingin kamu ikuti</p>
              </div>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ekskul.filter(e => !sudahDaftar.includes(e.id)).map(e => (
                  <div key={e.id} className={`flex items-center justify-between p-3.5 rounded-xl border-2 transition-all
                    ${mendaftar === e.id ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-blue-200'}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{e.icon}</span>
                      <div>
                        <div className="font-semibold text-sm text-gray-800">{e.nama}</div>
                        <div className="text-xs text-gray-400">{e.hari} • {e.jam_mulai?.slice(0,5)}–{e.jam_selesai?.slice(0,5)}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => mendaftar === e.id ? daftar(e.id) : setMendaftar(e.id)}
                      disabled={saving}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${mendaftar === e.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-blue-600 hover:text-white'}`}>
                      {mendaftar === e.id ? (saving ? 'Mendaftar...' : 'Konfirmasi') : 'Daftar'}
                    </button>
                  </div>
                ))}
                {ekskul.filter(e => !sudahDaftar.includes(e.id)).length === 0 && (
                  <p className="text-sm text-gray-400 col-span-2 py-4 text-center">Kamu sudah mendaftar semua ekskul yang tersedia.</p>
                )}
              </div>
            </div>
          </div>

          {/* Status pendaftaran siswa */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="font-display font-bold text-gray-900">Status Pendaftaran Saya</h3>
                <p className="text-xs text-gray-400 mt-0.5">{pendaftaran.length} pendaftaran</p>
              </div>
            </div>
            {pendaftaran.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Plus size={36} className="mx-auto mb-2 opacity-40" />
                <p className="font-medium text-sm">Belum ada pendaftaran</p>
                <p className="text-xs mt-1">Daftar ekskul di atas untuk memulai</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr>
                    <th className="table-th">Ekskul</th>
                    <th className="table-th">Hari & Jam</th>
                    <th className="table-th">Tempat</th>
                    <th className="table-th">Status</th>
                  </tr></thead>
                  <tbody>
                    {pendaftaran.map(d => (
                      <tr key={d.id} className="hover:bg-gray-50">
                        <td className="table-td font-medium text-gray-800">
                          <div className="flex items-center gap-2">
                            <span>{d.ekskul?.icon}</span> {d.ekskul?.nama}
                          </div>
                        </td>
                        <td className="table-td">{d.ekskul?.hari} • {d.ekskul?.jam_mulai?.slice(0,5)}–{d.ekskul?.jam_selesai?.slice(0,5)}</td>
                        <td className="table-td">{d.ekskul?.tempat || '-'}</td>
                        <td className="table-td">
                          {d.status === 'diterima' && <span className="badge-green flex items-center gap-1 w-fit"><CheckCircle size={11}/>Diterima</span>}
                          {d.status === 'proses' && <span className="badge-amber flex items-center gap-1 w-fit"><Clock size={11}/>Proses</span>}
                          {d.status === 'ditolak' && <span className="badge-red flex items-center gap-1 w-fit"><XCircle size={11}/>Ditolak</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* PEMBINA VIEW */}
      {role === 'pembina' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="font-display font-bold text-gray-900">Semua Pendaftaran</h3>
              <p className="text-xs text-gray-400 mt-0.5">{pendaftaran.length} total pendaftaran</p>
            </div>
            <div className="flex gap-2">
              <select className="select text-xs" onChange={e => {}} >
                <option value="">Semua Ekskul</option>
              </select>
              <select className="select text-xs">
                <option value="">Semua Status</option>
                <option value="proses">Proses</option>
                <option value="diterima">Diterima</option>
                <option value="ditolak">Ditolak</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr>
                <th className="table-th">Nama Siswa</th>
                <th className="table-th">Kelas</th>
                <th className="table-th">NIS</th>
                <th className="table-th">Ekskul</th>
                <th className="table-th">Tanggal Daftar</th>
                <th className="table-th">Status</th>
                {role === 'pembina' && <th className="table-th">Aksi</th>}
              </tr></thead>
              <tbody>
                {pendaftaran.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="table-td font-medium text-gray-800">{d.profiles?.nama}</td>
                    <td className="table-td">{d.profiles?.kelas || '-'}</td>
                    <td className="table-td">{d.profiles?.nis || '-'}</td>
                    <td className="table-td">{d.ekskul?.nama}</td>
                    <td className="table-td">{new Date(d.tanggal_daftar).toLocaleDateString('id-ID')}</td>
                    <td className="table-td">
                      {d.status === 'diterima' && <span className="badge-green">Diterima</span>}
                      {d.status === 'proses' && <span className="badge-amber">Proses</span>}
                      {d.status === 'ditolak' && <span className="badge-red">Ditolak</span>}
                    </td>
                    <td className="table-td">
                      {d.status === 'proses' && (
                        <div className="flex gap-1.5">
                          <button onClick={() => ubahStatus(d.id, 'diterima')}
                            className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-500 hover:text-white transition-all font-semibold">
                            Terima
                          </button>
                          <button onClick={() => ubahStatus(d.id, 'ditolak')}
                            className="text-xs px-2.5 py-1 bg-red-50 text-red-700 rounded-lg hover:bg-red-500 hover:text-white transition-all font-semibold">
                            Tolak
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* KEPSEK VIEW */}
      {role === 'kepala_sekolah' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="font-display font-bold text-gray-900">Data Pendaftaran</h3>
              <p className="text-xs text-gray-400 mt-0.5">Mode lihat saja</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr>
                <th className="table-th">Nama Siswa</th>
                <th className="table-th">Kelas</th>
                <th className="table-th">Ekskul</th>
                <th className="table-th">Tanggal</th>
                <th className="table-th">Status</th>
              </tr></thead>
              <tbody>
                {pendaftaran.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="table-td font-medium text-gray-800">{d.profiles?.nama}</td>
                    <td className="table-td">{d.profiles?.kelas || '-'}</td>
                    <td className="table-td">{d.ekskul?.nama}</td>
                    <td className="table-td">{new Date(d.tanggal_daftar).toLocaleDateString('id-ID')}</td>
                    <td className="table-td">
                      {d.status === 'diterima' && <span className="badge-green">Diterima</span>}
                      {d.status === 'proses' && <span className="badge-amber">Proses</span>}
                      {d.status === 'ditolak' && <span className="badge-red">Ditolak</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
