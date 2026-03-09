import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../api/axios'
import SymbolKeyboard from '../components/SymbolKeyboard'

const LABEL_COLORS = {
  '¬': '#dc2626', '∧': '#7c3aed', '∨': '#2563eb',
  '→': '#d97706', '↔': '#059669', '⊕': '#db2777',
  '↑': '#9333ea', '↓': '#0891b2'
}
const NODE_RADIUS = 22
const H_GAP = 50   // horizontal gap between subtrees
const V_GAP = 80   // vertical gap between levels

// Returns { width, positions } where positions is Map<node, {x, y}>
function layoutNode(node, depth = 0) {
  if (!node.children || node.children.length === 0) {
    // Leaf
    return { width: NODE_RADIUS * 2 + 10, positions: new Map([[node, { x: 0, y: depth * V_GAP }]]) }
  }

  const childLayouts = node.children.map(c => layoutNode(c, depth + 1))
  const totalChildWidth = childLayouts.reduce((s, l) => s + l.width, 0) + H_GAP * (childLayouts.length - 1)

  // Merge child positions with offsets
  const positions = new Map()
  let xOffset = 0
  childLayouts.forEach((cl, i) => {
    cl.positions.forEach((pos, n) => {
      positions.set(n, { x: pos.x + xOffset, y: pos.y })
    })
    xOffset += cl.width + (i < childLayouts.length - 1 ? H_GAP : 0)
  })

  // Place parent centered over children
  const firstChildX = positions.get(node.children[0]).x
  const lastChildX = positions.get(node.children[node.children.length - 1]).x
  const parentX = (firstChildX + lastChildX) / 2
  positions.set(node, { x: parentX, y: depth * V_GAP })

  return { width: totalChildWidth, positions }
}

function TreeSVG({ node, darkMode }) {
  if (!node) return null
  const { width, positions } = layoutNode(node)

  // Normalize: shift all X to be >= NODE_RADIUS
  let minX = Infinity
  positions.forEach(pos => { if (pos.x < minX) minX = pos.x })
  const offsetX = NODE_RADIUS + 10 - minX
  const normalized = new Map()
  positions.forEach((pos, n) => normalized.set(n, { x: pos.x + offsetX, y: pos.y + NODE_RADIUS + 10 }))

  const svgW = width + NODE_RADIUS * 2 + 20
  const maxY = Math.max(...Array.from(normalized.values()).map(p => p.y))
  const svgH = maxY + NODE_RADIUS + 30

  // Collect edges
  const edges = []
  const collectEdges = (n) => {
    if (!n.children) return
    n.children.forEach(child => {
      const p = normalized.get(n)
      const c = normalized.get(child)
      if (p && c) edges.push({ x1: p.x, y1: p.y, x2: c.x, y2: c.y })
      collectEdges(child)
    })
  }
  collectEdges(node)

  return (
    <svg width={svgW} height={svgH} className="block mx-auto">
      {/* Edges */}
      {edges.map((e, i) => (
        <line key={i} x1={e.x1} y1={e.y1 + NODE_RADIUS} x2={e.x2} y2={e.y2 - NODE_RADIUS}
          stroke={darkMode ? '#4b5563' : '#d1d5db'} strokeWidth="1.5" />
      ))}
      {/* Nodes */}
      {Array.from(normalized.entries()).map(([n, pos], i) => {
        const isLeaf = !n.children || n.children.length === 0
        const fill = isLeaf
          ? (darkMode ? '#1d4ed8' : '#3b82f6')
          : (LABEL_COLORS[n.label] || '#6b7280')
        return (
          <g key={i}>
            <circle cx={pos.x} cy={pos.y} r={NODE_RADIUS} fill={fill} opacity={0.85} />
            <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central"
              fill="white" fontSize={isLeaf ? 13 : 15} fontWeight="bold" fontFamily="monospace">
              {n.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export default function ExpressionTree({ darkMode }) {
  const [searchParams] = useSearchParams()
  const [input, setInput] = useState(() => searchParams.get('expr') || 'A AND B OR NOT C')
  const [tree, setTree] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const generate = async () => {
    if (!input.trim()) return
    setLoading(true); setError('')
    try {
      const r = await api.post('/logic/tree', { expression: input })
      setTree(r.data)
    } catch (e) {
      setError(e.response?.data?.message || 'Expresión inválida')
      setTree(null)
    } finally { setLoading(false) }
  }

  useEffect(() => { generate() }, [])

  const card = `rounded-2xl border p-5 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`

  const LEGEND = [
    { label: '¬', name: 'NOT' }, { label: '∧', name: 'AND' }, { label: '∨', name: 'OR' },
    { label: '→', name: 'IMP' }, { label: '↔', name: 'BICON' }, { label: '⊕', name: 'XOR' },
    { label: '↑', name: 'NAND' }, { label: '↓', name: 'NOR' },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      <div>
        <h1 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>🌳 Árbol de expresión</h1>
        <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Visualización del árbol sintáctico de la fórmula lógica</p>
      </div>

      <div className={card}>
        <div className="flex gap-2">
          <input
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && generate()}
            className={`flex-1 border rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-violet-500 ${darkMode ? 'bg-gray-900 border-gray-600 text-violet-300 placeholder-gray-600' : 'bg-white border-gray-200 text-violet-700'}`}
            placeholder="Escribe tu expresión..."
          />
          <button onClick={generate} disabled={loading}
            className="bg-violet-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-violet-700 transition text-sm disabled:opacity-50">
            {loading ? '...' : 'Generar'}
          </button>
        </div>
        <div className="mt-2">
          <SymbolKeyboard onInsert={s => setInput(prev => prev + s)} darkMode={darkMode} />
        </div>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>

      {/* Legend */}
      <div className={card}>
        <p className={`text-xs font-bold uppercase tracking-wide mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Leyenda de colores</p>
        <div className="flex flex-wrap gap-2">
          {LEGEND.map(({ label, name }) => (
            <span key={name} className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full text-white"
              style={{ backgroundColor: LABEL_COLORS[label] }}>
              {label} {name}
            </span>
          ))}
          <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-blue-500 text-white">A Variable</span>
        </div>
      </div>

      {/* Tree SVG */}
      {tree && (
        <div className={`${card} overflow-x-auto`}>
          <TreeSVG node={tree} darkMode={darkMode} />
        </div>
      )}

      {!tree && !loading && (
        <div className={`text-center py-16 rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="text-5xl mb-3">🌳</div>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Ingresa una expresión para ver el árbol sintáctico</p>
        </div>
      )}
    </div>
  )
}
