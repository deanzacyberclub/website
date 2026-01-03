import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import App from '@/pages/App'
import './index.css'
import Footer from './components/Footer'

const Attendance = lazy(() => import('@/pages/Attendance'))
const Terms = lazy(() => import('@/pages/Terms'))
const Privacy = lazy(() => import('@/pages/Privacy'))
const Meetings = lazy(() => import('@/pages/Meetings'))
const MeetingDetails = lazy(() => import('@/pages/MeetingDetails'))
const NotFound = lazy(() => import('@/pages/NotFound'))
const Auth = lazy(() => import('@/pages/Auth'))
const AuthCallback = lazy(() => import('@/pages/AuthCallback'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Settings = lazy(() => import('@/pages/Settings'))

const LoadingFallback = () => (
  <div className="min-h-screen bg-terminal-bg text-matrix flex items-center justify-center">
    <div className="text-center">
      <div className="font-terminal text-lg neon-pulse">Loading...</div>
    </div>
  </div>
)

ReactDOM.createRoot(document.getElementById('deanzacybersecurityclub')!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/live" element={<Attendance />} />
            <Route path="/meetings" element={<Meetings />} />
            <Route path="/meetings/:slug" element={<MeetingDetails />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>,
)
