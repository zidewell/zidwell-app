'use client';

import { useEffect, useRef } from 'react';
import { useUserContextData } from '@/app/context/userData';

export function SessionRestore({ children }: { children: React.ReactNode }) {
  const { setUserData, loading, userData } = useUserContextData();
  const restoreAttempted = useRef(false);

  useEffect(() => {
    const restoreSession = async () => {
      // Don't restore if we already have user data or already attempted
      if (userData || restoreAttempted.current || loading) return;
      
      restoreAttempted.current = true;

      // Check if we have session cookie
      const hasSession = document.cookie.includes('sb-client-session=true');
      
      if (hasSession) {
        try {
          const response = await fetch('/api/user/me', {
            credentials: 'include',
            headers: {
              'Cache-Control': 'no-cache'
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            if (userData && userData.id) {
              setUserData(userData);
              localStorage.setItem('userData', JSON.stringify(userData));
              console.log('✅ Session restored successfully');
            }
          } else if (response.status === 401) {
            // Session expired, clear cookies
            document.cookie = "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            document.cookie = "sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            document.cookie = "sb-client-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          }
        } catch (error) {
          console.error('Failed to restore session:', error);
        }
      }
    };

    restoreSession();
  }, [setUserData, loading, userData]);

  return <>{children}</>;
}