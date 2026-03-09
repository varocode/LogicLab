import { useState, useRef } from 'react'
import api from '../api/axios'
import SymbolKeyboard from '../components/SymbolKeyboard'

const GROUP_COLORS = ['bg-red-200/60', 'bg-blue-200/60', 'bg-green-200/60', 'bg-yellow-200/60', 'bg-purple-200/60', 'bg-pink-200/60']

export default function KMap({ darkMode }) {
  const [input, setInput] = useState('A AND B OR NOT A AND C')
  const [kmap, setKmap] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)

  const evaluate = async () => {
    setLoading(true); setError('')
    try {
      const r = await api.post('/logic/kmap', { expression: input })
      setKmap(r.data)
    } catch (err) { setError(err.response?.data?.message || 'Error: K-Map requiere 2-4 variables') }
    finally { setLoading(false) }
  }

  const insert = (s) => {
    const el = inputRef.current
    if (!el) { setInput(prev => prev + s); return }
    const start = el.selectionStart, end = el.selectionEnd
    const newVal = input.slice(0, start) + s + input.slice(end)
    setInput(newVal)
    setTimeout(() => { el.setSelectionRange(start + s.length, start + s.length); el.focus() }, 0)
  }

  const card = `rounded-2xl border p-5 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      <h1 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Mapa de Karnaugh</h1>

      <div className={card}>
        <div className="flex gap-2 mb-3">
          <input ref={inputRef}
            className={`flex-1 border rounded-xl px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-violet-500 ${darkMode ? 'bg-gray-900 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'}`}
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && evaluate()}
            placeholder="Ej: A AND B OR NOT C (2-4 variables)" />
          <button onClick={evaluate} disabled={loading}
            className="bg-violet-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-violet-700 transition disabled:opacity-50 shrink-0">
            {loading ? '...' : 'Generar'}
          </button>
        </div>
        <SymbolKeyboard onInsert={insert} darkMode={darkMode} />
        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
        <p className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Soporta 2, 3 y 4 variables (A-D)</p>
      </div>

      {kmap && (
        <div className={card}>
          <h2 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            K-Map — {kmap.varCount} variable{kmap.varCount > 1 ? 's' : ''}
          </h2>
          <div className="overflow-x-auto">
            <table className="border-collapse mx-auto">
              <thead>
                <tr>
                  <th className={`w-20 h-12 border ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}></th>
                  {kmap.colHeaders.map((h, i) => (
                    <th key={i} className={`px-4 h-12 text-xs font-mono font-bold border ${darkMode ? 'border-gray-600 text-violet-300 bg-gray-700' : 'border-gray-300 text-violet-700 bg-violet-50'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {kmap.rowHeaders.map((rh, ri) => (
                  <tr key={ri}>
                    <td className={`px-3 h-12 text-xs font-mono font-bold border text-center ${darkMode ? 'border-gray-600 text-violet-300 bg-gray-700' : 'border-gray-300 text-violet-700 bg-violet-50'}`}>{rh}</td>
                    {kmap.cells.filter(c => c.row === ri).map((cell, ci) => (
                      <td key={ci} className={`w-16 h-16 text-center border font-bold text-lg font-mono transition ${
                        darkMode ? 'border-gray-600' : 'border-gray-300'
                      } ${cell.value
                        ? (darkMode ? 'bg-violet-700/40 text-violet-300' : 'bg-violet-100 text-violet-700')
                        : (darkMode ? 'bg-gray-800 text-gray-500' : 'bg-gray-50 text-gray-400')
                      }`}>
                        <div>{cell.value ? '1' : '0'}</div>
                        <div className={`text-xs font-normal ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}>{cell.minterm}</div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-violet-100 border border-violet-300"></div>
              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Celda = 1</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-100 border border-gray-300"></div>
              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Celda = 0</span>
            </div>
          </div>
          <div className={`mt-4 px-4 py-3 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <p className={`text-xs font-bold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>EXPRESIÓN ORIGINAL</p>
            <p className={`text-sm font-mono ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{kmap.expression}</p>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className={card}>
        <h2 className={`text-sm font-bold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>¿Cómo leer el K-Map?</h2>
        <div className={`space-y-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <p>• Los encabezados usan <strong>código Gray</strong> (solo 1 bit cambia entre columnas/filas adyacentes)</p>
          <p>• Los <strong>unos (1)</strong> representan minterms donde la función es verdadera</p>
          <p>• Agrupa unos en potencias de 2 (1, 2, 4, 8...) en bloques rectangulares para simplificar</p>
          <p>• Los bordes del mapa se consideran adyacentes (wrap-around)</p>
        </div>
      </div>
    </div>
  )
}
