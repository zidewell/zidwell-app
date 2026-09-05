// app/components/dashboard-component/DashboardHeader.tsx

"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { useUserContextData } from "@/app/context/userData";
import NotificationBell from "../NotificationBell";
import { Menu, LogOut, Sun, Moon } from "lucide-react";
import { useTheme } from "../ThemeProvider";

interface DashboardHeaderProps {
  onMenuClick: () => void;
}

const DashboardHeader = ({ onMenuClick }: DashboardHeaderProps) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { userData, setUserData } = useUserContextData();
  const logoutInProgress = useRef(false);

  // Handle scroll effect for sticky header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    // Prevent multiple logout attempts
    if (logoutInProgress.current || isLoggingOut) return;

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You will be logged out of your account",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "var(--color-accent-yellow)",
      cancelButtonColor: "#6b6b6b",
      confirmButtonText: "Yes, logout",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    logoutInProgress.current = true;
    setIsLoggingOut(true);

    // Show loading
    Swal.fire({
      title: "Logging out...",
      text: "Please wait",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      // 1. Clear local data FIRST
      localStorage.removeItem("userData");
      sessionStorage.removeItem("userData");
      
      // Clear specific store data
      localStorage.removeItem("zidwell_store_data");
      localStorage.removeItem("zidwell_store_timestamp");
      
      // Clear cookies
      const cookiesToClear = [
        "sb-access-token",
        "sb-refresh-token",
        "verified",
        "sb-client-session",
        "sb-login-time",
        "sb-session-risk",
        "sb-user-data",
        "sb-session-id",
      ];
      
      cookiesToClear.forEach((name) => {
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
      });

      // 2. Update context
      setUserData(null);

      // 3. Call logout API (fire and forget)
      fetch("/api/logout", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }).catch((err) => console.error("Logout API error:", err));

      // 4. Close loading
      Swal.close();

      // 5. Reset states
      logoutInProgress.current = false;
      setIsLoggingOut(false);

      // 6. Navigate to login with replace (prevents back button)
      router.replace("/auth/login");

      // 7. Show success toast (after navigation)
      setTimeout(() => {
        Swal.fire({
          icon: "success",
          title: "Logged Out!",
          text: "You have been successfully logged out",
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
          timerProgressBar: true,
        });
      }, 100);

    } catch (error) {
      console.error("Logout error:", error);
      Swal.close();
      
      await Swal.fire({
        icon: "error",
        title: "Logout Failed",
        text: "Please try again",
        confirmButtonColor: "var(--color-accent-yellow)",
      });
      
      logoutInProgress.current = false;
      setIsLoggingOut(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <header
      className={`sticky top-0 z-30 w-full transition-all duration-300 ${
        scrolled
          ? "bg-(--bg-primary)/95 backdrop-blur-md shadow-lg"
          : "bg-(--bg-primary)"
      } border-b-2 border-(--border-color)`}
    >
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10">
        <div className="flex items-center justify-between h-16 sm:h-18 md:h-20">
          {/* Left Section */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-md border-2 border-(--border-color) text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-secondary) shadow-[2px_2px_0px_var(--border-color)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all"
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <span className="text-base sm:text-lg md:text-xl font-bold lg:hidden uppercase tracking-tight text-(--text-primary)">
              Zidwell
            </span>

            {userData?.fullName && (
              <div className="hidden lg:flex flex-col">
                <p className="text-sm text-(--text-secondary)">
                  {getGreeting()}
                </p>
                <h1 className="text-lg font-bold text-(--text-primary) leading-tight">
                  {userData.fullName}
                </h1>
              </div>
            )}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
            {userData?.fullName && (
              <span className="lg:hidden text-xs sm:text-sm text-(--text-secondary) truncate max-w-[120px] sm:max-w-[150px]">
                Hi, {userData.fullName.split(" ")[0]}
              </span>
            )}

            {/* Theme Toggle */}
            <div className="hidden sm:flex items-center gap-1 p-1 bg-(--bg-secondary) rounded-xl">
              <button
                onClick={() => setTheme("light")}
                className={`p-1.5 sm:p-2 rounded-lg transition-all ${
                  theme === "light"
                    ? "bg-(--color-accent-yellow) text-(--color-ink) shadow-sm"
                    : "text-(--text-secondary) hover:bg-(--bg-secondary)"
                }`}
                aria-label="Light mode"
              >
                <Sun size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`p-1.5 sm:p-2 rounded-lg transition-all ${
                  theme === "dark"
                    ? "bg-(--color-accent-yellow) text-(--color-ink) shadow-sm"
                    : "text-(--text-secondary) hover:bg-(--bg-secondary)"
                }`}
                aria-label="Dark mode"
              >
                <Moon size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>
            </div>

            <NotificationBell />

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-md border-2 border-(--border-color) bg-destructive text-white hover:bg-destructive/80 shadow-[2px_2px_0px_var(--border-color)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all ${
                isLoggingOut ? "opacity-50 cursor-not-allowed" : ""
              }`}
              aria-label="Logout"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline text-xs sm:text-sm font-bold uppercase tracking-wide">
                Logout
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Welcome Banner */}
        {userData?.fullName && (
          <div className="lg:hidden pb-3 -mt-1 sm:pb-4 border-b border-(--border-color)/50">
            <p className="text-xs sm:text-sm text-(--text-secondary)">
              {getGreeting()},{" "}
              <span className="font-bold text-(--text-primary)">
                {userData.fullName}
              </span>
            </p>
          </div>
        )}
      </div>
    </header>
  );
};

export default DashboardHeader;