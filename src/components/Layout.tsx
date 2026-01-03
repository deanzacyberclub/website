import { Outlet, useLocation } from 'react-router-dom'
import PageHeader from './PageHeader'
import Footer from './Footer'

// Map routes to their back navigation
const backLinks: Record<string, { to: string; text: string }> = {
  '/meetings': { to: '/', text: 'cd ~/' },
  '/dashboard': { to: '/', text: 'cd ~/' },
  '/settings': { to: '/dashboard', text: 'cd ../dashboard' },
  '/terms': { to: '/', text: 'cd ~/' },
  '/privacy': { to: '/', text: 'cd ~/' },
  '/auth': { to: '/', text: 'cd ~/' },
  '/live': { to: '/dashboard', text: 'cd ../dashboard' },
}

function Layout() {
  const location = useLocation()
  const path = location.pathname

  // Check for dynamic routes like /meetings/:slug
  let backLink = backLinks[path]
  if (!backLink && path.startsWith('/meetings/')) {
    backLink = { to: '/meetings', text: 'cd ../meetings' }
  }

  return (
    <>
      <div className="relative z-50">
        <div className="max-w-5xl mx-auto px-6 pt-6">
          <PageHeader backTo={backLink?.to} backText={backLink?.text} />
        </div>
      </div>
      <Outlet />
      <div className="max-w-5xl mx-auto px-6 pb-6">
        <Footer />
      </div>
    </>
  )
}

export default Layout
