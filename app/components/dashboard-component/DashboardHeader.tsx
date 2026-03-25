"use client";

import { Menu, Sun, Moon, LogOut, Settings, Bell } from "lucide-react";
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
        setUserData(JSON.parse(stored));
      }
    }
  }, [setUserData]);

  const handleLogout = async () => {
    // Prevent multiple logout attempts
    if (logoutInProgress.current || isLoggingOut) return;
    
    logoutInProgress.current = true;
    setIsLoggingOut(true);

    try {
      console.log("🔵 Attempting logout...");
      
      // Call logout API
      const response = await fetch("/api/logout", { method: "POST" });
      const data = await response.json();
      
      console.log("🔵 Logout response:", data);

      // Track last logout activity if user data exists
      if (userData) {
        try {
          await fetch("/api/activity/last-logout", {
            method: "POST",
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: userData.id,
              email: userData.email,
              login_history_id: userData.currentLoginSession 
            }),
          });
        } catch (activityError) {
          console.error("Error tracking logout activity:", activityError);
          // Don't fail the logout if this fails
        }
      }

      // Clear client-side storage
      if (typeof window !== "undefined") {
        localStorage.removeItem("userData");
        // Only clear specific items, not everything
        // localStorage.clear(); // Remove this line - it's too aggressive
      }

      // Clear context
      setUserData(null);

      // Show success message
      await Swal.fire({
        icon: "success",
        title: "Logged Out",
        text: "You have been signed out successfully.",
        timer: 1500,
        showConfirmButton: false,
      });

      // Redirect after a short delay to show the success message
      setTimeout(() => {
        router.push("/auth/login");
      }, 1500);
      
    } catch (error: any) {
      console.error("Logout error:", error);
      
      // Even if API fails, clear local state
      localStorage.removeItem("userData");
      setUserData(null);
      
      await Swal.fire({
        icon: "error",
        title: "Logout Failed",
        text: error?.message || "An error occurred during logout. You have been logged out locally.",
        timer: 2000,
        showConfirmButton: false,
      });
      
      // Still redirect after error
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } finally {
      // Reset logout flags after delay
      setTimeout(() => {
        logoutInProgress.current = false;
        setIsLoggingOut(false);
      }, 2000);
    }
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
              {isLoggingOut ? "Logging out..." : "Logout"}
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