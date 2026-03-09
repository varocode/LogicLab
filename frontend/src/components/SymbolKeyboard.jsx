const SYMBOLS = [
  { label: '∧', hint: 'AND', insert: ' AND ' },
  { label: '∨', hint: 'OR', insert: ' OR ' },
  { label: '¬', hint: 'NOT', insert: 'NOT ' },
  { label: '→', hint: 'IMPLIES', insert: ' -> ' },
  { label: '↔', hint: 'BICON', insert: ' <-> ' },
  { label: '⊕', hint: 'XOR', insert: ' XOR ' },
  { label: '↑', hint: 'NAND', insert: ' NAND ' },
  { label: '↓', hint: 'NOR', insert: ' NOR ' },
  { label: '(', hint: '', insert: '(' },
  { label: ')', hint: '', insert: ')' },
]

export default function SymbolKeyboard({ onInsert, darkMode }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {SYMBOLS.map(s => (
        <button key={s.label} type="button" onClick={() => onInsert(s.insert)}
          title={s.hint}
          className={`px-3 py-1.5 rounded-lg text-sm font-mono font-bold border transition ${
            darkMode
              ? 'bg-gray-800 border-gray-600 text-violet-300 hover:bg-gray-700'
              : 'bg-white border-gray-200 text-violet-700 hover:bg-violet-50 hover:border-violet-300'
          }`}>
          {s.label}
          {s.hint && <span className={`text-xs ml-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{s.hint}</span>}
        </button>
      ))}
    </div>
  )
}
