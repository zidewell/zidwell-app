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
// }'use client';
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUserContextData } from "@/app/context/userData";
import { useAuth } from "../hooks/useAuth";

// Public routes that don't need auth
const PUBLIC_ROUTES = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/",
  "/pricing",
  "/blog",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
];

export default function SessionWatcher({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { userData, loading } = useUserContextData();
  const { checkAuth, logout } = useAuth();
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const checkedRef = useRef(false);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const authCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Set inactivity limit based on environment
  const INACTIVITY_LIMIT =
    process.env.NODE_ENV === "production"
      ? 15 * 60 * 1000 // 15 minutes in production
      : 120 * 60 * 1000; // 2 hour in development

  // Check if current route is public
  const isPublicRoute = useCallback(() => {
    if (!pathname) return false;
    return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  }, [pathname]);

  // Reset activity timer
  const resetActivityTimer = useCallback(() => {
    setLastActivityTime(Date.now());

    // Clear existing timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    // Set new timer
    inactivityTimerRef.current = setTimeout(() => {
      const timeSinceLastActivity = Date.now() - lastActivityTime;
      if (
        timeSinceLastActivity >= INACTIVITY_LIMIT &&
        userData &&
        !isPublicRoute()
      ) {
        console.log(
          `🕐 Inactive for ${Math.round(timeSinceLastActivity / 1000)}s, logging out...`,
        );
        logout();
      }
    }, INACTIVITY_LIMIT);
  }, [INACTIVITY_LIMIT, lastActivityTime, userData, isPublicRoute, logout]);

  // Track user activity
  useEffect(() => {
    if (!userData || isPublicRoute()) return;

    const events = [
      "mousedown",
      "click",
      "scroll",
      "keydown",
      "touchstart",
      "focus",
      "mousemove",
      "wheel",
    ];

    const handleActivity = () => {
      resetActivityTimer();
    };

    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Initial timer
    resetActivityTimer();

    // Handle visibility change (tab focus)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // User came back to tab, check if they were away too long
        const timeAway = Date.now() - lastActivityTime;
        if (timeAway > INACTIVITY_LIMIT) {
          console.log("🕐 Tab inactive too long, logging out...");
          logout();
        } else {
          resetActivityTimer();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [
    userData,
    isPublicRoute,
    resetActivityTimer,
    INACTIVITY_LIMIT,
    lastActivityTime,
    logout,
  ]);

  // Periodic auth check (every 5 minutes)
  useEffect(() => {
    if (!userData || isPublicRoute()) return;

    const performAuthCheck = async () => {
      const isValid = await checkAuth();
      if (!isValid) {
        // Auth check will trigger logout
        if (authCheckIntervalRef.current) {
          clearInterval(authCheckIntervalRef.current);
        }
      }
    };

    // Check immediately on mount
    performAuthCheck();

    // Set up interval
    authCheckIntervalRef.current = setInterval(performAuthCheck, 5 * 60 * 1000);

    return () => {
      if (authCheckIntervalRef.current) {
        clearInterval(authCheckIntervalRef.current);
      }
    };
  }, [userData, isPublicRoute, checkAuth]);

  // Check auth on route change
  useEffect(() => {
    if (!userData || isPublicRoute() || checkedRef.current) return;

    checkedRef.current = true;

    const validateOnRouteChange = async () => {
      const isValid = await checkAuth();
      if (!isValid) {
        checkedRef.current = false;
      }
    };

    validateOnRouteChange();

    // Reset check after 5 minutes
    setTimeout(
      () => {
        checkedRef.current = false;
      },
      5 * 60 * 1000,
    );
  }, [pathname, userData, isPublicRoute, checkAuth]);

  return <>{children}</>;
}
