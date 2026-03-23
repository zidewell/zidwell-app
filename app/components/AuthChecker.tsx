// components/AuthChecker.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserContextData } from '@/app/context/userData';

export default function AuthChecker({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { userData, setUserData } = useUserContextData();

  useEffect(() => {
    // Save original fetch
    const originalFetch = window.fetch;
    
    // Override fetch to catch 401 responses
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      
      // Check if it's a 401 with logout flag
      if (response.status === 401) {
        try {
          const data = await response.clone().json();
          
          if (data.logout) {
            console.log('🔴 Session expired, logging out...');
            
            // Call logout API
            await fetch('/api/logout', { method: 'POST' });
            
            // Clear local data
            localStorage.removeItem('userData');
            localStorage.removeItem('supabase.auth.token');
            setUserData(null);
            
            // Clear all supabase cookies
            document.cookie.split(";").forEach(function(c) {
              document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            });
            
            // Redirect to login
            router.push('/auth/login?reason=session_expired');
            
            // Throw to stop execution
            throw new Error('Session expired');
          }
        } catch (e) {
          if (e instanceof Error && e.message === 'Session expired') {
            throw e;
          }
          // Ignore other errors
        }
      }
      
      return response;
    };

    // Cleanup
    return () => {
      window.fetch = originalFetch;
    };
  }, [router, setUserData]);

  return <>{children}</>;
}