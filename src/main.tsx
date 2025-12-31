import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import './index.css'

const Petition = lazy(() => import('./Petition'))
const Terms = lazy(() => import('./Terms'))
const Privacy = lazy(() => import('./Privacy'))

const LoadingFallback = () => (
  <div className="min-h-screen bg-terminal-bg text-matrix flex items-center justify-center">
    <div className="text-center">
      <div className="font-terminal text-lg neon-pulse">Loading...</div>
    </div>
  </div>
)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/petition" element={<Petition />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </React.StrictMode>,
)
