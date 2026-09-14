'use client';
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
}>({ theme: 'light', toggleTheme: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const saved = localStorage.getItem('trikmed-theme') as Theme;
    if (saved) setTheme(saved as Theme);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');

    if (theme === 'dark') {
      root.style.setProperty('--tm-bg',         '#0f172a');
      root.style.setProperty('--tm-surface',    '#1e293b');
      root.style.setProperty('--tm-surface2',   '#0f172a');
      root.style.setProperty('--tm-border',     '#334155');
      root.style.setProperty('--tm-text',       '#f1f5f9');
      root.style.setProperty('--tm-text-muted', '#94a3b8');
      root.style.setProperty('--tm-input-bg',   '#1e293b');
      document.body.style.backgroundColor = '#0f172a';
      document.body.style.color           = '#f1f5f9';
    } else {
      root.style.setProperty('--tm-bg',         '#F7F9FF');
      root.style.setProperty('--tm-surface',    '#ffffff');
      root.style.setProperty('--tm-surface2',   '#F7F9FF');
      root.style.setProperty('--tm-border',     '#DDE4F0');
      root.style.setProperty('--tm-text',       '#0F2D5E');
      root.style.setProperty('--tm-text-muted', '#6B7A9A');
      root.style.setProperty('--tm-input-bg',   '#ffffff');
      document.body.style.backgroundColor = '';
      document.body.style.color           = '';
    }

    localStorage.setItem('trikmed-theme', theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
