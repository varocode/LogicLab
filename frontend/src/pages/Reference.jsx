import { useNavigate } from 'react-router-dom'

const LAWS = [
  {
    category: 'Leyes de identidad',
    items: [
      { name: 'Identidad AND', expr: 'A ∧ 1 ↔ A', example: 'A AND 1 <-> A', desc: 'Conjunción con verdad es identidad' },
      { name: 'Identidad OR', expr: 'A ∨ 0 ↔ A', example: 'A OR 0 <-> A', desc: 'Disyunción con falso es identidad' },
    ]
  },
  {
    category: 'Leyes de dominación',
    items: [
      { name: 'Dominación AND', expr: 'A ∧ 0 ↔ 0', example: 'A AND 0', desc: 'Cualquier cosa AND falso es falso' },
      { name: 'Dominación OR', expr: 'A ∨ 1 ↔ 1', example: 'A OR 1', desc: 'Cualquier cosa OR verdad es verdad' },
    ]
  },
  {
    category: 'Leyes de De Morgan',
    items: [
      { name: 'De Morgan AND', expr: '¬(A ∧ B) ↔ ¬A ∨ ¬B', example: 'NOT (A AND B) <-> (NOT A OR NOT B)', desc: 'Negar una conjunción = disyunción de negaciones' },
      { name: 'De Morgan OR', expr: '¬(A ∨ B) ↔ ¬A ∧ ¬B', example: 'NOT (A OR B) <-> (NOT A AND NOT B)', desc: 'Negar una disyunción = conjunción de negaciones' },
    ]
  },
  {
    category: 'Leyes distributivas',
    items: [
      { name: 'Distributiva AND', expr: 'A ∧ (B ∨ C) ↔ (A ∧ B) ∨ (A ∧ C)', example: 'A AND (B OR C) <-> (A AND B) OR (A AND C)', desc: 'AND distribuye sobre OR' },
      { name: 'Distributiva OR', expr: 'A ∨ (B ∧ C) ↔ (A ∨ B) ∧ (A ∨ C)', example: 'A OR (B AND C) <-> (A OR B) AND (A OR C)', desc: 'OR distribuye sobre AND' },
    ]
  },
  {
    category: 'Leyes de absorción',
    items: [
      { name: 'Absorción 1', expr: 'A ∧ (A ∨ B) ↔ A', example: 'A AND (A OR B) <-> A', desc: 'AND absorbe OR' },
      { name: 'Absorción 2', expr: 'A ∨ (A ∧ B) ↔ A', example: 'A OR (A AND B) <-> A', desc: 'OR absorbe AND' },
    ]
  },
  {
    category: 'Leyes de implicación',
    items: [
      { name: 'Material conditional', expr: 'A → B ↔ ¬A ∨ B', example: 'A -> B <-> (NOT A OR B)', desc: 'Implicación como disyunción' },
      { name: 'Contrapositiva', expr: '(A → B) ↔ (¬B → ¬A)', example: '(A -> B) <-> (NOT B -> NOT A)', desc: 'Equivalencia con la contrapositiva' },
      { name: 'Modus Ponens', expr: '(A ∧ (A → B)) → B', example: '(A AND (A -> B)) -> B', desc: 'Regla de inferencia básica (tautología)' },
      { name: 'Modus Tollens', expr: '(¬B ∧ (A → B)) → ¬A', example: '(NOT B AND (A -> B)) -> NOT A', desc: 'Regla de inferencia por negación' },
    ]
  },
  {
    category: 'Doble negación y complemento',
    items: [
      { name: 'Doble negación', expr: '¬¬A ↔ A', example: 'NOT NOT A <-> A', desc: 'La negación de la negación es la afirmación' },
      { name: 'Complemento AND', expr: 'A ∧ ¬A ↔ 0', example: 'A AND NOT A', desc: 'Contradicción (siempre falso)' },
      { name: 'Complemento OR', expr: 'A ∨ ¬A ↔ 1', example: 'A OR NOT A', desc: 'Tautología (siempre verdadero)' },
    ]
  },
  {
    category: 'Bicondicional',
    items: [
      { name: 'Bicondicional', expr: 'A ↔ B ↔ (A → B) ∧ (B → A)', example: 'A <-> B <-> (A -> B) AND (B -> A)', desc: 'Doble implicación' },
      { name: 'XOR y bicondicional', expr: 'A ↔ B ↔ ¬(A ⊕ B)', example: 'A <-> B <-> NOT (A XOR B)', desc: 'Bicondicional como negación del XOR' },
    ]
  },
]

