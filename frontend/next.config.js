// Node.js 22+ exposes a stub global `localStorage` with no methods, which
// crashes Next.js server-side code that checks `typeof localStorage`.
// This polyfill runs only on the server (window === undefined) and only
// when the stub is present but broken. On Vercel (Node 20) localStorage
// is simply undefined and this block never executes.
if (
  typeof window === 'undefined' &&
  typeof localStorage !== 'undefined' &&
  typeof localStorage.getItem !== 'function'
) {
  global.localStorage = {
    getItem:    () => null,
    setItem:    () => {},
    removeItem: () => {},
    clear:      () => {},
    key:        () => null,
    get length() { return 0 },
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Skip ESLint during Vercel builds — run it separately in CI if needed
  turbopack: {
    root: __dirname,
  },

  // Skip TypeScript errors during builds (project uses JSX, not TSX)
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
