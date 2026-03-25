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

// Update your fetch interceptor in AuthChecker
useEffect(() => {
  const originalFetch = window.fetch;
  
  window.fetch = async (...args) => {
    try {
      const response = await originalFetch(...args);
      
      // Handle 401 responses
      if (response.status === 401) {
        const data = await response.clone().json();
        
        // Check if we need to retry with refreshed token
        if (data.retry) {
          console.log('🔄 Token expired, retrying request...');
          // Retry the original request
          return originalFetch(...args);
        }
        
        if (data.logout || data.error?.includes('session')) {
          console.log('🔴 Session invalid, logging out...');
          await handleLogout();
          throw new Error('Session expired');
        }
      }
      
      return response;
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  };

  return () => {
    window.fetch = originalFetch;
  };
}, [handleLogout]);

  return <>{children}</>;
}