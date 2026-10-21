import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Cats } from './cats/Cats'
import { Hobbies } from './pages/Hobbies'
import { Portfolio } from './pages/Portfolio'

// La app se carga aparte: el portafolio no descarga su código
const AppShell = lazy(() => import('./app/AppShell'))

export function App() {
  return (
    <BrowserRouter>
      <Cats />
      <Routes>
        <Route path="/" element={<Portfolio />} />
        <Route path="/hobbies" element={<Hobbies />} />
        <Route
          path="/app/*"
          element={
            <Suspense fallback={null}>
              <AppShell />
            </Suspense>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
