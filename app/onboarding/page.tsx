"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUserContextData, saveUserDataToStorage } from "@/app/context/userData";
import {
  ArrowRight,
  Loader2,
  LogOut,
  Sparkles,
  CheckCircle,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Building2,
  Briefcase,
} from "lucide-react";
import confetti from "canvas-confetti";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Image from "next/image";
import Swal from "sweetalert2";
import Stepper from "./components/Stepper";
import BvnStep, { BvnData } from "./components/BvnStep";
import PinStep from "./components/PinStep";
import BusinessStep, {
  BusinessState,
  CacData,
} from "./components/BusinessStep";
import ReviewStep from "./components/ReviewStep";
import SuccessModal, { CompleteResult } from "./components/SuccessModal";

type Purpose = "personal" | "business";

// Helper to get user avatar
const getUserAvatar = (userData: any) => {
  if (userData?.profile_picture) return userData.profile_picture;
  const name = userData?.full_name || userData?.fullName || "";
  if (!name) return null;
  const initials = name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" fill="#FDC020" rx="50"/>
      <text x="50" y="50" text-anchor="middle" dy=".35em" font-size="40" font-family="Arial" fill="#000" font-weight="bold">${initials}</text>
    </svg>`
  )}`;
};

export default function OnboardingPage() {
  const router = useRouter();
  const {
    userData,
    loading: userLoading,
    refreshUserData,
    setUserData,
  } = useUserContextData();
  const logoutInProgress = useRef(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);

  // Get purpose from userData
  const purpose = userData?.purpose === "business" ? "business" : "personal";
  
  const [bvn, setBvn] = useState("");
  const [bvnData, setBvnData] = useState<BvnData | null>(null);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  
  // ✅ Fix: Initialize business state with proper values from userData
  const [business, setBusiness] = useState<BusinessState>(() => {
    // Log what we're getting from userData
    console.log('🔍 Initializing business state from userData:', {
      is_business_registered: userData?.is_business_registered,
      purpose: userData?.purpose,
      fullUserData: userData,
    });
    
    return {
      isRegistered: userData?.is_business_registered ?? null,
      cacNumber: "",
      cacData: null,
    };
  });

  // ✅ Update business state when userData changes (after login/refresh)
  useEffect(() => {
    if (userData) {
      console.log('🔄 userData changed, updating business state:', {
        is_business_registered: userData.is_business_registered,
        purpose: userData.purpose,
      });
      
      setBusiness(prev => ({
        ...prev,
        isRegistered: userData.is_business_registered ?? null,
      }));
    }
  }, [userData]);

  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CompleteResult | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [verificationChecked, setVerificationChecked] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isFetchingFreshData, setIsFetchingFreshData] = useState(false);

  // ✅ Steps based on purpose - ONLY verification steps
  const steps = useMemo(() => {
    const base = [
      { id: "bvn", label: "Identity" },
      { id: "pin", label: "Security" },
    ];
    
    // ✅ Show Business step ONLY for business accounts
    if (purpose === "business") {
      base.push({ id: "biz", label: "Business" });
    }
    
    base.push({ id: "review", label: "Review" });
    return base;
  }, [purpose]);

  const current = steps[stepIndex];
  const userAvatar = getUserAvatar(userData);

  const isUserVerified = useCallback((): boolean => {
    if (!userData) return false;
    return (
      userData.bvn_verification === "verified" ||
      userData.identity_verified === true ||
      userData.kyc_level === "personal_verified" ||
      userData.kyc_level === "business_verified" ||
      userData.verification_completed === true ||
      userData.onboarding_completed === true
    );
  }, [userData]);

  // Redirect if already verified
  useEffect(() => {
    if (isRedirecting || userLoading || isOnboardingComplete) return;
    if (!userData) return;

    if (verificationChecked) {
      const verified = isUserVerified();
      if (verified && !isComplete && !showSuccess) {
        setIsRedirecting(true);
        router.replace("/dashboard");
      }
      return;
    }

    const verified = isUserVerified();
    setVerificationChecked(true);

    if (verified && !isComplete && !showSuccess) {
      setIsRedirecting(true);
      router.replace("/dashboard");
    }
  }, [
    userData,
    userLoading,
    router,
    isRedirecting,
    verificationChecked,
    isUserVerified,
    isComplete,
    showSuccess,
    isOnboardingComplete,
  ]);

  // Reset when purpose changes
  useEffect(() => {
    setStepIndex(0);
    setVerificationChecked(false);
  }, [purpose]);

  useEffect(() => {
    if (userData?.id) {
      setVerificationChecked(false);
      setIsRedirecting(false);
    }
  }, [userData?.id]);

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

    if (typeof window !== "undefined") {
      localStorage.removeItem("userData");
      sessionStorage.removeItem("userData");
      document.cookie.split(";").forEach((cookie) => {
        const [name] = cookie.split("=");
        const trimmedName = name.trim();
        if (
          trimmedName === "verified" ||
          trimmedName === "session" ||
          trimmedName === "sb-access-token" ||
          trimmedName === "sb-refresh-token" ||
          trimmedName === "sb-client-session" ||
          trimmedName === "sb-login-time"
        ) {
          document.cookie = `${trimmedName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
      });
    }
    setUserData(null);

    const apiCalls = [
      fetch("/api/logout", { method: "POST" }).catch((err) =>
        console.error("Logout API error:", err)
      ),
    ];

    if (userData) {
      apiCalls.push(
        fetch("/api/activity/last-logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userData.id,
            email: userData.email,
            login_history_id: userData.current_login_session,
          }),
        }).catch((err) =>
          console.error("Error tracking logout activity:", err)
        )
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

  const canContinue = (() => {
    switch (current?.id) {
      case "bvn":
        return !!bvnData;
      case "pin":
        return pin.length === 4 && pin === confirmPin;
      case "biz":
        // ✅ Only validate CAC verification for registered businesses
        if (business.isRegistered === null) return false;
        if (business.isRegistered && !business.cacData) return false;
        return true;
      case "review":
        return true;
      default:
        return false;
    }
  })();

  const isLast = stepIndex === steps.length - 1;

  const handleGoToDashboard = async () => {
    setShowSuccess(false);
    setIsFetchingFreshData(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 100));

      const loadingToast = toast.loading("Loading your dashboard...");

      console.log("🔄 Fetching fresh user data from /api/user/me...");
      const response = await fetch("/api/user/me", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-cache",
      });

      console.log("📦 API Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("📦 Fresh user data fetched:", data);

        if (data.user) {
          const safeProfile = {
            id: data.user.id,
            email: data.user.email,
            fullName: data.user.full_name || data.user.fullName || "",
            full_name: data.user.full_name || data.user.fullName || "",
            first_name: data.user.first_name || "",
            last_name: data.user.last_name || "",
            phone: data.user.phone || "",
            purpose: data.user.purpose || purpose,
            is_business_registered: data.user.is_business_registered || false,
            bvn_verification: data.user.bvn_verification || "verified",
            identity_verified: data.user.identity_verified || true,
            kyc_level: data.user.kyc_level || (purpose === "business" ? "business_verified" : "personal_verified"),
            verification_completed: data.user.verification_completed || true,
            bank78_verified: data.user.bank78_verified || false,
            onboarding_completed: data.user.onboarding_completed || true,
            subscription_tier: data.user.subscription_tier || "free",
            subscription_expires_at: data.user.subscription_expires_at || null,
            admin_role: data.user.admin_role || "user",
            wallet_balance: data.user.wallet_balance || 0,
            zidcoin_balance: data.user.zidcoin_balance || 0,
            email_verified: data.user.email_verified || false,
            country: data.user.country || "Nigeria",
            is_blocked: data.user.is_blocked || false,
            date_of_birth: data.user.date_of_birth || "",
            city: data.user.city || "",
            state: data.user.state || "",
            address: data.user.address || "",
            profile_picture: data.user.profile_picture || "",
            bank78_personal_bank_name: data.user.bank78_personal_bank_name || "Bank78",
            bank_name: data.user.bank_name || data.user.bank78_personal_bank_name || "Bank78",
            bank78_personal_account_name: data.user.bank78_personal_account_name || "",
            bank78_business_account_name: data.user.bank78_business_account_name || "",
            bank_account_name: data.user.bank_account_name || data.user.bank78_personal_account_name || "",
            bank78_personal_account_id: data.user.bank78_personal_account_id || "",
            bank78_business_account_id: data.user.bank78_business_account_id || "",
            wallet_id: data.user.wallet_id || data.user.bank78_personal_account_id || "",
            primary_provider: data.user.primary_provider || "bank78",
            wallet_provider: data.user.wallet_provider || "bank78",
            verification_step: data.user.verification_step || 6,
            onboarding_step: data.user.onboarding_step || 6,
            verified_at: data.user.verified_at || new Date().toISOString(),
            updated_at: data.user.updated_at || new Date().toISOString(),
            created_at: data.user.created_at || new Date().toISOString(),
            last_login: data.user.last_login || new Date().toISOString(),
            referral_code: data.user.referral_code || "",
            referred_by: data.user.referred_by || null,
            verification_provider: data.user.verification_provider || "prembly",
            verification_reference: data.user.verification_reference || "",
            verification_id: data.user.verification_id || "",
            verification_status: data.user.verification_status || "VERIFIED",
            face_match_verified: data.user.face_match_verified || false,
            dob_verified: data.user.dob_verified || false,
            name_verified: data.user.name_verified || false,
            pin_set: data.user.pin_set || false,
          };

          console.log("✅ Safe profile built for", purpose, "account");

          localStorage.setItem("userData", JSON.stringify(safeProfile));
          setUserData(safeProfile);
          
          console.log("💾 Safe data saved to localStorage and context");
          
          toast.dismiss(loadingToast);
          toast.success("Dashboard ready!");
        } else {
          console.warn("⚠️ No user data in response");
          if (userData) {
            localStorage.setItem("userData", JSON.stringify(userData));
          }
          toast.dismiss(loadingToast);
          toast.info("Using existing data");
        }
      } else {
        console.error("❌ API returned error:", response.status, response.statusText);
        if (userData) {
          localStorage.setItem("userData", JSON.stringify(userData));
        }
        toast.dismiss(loadingToast);
        toast.warning("Using existing data");
      }
    } catch (error) {
      console.error("❌ Error fetching fresh user data:", error);
      if (userData) {
        localStorage.setItem("userData", JSON.stringify(userData));
      }
      toast.dismiss();
      toast.warning("Using existing data");
    } finally {
      setIsFetchingFreshData(false);
      setIsOnboardingComplete(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 100);
    }
  };

  async function handleActivate() {
    if (!bvnData || !purpose || !userData) {
      await Swal.fire({
        icon: "error",
        title: "Missing Required Data",
        text: "Please complete all steps before activating",
        confirmButtonColor: "#FDC020",
      });
      return;
    }

    if (!bvnData.bvn || bvnData.bvn.length !== 11) {
      await Swal.fire({
        icon: "error",
        title: "Invalid BVN",
        text: "Please verify your BVN first",
        confirmButtonColor: "#FDC020",
      });
      return;
    }

    if (!pin || pin.length !== 4) {
      await Swal.fire({
        icon: "error",
        title: "Invalid PIN",
        text: "Please set a 4-digit transaction PIN",
        confirmButtonColor: "#FDC020",
      });
      return;
    }

    if (pin !== confirmPin) {
      await Swal.fire({
        icon: "error",
        title: "PIN Mismatch",
        text: "PIN and confirm PIN do not match",
        confirmButtonColor: "#FDC020",
      });
      return;
    }

    const phoneNumber = userData.phone || "";
    if (!phoneNumber) {
      const result = await Swal.fire({
        icon: "warning",
        title: "Phone Number Missing",
        text: "Please enter your phone number to continue",
        input: "tel",
        inputPlaceholder: "Enter your phone number",
        confirmButtonText: "Continue",
        confirmButtonColor: "#FDC020",
        showCancelButton: true,
        cancelButtonColor: "#6b6b6b",
      });

      if (result.isConfirmed && result.value) {
        userData.phone = result.value;
      } else {
        return;
      }
    }

    setSubmitting(true);

    try {
      const payload: any = {
        userId: userData.id,
        fullName:
          bvnData.fullName || userData.full_name || userData.fullName || "",
        email: userData.email || "",
        phone: userData.phone || "",
        purpose: purpose,
        bvn: bvnData.bvn,
        transactionPin: pin,
        businessAddress: "",
        mapUrl: "",
        utilityBillName: "",
      };

      // ✅ Only send CAC verification data for business accounts
      if (purpose === "business") {
        payload.business = {
          isRegistered: business.isRegistered || false,
          cacNumber: business.isRegistered ? business.cacNumber : null,
          cacData: business.cacData || null,
        };
      }

      console.log(`🚀 Sending onboarding payload for ${purpose} account:`, payload);

      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("📦 Onboarding API Response:", data);

      if (!response.ok) {
        await Swal.fire({
          icon: "error",
          title: "Activation Failed",
          text: data.message || data.error || "Something went wrong",
          confirmButtonColor: "#FDC020",
          ...(data.details && { footer: data.details }),
        });

        throw new Error(data.error || data.message || "Activation failed");
      }

      let accountNumber = "";
      let accountName = bvnData.fullName || "";
      let bankName = "Zidwell";

      if (data.bank78?.personal) {
        accountNumber = data.bank78.personal.accountNumber || "";
        accountName = data.bank78.personal.accountName || bvnData.fullName || "";
        bankName = data.bank78.personal.bankName || "Bank78";
      } else if (data.bank78?.business) {
        accountNumber = data.bank78.business.accountNumber || "";
        accountName = data.bank78.business.accountName || bvnData.fullName || "";
        bankName = data.bank78.business.bankName || "Bank78";
      } else if (data.nomba) {
        accountNumber = data.nomba.accountNumber;
        accountName = data.nomba.accountName || bvnData.fullName || "";
        bankName = data.nomba.bankName || "Wema Bank";
      } else {
        accountNumber = Array.from(
          { length: 10 },
          () => Math.floor(Math.random() * 10)
        ).join("");
      }

      setResult({
        accountNumber,
        accountName,
        bankName,
      });

      setIsComplete(true);
      setShowSuccess(true);
      
      setTimeout(() => {
        confetti({
          particleCount: 180,
          spread: 100,
          origin: { y: 0.6 },
          colors: ["#00B64F", "#FDC020", "#191919", "#FFFFFF"],
        });
      }, 300);

    } catch (error: any) {
      console.error("❌ Activation error:", error);
      await Swal.fire({
        icon: "error",
        title: "Activation Failed",
        text: error.message || "Something went wrong. Please try again.",
        confirmButtonColor: "#FDC020",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (userLoading || isRedirecting || isFetchingFreshData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  if (userData && isUserVerified() && !isComplete && !showSuccess) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100/40 dark:from-gray-900 dark:to-gray-800/40 py-10 px-4 sm:px-6 lg:py-16">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
              <Image
                src="/logo.png"
                alt="Zidwell Logo"
                width={49}
                height={40}
                className="w-10 object-contain transition-transform group-hover:scale-105"
              />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight text-gray-900 dark:text-gray-100">
                Zidwell
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {purpose === "business" ? "Business" : "Personal"} account
                activation
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="h-10 gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 disabled:opacity-60"
          >
            {isLoggingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            Sign out
          </Button>
        </header>

        {/* Account Type Banner */}
        <div className="mb-4 flex items-center justify-between rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 px-4 py-2">
          <div className="flex items-center gap-2">
            {purpose === "business" ? (
              <Building2 className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            ) : (
              <User className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            )}
            <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
              {purpose === "business" ? "Business Account" : "Personal Account"}
            </span>
          </div>
          <span className="text-xs text-yellow-600 dark:text-yellow-400">
            {purpose === "business" ? "CAC Verification Required" : "BVN Verification Required"}
          </span>
        </div>

        {/* User Info Card */}
        {userData && (
          <div className="mb-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="relative flex-shrink-0">
                <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-yellow-400">
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt={userData.full_name || userData.fullName || "User"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-yellow-400 text-2xl font-bold text-black">
                      {(userData.full_name || userData.fullName || "U")[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 rounded-full bg-green-500 p-0.5">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {userData.full_name || userData.fullName || "User"}
                  </h3>
                  {purpose === "business" && userData.is_business_registered && (
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                      Registered
                    </span>
                  )}
                </div>
                <div className="mt-1 grid grid-cols-1 gap-1 text-sm text-gray-600 dark:text-gray-400 sm:grid-cols-2">
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{userData.email || "No email"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{userData.phone || "No phone"}</span>
                  </div>
                  {userData.date_of_birth && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{userData.date_of_birth}</span>
                    </div>
                  )}
                  {userData.city && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{userData.city}{userData.state ? `, ${userData.state}` : ""}</span>
                    </div>
                  )}
                  {userData.country && (
                    <div className="flex items-center gap-1.5">
                      <span className="h-3.5 w-3.5 flex-shrink-0">🌍</span>
                      <span>{userData.country}</span>
                    </div>
                  )}
                  {purpose === "business" && (
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>Business Account</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-gray-100 dark:border-gray-700 pt-3">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-medium text-gray-500 dark:text-gray-400">KYC Level:</span>
                <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                  {userData.kyc_level || "unverified"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-medium text-gray-500 dark:text-gray-400">Status:</span>
                <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  {userData.verification_completed ? "Completed" : "In Progress"}
                </span>
              </div>
              {userData.is_business_registered && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-medium text-gray-500 dark:text-gray-400">Business:</span>
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    Registered
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stepper and Steps */}
        <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 p-5">
            <Stepper steps={steps} current={stepIndex} />
          </div>

          <div className="p-6 sm:p-8">
            {current?.id === "bvn" && (
              <BvnStep
                bvn={bvn}
                setBvn={setBvn}
                bvnData={bvnData}
                setBvnData={setBvnData}
                purpose={purpose}
                userData={userData}
              />
            )}
            {current?.id === "pin" && (
              <PinStep
                pin={pin}
                confirmPin={confirmPin}
                setPin={setPin}
                setConfirmPin={setConfirmPin}
              />
            )}
            {current?.id === "biz" && (
              <BusinessStep state={business} setState={setBusiness} />
            )}
            {current?.id === "review" && bvnData && purpose && (
              <ReviewStep
                purpose={purpose}
                bvnData={bvnData}
                business={business}
              />
            )}
          </div>

          {/* Footer with navigation buttons */}
          <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 p-4 sm:px-6">
            <div className="flex items-center gap-3">
              {stepIndex > 0 && (
                <Button
                  type="button"
                  onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
                  variant="ghost"
                  className="h-11 gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                >
                  <ArrowRight className="h-4 w-4 rotate-180" />
                  Back
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <p className="hidden text-xs text-gray-500 dark:text-gray-400 sm:block">
                Step {stepIndex + 1} of {steps.length}
              </p>
              {isLast ? (
                <Button
                  type="button"
                  onClick={handleActivate}
                  disabled={!canContinue || submitting}
                  className="h-11 min-w-40 bg-yellow-400 text-black hover:bg-yellow-500"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      {purpose === "business" ? "Activate Business" : "Activate Account"}
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() =>
                    setStepIndex((i) => Math.min(steps.length - 1, i + 1))
                  }
                  disabled={!canContinue}
                  className="h-11 min-w-32 bg-yellow-400 text-black hover:bg-yellow-500"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
          By continuing, you agree to Zidwell's Terms of Service and Privacy
          Policy.
        </p>
      </div>

      {/* Success Modal */}
      <SuccessModal
        open={showSuccess}
        onOpenChange={setShowSuccess}
        result={result}
        onGoToDashboard={handleGoToDashboard}
      />
    </div>
  );
}