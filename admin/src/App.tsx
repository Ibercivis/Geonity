import AppShell from '@/features/app/AppShell'
import { GoogleAuthCallbackPage } from '@/features/auth/components/GoogleAuthCallbackPage'
import { getGoogleCallbackPath } from '@/features/auth/google'

function normalizePathname(pathname: string): string {
	if (!pathname) return '/'
	return pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname
}

export default function App() {
	const pathname = typeof window === 'undefined' ? '/' : window.location.pathname
	const callbackPath = normalizePathname(getGoogleCallbackPath())

	if (normalizePathname(pathname) === callbackPath) {
		return <GoogleAuthCallbackPage />
	}

	return <AppShell />
}
