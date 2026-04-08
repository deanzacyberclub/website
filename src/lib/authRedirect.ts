import type { Session } from '@supabase/supabase-js'

/**
 * Returns true if the URL uses a non-web protocol (e.g. dacc://).
 * Used to detect iOS app deep link redirects.
 */
export function isAppDeepLink(url: string): boolean {
  try {
    const { protocol } = new URL(url)
    return protocol !== 'http:' && protocol !== 'https:'
  } catch {
    return false
  }
}

/**
 * Redirects to an app deep link with the Supabase session tokens appended as
 * query parameters so the native app can call setSession().
 */
export function redirectToApp(deepLink: string, session: Session): void {
  const url = new URL(deepLink)
  url.searchParams.set('access_token', session.access_token)
  url.searchParams.set('refresh_token', session.refresh_token)
  window.location.href = url.toString()
}
