'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const ROLES = ['Siswa', 'Pembina', 'Kepala Sekolah']

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [tab, setTab] = useState('Siswa')
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [form, setForm] = useState({ email: '', password: '', nama: '', kelas: '', nis: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  async function doLogin(e) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email, password: form.password
    })
    if (error) { setError('Email atau password salah.'); setLoading(false); return }
    router.push('/dashboard')
    router.refresh()
  }

  async function doRegister(e) {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess('')
    const roleMap = { Siswa: 'siswa', Pembina: 'pembina', 'Kepala Sekolah': 'kepala_sekolah' }
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          nama: form.nama,
          role: roleMap[tab],
          kelas: form.kelas,
          nis: form.nis,
        }
      }
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    setSuccess('Akun berhasil dibuat! Silakan login.')
    setMode('login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5"
      style={{ background: 'linear-gradient(135deg,#0F172A 0%,#1E3A8A 50%,#0F172A 100%)' }}>

      {/* BG decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-30 pointer-events-none"
        style={{ background: 'radial-gradient(circle,#2563EB 0%,transparent 70%)', transform: 'translate(30%,-30%)' }} />
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle,#0EA5E9 0%,transparent 70%)', transform: 'translate(-30%,30%)' }} />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-2xl shadow-2xl p-8 sm:p-10">

          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
              style={{ background: 'linear-gradient(135deg,#2563EB,#0EA5E9)' }}>
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <h1 className="font-display text-2xl font-bold text-gray-900 leading-tight">
              Sistem Informasi<br />Ekstrakurikuler SD
            </h1>
            <p className="text-sm text-gray-400 mt-1">Masuk sesuai peran Anda</p>
          </div>

          {/* Role Tabs */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6 gap-1">
            {ROLES.map(r => (
              <button key={r} onClick={() => setTab(r)}
                className={`flex-1 py-2 px-2 rounded-md text-xs font-semibold transition-all ${tab === r ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                {r}
              </button>
            ))}
          </div>

          {/* Mode toggle */}
          <div className="flex gap-3 mb-6 border-b border-gray-100 pb-4">
            <button onClick={() => { setMode('login'); setError('') }}
              className={`text-sm font-semibold pb-1 border-b-2 transition-all ${mode === 'login' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}>
              Masuk
            </button>
            <button onClick={() => { setMode('register'); setError('') }}
              className={`text-sm font-semibold pb-1 border-b-2 transition-all ${mode === 'register' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}>
              Daftar Akun Baru
            </button>
          </div>

          {/* Error / Success */}
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
          {success && <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">{success}</div>}

          {/* Form */}
          <form onSubmit={mode === 'login' ? doLogin : doRegister} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nama Lengkap</label>
                  <input name="nama" value={form.nama} onChange={handle} placeholder="Masukkan nama lengkap"
                    className="input" required />
                </div>
                {tab === 'Siswa' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">NIS</label>
                      <input name="nis" value={form.nis} onChange={handle} placeholder="NIS"
                        className="input" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Kelas</label>
                      <select name="kelas" value={form.kelas} onChange={handle} className="input">
                        <option value="">Pilih Kelas</option>
                        {['1A','1B','2A','2B','3A','3B','4A','4B','5A','5B','6A','6B'].map(k =>
                          <option key={k} value={k}>{k}</option>
                        )}
                      </select>
                    </div>
                  </div>
                )}
              </>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
              <input type="email" name="email" value={form.email} onChange={handle}
                placeholder="email@sekolah.com" className="input" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
              <input type="password" name="password" value={form.password} onChange={handle}
                placeholder="••••••••" className="input" required minLength={6} />
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-3 mt-2 font-display text-sm">
              {loading ? 'Memproses...' : mode === 'login' ? 'Masuk' : 'Buat Akun'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