const OP_TABLE = [
  { symbol: '∧', aliases: 'AND, &&, &', name: 'Conjunción', example: 'A AND B', desc: 'Verdadero si ambos son verdaderos' },
  { symbol: '∨', aliases: 'OR, ||, |', name: 'Disyunción', example: 'A OR B', desc: 'Verdadero si al menos uno es verdadero' },
  { symbol: '¬', aliases: 'NOT, !, ~', name: 'Negación', example: 'NOT A', desc: 'Invierte el valor de verdad' },
  { symbol: '→', aliases: '->, =>', name: 'Implicación', example: 'A -> B', desc: 'Falso solo cuando A es verdadero y B es falso' },
  { symbol: '↔', aliases: '<->, <=>', name: 'Bicondicional', example: 'A <-> B', desc: 'Verdadero cuando A y B tienen el mismo valor' },
  { symbol: '⊕', aliases: 'XOR, ^', name: 'O exclusivo', example: 'A XOR B', desc: 'Verdadero cuando A y B son distintos' },
  { symbol: '↑', aliases: 'NAND', name: 'No-Y', example: 'A NAND B', desc: 'Negación de AND' },
  { symbol: '↓', aliases: 'NOR', name: 'No-O', example: 'A NOR B', desc: 'Negación de OR' },
]

export default function Reference({ darkMode, onLoadExample }) {
  const navigate = useNavigate()

  const loadInEditor = (example) => {
    navigate(`/editor?expr=${encodeURIComponent(example)}`)
  }

  const card = `rounded-2xl border p-5 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`
  const th = `px-4 py-2.5 text-xs font-bold text-left ${darkMode ? 'text-gray-400 bg-gray-700' : 'text-gray-500 bg-gray-50'}`

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <h1 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Referencia de Lógica</h1>

      {/* Operators */}
      <div className={card}>
        <h2 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Operadores soportados</h2>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full">
            <thead>
              <tr className={darkMode ? 'border-b border-gray-600' : 'border-b border-gray-200'}>
                <th className={th}>Símbolo</th>
                <th className={th}>Alias</th>
                <th className={th}>Nombre</th>
                <th className={th}>Descripción</th>
                <th className={th}>Probar</th>
              </tr>
            </thead>
            <tbody>
              {OP_TABLE.map(op => (
                <tr key={op.symbol} className={`border-b last:border-0 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                  <td className={`px-4 py-2.5 text-xl font-bold text-center ${darkMode ? 'text-violet-300' : 'text-violet-700'}`}>{op.symbol}</td>
                  <td className={`px-4 py-2.5 text-xs font-mono ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{op.aliases}</td>
                  <td className={`px-4 py-2.5 text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{op.name}</td>
                  <td className={`px-4 py-2.5 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{op.desc}</td>
                  <td className="px-4 py-2.5">
                    <button onClick={() => loadInEditor(op.example)}
                      className="text-xs text-violet-600 hover:underline whitespace-nowrap">
                      {op.example} →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Precedence */}
      <div className={card}>
        <h2 className={`text-lg font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Precedencia de operadores</h2>
        <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>De mayor a menor precedencia (los primeros se evalúan antes):</p>
        <div className="flex flex-wrap gap-2 items-center">
          {['¬ (NOT)', '∧ (AND)', '⊕ (XOR)', '∨ (OR)', '↑ (NAND)', '↓ (NOR)', '→ (IMP)', '↔ (BICON)'].map((op, i, arr) => (
            <div key={op} className="flex items-center gap-2">
              <span className={`px-3 py-1.5 rounded-lg text-sm font-mono font-bold ${darkMode ? 'bg-gray-700 text-violet-300' : 'bg-violet-50 text-violet-700'}`}>{op}</span>
              {i < arr.length - 1 && <span className={`text-gray-400`}>›</span>}
            </div>
          ))}
        </div>
        <p className={`text-xs mt-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Usa paréntesis para cambiar la precedencia: <code className="font-mono">(A OR B) AND C</code></p>
      </div>

      {/* Laws */}
      {LAWS.map(cat => (
        <div key={cat.category} className={card}>
          <h2 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{cat.category}</h2>
          <div className="space-y-3">
            {cat.items.map(law => (
              <div key={law.name} className={`flex items-start justify-between gap-4 p-3 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{law.name}</span>
                  </div>
                  <div className={`text-sm font-mono mb-1 ${darkMode ? 'text-violet-300' : 'text-violet-700'}`}>{law.expr}</div>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{law.desc}</div>
                </div>
                <button onClick={() => loadInEditor(law.example)}
                  className="text-xs text-violet-600 hover:text-violet-800 hover:underline whitespace-nowrap shrink-0 mt-1">
                  Probar →
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
