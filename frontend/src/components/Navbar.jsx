import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { to: '/editor', label: 'Editor', icon: '⊕' },
  { to: '/analysis', label: 'Análisis', icon: '🔍' },
  { to: '/kmap', label: 'K-Map', icon: '🗺️' },
  { to: '/tree', label: 'Árbol', icon: '🌳' },
  { to: '/exercises', label: 'Ejercicios', icon: '✏️' },
  { to: '/leaderboard', label: 'Ranking', icon: '🏆' },
  { to: '/reference', label: 'Referencia', icon: '📚' },
]

export default function Navbar({ darkMode, setDarkMode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav className={`sticky top-0 z-50 border-b ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link to="/" className="text-lg font-black text-violet-600 shrink-0">LogicLab</Link>

        <div className="flex items-center gap-0.5 overflow-x-auto">
          {NAV.map(n => (
            <Link key={n.to} to={n.to}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                pathname.startsWith(n.to)
                  ? 'bg-violet-100 text-violet-700'
                  : darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
              }`}>
              {n.icon} {n.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setDarkMode(!darkMode)}
            className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center transition ${darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {darkMode ? '☀️' : '🌙'}
          </button>
          {user ? (
            <>
              <Link to="/profile" className={`text-sm font-medium transition ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                <span className="hidden sm:inline">{user.username}</span>
                <span className="sm:hidden">👤</span>
              </Link>
              <button onClick={() => { logout(); navigate('/') }}
                className="text-sm text-gray-500 hover:text-red-500 transition">Salir</button>
            </>
          ) : (
            <>
              <Link to="/login" className={`text-sm font-medium transition ${darkMode ? 'text-gray-300' : 'text-gray-600 hover:text-gray-900'}`}>Entrar</Link>
              <Link to="/register" className="bg-violet-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-violet-700 transition">Registrarse</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
