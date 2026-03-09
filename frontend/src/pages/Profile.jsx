import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

export default function Profile({ darkMode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [expressions, setExpressions] = useState([])
  const [myExercises, setMyExercises] = useState([])
  const [badges, setBadges] = useState([])
  const [allBadges, setAllBadges] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('history')

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    Promise.all([
      api.get('/expressions/mine'),
      api.get('/exercises/mine'),
      api.get('/badges/mine'),
      api.get('/badges/all'),
    ]).then(([exRes, excRes, badgesRes, allBadgesRes]) => {
      setExpressions(exRes.data)
      setMyExercises(excRes.data)
      setBadges(badgesRes.data)
      setAllBadges(allBadgesRes.data)
    }).finally(() => setLoading(false))
  }, [user])

  const deleteExpression = async (id) => {
    await api.delete(`/expressions/${id}`)
    setExpressions(prev => prev.filter(e => e.id !== id))
  }

  const deleteExercise = async (id) => {
    if (!confirm('¿Eliminar ejercicio?')) return
    await api.delete(`/exercises/${id}`)
    setMyExercises(prev => prev.filter(e => e.id !== id))
  }

  const loadInEditor = (expr) => navigate(`/editor?expr=${encodeURIComponent(expr)}`)

  const card = `rounded-2xl border p-5 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`
  const DIFF_COLORS = { easy: 'bg-green-100 text-green-700', medium: 'bg-yellow-100 text-yellow-700', hard: 'bg-red-100 text-red-700' }
  const DIFF_LABELS = { easy: 'Fácil', medium: 'Medio', hard: 'Difícil' }
  const CLASS_COLORS = { tautology: 'text-green-600', contradiction: 'text-red-500', contingency: 'text-yellow-600' }

  const earnedKeys = new Set(badges.map(b => b.key))

  if (!user) return null

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      {/* Profile header */}
      <div className={card}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-2xl font-black">
            {user.username?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{user.username}</h1>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{user.email}</p>
          </div>
          <button onClick={() => { logout(); navigate('/') }} className="text-sm text-red-500 hover:text-red-700 transition">Salir</button>
        </div>
        <div className="grid grid-cols-4 gap-3 mt-4">
          {[
            { label: 'XP', value: user.xp ?? 0, icon: '⚡' },
            { label: 'Racha', value: `${user.streak ?? 0}d`, icon: '🔥' },
            { label: 'Expresiones', value: expressions.length, icon: '📊' },
            { label: 'Logros', value: `${badges.length}/${allBadges.length}`, icon: '🏅' },
          ].map(stat => (
            <div key={stat.label} className={`rounded-xl p-3 text-center ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="text-xl mb-1">{stat.icon}</div>
              <div className={`text-lg font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stat.value}</div>
              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'history', label: '📋 Historial' },
          { key: 'exercises', label: '✏️ Mis ejercicios' },
          { key: 'badges', label: `🏅 Logros (${badges.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
              tab === t.key ? 'bg-violet-600 text-white' : (darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
            }`}>{t.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : tab === 'badges' ? (
        <div className={card}>
          <h2 className={`text-sm font-bold uppercase tracking-wide mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Todos los logros — {badges.length}/{allBadges.length} desbloqueados
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {allBadges.map(b => {
              const earned = earnedKeys.has(b.key)
              return (
                <div key={b.key} className={`flex items-center gap-3 p-3 rounded-xl border transition ${
                  earned
                    ? (darkMode ? 'border-yellow-600/40 bg-yellow-900/10' : 'border-yellow-200 bg-yellow-50')
                    : (darkMode ? 'border-gray-700 opacity-40' : 'border-gray-100 opacity-50')
                }`}>
                  <span className={`text-3xl ${earned ? '' : 'grayscale'}`}>{b.icon}</span>
                  <div>
                    <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{b.name}</p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{b.description}</p>
                    {!earned && <p className={`text-xs font-bold mt-0.5 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}>Bloqueado</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : tab === 'history' ? (
        expressions.length === 0 ? (
          <div className={`text-center py-12 rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No hay expresiones guardadas</p>
            <button onClick={() => navigate('/editor')} className="mt-2 text-violet-600 text-sm hover:underline">Ir al editor</button>
          </div>
        ) : (
          <div className={card}>
            <div className="space-y-2">
              {expressions.map(e => (
                <div key={e.id} className={`flex items-center justify-between gap-3 px-3 py-2 rounded-xl ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-mono truncate block ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{e.input}</span>
                    <span className={`text-xs ${CLASS_COLORS[e.classification]}`}>{e.classification}</span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => loadInEditor(e.input)} className="text-xs text-violet-600 hover:underline">Abrir</button>
                    <button onClick={() => deleteExpression(e.id)} className="text-xs text-red-400 hover:text-red-600">✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ) : (
        myExercises.length === 0 ? (
          <div className={`text-center py-12 rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No has creado ejercicios aún</p>
            <button onClick={() => navigate('/exercises/create')} className="mt-2 text-violet-600 text-sm hover:underline">Crear ejercicio</button>
          </div>
        ) : (
          <div className="space-y-3">
            {myExercises.map(ex => (
              <div key={ex.id} className={`${card} flex items-center justify-between gap-3`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{ex.title}</h3>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${DIFF_COLORS[ex.difficulty]}`}>{DIFF_LABELS[ex.difficulty]}</span>
                  </div>
                  <p className={`text-xs font-mono mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{ex.expression}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => navigate(`/exercises/${ex.id}`)} className="text-xs text-violet-600 hover:underline">Ver</button>
                  <button onClick={() => deleteExercise(ex.id)} className="text-xs text-red-400 hover:text-red-600">✕</button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
