'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUserContextData } from '@/app/context/userData';

export default function AuthChecker({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { userData, setUserData } = useUserContextData();
  const logoutInProgress = useRef(false);

  const handleLogout = async () => {
    if (logoutInProgress.current) return;
    logoutInProgress.current = true;

    try {
      await fetch('/api/logout', { method: 'POST' });
      localStorage.removeItem('userData');
      setUserData(null);
      router.replace('/auth/login?reason=session_expired');
    } catch (error) {
      console.error('Logout error:', error);
      router.replace('/auth/login');
    } finally {
      setTimeout(() => {
        logoutInProgress.current = false;
      }, 1000);
    }
  };

  useEffect(() => {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      
      if (response.status === 401) {
        console.log('🔴 Received 401, logging out...');
        await handleLogout();
        throw new Error('Session expired');
      }
      
      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return <>{children}</>;
}