import { useState, useRef, useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import SymbolKeyboard from '../components/SymbolKeyboard'
import TruthTable from '../components/TruthTable'

const EXAMPLES = [
  { label: 'Modus Ponens', expr: '(A AND (A -> B)) -> B' },
  { label: 'De Morgan', expr: 'NOT (A AND B) <-> (NOT A OR NOT B)' },
  { label: 'Distributiva', expr: 'A AND (B OR C) <-> (A AND B) OR (A AND C)' },
  { label: 'XOR doble', expr: 'A XOR A' },
  { label: 'Implicación', expr: 'A -> B' },
  { label: 'NAND universal', expr: '(A NAND A) NAND (B NAND B)' },
]

export default function Editor({ darkMode }) {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [input, setInput] = useState(() => searchParams.get('expr') || '(A -> B) AND (B -> C) -> (A -> C)')
  const [table, setTable] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('logic_history') || '[]') } catch { return [] }
  })
  const inputRef = useRef(null)

  useEffect(() => { evaluate() }, [])

  const evaluate = useCallback(async (expr = input) => {
    if (!expr.trim()) return
    setLoading(true); setError(''); setSaved(false)
    try {
      const r = await api.post('/logic/evaluate', { expression: expr })
      setTable(r.data)
      const newHistory = [expr, ...history.filter(h => h !== expr)].slice(0, 20)
      setHistory(newHistory)
      localStorage.setItem('logic_history', JSON.stringify(newHistory))
    } catch (err) { setError(err.response?.data?.message || 'Error de sintaxis') }
    finally { setLoading(false) }
  }, [input, history])

  const insertSymbol = (sym) => {
    const el = inputRef.current
    if (!el) { setInput(prev => prev + sym); return }
    const start = el.selectionStart, end = el.selectionEnd
    const newVal = input.slice(0, start) + sym + input.slice(end)
    setInput(newVal)
    setTimeout(() => { el.setSelectionRange(start + sym.length, start + sym.length); el.focus() }, 0)
  }

  const saveExpression = async () => {
    if (!user || !table) return
    await api.post('/expressions', { input, name: input, isPublic: false })
    setSaved(true)
  }

  const copyShareLink = async () => {
    if (!user || !table) return
    const r = await api.post('/expressions', { input, name: input, isPublic: true })
    const link = `${window.location.origin}/share/${r.data.shareId}`
    await navigator.clipboard.writeText(link)
    alert('Link copiado al portapapeles')
  }

  const card = `rounded-2xl border p-5 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`
  const label = `text-xs font-bold uppercase tracking-wide mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
      <div className={card}>
        <p className={label}>Expresión lógica</p>
        <div className="flex gap-2 mb-3">
          <input ref={inputRef}
            className={`flex-1 border rounded-xl px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-violet-500 ${darkMode ? 'bg-gray-900 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && evaluate()}
            placeholder="Ej: (A AND B) -> C" />
          <button onClick={() => evaluate()}
            disabled={loading}
            className="bg-violet-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-violet-700 transition disabled:opacity-50 shrink-0">
            {loading ? '...' : 'Evaluar'}
          </button>
        </div>
        <SymbolKeyboard onInsert={insertSymbol} darkMode={darkMode} />
        {error && <p className="text-red-500 text-sm mt-3 bg-red-50 border border-red-200 px-3 py-2 rounded-xl">{error}</p>}
      </div>

      {/* Examples */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {EXAMPLES.map(ex => (
          <button key={ex.label} onClick={() => { setInput(ex.expr); evaluate(ex.expr) }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition shrink-0 ${
              darkMode ? 'bg-gray-800 border-gray-600 text-gray-300 hover:border-violet-500' : 'bg-white border-gray-200 text-gray-600 hover:border-violet-400 hover:text-violet-700'
            }`}>{ex.label}</button>
        ))}
      </div>

      {table && (
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <div className={card}>
              <div className="flex items-center justify-between mb-4">
                <p className={label}>Tabla de verdad — {table.variables.length} variable{table.variables.length !== 1 ? 's' : ''}, {table.rows.length} filas, {table.subExpressions.length} sub-expresión{table.subExpressions.length !== 1 ? 'es' : ''}</p>
                <div className="flex gap-2 flex-wrap">
                  {user && (
                    <>
                      <button onClick={saveExpression} className={`text-xs px-3 py-1 rounded-lg border transition ${saved ? 'border-green-400 text-green-600' : (darkMode ? 'border-gray-600 text-gray-400 hover:border-violet-500' : 'border-gray-200 text-gray-500 hover:border-violet-400')}`}>
                        {saved ? '✓ Guardado' : '💾 Guardar'}
                      </button>
                      <button onClick={copyShareLink} className={`text-xs px-3 py-1 rounded-lg border transition ${darkMode ? 'border-gray-600 text-gray-400 hover:border-violet-500' : 'border-gray-200 text-gray-500 hover:border-violet-400'}`}>
                        🔗 Compartir
                      </button>
                    </>
                  )}
                  <ExportButtons table={table} input={input} darkMode={darkMode} />
                </div>
              </div>
              <TruthTable table={table} darkMode={darkMode} />
            </div>
          </div>

          <div className="space-y-4">
            {/* Quick tools */}
            <QuickTools input={input} darkMode={darkMode} />

            {/* History */}
            {history.length > 0 && (
              <div className={card}>
                <p className={label}>Historial</p>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {history.slice(0, 10).map(h => (
                    <button key={h} onClick={() => { setInput(h); evaluate(h) }}
                      className={`w-full text-left text-xs font-mono px-2 py-1.5 rounded-lg truncate transition ${
                        darkMode ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                      }`}>{h}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ExportButtons({ table, input, darkMode }) {
  if (!table) return null

  const exportCSV = () => {
    const headers = [...table.variables, ...table.subExpressions]
    const rows = table.rows.map(row => headers.map(h => row[h] ? '1' : '0').join(','))
    const csv = [headers.join(','), ...rows].join('\n')
    download(csv, 'tabla_verdad.csv', 'text/csv')
  }

  const exportMarkdown = () => {
    const headers = [...table.variables, ...table.subExpressions]
    const sep = headers.map(() => '---').join(' | ')
    const rows = table.rows.map(row => headers.map(h => row[h] ? '1' : '0').join(' | '))
    const md = `# Tabla de verdad\n\`${input}\`\n\n| ${headers.join(' | ')} |\n| ${sep} |\n${rows.map(r => `| ${r} |`).join('\n')}`
    download(md, 'tabla_verdad.md', 'text/markdown')
  }

  const exportLatex = () => {
    const headers = [...table.variables, ...table.subExpressions]
    const cols = 'c'.repeat(headers.length)
    const head = headers.map(h => `$${h.replace(/→/g,'\\to').replace(/↔/g,'\\leftrightarrow').replace(/∧/g,'\\land').replace(/∨/g,'\\lor').replace(/¬/g,'\\neg').replace(/⊕/g,'\\oplus')}$`).join(' & ')
    const rows = table.rows.map(row => headers.map(h => row[h] ? '1' : '0').join(' & ') + ' \\\\')
    const latex = `\\begin{tabular}{${cols}}\n\\hline\n${head} \\\\\n\\hline\n${rows.join('\n')}\n\\hline\n\\end{tabular}`
    download(latex, 'tabla_verdad.tex', 'text/plain')
  }

  const download = (content, filename, mime) => {
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }

  const btn = `text-xs px-3 py-1 rounded-lg border transition ${darkMode ? 'border-gray-600 text-gray-400 hover:border-violet-500 hover:text-gray-200' : 'border-gray-200 text-gray-500 hover:border-violet-400 hover:text-gray-700'}`

  return (
    <>
      <button onClick={exportCSV} className={btn}>📊 CSV</button>
      <button onClick={exportMarkdown} className={btn}>📝 MD</button>
      <button onClick={exportLatex} className={btn}>𝛌 LaTeX</button>
    </>
  )
}

function QuickTools({ input, darkMode }) {
  const [results, setResults] = useState({})
  const card = `rounded-2xl border p-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`
  const label = `text-xs font-bold uppercase tracking-wide mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`

  const run = async (tool) => {
    try {
      let r
      if (tool === 'cnf') r = (await api.post('/logic/cnf', { expression: input })).data.result
      else if (tool === 'dnf') r = (await api.post('/logic/dnf', { expression: input })).data.result
      else if (tool === 'simplify') r = (await api.post('/logic/simplify', { expression: input })).data.simplified
      else if (tool === 'sat') r = (await api.post('/logic/satisfiability', { expression: input })).data.isSatisfiable ? 'Satisfacible ✓' : 'Insatisfacible ✗'
      setResults(prev => ({ ...prev, [tool]: r }))
    } catch (e) { setResults(prev => ({ ...prev, [tool]: 'Error' })) }
  }

  return (
    <div className={card}>
      <p className={label}>Herramientas rápidas</p>
      <div className="space-y-2">
        {[
          { key: 'cnf', label: 'Forma Normal Conjuntiva (CNF)' },
          { key: 'dnf', label: 'Forma Normal Disyuntiva (DNF)' },
          { key: 'simplify', label: 'Simplificar (Quine-McCluskey)' },
          { key: 'sat', label: 'Satisfacibilidad' },
        ].map(({ key, label: lbl }) => (
          <div key={key}>
            <button onClick={() => run(key)}
              className={`w-full text-left text-xs px-3 py-2 rounded-lg border transition ${
                darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-violet-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-violet-300'
              }`}>{lbl}</button>
            {results[key] && (
              <div className={`mt-1 px-3 py-1.5 rounded-lg text-xs font-mono break-all ${
                darkMode ? 'bg-gray-900 text-violet-300' : 'bg-violet-50 text-violet-800'
              }`}>{results[key]}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
