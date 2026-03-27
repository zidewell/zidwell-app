'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUserContextData } from '@/app/context/userData';
import { isPublicRoute } from '@/lib/publicRoutes';

export default function AuthChecker({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname(); 
  const { userData, setUserData } = useUserContextData();
  const logoutInProgress = useRef(false);
  
  const isPublic = isPublicRoute(pathname);

  const handleLogout = async () => {
    if (logoutInProgress.current) return;
    logoutInProgress.current = true;

    try {
      await fetch('/api/logout', { method: 'POST' });
      localStorage.removeItem('userData');
      setUserData(null);
      
      
      if (!isPublic) {
        router.replace('/auth/login?reason=session_expired');
      }
    } catch (error) {
      console.error('Logout error:', error);
      if (!isPublic) {
        router.replace('/auth/login');
      }
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
          const data = await response.clone().json().catch(() => ({}));
          
          // Check if we need to retry with refreshed token
          if (data.retry) {
            console.log('🔄 Token expired, retrying request...');
            // Retry the original request
            return originalFetch(...args);
          }
          
          if (data.logout || data.error?.includes('session')) {
            console.log('🔴 Session invalid, logging out...');
            
            // Don't redirect if on a public route
            if (!isPublic) {
              await handleLogout();
            } else {
              // Just clear the invalid data without redirecting
              localStorage.removeItem('userData');
              setUserData(null);
            }
            
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
  }, [handleLogout, isPublic, setUserData]);

  return <>{children}</>;
}