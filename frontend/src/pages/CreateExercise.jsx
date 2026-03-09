import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import SymbolKeyboard from '../components/SymbolKeyboard'
import TruthTable from '../components/TruthTable'

const DIFF_OPTS = [
  { val: 'easy', label: 'Fácil', desc: 'Solo oculta el resultado final' },
  { val: 'medium', label: 'Medio', desc: 'Oculta sub-expresiones intermedias' },
  { val: 'hard', label: 'Difícil', desc: 'Oculta toda la tabla (solo variables visibles)' },
  { val: 'custom', label: 'Personalizado', desc: 'Elegís exactamente qué ocultar' },
]

export default function CreateExercise({ darkMode }) {
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ title: '', description: '', expression: '', difficulty: 'medium', tags: '', isPublic: true })
  const [table, setTable] = useState(null)
  const [error, setError] = useState('')
  const [evaluating, setEvaluating] = useState(false)
  const [hiddenCols, setHiddenCols] = useState([])
  const [hiddenCells, setHiddenCells] = useState([]) // [{row, column}]
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState(false)
  const [diffMode, setDiffMode] = useState('medium')

  const evaluateExpr = async () => {
    if (!form.expression.trim()) return
    setEvaluating(true); setError('')
    try {
      const r = await api.post('/logic/evaluate', { expression: form.expression })
      setTable(r.data)
      applyDiffMode(diffMode, r.data)
    } catch (err) { setError(err.response?.data?.message || 'Expresión inválida'); setTable(null) }
    finally { setEvaluating(false) }
  }

  const applyDiffMode = (mode, t = table) => {
    if (!t) return
    const { variables, subExpressions } = t
    const lastCol = subExpressions[subExpressions.length - 1]
    if (mode === 'easy') {
      setHiddenCols([lastCol]); setHiddenCells([])
    } else if (mode === 'medium') {
      setHiddenCols(subExpressions.slice(-Math.ceil(subExpressions.length / 2))); setHiddenCells([])
    } else if (mode === 'hard') {
      setHiddenCols(subExpressions); setHiddenCells([])
    } else if (mode === 'custom') {
      setHiddenCols([]); setHiddenCells([])
    }
  }

  const toggleColHidden = (col) => {
    setHiddenCols(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col])
  }

  const toggleCellHidden = (row, col) => {
    const key = `${row}:${col}`
    setHiddenCells(prev => {
      const exists = prev.find(c => c.row === row && c.column === col)
      return exists ? prev.filter(c => !(c.row === row && c.column === col)) : [...prev, { row, column: col }]
    })
  }

  const insert = (s) => {
    const el = inputRef.current
    if (!el) { setForm(f => ({ ...f, expression: f.expression + s })); return }
    const start = el.selectionStart, end = el.selectionEnd
    const newVal = form.expression.slice(0, start) + s + form.expression.slice(end)
    setForm(f => ({ ...f, expression: newVal }))
    setTimeout(() => { el.setSelectionRange(start + s.length, start + s.length); el.focus() }, 0)
  }

  const save = async () => {
    setSaving(true)
    try {
      const hiddenConfig = {
        hiddenColumns: hiddenCols,
        hiddenCells: hiddenCells
      }
      const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)
      await api.post('/exercises', {
        title: form.title, description: form.description,
        expression: form.expression, difficulty: diffMode === 'custom' ? form.difficulty : diffMode,
        tags, hiddenConfig, isPublic: form.isPublic
      })
      navigate('/exercises')
    } catch (err) { setError(err.response?.data?.message || 'Error al guardar') }
    finally { setSaving(false) }
  }

  const card = `rounded-2xl border p-5 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`
  const label = `text-sm font-medium mb-1 block ${darkMode ? 'text-gray-300' : 'text-gray-700'}`
  const inp = `w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 ${darkMode ? 'bg-gray-900 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-200'}`

  const hiddenConfig = { hiddenColumns: hiddenCols, hiddenCells }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => navigate('/exercises')} className={`text-sm ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>← Volver</button>
        <h1 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Crear ejercicio</h1>
      </div>

      {/* Step 1: Metadata */}
      <div className={card}>
        <h2 className={`font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>1. Información del ejercicio</h2>
        <div className="space-y-4">
          <div>
            <label className={label}>Título *</label>
            <input className={inp} placeholder="Ej: Ley de De Morgan" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label className={label}>Descripción</label>
            <textarea className={`${inp} resize-none`} rows={2} placeholder="Explica qué debe practicar el usuario..."
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={label}>Tags (separados por coma)</label>
              <input className={inp} placeholder="Ej: AND, OR, implicación" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input type="checkbox" id="pub" checked={form.isPublic} onChange={e => setForm(f => ({ ...f, isPublic: e.target.checked }))} className="accent-violet-600 w-4 h-4" />
              <label htmlFor="pub" className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Publicar (visible para todos)</label>
            </div>
          </div>
        </div>
      </div>

      {/* Step 2: Expression */}
      <div className={card}>
        <h2 className={`font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>2. Expresión lógica</h2>
        <div className="flex gap-2 mb-3">
          <input ref={inputRef}
            className={`flex-1 border rounded-xl px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-violet-500 ${darkMode ? 'bg-gray-900 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'}`}
            value={form.expression} onChange={e => setForm(f => ({ ...f, expression: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && evaluateExpr()}
            placeholder="Ej: (A AND B) -> C" />
          <button onClick={evaluateExpr} disabled={evaluating}
            className="bg-violet-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-violet-700 transition disabled:opacity-50 shrink-0">
            {evaluating ? '...' : 'Generar tabla'}
          </button>
        </div>
        <SymbolKeyboard onInsert={insert} darkMode={darkMode} />
        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
      </div>

      {/* Step 3: Configure hidden cells */}
      {table && (
        <div className={card}>
          <h2 className={`font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>3. Configurar qué ocultar</h2>

          {/* Difficulty mode */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-5">
            {DIFF_OPTS.map(opt => (
              <button key={opt.val} type="button"
                onClick={() => { setDiffMode(opt.val); applyDiffMode(opt.val) }}
                className={`p-3 rounded-xl border text-left transition ${
                  diffMode === opt.val
                    ? 'border-violet-500 bg-violet-50 text-violet-800'
                    : (darkMode ? 'border-gray-600 bg-gray-700 text-gray-300 hover:border-violet-500' : 'border-gray-200 hover:border-violet-300')
                }`}>
                <div className="font-bold text-sm">{opt.label}</div>
                <div className={`text-xs mt-0.5 ${diffMode === opt.val ? 'text-violet-600' : (darkMode ? 'text-gray-500' : 'text-gray-400')}`}>{opt.desc}</div>
              </button>
            ))}
          </div>

          {diffMode === 'custom' && (
            <div className="mb-4">
              <p className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Selecciona columnas a ocultar completas:</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {table.subExpressions.map(col => (
                  <button key={col} type="button" onClick={() => toggleColHidden(col)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition ${
                      hiddenCols.includes(col)
                        ? 'bg-red-100 border-red-300 text-red-700'
                        : (darkMode ? 'bg-gray-700 border-gray-600 text-gray-300 hover:border-violet-500' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-violet-300')
                    }`}>{hiddenCols.includes(col) ? '🙈 ' : ''}{col}</button>
                ))}
              </div>
              <p className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>O haz clic en celdas individuales de la tabla para ocultarlas:</p>
            </div>
          )}

          {/* Preview of how exercise will look */}
          <div className="mt-2">
            <div className="flex items-center justify-between mb-3">
              <p className={`text-xs font-bold uppercase tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Vista previa — así verán el ejercicio los usuarios
              </p>
              <button onClick={() => setPreview(!preview)}
                className={`text-xs px-3 py-1 rounded-lg border transition ${darkMode ? 'border-gray-600 text-gray-400 hover:border-violet-500' : 'border-gray-200 text-gray-500 hover:border-violet-400'}`}>
                {preview ? 'Vista completa' : 'Vista ejercicio'}
              </button>
            </div>
            {diffMode === 'custom' ? (
              <CustomTableEditor
                table={table} hiddenCols={hiddenCols} hiddenCells={hiddenCells}
                onToggleCell={toggleCellHidden} darkMode={darkMode} preview={preview} />
            ) : (
              <TruthTable table={table} darkMode={darkMode}
                hiddenConfig={preview ? hiddenConfig : null} />
            )}
          </div>
        </div>
      )}

      {/* Save */}
      {table && (
        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('/exercises')}
            className={`flex-1 border font-bold py-3 rounded-xl transition ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            Cancelar
          </button>
          <button onClick={save} disabled={saving || !form.title.trim()}
            className="flex-1 bg-violet-600 text-white font-bold py-3 rounded-xl hover:bg-violet-700 transition disabled:opacity-50">
            {saving ? 'Guardando...' : 'Publicar ejercicio'}
          </button>
        </div>
      )}
    </div>
  )
}

function CustomTableEditor({ table, hiddenCols, hiddenCells, onToggleCell, darkMode, preview }) {
  const { variables, subExpressions, rows } = table
  const visibleCols = subExpressions.filter(c => !hiddenCols.includes(c))
  const isCellHidden = (row, col) => hiddenCells.some(c => c.row === row && c.column === col)

  const th = `px-3 py-2 text-xs font-bold text-center border-b ${darkMode ? 'border-gray-600 text-gray-300 bg-gray-700' : 'border-gray-200 text-gray-600 bg-gray-50'}`
  const td = `px-3 py-1.5 text-center border-b text-sm font-mono ${darkMode ? 'border-gray-700' : 'border-gray-100'}`

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="min-w-full">
        <thead>
          <tr>
            {variables.map(v => <th key={v} className={`${th} text-blue-600`}>{v}</th>)}
            {visibleCols.map(c => (
              <th key={c} className={th}><span className="font-mono">{c}</span></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {variables.map(v => (
                <td key={v} className={td}>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    row[v]
                      ? (darkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-700')
                      : (darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500')
                  }`}>{row[v] ? '1' : '0'}</span>
                </td>
              ))}
              {visibleCols.map(c => {
                const hidden = isCellHidden(ri, c)
                if (preview && hidden) return (
                  <td key={c} className={td}>
                    <span className={`px-2 py-0.5 rounded text-xs ${darkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'}`}>?</span>
                  </td>
                )
                return (
                  <td key={c} className={td}>
                    <button type="button" onClick={() => !preview && onToggleCell(ri, c)}
                      className={`px-2 py-0.5 rounded text-xs font-bold transition ${
                        hidden
                          ? 'bg-red-100 border-2 border-dashed border-red-400 text-red-600'
                          : (row[c]
                              ? (darkMode ? 'bg-green-900/30 text-green-300 hover:bg-red-900/20' : 'bg-green-100 text-green-700 hover:bg-red-100')
                              : (darkMode ? 'bg-gray-700 text-gray-400 hover:bg-red-900/20' : 'bg-gray-100 text-gray-500 hover:bg-red-100'))
                      } ${!preview ? 'cursor-pointer' : 'cursor-default'}`}>
                      {hidden ? '?' : (row[c] ? '1' : '0')}
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
