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
  const { userData, setUserData, handleSessionExpired } = useUserContextData();
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

    Swal.fire({
      title: "Logging out...",
      text: "Please wait",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      await handleSessionExpired();

      Swal.close();
      logoutInProgress.current = false;
      setIsLoggingOut(false);

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

  const ThemeToggle = () => (
    <div className="hidden sm:flex items-center gap-1 p-1 bg-(--bg-secondary) rounded-xl">
      <button
        onClick={() => setTheme("light")}
        className={`p-2 rounded-lg transition-all ${
          theme === "light"
            ? "bg-(--color-accent-yellow) text-(--color-ink) shadow-sm"
            : "text-(--text-secondary) hover:text-(--text-primary)"
        }`}
        aria-label="Light mode"
      >
        <Sun size={16} />
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`p-2 rounded-lg transition-all ${
          theme === "dark"
            ? "bg-(--color-accent-yellow) text-(--color-ink) shadow-sm"
            : "text-(--text-secondary) hover:text-(--text-primary)"
        }`}
        aria-label="Dark mode"
      >
        <Moon size={16} />
      </button>
    </div>
  );

  return (
    <header
      className={`sticky top-0 z-30 w-full transition-all duration-300 border-b border-(--border-color) ${
        scrolled
          ? "bg-(--bg-primary)/85 backdrop-blur-md shadow-sm"
          : "bg-(--bg-primary)"
      }`}
    >
      <div className="w-full px-4 sm:px-6 md:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Section */}
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={onMenuClick}
              className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-secondary) transition-all duration-200"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" strokeWidth={1.9} />
            </button>

            {/* Mobile brand */}
            <span className="text-base font-bold tracking-tight lg:hidden text-(--text-primary) uppercase">
              Zidwell
            </span>

            {/* Desktop greeting */}
            {userData?.fullName && (
              <div className="hidden lg:flex flex-col">
                <p className="text-xs text-(--text-secondary)">
                  {getGreeting()}
                </p>
                <h1 className="text-[15px] font-semibold text-(--text-primary) leading-tight">
                  {userData.fullName}
                </h1>
              </div>
            )}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile first-name greeting */}
            {userData?.fullName && (
              <span className="lg:hidden text-xs text-(--text-secondary) truncate max-w-[110px] sm:max-w-[150px]">
                Hi, {userData.fullName.split(" ")[0]}
              </span>
            )}

            <ThemeToggle />

            <NotificationBell />

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={`
                flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl
                bg-destructive text-white text-sm font-medium
                hover:bg-destructive/90
                transition-all duration-200
                ${isLoggingOut ? "opacity-50 cursor-not-allowed" : ""}
              `}
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" strokeWidth={2} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Welcome Banner */}
        {userData?.fullName && (
          <div className="lg:hidden pb-3 border-b border-(--border-color)/50">
            <p className="text-xs text-(--text-secondary)">
              {getGreeting()},{" "}
              <span className="font-semibold text-(--text-primary)">
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