import { useNavigate } from 'react-router-dom'

const FEATURES = [
  { icon: '⊕', title: 'Editor en tiempo real', desc: 'Escribe cualquier expresión lógica y obtén la tabla de verdad al instante con todas las sub-columnas' },
  { icon: '🔍', title: 'Análisis lógico', desc: 'Verifica equivalencias, consecuencias lógicas y satisfacibilidad entre expresiones' },
  { icon: '🗺️', title: 'Mapa de Karnaugh', desc: 'Visualiza el K-Map para 2, 3 y 4 variables con código Gray' },
  { icon: '✏️', title: 'Ejercicios interactivos', desc: 'Completa tablas de verdad con celdas ocultas y recibe feedback inmediato' },
  { icon: '🎨', title: 'Crea tus ejercicios', desc: 'Diseña ejercicios personalizados eligiendo exactamente qué columnas y celdas ocultar' },
  { icon: '📚', title: 'Referencia completa', desc: 'Leyes lógicas, operadores y ejemplos interactivos que cargan directo en el editor' },
]

const OPS = ['∧ AND', '∨ OR', '¬ NOT', '→ IMP', '↔ IFF', '⊕ XOR', '↑ NAND', '↓ NOR']

export default function Home({ darkMode }) {
  const navigate = useNavigate()

  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-br from-violet-600 to-indigo-700 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-black mb-4">LogicLab</h1>
          <p className="text-xl text-violet-200 mb-3">El laboratorio completo de lógica proposicional</p>
          <p className="text-violet-300 mb-8 max-w-xl mx-auto">
            Tablas de verdad con sub-columnas automáticas, mapas de Karnaugh, simplificación Quine-McCluskey, análisis lógico y ejercicios interactivos.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button onClick={() => navigate('/editor')} className="bg-white text-violet-700 font-bold px-8 py-3 rounded-2xl hover:bg-violet-50 transition">
              Abrir editor →
            </button>
            <button onClick={() => navigate('/exercises')} className="border border-violet-400 text-white font-bold px-8 py-3 rounded-2xl hover:bg-violet-700 transition">
              Ver ejercicios
            </button>
          </div>

          {/* Operators */}
          <div className="flex flex-wrap gap-2 justify-center mt-10">
            {OPS.map(op => (
              <span key={op} className="px-3 py-1.5 bg-white/10 rounded-full text-sm font-mono text-violet-200">{op}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className={`py-16 px-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-5xl mx-auto">
          <h2 className={`text-3xl font-black text-center mb-10 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Todo lo que necesitás</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(f => (
              <div key={f.title} className={`rounded-2xl border p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className={`font-bold text-lg mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{f.title}</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Demo expression */}
      <div className={`py-12 px-4 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className={`text-2xl font-black mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Sub-columnas automáticas</h2>
          <p className={`text-sm mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Para cualquier expresión, LogicLab genera automáticamente una columna por cada sub-expresión del árbol sintáctico
          </p>
          <div className={`rounded-2xl border px-5 py-4 text-sm font-mono text-left ${darkMode ? 'bg-gray-900 border-gray-600 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
            <span className={darkMode ? 'text-violet-400' : 'text-violet-600'}>Expresión:</span> (A → B) ∧ (B → C) → (A → C)<br/>
            <span className={darkMode ? 'text-green-400' : 'text-green-600'}>Columnas:</span> A | B | C | (A → B) | (B → C) | (A → C) | ((A → B) ∧ (B → C)) | <strong>resultado</strong>
          </div>
          <button onClick={() => navigate('/editor')} className="mt-6 bg-violet-600 text-white font-bold px-8 py-3 rounded-2xl hover:bg-violet-700 transition">
            Probarlo ahora →
          </button>
        </div>
      </div>
    </div>
  )
}
