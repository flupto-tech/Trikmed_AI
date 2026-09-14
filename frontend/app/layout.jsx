import '../src/index.css'
import { ThemeProvider } from '../src/context/ThemeContext'

export const metadata = {
  title: 'TrikMed — AI Clinic Manager',
  description: 'Smart clinic management for Indian doctors',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body style={{ overflowX: 'hidden' }}><ThemeProvider>{children}</ThemeProvider></body>
    </html>
  )
}
