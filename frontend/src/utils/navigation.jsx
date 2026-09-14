'use client'
import { useRouter, usePathname } from 'next/navigation'
import { useParams as useNextParams, useSearchParams as useNextSearchParams } from 'next/navigation'
import NextLink from 'next/link'

export function useNavigate() {
  const router = useRouter()
  return (path, options) => {
    if (!path && path !== 0) return
    if (typeof path === 'number') { router.back(); return }
    if (options?.replace) router.replace(path)
    else router.push(path)
  }
}

export function useLocation() {
  const pathname = usePathname()
  return {
    pathname,
    search: typeof window !== 'undefined' ? window.location.search : '',
    hash: typeof window !== 'undefined' ? window.location.hash : '',
  }
}

export function useParams() {
  return useNextParams()
}

export function useSearchParams() {
  const params = useNextSearchParams()
  // Return [params, setter] tuple to match React Router's useSearchParams API
  return [params, () => {}]
}

export function Navigate({ to, replace }) {
  const router = useRouter()
  if (typeof window !== 'undefined') {
    if (replace) router.replace(to)
    else router.push(to)
  }
  return null
}

export function Link({ to, href, children, className, style, onClick, ...rest }) {
  return (
    <NextLink
      href={to || href || '/'}
      className={className}
      style={style}
      onClick={onClick}
      {...rest}
    >
      {children}
    </NextLink>
  )
}

// NavLink — same as Link; active state is handled manually in components via useLocation()
export const NavLink = Link

// Outlet — stub; layouts that used <Outlet /> must use {children} instead (see layouts/)
export function Outlet() { return null }

// Stubs for App.jsx (not used in Next.js routing)
export function BrowserRouter({ children }) { return children }
export function Routes({ children }) { return children }
export function Route() { return null }
