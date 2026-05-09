// app/components/ThemeProvider.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const applyTheme = (newTheme: Theme) => {
    const resolved = newTheme === 'system' ? getSystemTheme() : newTheme;
    
    if (resolved === 'dark') {
      document.documentElement.classList.add('dark');
      setResolvedTheme('dark');
    } else {
      document.documentElement.classList.remove('dark');
      setResolvedTheme('light');
    }
  };

  useEffect(() => {
    setMounted(true);
    
    try {
      const savedTheme = localStorage.getItem('zidwell-theme') as Theme | null;
      const initialTheme = savedTheme || 'system';
      setTheme(initialTheme);
      applyTheme(initialTheme);
    } catch (error) {
      console.error('Error reading theme from localStorage:', error);
      setTheme('system');
      applyTheme('system');
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (theme !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      const newSystemTheme = e.matches ? 'dark' : 'light';
      if (newSystemTheme === 'dark') {
        document.documentElement.classList.add('dark');
        setResolvedTheme('dark');
      } else {
        document.documentElement.classList.remove('dark');
        setResolvedTheme('light');
      }
    };
    
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [theme, mounted]);

  const updateTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    try {
      localStorage.setItem('zidwell-theme', newTheme);
    } catch (error) {
      console.error('Error saving theme to localStorage:', error);
    }
    applyTheme(newTheme);
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme: updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};