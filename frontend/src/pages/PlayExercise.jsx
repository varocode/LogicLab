import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import TruthTable from '../components/TruthTable'

const DIFF_COLORS = { easy: 'bg-green-100 text-green-700', medium: 'bg-yellow-100 text-yellow-700', hard: 'bg-red-100 text-red-700' }
const DIFF_LABELS = { easy: 'Fácil', medium: 'Medio', hard: 'Difícil' }

export default function PlayExercise({ darkMode }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [exercise, setExercise] = useState(null)
  const [table, setTable] = useState(null)
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState({}) // { "row:col": bool }
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState(null)
  const [startTime] = useState(Date.now())
  const [hiddenConfig, setHiddenConfig] = useState(null)
  const [correctAnswers, setCorrectAnswers] = useState({}) // after submit

  useEffect(() => {
    Promise.all([
      api.get(`/exercises/${id}`),
      api.post('/logic/evaluate', { expression: '' }).catch(() => null)
    ]).then(async ([exRes]) => {
      const ex = exRes.data
      setExercise(ex)
      const tableRes = await api.post('/logic/evaluate', { expression: ex.expression })
      setTable(tableRes.data)
      try {
        const config = JSON.parse(ex.hiddenConfig)
        setHiddenConfig(config)
      } catch { setHiddenConfig({ hiddenColumns: [], hiddenCells: [] }) }
    }).catch(() => navigate('/exercises'))
      .finally(() => setLoading(false))
  }, [id])

  const handleAnswer = (row, col, value) => {
    if (submitted) return
    setAnswers(prev => ({ ...prev, [`${row}:${col}`]: value }))
  }

  const submit = async () => {
    if (!user) { navigate('/login'); return }
    const answerList = Object.entries(answers).map(([key, value]) => {
      const [row, ...colParts] = key.split(':')
      return { row: parseInt(row), column: colParts.join(':'), value }
    })
    const timeSpent = Math.floor((Date.now() - startTime) / 1000)
    try {
      const r = await api.post(`/exercises/${id}/attempt`, { answers: answerList, timeSpentSeconds: timeSpent })
      setResult(r.data)
      setSubmitted(true)
      // Show correct answers
      const correct = {}
      if (table && hiddenConfig) {
        const { hiddenColumns = [], hiddenCells = [] } = hiddenConfig
        hiddenColumns.forEach(col => {
          table.rows.forEach((row, ri) => {
            correct[`${ri}:${col}`] = row[col]
          })
        })
        hiddenCells.forEach(({ row, column }) => {
          correct[`${row}:${column}`] = table.rows[row]?.[column]
        })
      }
      setCorrectAnswers(correct)
    } catch (err) { alert('Error al enviar respuestas') }
  }

  const totalHidden = hiddenConfig ? (
    (hiddenConfig.hiddenColumns?.length ?? 0) * (table?.rows?.length ?? 0) +
    (hiddenConfig.hiddenCells?.length ?? 0)
  ) : 0
  const answered = Object.keys(answers).length

  const card = `rounded-2xl border p-5 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>Cargando ejercicio...</div>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
      <button onClick={() => navigate('/exercises')} className={`text-sm ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>← Volver a ejercicios</button>

      {/* Header */}
      <div className={card}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${DIFF_COLORS[exercise?.difficulty]}`}>{DIFF_LABELS[exercise?.difficulty]}</span>
              <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>por {exercise?.author}</span>
            </div>
            <h1 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{exercise?.title}</h1>
            {exercise?.description && <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{exercise.description}</p>}
          </div>
          {exercise?.bestScore != null && (
            <div className={`text-center shrink-0 px-4 py-2 rounded-xl ${exercise.bestScore === 100 ? 'bg-green-100 text-green-700' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600')}`}>
              <div className="text-2xl font-black">{exercise.bestScore}%</div>
              <div className="text-xs">mejor intento</div>
            </div>
          )}
        </div>
        <div className={`mt-3 px-3 py-2 rounded-lg text-xs font-mono ${darkMode ? 'bg-gray-900 text-violet-300' : 'bg-violet-50 text-violet-800'}`}>
          {exercise?.expression}
        </div>
      </div>

      {/* Instructions */}
      {!submitted && (
        <div className={`px-4 py-3 rounded-xl border ${darkMode ? 'bg-blue-900/20 border-blue-800 text-blue-300' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>
          <p className="text-sm font-medium">
            📝 Completa las celdas marcadas con <strong>?</strong> haciendo clic en el valor correcto (0 o 1).
            Progreso: {answered}/{totalHidden} celdas completadas.
          </p>
        </div>
      )}

      {/* Result */}
      {submitted && result && (
        <div className={`px-5 py-4 rounded-2xl border ${
          result.score === 100
            ? 'bg-green-50 border-green-200'
            : result.score >= 70
            ? 'bg-yellow-50 border-yellow-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-4">
            <div className="text-5xl">{result.score === 100 ? '🎉' : result.score >= 70 ? '👍' : '💪'}</div>
            <div>
              <p className="text-3xl font-black">{result.score}%</p>
              <p className="text-sm">{result.correct}/{result.total} respuestas correctas</p>
              {result.score === 100 && <p className="text-sm font-bold text-green-600 mt-1">¡Perfecto! Completaste el ejercicio.</p>}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {table && hiddenConfig && (
        <div className={card}>
          <div className="flex items-center justify-between mb-4">
            <p className={`text-xs font-bold uppercase tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Tabla de verdad — completa los espacios en blanco
            </p>
            {!submitted && answered >= totalHidden && totalHidden > 0 && (
              <button onClick={submit}
                className="bg-green-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-green-700 transition text-sm">
                Verificar respuestas
              </button>
            )}
          </div>
          <ExerciseTable
            table={table} hiddenConfig={hiddenConfig}
            answers={answers} onAnswer={handleAnswer}
            submitted={submitted} correctAnswers={correctAnswers}
            darkMode={darkMode} />
        </div>
      )}

      {submitted && (
        <div className="flex gap-3">
          <button onClick={() => { setAnswers({}); setSubmitted(false); setResult(null) }}
            className={`flex-1 border font-bold py-3 rounded-xl transition ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            Reintentar
          </button>
          <button onClick={() => navigate('/exercises')}
            className="flex-1 bg-violet-600 text-white font-bold py-3 rounded-xl hover:bg-violet-700 transition">
            Más ejercicios
          </button>
        </div>
      )}
    </div>
  )
}

function ExerciseTable({ table, hiddenConfig, answers, onAnswer, submitted, correctAnswers, darkMode }) {
  const { variables, subExpressions, rows } = table
  const { hiddenColumns = [], hiddenCells = [] } = hiddenConfig

  const isColHidden = (col) => hiddenColumns.includes(col)
  const isCellHidden = (row, col) => hiddenCells.some(c => c.row === row && c.column === col)
  const getCellHidden = (row, col) => isColHidden(col) || isCellHidden(row, col)

  const th = `px-4 py-2 text-xs font-bold text-center border-b ${darkMode ? 'border-gray-600 text-gray-300 bg-gray-700' : 'border-gray-200 text-gray-600 bg-gray-50'}`
  const td = `px-2 py-1.5 text-center border-b text-sm ${darkMode ? 'border-gray-700' : 'border-gray-100'}`

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="min-w-full">
        <thead>
          <tr>
            {variables.map(v => <th key={v} className={`${th} ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>{v}</th>)}
            {subExpressions.map(s => (
              <th key={s} className={th}><span className="font-mono text-xs">{s}</span></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {variables.map(v => (
                <td key={v} className={td}>
                  <span className={`px-2 py-0.5 rounded font-bold text-xs font-mono ${
                    row[v]
                      ? (darkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-700')
                      : (darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500')
                  }`}>{row[v] ? '1' : '0'}</span>
                </td>
              ))}
              {subExpressions.map(s => {
                const hidden = getCellHidden(ri, s)
                const ansKey = `${ri}:${s}`
                const ans = answers[ansKey]
                const correctVal = correctAnswers[ansKey]

                if (!hidden) return (
                  <td key={s} className={td}>
                    <span className={`px-2 py-0.5 rounded font-bold text-xs font-mono ${
                      row[s]
                        ? (darkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700')
                        : (darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500')
                    }`}>{row[s] ? '1' : '0'}</span>
                  </td>
                )

                if (submitted) {
                  const isCorrect = ans === correctVal
                  return (
                    <td key={s} className={td}>
                      <div className="flex flex-col items-center gap-0.5">
                        <span className={`px-2 py-0.5 rounded font-bold text-xs font-mono border-2 ${
                          ans === undefined ? 'border-gray-300 text-gray-400'
                          : isCorrect ? 'border-green-400 bg-green-100 text-green-700'
                          : 'border-red-400 bg-red-100 text-red-700'
                        }`}>{ans === undefined ? '—' : ans ? '1' : '0'}</span>
                        {!isCorrect && correctVal !== undefined && (
                          <span className="text-xs text-green-600 font-bold">{correctVal ? '1' : '0'}</span>
                        )}
                      </div>
                    </td>
                  )
                }

                return (
                  <td key={s} className={td}>
                    <div className="flex justify-center gap-1">
                      {[true, false].map(v => (
                        <button key={String(v)} type="button"
                          onClick={() => onAnswer(ri, s, v)}
                          className={`w-8 h-7 rounded text-xs font-bold font-mono transition ${
                            ans === v
                              ? (v ? 'bg-green-500 text-white shadow-sm' : 'bg-red-500 text-white shadow-sm')
                              : (darkMode ? 'bg-gray-700 text-gray-400 hover:bg-gray-600 border border-gray-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-200')
                          }`}>{v ? '1' : '0'}</button>
                      ))}
                    </div>
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
