import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Editor from './pages/Editor'
import Analysis from './pages/Analysis'
import KMap from './pages/KMap'
import Exercises from './pages/Exercises'
import CreateExercise from './pages/CreateExercise'
import PlayExercise from './pages/PlayExercise'
import Reference from './pages/Reference'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Register from './pages/Register'

function AppContent() {
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem('darkMode') === 'true' } catch { return false }
  })

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode)
  }, [darkMode])

  const bg = darkMode ? 'bg-gray-900 min-h-screen' : 'bg-gray-50 min-h-screen'

  return (
    <div className={bg}>
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
      <Routes>
        <Route path="/" element={<Home darkMode={darkMode} />} />
        <Route path="/editor" element={<Editor darkMode={darkMode} />} />
        <Route path="/analysis" element={<Analysis darkMode={darkMode} />} />
        <Route path="/kmap" element={<KMap darkMode={darkMode} />} />
        <Route path="/exercises" element={<Exercises darkMode={darkMode} />} />
        <Route path="/exercises/create" element={<CreateExercise darkMode={darkMode} />} />
        <Route path="/exercises/:id" element={<PlayExercise darkMode={darkMode} />} />
        <Route path="/reference" element={<Reference darkMode={darkMode} />} />
        <Route path="/profile" element={<Profile darkMode={darkMode} />} />
        <Route path="/login" element={<Login darkMode={darkMode} />} />
        <Route path="/register" element={<Register darkMode={darkMode} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  )
}
