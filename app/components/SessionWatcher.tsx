// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";

// export default function SessionWatcher({ children }: { children: React.ReactNode }) {
//   const router = useRouter();
//   const [lastActivityTime, setLastActivityTime] = useState(Date.now());
//   const INACTIVITY_LIMIT = 15 * 60 * 1000; 

//   useEffect(() => {
//     let activityTimer: NodeJS.Timeout;
    
//     const updateActivity = () => {
//       setLastActivityTime(Date.now());
//     };

//     // Debounced activity update to prevent too many state updates
//     const handleActivity = () => {
//       clearTimeout(activityTimer);
//       activityTimer = setTimeout(updateActivity, 1000); // Update only once per second max
//     };

//     // Track essential user activities only
//     const events = [
//       "mousedown", 
//       "click", 
//       "scroll",
//       "keydown",
//       "touchstart",
//       "focus"
//     ];

//     // Also track route changes
//     const handleRouteChange = () => {
//       handleActivity();
//     };

//     events.forEach(event => {
//       document.addEventListener(event, handleActivity, { passive: true });
//     });

//     // Listen for route changes
//     window.addEventListener('popstate', handleRouteChange);

//     // Initial activity mark
//     handleActivity();

//     return () => {
//       events.forEach(event => {
//         document.removeEventListener(event, handleActivity);
//       });
//       window.removeEventListener('popstate', handleRouteChange);
//       clearTimeout(activityTimer);
//     };
//   }, []);

//   // Auto logout only after 15 minutes of complete inactivity
//   useEffect(() => {
//     let logoutTimer: NodeJS.Timeout;
//     let alreadyLoggedOut = false;

//     const checkInactivity = async () => {
//       const currentTime = Date.now();
//       const timeSinceLastActivity = currentTime - lastActivityTime;
      
//       // console.log(`Time since last activity: ${Math.round(timeSinceLastActivity / 1000)}s`);
      
//       // Check if user has been inactive for 15 minutes
//       if (!alreadyLoggedOut && timeSinceLastActivity > INACTIVITY_LIMIT) {
//         alreadyLoggedOut = true;
        
//         console.log("User inactive for 15 minutes, logging out...");

//         try {
//           // Sign out via API
//           const response = await fetch("/api/logout", { 
//             method: "POST",
//             headers: {
//               'Content-Type': 'application/json',
//             }
//           });
          
//           if (!response.ok) {
//             throw new Error('Logout API failed');
//           }
//         } catch (error) {
//           console.error("Logout API error:", error);
//         }

//         // Clear local storage
//         if (typeof window !== "undefined") {
//           localStorage.removeItem("userData");
//           localStorage.removeItem("supabase.auth.token");
//           sessionStorage.clear();
//         }

//         // Redirect to login
//         router.replace("/auth/login");
//       }
//     };

//     // Check every minute instead of 30 seconds to reduce performance impact
//     logoutTimer = setInterval(checkInactivity, 60000);

//     return () => {
//       if (logoutTimer) clearInterval(logoutTimer);
//     };
//   }, [lastActivityTime, router]);

//   // Handle page visibility (when user switches tabs/windows)
//   useEffect(() => {
//     const handleVisibilityChange = () => {
//       if (!document.hidden) {
//         // User returned to the tab, update activity time
//         setLastActivityTime(Date.now());
//         // console.log("User returned to tab, activity updated");
//       }
//     };

//     document.addEventListener("visibilitychange", handleVisibilityChange);
    
//     return () => {
//       document.removeEventListener("visibilitychange", handleVisibilityChange);
//     };
//   }, []);

//   // Reset activity time when component mounts (page load/refresh)
//   useEffect(() => {
//     setLastActivityTime(Date.now());
//   }, []);

//   return <>{children}</>;
// }
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUserContextData } from "../context/userData"; 

