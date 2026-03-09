import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

export default function Register({ darkMode }) {
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const submit = async e => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const r = await api.post('/auth/register', form)
      login(r.data); navigate('/editor')
    } catch (err) { setError(err.response?.data?.message || 'Error al registrarse') }
    finally { setLoading(false) }
  }

  const inp = `w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900'}`

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className={`w-full max-w-sm rounded-2xl border p-8 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <h1 className={`text-2xl font-black mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Crear cuenta</h1>
        {error && <p className="text-red-500 text-sm mb-4 bg-red-50 border border-red-200 px-3 py-2 rounded-xl">{error}</p>}
        <form onSubmit={submit} className="space-y-4">
          <input className={inp} placeholder="Nombre de usuario" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
          <input className={inp} type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          <input className={inp} type="password" placeholder="Contraseña" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
          <button disabled={loading} className="w-full bg-violet-600 text-white font-bold py-3 rounded-xl hover:bg-violet-700 transition disabled:opacity-50">
            {loading ? 'Registrando...' : 'Crear cuenta'}
          </button>
        </form>
        <p className={`text-sm mt-4 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          ¿Ya tenés cuenta? <Link to="/login" className="text-violet-600 font-medium hover:underline">Iniciar sesión</Link>
        </p>
      </div>
    </div>
  )
}
