import { useState, useRef } from 'react'
import api from '../api/axios'
import SymbolKeyboard from '../components/SymbolKeyboard'

export default function Analysis({ darkMode }) {
  const [tab, setTab] = useState('equivalence')
  const card = `rounded-2xl border p-5 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className={`text-2xl font-black mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Análisis Lógico</h1>
      <p className={`text-sm mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Verifica equivalencias, consecuencias y satisfacibilidad</p>

      <div className="flex gap-2 mb-5 flex-wrap">
        {[
          { key: 'equivalence', label: 'Equivalencia' },
          { key: 'consequence', label: 'Consecuencia lógica' },
          { key: 'satisfiability', label: 'Satisfacibilidad' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
              tab === t.key
                ? 'bg-violet-600 text-white'
                : (darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
            }`}>{t.label}</button>
        ))}
      </div>

      <div className={card}>
        {tab === 'equivalence' && <EquivalencePanel darkMode={darkMode} />}
        {tab === 'consequence' && <ConsequencePanel darkMode={darkMode} />}
        {tab === 'satisfiability' && <SatisfiabilityPanel darkMode={darkMode} />}
      </div>
    </div>
  )
}

function ExprInput({ label, value, onChange, darkMode }) {
  const ref = useRef(null)
  const insert = (s) => {
    const el = ref.current
    if (!el) { onChange(value + s); return }
    const start = el.selectionStart, end = el.selectionEnd
    const newVal = value.slice(0, start) + s + value.slice(end)
    onChange(newVal)
    setTimeout(() => { el.setSelectionRange(start + s.length, start + s.length); el.focus() }, 0)
  }
  return (
    <div className="space-y-2">
      <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{label}</label>
      <input ref={ref}
        className={`w-full border rounded-xl px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-violet-500 ${darkMode ? 'bg-gray-900 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'}`}
        value={value} onChange={e => onChange(e.target.value)} />
      <SymbolKeyboard onInsert={insert} darkMode={darkMode} />
    </div>
  )
}

function ResultBadge({ result, darkMode }) {
  if (!result) return null
  const isTrue = result.areEquivalent ?? result.isConsequence ?? result.isSatisfiable
  return (
    <div className={`mt-4 px-4 py-3 rounded-xl border flex items-start gap-3 ${
      isTrue
        ? 'bg-green-50 border-green-200 text-green-800'
        : 'bg-red-50 border-red-200 text-red-800'
    }`}>
      <span className="text-xl">{isTrue ? '✓' : '✗'}</span>
      <div>
        <p className="font-bold text-sm">{result.message}</p>
        {result.counterExample && (
          <p className="text-xs mt-1 font-mono">Contraejemplo: {result.counterExample}</p>
        )}
      </div>
    </div>
  )
}

function EquivalencePanel({ darkMode }) {
  const [e1, setE1] = useState('A -> B')
  const [e2, setE2] = useState('NOT A OR B')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const check = async () => {
    setLoading(true); setError('')
    try {
      const r = await api.post('/logic/equivalence', { expr1: e1, expr2: e2 })
      setResult({ ...r.data, message: r.data.areEquivalent ? 'Las expresiones son lógicamente equivalentes' : 'Las expresiones NO son equivalentes' })
    } catch (err) { setError(err.response?.data?.message || 'Error') }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className={`text-lg font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Verificador de Equivalencia</h2>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Comprueba si dos expresiones tienen la misma tabla de verdad</p>
      </div>
      <ExprInput label="Expresión 1" value={e1} onChange={setE1} darkMode={darkMode} />
      <div className="flex items-center justify-center">
        <span className={`text-2xl font-bold ${darkMode ? 'text-gray-500' : 'text-gray-300'}`}>↔</span>
      </div>
      <ExprInput label="Expresión 2" value={e2} onChange={setE2} darkMode={darkMode} />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button onClick={check} disabled={loading}
        className="w-full bg-violet-600 text-white font-bold py-3 rounded-xl hover:bg-violet-700 transition disabled:opacity-50">
        {loading ? 'Verificando...' : 'Verificar equivalencia'}
      </button>
      <ResultBadge result={result} darkMode={darkMode} />
    </div>
  )
}

function ConsequencePanel({ darkMode }) {
  const [premises, setPremises] = useState(['A', 'A -> B'])
  const [conclusion, setConclusion] = useState('B')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const addPremise = () => setPremises([...premises, ''])
  const removePremise = (i) => setPremises(premises.filter((_, idx) => idx !== i))
  const updatePremise = (i, val) => setPremises(premises.map((p, idx) => idx === i ? val : p))

  const check = async () => {
    setLoading(true); setError('')
    try {
      const r = await api.post('/logic/consequence', { premises: premises.filter(p => p.trim()), conclusion })
      setResult({ ...r.data, message: r.data.isConsequence ? 'La conclusión es consecuencia lógica de las premisas' : 'La conclusión NO se sigue de las premisas' })
    } catch (err) { setError(err.response?.data?.message || 'Error') }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className={`text-lg font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Consecuencia Lógica</h2>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>¿Se deduce la conclusión de las premisas? (⊨)</p>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Premisas</label>
          <button onClick={addPremise} className="text-xs text-violet-600 hover:underline">+ Agregar</button>
        </div>
        {premises.map((p, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input
              className={`flex-1 border rounded-xl px-4 py-2 font-mono text-sm focus:outline-none focus:border-violet-500 ${darkMode ? 'bg-gray-900 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'}`}
              value={p} onChange={e => updatePremise(i, e.target.value)} placeholder={`Premisa ${i + 1}`} />
            {premises.length > 1 && (
              <button onClick={() => removePremise(i)} className="text-red-400 hover:text-red-600 px-2">✕</button>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-lg font-bold shrink-0 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>⊨</span>
        <ExprInput label="Conclusión" value={conclusion} onChange={setConclusion} darkMode={darkMode} />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button onClick={check} disabled={loading}
        className="w-full bg-violet-600 text-white font-bold py-3 rounded-xl hover:bg-violet-700 transition disabled:opacity-50">
        {loading ? 'Verificando...' : 'Verificar consecuencia'}
      </button>
      <ResultBadge result={result} darkMode={darkMode} />
    </div>
  )
}

function SatisfiabilityPanel({ darkMode }) {
  const [expr, setExpr] = useState('A AND NOT A')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const check = async () => {
    setLoading(true); setError('')
    try {
      const r = await api.post('/logic/satisfiability', { expression: expr })
      setResult({ ...r.data, message: r.data.isSatisfiable ? 'La expresión es satisfacible (existe al menos una interpretación verdadera)' : 'La expresión es insatisfacible (contradicción)' })
    } catch (err) { setError(err.response?.data?.message || 'Error') }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className={`text-lg font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Satisfacibilidad</h2>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>¿Existe alguna interpretación que hace verdadera la expresión?</p>
      </div>
      <ExprInput label="Expresión" value={expr} onChange={setExpr} darkMode={darkMode} />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button onClick={check} disabled={loading}
        className="w-full bg-violet-600 text-white font-bold py-3 rounded-xl hover:bg-violet-700 transition disabled:opacity-50">
        {loading ? 'Verificando...' : 'Verificar satisfacibilidad'}
      </button>
      <ResultBadge result={result} darkMode={darkMode} />
    </div>
  )
}
