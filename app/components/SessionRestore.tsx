'use client';

import { useEffect, useRef } from 'react';
import { useUserContextData } from '@/app/context/userData';

export function SessionRestore({ children }: { children: React.ReactNode }) {
  const { setUserData, loading, userData } = useUserContextData();
  const restoreAttempted = useRef(false);

  useEffect(() => {
    const restoreSession = async () => {
      if (userData || restoreAttempted.current || loading) return;
      
      restoreAttempted.current = true;

      const hasSession = document.cookie.includes('sb-client-session=true');
      const hasSessionId = document.cookie.includes('sb-session-id=');
      
      if (hasSession && hasSessionId) {
        try {
          const validateRes = await fetch('/api/auth/validate-session', {
            credentials: 'include',
            headers: { 'Cache-Control': 'no-cache' }
          });

          if (validateRes.status === 403) {
            const data = await validateRes.json();
            if (data.reason === 'concurrent_login') {
              console.warn('🚫 SessionRestore: Concurrent login detected, clearing local data');
              localStorage.removeItem('userData');
              document.cookie = "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
              document.cookie = "sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
              document.cookie = "sb-client-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
              document.cookie = "sb-session-id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
              return;
            }
          }

          if (!validateRes.ok) {
            throw new Error('Session invalid');
          }

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
            document.cookie = "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            document.cookie = "sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            document.cookie = "sb-client-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            document.cookie = "sb-session-id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
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