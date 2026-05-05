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
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const { userData, setUserData } = useUserContextData();
  const logoutInProgress = useRef(false);

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
      title: 'Are you sure?',
      text: "You will be logged out of your account",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: 'var(--color-accent-yellow)',
      cancelButtonColor: '#6b6b6b',
      confirmButtonText: 'Yes, logout',
      cancelButtonText: 'Cancel',
      reverseButtons: true
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

    const apiCalls = [];

    apiCalls.push(
      fetch("/api/logout", { method: "POST" }).catch(err => 
        console.error("Logout API error:", err)
      )
    );

    if (userData) {
      apiCalls.push(
        fetch("/api/activity/last-logout", {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userData.id,
            email: userData.email,
            login_history_id: userData.currentLoginSession
          }),
        }).catch(err => console.error("Error tracking logout activity:", err))
      );
    }

    Promise.allSettled(apiCalls).catch(err => 
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

  return (
    <header className="sticky top-0 z-30 bg-[var(--bg-primary)] border-b-2 border-[var(--border-color)]">
      <div className="flex items-center justify-between h-20 px-6 md:px-10">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2.5 rounded-md border-2 border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] shadow-[2px_2px_0px_var(--border-color)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-xl font-bold lg:hidden uppercase tracking-tight text-[var(--text-primary)]">
            Zidwell
          </span>
          
          {userData?.fullName && (
            <h1 className="hidden lg:block text-lg font-bold text-[var(--text-primary)]">
              Hello, {userData.fullName}
            </h1>
          )}
        </div>

        <div className="flex items-center gap-3">
          {userData?.fullName && (
            <span className="lg:hidden text-sm text-[var(--text-secondary)]">
              Hi, {userData.fullName.split(' ')[0]}
            </span>
          )}

          <NotificationBell />

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-md border-2 border-[var(--border-color)] bg-destructive text-white hover:bg-destructive/80 shadow-[2px_2px_0px_var(--border-color)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all ${
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

      {userData?.fullName && (
        <div className="lg:hidden px-6 pb-3 -mt-2">
          <p className="text-sm text-[var(--text-secondary)]">
            Welcome back, <span className="font-bold text-[var(--text-primary)]">{userData.fullName}</span>
          </p>
        </div>
      )}
    </header>
  );
};

export default DashboardHeader;