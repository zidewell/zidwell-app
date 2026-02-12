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

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserContextData } from "../context/userData"; 
export default function SessionWatcher({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const [isMounted, setIsMounted] = useState(false);
 const INACTIVITY_LIMIT = process.env.NODE_ENV === 'development' 
  ? 60 * 60 * 1000 
  : 15 * 60 * 1000; 

  const { userData, setUserData, loading } = useUserContextData();
  
  // Check if user is logged in based on your context
  const isUserLoggedIn = !loading && !!userData;

  // Activity tracking effect - only runs if user is logged in
  useEffect(() => {
    if (!isUserLoggedIn) return;

    let activityTimer: NodeJS.Timeout;
    
    const updateActivity = () => {
      setLastActivityTime(Date.now());
    };

    const handleActivity = () => {
      clearTimeout(activityTimer);
      activityTimer = setTimeout(updateActivity, 1000);
    };

    const events = [
      "mousedown", 
      "click", 
      "scroll",
      "keydown",
      "touchstart",
      "focus"
    ];

    const handleRouteChange = () => {
      handleActivity();
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    window.addEventListener('popstate', handleRouteChange);

    // Also listen for any route changes via Next.js router
    const originalPush = router.push;
    const originalReplace = router.replace;
    
    // Override router methods to track navigation
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
      window.removeEventListener('popstate', handleRouteChange);
      clearTimeout(activityTimer);
      
      // Restore original router methods
      router.push = originalPush;
      router.replace = originalReplace;
    };
  }, [isUserLoggedIn, router]);

  // Auto logout effect - only runs if user is logged in
  useEffect(() => {
    if (!isUserLoggedIn) return;

    let logoutTimer: NodeJS.Timeout;
    let alreadyLoggedOut = false;

    const checkInactivity = async () => {
      // Double-check if user is still logged in
      if (!userData) {
        return;
      }

      const currentTime = Date.now();
      const timeSinceLastActivity = currentTime - lastActivityTime;
      
      // console.log(`Time since last activity: ${Math.round(timeSinceLastActivity / 1000)}s`);
      
      if (!alreadyLoggedOut && timeSinceLastActivity > INACTIVITY_LIMIT) {
        alreadyLoggedOut = true;
        
    

        try {
          // Sign out via API
          const response = await fetch("/api/logout", { 
            method: "POST",
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          if (!response.ok) {
            throw new Error('Logout API failed');
          }
        } catch (error) {
          console.error("Logout API error:", error);
        }

        // Clear local storage
        if (typeof window !== "undefined") {
          localStorage.removeItem("userData");
          localStorage.removeItem("supabase.auth.token");
          sessionStorage.clear();
        }

        // Update context state
        setUserData(null);
        
        // Redirect to login
        router.replace("/auth/login");
      }
    };

    // Check every minute
    logoutTimer = setInterval(checkInactivity, 60000);

    return () => {
      if (logoutTimer) clearInterval(logoutTimer);
    };
  }, [lastActivityTime, router, isUserLoggedIn, userData, setUserData]);

  // Handle page visibility (when user switches tabs/windows)
  useEffect(() => {
    if (!isUserLoggedIn) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // User returned to the tab, update activity time
        setLastActivityTime(Date.now());
        // console.log("User returned to tab, activity updated");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isUserLoggedIn]);

  // Reset activity time when component mounts or user logs in
  useEffect(() => {
    if (isUserLoggedIn) {
      setLastActivityTime(Date.now());
    }
  }, [isUserLoggedIn]);

  // Set mounted state to avoid hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Don't render anything until mounted to avoid hydration mismatch
  if (!isMounted) {
    return null;
  }

  return <>{children}</>;
}