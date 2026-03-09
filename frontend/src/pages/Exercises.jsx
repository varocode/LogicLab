import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

const DIFF_COLORS = { easy: 'bg-green-100 text-green-700', medium: 'bg-yellow-100 text-yellow-700', hard: 'bg-red-100 text-red-700' }
const DIFF_LABELS = { easy: 'Fácil', medium: 'Medio', hard: 'Difícil' }

export default function Exercises({ darkMode }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const params = new URLSearchParams()
    if (filter) params.set('difficulty', filter)
    if (search) params.set('search', search)
    api.get(`/exercises?${params}`).then(r => setExercises(r.data)).finally(() => setLoading(false))
  }, [filter, search])

  const card = `rounded-2xl border p-5 cursor-pointer transition ${darkMode ? 'bg-gray-800 border-gray-700 hover:border-violet-500' : 'bg-white border-gray-200 hover:border-violet-300 hover:shadow-sm'}`

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Ejercicios</h1>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Practica lógica completando tablas de verdad</p>
        </div>
        {user && (
          <button onClick={() => navigate('/exercises/create')}
            className="bg-violet-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-violet-700 transition text-sm">
            + Crear ejercicio
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <input
          className={`flex-1 min-w-48 border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-violet-500 ${darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-200'}`}
          placeholder="Buscar ejercicios..." value={search} onChange={e => setSearch(e.target.value)} />
        {['', 'easy', 'medium', 'hard'].map(d => (
          <button key={d} onClick={() => setFilter(d)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              filter === d
                ? 'bg-violet-600 text-white'
                : (darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
            }`}>{d ? DIFF_LABELS[d] : 'Todos'}</button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">{[...Array(6)].map((_, i) => <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
      ) : exercises.length === 0 ? (
        <div className={`text-center py-16 rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="text-5xl mb-3">✏️</div>
          <p className={`font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>No hay ejercicios aún</p>
          {user && <button onClick={() => navigate('/exercises/create')} className="mt-3 text-violet-600 hover:underline text-sm">¡Crear el primero!</button>}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {exercises.map(ex => (
            <div key={ex.id} className={card} onClick={() => navigate(`/exercises/${ex.id}`)}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{ex.title}</h3>
                <span className={`text-xs font-bold px-2 py-1 rounded-full shrink-0 ${DIFF_COLORS[ex.difficulty]}`}>
                  {DIFF_LABELS[ex.difficulty]}
                </span>
              </div>
              <p className={`text-sm mb-3 line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{ex.description}</p>
              <div className="flex items-center justify-between text-xs">
                <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>Por {ex.author}</span>
                <div className="flex gap-3">
                  <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>{ex.attemptCount} intentos</span>
                  {ex.avgScore > 0 && <span className={darkMode ? 'text-green-400' : 'text-green-600'}>{ex.avgScore}% promedio</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
