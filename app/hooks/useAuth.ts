'use client';

import { useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUserContextData } from '@/app/context/userData';

export function useAuth() {
  const router = useRouter();
  const { userData, setUserData } = useUserContextData();
  const logoutInProgress = useRef(false);

  const logout = useCallback(async (showMessage: boolean = false) => {
    if (logoutInProgress.current) return;
    logoutInProgress.current = true;

    try {
      // Call logout API to clear cookies
      await fetch('/api/logout', { method: 'POST' });

      // Clear localStorage
      localStorage.removeItem('userData');
      localStorage.removeItem('supabase.auth.token');
      
      // Clear context
      setUserData(null);

      if (showMessage) {
        // Optional: Show toast message
        console.log('🔴 User logged out');
      }

      // Redirect to login
      router.replace('/auth/login?reason=session_expired');
    } catch (error) {
      console.error('Logout error:', error);
      router.replace('/auth/login');
    } finally {
      setTimeout(() => {
        logoutInProgress.current = false;
      }, 1000);
    }
  }, [router, setUserData]);

  const checkAuth = useCallback(async () => {
    if (logoutInProgress.current) return true;

    try {
      const response = await fetch('/api/auth/check', {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();

      if (!data.authenticated) {
        console.log('🔴 Session invalid, logging out...');
        await logout();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Auth check error:', error);
      await logout();
      return false;
    }
  }, [logout]);

  return { checkAuth, logout };
}