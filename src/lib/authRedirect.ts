import type { Session } from '@supabase/supabase-js'

/**
 * Returns true if the URL uses a non-web protocol (e.g. dacc://).
 * Deliberately avoids `new URL()` since WebKit may reject custom schemes.
 */
export function isAppDeepLink(url: string): boolean {
  return !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')
}

/**
 * Redirects to an app deep link with the Supabase session tokens appended as
 * query parameters so the native app can call setSession().
 * Avoids `new URL()` for the same WebKit compatibility reason.
 */
export function redirectToApp(deepLink: string, session: Session): void {
  const connector = deepLink.includes('?') ? '&' : '?'
  window.location.href = `${deepLink}${connector}access_token=${encodeURIComponent(session.access_token)}&refresh_token=${encodeURIComponent(session.refresh_token)}`
}
