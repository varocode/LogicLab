import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'

export default function Share({ darkMode }) {
  const { shareId } = useParams()
  const navigate = useNavigate()
  const [expr, setExpr] = useState(null)
  const [table, setTable] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    api.get(`/expressions/share/${shareId}`)
      .then(async r => {
        setExpr(r.data)
        const tableRes = await api.post('/logic/evaluate', { expression: r.data.input })
        setTable(tableRes.data)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [shareId])

  const card = `rounded-2xl border p-5 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`
  const CLASS_COLORS = { tautology: 'text-green-600', contradiction: 'text-red-500', contingency: 'text-yellow-600' }
  const CLASS_LABELS = { tautology: 'Tautología', contradiction: 'Contradicción', contingency: 'Contingencia' }

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>Cargando expresión compartida...</div>
    </div>
  )

  if (error) return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="text-6xl mb-4">🔍</div>
      <h2 className={`text-xl font-black mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Expresión no encontrada</h2>
      <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>El enlace compartido no existe o ha expirado.</p>
      <button onClick={() => navigate('/editor')} className="bg-violet-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-violet-700 transition text-sm">
        Ir al editor
      </button>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-2 text-sm">
        <button onClick={() => navigate('/editor')} className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>← Editor</button>
        <span className={darkMode ? 'text-gray-600' : 'text-gray-300'}>/</span>
        <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Expresión compartida</span>
      </div>

      {/* Header */}
      <div className={card}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs bg-violet-100 text-violet-700 font-bold px-2 py-1 rounded-full">Compartido</span>
              <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                por {expr?.name || 'Anónimo'} • {new Date(expr?.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className={`text-xl font-mono font-bold mt-1 ${darkMode ? 'text-violet-300' : 'text-violet-700'}`}>
              {expr?.input}
            </div>
          </div>
          {table && (
            <span className={`text-sm font-bold shrink-0 ${CLASS_COLORS[table.classification]}`}>
              {CLASS_LABELS[table.classification]}
            </span>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => navigate(`/editor?expr=${encodeURIComponent(expr.input)}`)}
            className="bg-violet-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-violet-700 transition text-sm">
            Abrir en editor
          </button>
          <button
            onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Enlace copiado') }}
            className={`px-4 py-2 rounded-xl font-bold border transition text-sm ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            📋 Copiar enlace
          </button>
        </div>
      </div>

      {/* Truth Table */}
      {table && (
        <div className={card}>
          <h2 className={`text-sm font-bold uppercase tracking-wide mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tabla de Verdad</h2>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full">
              <thead>
                <tr>
                  {table.variables.map(v => (
                    <th key={v} className={`px-4 py-2 text-xs font-bold text-center border-b ${darkMode ? 'border-gray-600 text-blue-300 bg-gray-700' : 'border-gray-200 text-blue-700 bg-gray-50'}`}>{v}</th>
                  ))}
                  {table.subExpressions.map(s => (
                    <th key={s} className={`px-4 py-2 text-xs font-bold text-center border-b font-mono ${darkMode ? 'border-gray-600 text-gray-300 bg-gray-700' : 'border-gray-200 text-gray-600 bg-gray-50'}`}>{s}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, ri) => (
                  <tr key={ri}>
                    {table.variables.map(v => (
                      <td key={v} className={`px-2 py-1.5 text-center border-b text-sm ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                        <span className={`px-2 py-0.5 rounded font-bold text-xs font-mono ${row[v] ? (darkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-700') : (darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500')}`}>
                          {row[v] ? '1' : '0'}
                        </span>
                      </td>
                    ))}
                    {table.subExpressions.map(s => (
                      <td key={s} className={`px-2 py-1.5 text-center border-b text-sm ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                        <span className={`px-2 py-0.5 rounded font-bold text-xs font-mono ${row[s] ? (darkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700') : (darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500')}`}>
                          {row[s] ? '1' : '0'}
                        </span>
                      </td>
                    ))}
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
