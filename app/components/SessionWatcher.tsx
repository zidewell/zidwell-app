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

  // Function to perform logout without refresh
  const performLogout = useCallback(async (reason: string = 'inactivity') => {
    // Prevent multiple logout attempts
    if (logoutInProgressRef.current) return;
    logoutInProgressRef.current = true;

    console.log(`Logging out due to: ${reason}`);

    try {
      // Call logout API (fire and forget - don't wait)
      fetch("/api/logout", { 
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        // Keepalive ensures the request completes even if page unloads
        keepalive: true
      }).catch(err => console.error("Logout API error:", err));

      // Clear all client-side storage immediately
      if (typeof window !== "undefined") {
        localStorage.removeItem("userData");
        localStorage.removeItem("supabase.auth.token");
        sessionStorage.clear();
        
        // Clear any other app-specific items
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.includes('supabase') || key?.includes('sb-') || key?.includes('user')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }

      // Update context state (this will trigger UI updates immediately)
      setUserData(null);

      // Small delay to ensure state updates are processed
      setTimeout(() => {
        // Use replace to prevent going back to protected page
        router.replace("/auth/login?reason=session_expired");
      }, 100);

    } catch (error) {
      console.error("Logout error:", error);
      // Still try to redirect even if API fails
      setUserData(null);
      router.replace("/auth/login?reason=error");
    } finally {
      // Reset flag after a delay
      setTimeout(() => {
        logoutInProgressRef.current = false;
      }, 2000);
    }
  }, [router, setUserData]);

  // Activity tracking effect
  useEffect(() => {
    if (!isUserLoggedIn) return;

    let activityTimer: NodeJS.Timeout;
    
    const updateActivity = () => {
      setLastActivityTime(Date.now());
    };

    // Debounced activity handler
    const handleActivity = () => {
      clearTimeout(activityTimer);
      activityTimer = setTimeout(updateActivity, 500);
    };

    // Track all user interactions
    const events = [
      "mousedown", "click", "scroll", "keydown", 
      "touchstart", "focus", "mousemove"
    ];

    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Track route changes via Next.js router
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

    // Initial activity
    handleActivity();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      clearTimeout(activityTimer);
      
      // Restore original router methods
      router.push = originalPush;
      router.replace = originalReplace;
    };
  }, [isUserLoggedIn, router]);

  // Auto logout timer effect
  useEffect(() => {
    if (!isUserLoggedIn || logoutInProgressRef.current) return;

    let logoutTimer: NodeJS.Timeout;
    let checkInterval: NodeJS.Timeout;

    // Check more frequently (every 5 seconds) for more responsive logout
    const checkInactivity = () => {
      // Double-check if user is still logged in
      if (!userData || logoutInProgressRef.current) {
        return;
      }

      const timeSinceLastActivity = Date.now() - lastActivityTime;
      
      // If inactive for too long, log out immediately
      if (timeSinceLastActivity > INACTIVITY_LIMIT) {
        console.log(`Inactive for ${Math.round(timeSinceLastActivity / 1000)}s, logging out`);
        performLogout('inactivity');
      }
    };

    // Check every 5 seconds for better responsiveness
    checkInterval = setInterval(checkInactivity, 5000);
    
    // Also set a precise timer for the exact timeout
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
        // User returned to tab, check if session should still be valid
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

  // Handle before unload to clean up
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Clean up if needed
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

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

  // Don't render anything until mounted
  if (!isMounted) {
    return null;
  }

  return <>{children}</>;
}