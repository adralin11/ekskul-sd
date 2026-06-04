'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Plus, Edit2 } from 'lucide-react'

const WARNA_MAP = {
  blue: 'from-blue-500 to-cyan-400',
  amber: 'from-amber-500 to-orange-400',
  green: 'from-emerald-500 to-teal-400',
  purple: 'from-violet-500 to-purple-400',
  red: 'from-red-500 to-orange-400',
  pink: 'from-pink-500 to-violet-400',
}

export default function EkskulPage() {
  const supabase = createClient()
  const [ekskul, setEkskul] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nama: '', deskripsi: '', hari: '', jam_mulai: '', jam_selesai: '', tempat: '', kuota: 30, icon: '🎽', warna: 'blue' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(prof)
    const { data } = await supabase.from('ekskul').select('*, profiles(nama)').eq('aktif', true).order('nama')
    setEkskul(data || [])
    setLoading(false)
  }

  async function saveEkskul(e) {
    e.preventDefault(); setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('ekskul').insert({ ...form, pembina_id: user.id })
    setSaving(false); setShowForm(false)
    setForm({ nama: '', deskripsi: '', hari: '', jam_mulai: '', jam_selesai: '', tempat: '', kuota: 30, icon: '🎽', warna: 'blue' })
    load()
  }

  const role = profile?.role
  const canEdit = role === 'pembina'

  if (loading) return <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      {role === 'kepala_sekolah' && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
          Mode lihat saja — Kepala Sekolah tidak dapat mengedit data.
        </div>
      )}

      {canEdit && (
        <div className="flex justify-end mb-5">
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            <Plus size={15} /> Tambah Ekskul
          </button>
        </div>
      )}

      {/* Form Tambah */}
      {showForm && (
        <div className="card mb-6">
          <div className="card-header"><h3 className="font-display font-bold text-gray-900">Tambah Ekskul Baru</h3></div>
          <form onSubmit={saveEkskul} className="card-body grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nama Ekskul</label>
              <input className="input" value={form.nama} onChange={e => setForm({...form, nama: e.target.value})} required placeholder="Nama ekstrakurikuler" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Deskripsi</label>
              <textarea className="input" rows={2} value={form.deskripsi} onChange={e => setForm({...form, deskripsi: e.target.value})} placeholder="Deskripsi singkat" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Hari</label>
              <input className="input" value={form.hari} onChange={e => setForm({...form, hari: e.target.value})} required placeholder="Senin & Rabu" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tempat</label>
              <input className="input" value={form.tempat} onChange={e => setForm({...form, tempat: e.target.value})} placeholder="Lapangan / Aula" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Jam Mulai</label>
              <input type="time" className="input" value={form.jam_mulai} onChange={e => setForm({...form, jam_mulai: e.target.value})} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Jam Selesai</label>
              <input type="time" className="input" value={form.jam_selesai} onChange={e => setForm({...form, jam_selesai: e.target.value})} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Icon</label>
              <input className="input" value={form.icon} onChange={e => setForm({...form, icon: e.target.value})} placeholder="⚽ 🎨 🎵" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Kuota Siswa</label>
              <input type="number" className="input" value={form.kuota} onChange={e => setForm({...form, kuota: parseInt(e.target.value)})} min={1} />
            </div>
            <div className="sm:col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Batal</button>
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Grid Ekskul */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ekskul.map(ek => (
          <div key={ek.id} className="card hover:-translate-y-1 hover:shadow-md transition-all cursor-default">
            <div className={`h-1 bg-gradient-to-r ${WARNA_MAP[ek.warna] || WARNA_MAP.blue}`} />
            <div className="p-5">
              <div className="text-3xl mb-3">{ek.icon}</div>
              <h4 className="font-display font-bold text-gray-900 mb-1">{ek.nama}</h4>
              <p className="text-xs text-gray-400 mb-3">Pembina: {ek.profiles?.nama || '-'}</p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {[ek.hari, `${ek.jam_mulai?.slice(0,5)}–${ek.jam_selesai?.slice(0,5)}`, `${ek.kuota} kuota`].map(t => (
                  <span key={t} className="text-xs px-2 py-1 bg-gray-100 rounded-md text-gray-500 font-medium">{t}</span>
                ))}
                {ek.tempat && <span className="text-xs px-2 py-1 bg-gray-100 rounded-md text-gray-500 font-medium">{ek.tempat}</span>}
              </div>
              {canEdit && (
                <button className="btn-outline text-xs py-1.5 px-3 w-full justify-center">
                  <Edit2 size={12} /> Edit
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {ekskul.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">🎽</div>
          <p className="font-medium">Belum ada ekskul.</p>
          {canEdit && <p className="text-sm mt-1">Klik Tambah Ekskul untuk memulai.</p>}
        </div>
      )}
    </div>
  )
}
