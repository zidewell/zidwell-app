// app/components/SessionRestore.tsx
"use client";

import { useEffect, useRef } from 'react';
import { useUserContextData } from '@/app/context/userData';

export function SessionRestore({ children }: { children: React.ReactNode }) {
  const { setUserData, loading, userData } = useUserContextData();
  const restoreAttempted = useRef(false);

  useEffect(() => {
    const restoreSession = async () => {
      // Skip if already have user data or restore attempted
      if (userData || restoreAttempted.current || loading) return;
      
      restoreAttempted.current = true;

      // Check if we have a session cookie
      const hasSession = document.cookie.includes('sb-client-session=true');
      const hasSessionId = document.cookie.includes('sb-session-id=');
      
      if (!hasSession || !hasSessionId) {
        // No session, clear any stale data
        localStorage.removeItem('userData');
        return;
      }

      try {
        // Validate session first
        const validateRes = await fetch('/api/auth/validate-session', {
          credentials: 'include',
          headers: { 'Cache-Control': 'no-cache' },
        });

        if (!validateRes.ok) {
          // Session invalid, clear data
          localStorage.removeItem('userData');
          document.cookie = "sb-client-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          return;
        }

        // Fetch user data
        const response = await fetch('/api/user/me', {
          credentials: 'include',
          headers: { 'Cache-Control': 'no-cache' },
        });
        
        if (response.ok) {
          const userData = await response.json();
          if (userData && userData.id) {
            setUserData(userData);
            localStorage.setItem('userData', JSON.stringify(userData));
            console.log('✅ Session restored successfully');
          }
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
        // Don't clear on network error - let the user retry
      }
    };

    restoreSession();
  }, [setUserData, loading, userData]);

  return <>{children}</>;
}