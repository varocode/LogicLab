import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

export default function Leaderboard({ darkMode }) {
  const navigate = useNavigate()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [limit, setLimit] = useState(20)

  useEffect(() => {
    api.get(`/leaderboard?limit=${limit}`).then(r => setEntries(r.data)).finally(() => setLoading(false))
  }, [limit])

  const card = `rounded-2xl border p-5 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`

  const rankBg = (rank) => {
    if (rank === 1) return 'bg-yellow-400 text-yellow-900'
    if (rank === 2) return 'bg-gray-300 text-gray-700'
    if (rank === 3) return 'bg-amber-600 text-white'
    return darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-500'
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>🏆 Tabla de clasificación</h1>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Los mejores lógicos de LogicLab</p>
        </div>
        <select value={limit} onChange={e => setLimit(Number(e.target.value))}
          className={`border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500 ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-200'}`}>
          <option value={10}>Top 10</option>
          <option value={20}>Top 20</option>
          <option value={50}>Top 50</option>
        </select>
      </div>

      {/* Top 3 Podium */}
      {!loading && entries.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 mb-2">
          {[entries[1], entries[0], entries[2]].map((entry, i) => {
            const heights = ['h-28', 'h-36', 'h-24']
            const icons = ['🥈', '🥇', '🥉']
            return (
              <div key={entry.userId} className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-black bg-violet-100 text-violet-700 mb-2 cursor-pointer hover:ring-2 ring-violet-400`}
                  onClick={() => navigate(`/profile/${entry.userId}`)}>
                  {entry.username[0].toUpperCase()}
                </div>
                <div className={`text-xs font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{entry.username}</div>
                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{entry.xp} XP</div>
                <div className={`w-full ${heights[i]} rounded-t-xl flex items-end justify-center pb-2 mt-2 ${
                  i === 1 ? 'bg-yellow-400' : i === 0 ? 'bg-gray-300' : 'bg-amber-600'
                }`}>
                  <span className="text-2xl">{icons[i]}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className={card}>
        {loading ? (
          <div className="space-y-3">{[...Array(8)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
          ))}</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">🏆</div>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Nadie en el ranking aún</p>
          </div>
        ) : (
          <div className="space-y-1">
            {entries.map(entry => (
              <div key={entry.userId}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition cursor-pointer ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                onClick={() => navigate(`/badges/user/${entry.userId}`)}>
                {/* Rank */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${rankBg(entry.rank)}`}>
                  {entry.rank <= 3 ? ['🥇','🥈','🥉'][entry.rank - 1] : entry.rank}
                </div>

                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-black shrink-0">
                  {entry.username[0].toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{entry.username}</span>
                    {entry.topBadges.slice(0, 3).map(b => (
                      <span key={b.key} title={b.name} className="text-base">{b.icon}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>{entry.exercisesCompleted} ejercicios</span>
                    {entry.streak > 0 && <span className="text-orange-500">🔥 {entry.streak} días</span>}
                  </div>
                </div>

                {/* XP */}
                <div className="text-right shrink-0">
                  <div className={`font-black text-sm ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>⚡ {entry.xp}</div>
                  <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>XP</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
