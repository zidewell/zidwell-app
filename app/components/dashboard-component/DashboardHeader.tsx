"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { Menu, LogOut, Sun, Moon, Bell } from "lucide-react";
import { useUserContextData } from "@/app/context/userData";
import { useTheme } from "../ThemeProvider";
import NotificationBell from "../NotificationBell";

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

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

    const clearLocalData = () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("userData");
        sessionStorage.removeItem("userData");
        document.cookie.split(";").forEach((cookie) => {
          const [name] = cookie.split("=");
          if (name.trim() === "verified" || name.trim() === "session") {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          }
        });
      }
      setUserData(null);
    };

    clearLocalData();

    const apiCalls = [];

    apiCalls.push(
      fetch("/api/logout", { method: "POST" }).catch((err) =>
        console.error("Logout API error:", err)
      )
    );

    if (userData) {
      apiCalls.push(
        fetch("/api/activity/last-logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userData.id,
            email: userData.email,
            login_history_id: userData.currentLoginSession,
          }),
        }).catch((err) => console.error("Error tracking logout activity:", err))
      );
    }

    Promise.allSettled(apiCalls).catch((err) =>
      console.error("Background logout tasks failed:", err)
    );

    Swal.close();

    await Swal.fire({
      icon: "success",
      title: "Logged Out!",
      text: "You have been successfully logged out",
      timer: 1500,
      showConfirmButton: false,
    });

    router.push("/auth/login");

    setTimeout(() => {
      logoutInProgress.current = false;
      setIsLoggingOut(false);
    }, 500);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <header
      className={`sticky top-0 z-30 bg-(--bg-primary) border-b-2 border-(--border-color) transition-all duration-300 ${
        scrolled ? "shadow-lg" : ""
      }`}
    >
      <div className="flex h-20 items-center justify-between px-4 md:px-8 lg:px-10">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden grid h-11 w-11 place-items-center rounded-full text-(--text-secondary) transition-colors hover:bg-(--bg-secondary) hover:text-(--text-primary)"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <span className="text-lg font-extrabold tracking-tight lg:hidden text-(--text-primary)">
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

        <div className="flex items-center gap-2">
          {userData?.fullName && (
            <span className="lg:hidden text-sm text-(--text-secondary) truncate max-w-[120px]">
              Hi, {userData.fullName.split(" ")[0]}
            </span>
          )}

          <div className="hidden sm:flex items-center gap-1 p-1 bg-(--bg-secondary) rounded-xl">
            <button
              onClick={() => setTheme("light")}
              className={`p-2 rounded-lg transition-all ${
                theme === "light"
                  ? "bg-(--color-accent-yellow) text-(--color-ink)"
                  : "text-(--text-secondary) hover:bg-(--bg-secondary)"
              }`}
              aria-label="Light mode"
            >
              <Sun size={18} />
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`p-2 rounded-lg transition-all ${
                theme === "dark"
                  ? "bg-(--color-accent-yellow) text-(--color-ink)"
                  : "text-(--text-secondary) hover:bg-(--bg-secondary)"
              }`}
              aria-label="Dark mode"
            >
              <Moon size={18} />
            </button>
          </div>

          <div className="scale-90 sm:scale-100">
            <NotificationBell />
          </div>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-full border-2 border-(--border-color) bg-destructive text-white hover:bg-destructive/80 transition-all ${
              isLoggingOut ? "opacity-50 cursor-not-allowed" : ""
            }`}
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" strokeWidth={1.5} />
            <span className="hidden sm:inline text-sm font-bold uppercase tracking-wide">
              Logout
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;