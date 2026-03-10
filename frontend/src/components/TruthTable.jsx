import { useState } from 'react'

const fmtVal = (v, mode) => mode === 'vf' ? (v ? 'V' : 'F') : (v ? '1' : '0')

function DisplayToggle({ mode, onChange, darkMode }) {
  return (
    <div className={`inline-flex rounded-lg border text-xs font-bold overflow-hidden ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
      {['binary', 'vf'].map(m => (
        <button key={m} onClick={() => onChange(m)}
          className={`px-2.5 py-1 transition ${
            mode === m
              ? 'bg-violet-600 text-white'
              : (darkMode ? 'bg-gray-700 text-gray-400 hover:bg-gray-600' : 'bg-white text-gray-500 hover:bg-gray-50')
          }`}>
          {m === 'binary' ? '1/0' : 'V/F'}
        </button>
      ))}
    </div>
  )
}

export default function TruthTable({ table, darkMode, hiddenConfig = null, answers = null, onAnswer = null }) {
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem('tt_display_mode') || 'binary' } catch { return 'binary' }
  })

  if (!table) return null
  const { variables, subExpressions, rows, classification } = table
  const allCols = [...variables, ...subExpressions]
  const lastCol = subExpressions[subExpressions.length - 1]

  const changeMode = (m) => { setMode(m); try { localStorage.setItem('tt_display_mode', m) } catch {} }

  const classColors = {
    tautology: 'bg-green-100 text-green-800 border-green-200',
    contradiction: 'bg-red-100 text-red-800 border-red-200',
    contingency: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  }
  const classLabels = { tautology: '✓ Tautología', contradiction: '✗ Contradicción', contingency: '◈ Contingencia' }

  const isHidden = (col) => hiddenConfig?.hiddenColumns?.includes(col) ?? false
  const isCellHidden = (row, col) => hiddenConfig?.hiddenCells?.some(c => c.row === row && c.column === col) ?? false

  const getCellKey = (row, col) => `${row}:${col}`
  const getAnswer = (row, col) => answers?.[getCellKey(row, col)]

  const td = `px-4 py-2 text-sm font-mono text-center border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`
  const th = `px-4 py-2 text-xs font-bold text-center border-b ${darkMode ? 'border-gray-600 text-gray-300 bg-gray-800' : 'border-gray-200 text-gray-600 bg-gray-50'}`

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${classColors[classification]}`}>
          {classLabels[classification]}
        </div>
        <DisplayToggle mode={mode} onChange={changeMode} darkMode={darkMode} />
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full">
          <thead>
            <tr>
              {variables.map(v => (
                <th key={v} className={`${th} ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>{v}</th>
              ))}
              {subExpressions.map(s => (
                !isHidden(s) && (
                  <th key={s} className={`${th} ${s === lastCol ? (darkMode ? 'text-violet-300 bg-violet-900/20' : 'text-violet-700 bg-violet-50') : ''}`}>
                    <span className="font-mono">{s}</span>
                  </th>
                )
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className={row[lastCol] ? (darkMode ? 'bg-green-900/10' : 'bg-green-50/50') : ''}>
                {variables.map(v => (
                  <td key={v} className={`${td} ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <span className={`px-2 py-0.5 rounded font-bold text-xs ${
                      row[v]
                        ? (darkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-700')
                        : (darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500')
                    }`}>{fmtVal(row[v], mode)}</span>
                  </td>
                ))}
                {subExpressions.map(s => {
                  if (isHidden(s)) return null
                  const hidden = isCellHidden(ri, s)
                  if (hidden && onAnswer) {
                    const ans = getAnswer(ri, s)
                    return (
                      <td key={s} className={td}>
                        <div className="flex justify-center gap-1">
                          {[true, false].map(v => (
                            <button key={String(v)} type="button"
                              onClick={() => onAnswer(ri, s, v)}
                              className={`w-8 h-7 rounded text-xs font-bold transition ${
                                ans === v
                                  ? (v ? 'bg-green-500 text-white' : 'bg-red-500 text-white')
                                  : (darkMode ? 'bg-gray-700 text-gray-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')
                              }`}>{fmtVal(v, mode)}</button>
                          ))}
                        </div>
                      </td>
                    )
                  }
                  if (hidden) return (
                    <td key={s} className={td}>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${darkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'}`}>?</span>
                    </td>
                  )
                  return (
                    <td key={s} className={`${td} ${s === lastCol ? 'font-bold' : ''}`}>
                      <span className={`px-2 py-0.5 rounded font-bold text-xs ${
                        row[s]
                          ? (s === lastCol
                              ? (darkMode ? 'bg-violet-900/50 text-violet-300' : 'bg-violet-100 text-violet-700')
                              : (darkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700'))
                          : (s === lastCol
                              ? (darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-500')
                              : (darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'))
                      }`}>{fmtVal(row[s], mode)}</span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
