'use client';

import { useEffect, useRef } from 'react';
import { useUserContextData } from '@/app/context/userData';

const DEV_MODE = process.env.NEXT_PUBLIC_NODE_ENV !== "production";

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

          if (!validateRes.ok) {
            const data = await validateRes.json().catch(() => ({}));
            
            // Don't clear for concurrent login — we now allow multiple devices
            // In dev mode, just warn but don't clear
            if (!DEV_MODE && (validateRes.status === 401 || validateRes.status === 403)) {
              console.warn('🚫 SessionRestore: Session invalid, clearing local data');
              localStorage.removeItem('userData');
              document.cookie = "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
              document.cookie = "sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
              document.cookie = "sb-client-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
              document.cookie = "sb-session-id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
              return;
            } else if (DEV_MODE) {
              console.warn('🔓 Dev mode: session invalid but keeping session active');
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