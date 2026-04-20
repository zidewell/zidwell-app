"use client";

import { Menu, LogOut } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { useUserContextData } from "@/app/context/userData";
import NotificationBell from "../NotificationBell";

interface DashboardHeaderProps {
  onMenuClick: () => void;
}

const DashboardHeader = ({ onMenuClick }: DashboardHeaderProps) => {
  const [dark, setDark] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const { userData, setUserData } = useUserContextData();
  const logoutInProgress = useRef(false);

  // Theme toggle effect
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [dark]);

  // Restore user from localStorage (only runs on client)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("userData");
      if (stored) {
        try {
          setUserData(JSON.parse(stored));
        } catch (error) {
          console.error("Error parsing user data:", error);
        }
      }
    }
  }, [setUserData]);

  const handleLogout = async () => {
    // Prevent multiple logout attempts
    if (logoutInProgress.current || isLoggingOut) return;
    
    // Show confirmation dialog first
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You will be logged out of your account",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#db3a34',
      cancelButtonColor: '#6b6b6b',
      confirmButtonText: 'Yes, logout',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    });

    if (!result.isConfirmed) {
      return;
    }
    
    logoutInProgress.current = true;
    setIsLoggingOut(true);

    // Show loading alert
    Swal.fire({
      title: "Logging out...",
      text: "Please wait",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    // Clear client-side storage IMMEDIATELY
    const clearLocalData = () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("userData");
        sessionStorage.removeItem("userData");
        // Clear any auth cookies
        document.cookie.split(";").forEach(cookie => {
          const [name] = cookie.split("=");
          if (name.trim() === "verified" || name.trim() === "session") {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          }
        });
      }
      setUserData(null);
    };

    clearLocalData();

    // Make API calls in background (fire and forget)
    const apiCalls = [];

    // Call logout API
    apiCalls.push(
      fetch("/api/logout", { method: "POST" }).catch(err => 
        console.error("Logout API error:", err)
      )
    );

    // Track last logout activity if user data exists
    if (userData) {
      apiCalls.push(
        fetch("/api/activity/last-logout", {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userData.id,
            email: userData.email,
            login_history_id: userData.currentLoginSession
          }),
        }).catch(err => 
          console.error("Error tracking logout activity:", err)
        )
      );
    }

    // Execute API calls in background
    Promise.allSettled(apiCalls).catch(err => 
      console.error("Background logout tasks failed:", err)
    );

    // Close loading alert and show success
    Swal.close();
    
    await Swal.fire({
      icon: "success",
      title: "Logged Out!",
      text: "You have been successfully logged out",
      timer: 1500,
      showConfirmButton: false,
    });

    // Redirect to login page
    router.push("/auth/login");

    // Reset logout flags
    setTimeout(() => {
      logoutInProgress.current = false;
      setIsLoggingOut(false);
    }, 500);
  };

  return (
    <header className="sticky top-0 z-30 bg-[#f7f7f7] dark:bg-[#0e0e0e] border-b-2 border-[#242424] dark:border-[#474747]">
      <div className="flex items-center justify-between h-20 px-6 md:px-10">
        {/* Left Section - Menu and Logo */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2.5 rounded-md border-2 border-[#242424] dark:border-[#474747] text-[#6b6b6b] dark:text-[#a6a6a6] hover:text-[#141414] dark:hover:text-[#f5f5f5] hover:bg-[#f0efe7] dark:hover:bg-[#242424] shadow-[2px_2px_0px_#242424] dark:shadow-[2px_2px_0px_#000000] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-xl font-bold lg:hidden uppercase tracking-tight text-[#141414] dark:text-[#f5f5f5]">
            Zidwell
          </span>
          
          {/* Welcome Message - Desktop */}
          {userData?.fullName && (
            <h1 className="hidden lg:block text-lg font-bold text-[#141414] dark:text-[#f5f5f5]">
              Hello, {userData.fullName}
            </h1>
          )}
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-3">
          {/* Welcome Message - Mobile */}
          {userData?.fullName && (
            <span className="lg:hidden text-sm text-[#6b6b6b] dark:text-[#a6a6a6]">
              Hi, {userData.fullName.split(' ')[0]}
            </span>
          )}

          {/* Theme Toggle Button */}
          {/* <button
            onClick={() => setDark(!dark)}
            className="p-2.5 rounded-md border-2 border-[#242424] dark:border-[#474747] text-[#6b6b6b] dark:text-[#a6a6a6] hover:text-[#141414] dark:hover:text-[#f5f5f5] hover:bg-[#f0efe7] dark:hover:bg-[#242424] shadow-[2px_2px_0px_#242424] dark:shadow-[2px_2px_0px_#000000] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all"
            aria-label="Toggle theme"
          >
            {dark ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>}
          </button> */}

          {/* Notification Bell */}
          <NotificationBell />

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-md border-2 border-[#242424] dark:border-[#474747] bg-[#db3a34] text-white hover:bg-[#c12e28] shadow-[2px_2px_0px_#242424] dark:shadow-[2px_2px_0px_#000000] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all ${
              isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline text-sm font-bold uppercase tracking-wide">
              Logout
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Welcome Message - Below header on mobile */}
      {userData?.fullName && (
        <div className="lg:hidden px-6 pb-3 -mt-2">
          <p className="text-sm text-[#6b6b6b] dark:text-[#a6a6a6]">
            Welcome back, <span className="font-bold text-[#141414] dark:text-[#f5f5f5]">{userData.fullName}</span>
          </p>
        </div>
      )}
    </header>
  );
};

export default DashboardHeader;