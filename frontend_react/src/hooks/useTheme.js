import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'falsum-theme';

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    // Read from localStorage before first render to prevent flash
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY) || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    // Keep the 'dark' class for Tailwind's darkMode: 'class'
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggleTheme };
}