export default function SessionWatcher({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const [isMounted, setIsMounted] = useState(false);
  const logoutInProgressRef = useRef(false);
  
  const INACTIVITY_LIMIT = process.env.NODE_ENV === 'development' 
    ? 60 * 60 * 1000 
    : 15 * 60 * 1000; 

  const { userData, setUserData, loading } = useUserContextData();
  
  // Check if user is logged in based on your context
  const isUserLoggedIn = !loading && !!userData;

  // Clear payment success cookie on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Clear the payment success cookie if it exists
      document.cookie = 'payment_success=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  }, []);

  // Function to perform logout without refresh
  const performLogout = useCallback(async (reason: string = 'inactivity') => {
    if (logoutInProgressRef.current) return;
    logoutInProgressRef.current = true;

    console.log(`Logging out due to: ${reason}`);

    try {
      fetch("/api/logout", { 
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        keepalive: true
      }).catch(err => console.error("Logout API error:", err));

      if (typeof window !== "undefined") {
        localStorage.removeItem("userData");
        localStorage.removeItem("supabase.auth.token");
        sessionStorage.clear();
        
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.includes('supabase') || key?.includes('sb-') || key?.includes('user')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }

      setUserData(null);

      setTimeout(() => {
        router.replace("/auth/login?reason=session_expired");
      }, 100);

    } catch (error) {
      console.error("Logout error:", error);
      setUserData(null);
      router.replace("/auth/login?reason=error");
    } finally {
      setTimeout(() => {
        logoutInProgressRef.current = false;
      }, 2000);
    }
  }, [router, setUserData]);

  // Activity tracking effect (rest of your existing code)
  useEffect(() => {
    if (!isUserLoggedIn) return;

    let activityTimer: NodeJS.Timeout;
    
    const updateActivity = () => {
      setLastActivityTime(Date.now());
    };

    const handleActivity = () => {
      clearTimeout(activityTimer);
      activityTimer = setTimeout(updateActivity, 500);
    };

    const events = [
      "mousedown", "click", "scroll", "keydown", 
      "touchstart", "focus", "mousemove"
    ];

    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    const originalPush = router.push;
    const originalReplace = router.replace;
    
    router.push = (...args) => {
      handleActivity();
      return originalPush.apply(router, args);
    };
    
    router.replace = (...args) => {
      handleActivity();
      return originalReplace.apply(router, args);
    };

    handleActivity();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      clearTimeout(activityTimer);
      
      router.push = originalPush;
      router.replace = originalReplace;
    };
  }, [isUserLoggedIn, router]);

  // Auto logout timer effect
  useEffect(() => {
    if (!isUserLoggedIn || logoutInProgressRef.current) return;

    let logoutTimer: NodeJS.Timeout;
    let checkInterval: NodeJS.Timeout;

    const checkInactivity = () => {
      if (!userData || logoutInProgressRef.current) {
        return;
      }

      const timeSinceLastActivity = Date.now() - lastActivityTime;
      
      if (timeSinceLastActivity > INACTIVITY_LIMIT) {
        console.log(`Inactive for ${Math.round(timeSinceLastActivity / 1000)}s, logging out`);
        performLogout('inactivity');
      }
    };

    checkInterval = setInterval(checkInactivity, 5000);
    
    logoutTimer = setTimeout(() => {
      checkInactivity();
    }, INACTIVITY_LIMIT + 1000);

    return () => {
      clearInterval(checkInterval);
      clearTimeout(logoutTimer);
    };
  }, [lastActivityTime, isUserLoggedIn, userData, performLogout, INACTIVITY_LIMIT]);

  // Handle page visibility changes
  useEffect(() => {
    if (!isUserLoggedIn) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const timeAway = Date.now() - lastActivityTime;
        if (timeAway > INACTIVITY_LIMIT) {
          performLogout('tab_return_timeout');
        } else {
          setLastActivityTime(Date.now());
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isUserLoggedIn, lastActivityTime, performLogout, INACTIVITY_LIMIT]);

  // Reset activity time when user logs in
  useEffect(() => {
    if (isUserLoggedIn) {
      setLastActivityTime(Date.now());
      logoutInProgressRef.current = false;
    }
  }, [isUserLoggedIn]);

  // Set mounted state
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return <>{children}</>;
}