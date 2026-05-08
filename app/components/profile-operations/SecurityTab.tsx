// app/components/new-profile/SecurityTab.tsx
import React, { useState } from "react";
import { useUserContextData } from "@/app/context/userData";
import SignaturePanel from "./SignaturePanel";
import Swal from "sweetalert2";
import { supabase } from "@/app/supabase/supabase";
import { Loader2, AlertCircle } from "lucide-react";

const SecurityTab: React.FC = () => {
  const { userData } = useUserContextData();
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [pins, setPins] = useState({ current: "", new: "", confirm: "" });
  const [loading, setLoading] = useState({ password: false, pin: false });
  const [signatureLoading, setSignatureLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check BVN verification status
  const isBvnNotSubmitted = userData?.bvnVerification === "not_submitted";

  const inputClassName = (field: string) => `
    w-full bg-[var(--bg-primary)] border-2 px-3 py-2 text-sm font-body text-[var(--text-primary)] 
    placeholder:text-[var(--text-secondary)] focus:outline-none transition-colors rounded-md
    ${errors[field] ? "border-red-500" : "border-[var(--color-accent-yellow)]"}
    focus:border-[var(--color-accent-yellow)] focus:ring-2 focus:ring-[var(--color-accent-yellow)]/20 disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const handlePasswordChange = async () => {
    const newErrors: Record<string, string> = {};

    if (!passwords.current) {
      newErrors.currentPassword = "Current password is required";
    }
    if (!passwords.new) {
      newErrors.newPassword = "New password is required";
    }
    if (!passwords.confirm) {
      newErrors.confirmPassword = "Please confirm your password";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (passwords.new !== passwords.confirm) {
      setErrors({ ...newErrors, confirmPassword: "Passwords do not match" });
      return;
    }

    if (passwords.new.length < 6) {
      setErrors({
        ...newErrors,
        newPassword: "Password must be at least 6 characters",
      });
      return;
    }

    setLoading((prev) => ({ ...prev, password: true }));
    setErrors({});

    try {
      if (!userData?.email) {
        throw new Error("User not authenticated");
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password: passwords.current,
      });

      if (signInError) {
        setErrors({ currentPassword: "Current password is incorrect" });
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: passwords.new,
      });

      if (updateError) throw updateError;

      setPasswords({ current: "", new: "", confirm: "" });

      Swal.fire({
        icon: "success",
        title: "Password updated successfully",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message,
      });
    } finally {
      setLoading((prev) => ({ ...prev, password: false }));
    }
  };

  const handlePinChange = async () => {
    // Don't proceed if BVN not submitted
    if (isBvnNotSubmitted) {
      Swal.fire({
        icon: "warning",
        title: "BVN Verification Required",
        text: "Please submit your BVN for verification before changing your transaction PIN.",
        confirmButtonColor: "var(--color-accent-yellow)",
      });
      return;
    }

    const newErrors: Record<string, string> = {};

    if (!pins.current) {
      newErrors.currentPin = "Current PIN is required";
    }
    if (!pins.new) {
      newErrors.newPin = "New PIN is required";
    }
    if (!pins.confirm) {
      newErrors.confirmPin = "Please confirm your PIN";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (pins.new !== pins.confirm) {
      setErrors({ ...newErrors, confirmPin: "PINs do not match" });
      return;
    }

    if (pins.new.length !== 4 || !/^\d+$/.test(pins.new)) {
      setErrors({ ...newErrors, newPin: "PIN must be 4 digits" });
      return;
    }

    setLoading((prev) => ({ ...prev, pin: true }));
    setErrors({});

    try {
      if (!userData?.id) throw new Error("User not authenticated");

      const response = await fetch("/api/profile/update-transaction-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userData.id,
          currentPin: pins.current,
          newPin: pins.new,
        }),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error);

      setPins({ current: "", new: "", confirm: "" });

      Swal.fire({
        icon: "success",
        title: "PIN updated successfully",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message,
      });
    } finally {
      setLoading((prev) => ({ ...prev, pin: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <div className="neo-card bg-[var(--bg-primary)] p-6 space-y-4 border border-[var(--border-color)] rounded-xl shadow-soft">
        <h3 className="font-heading text-[var(--text-primary)] text-sm">
          CHANGE PASSWORD
        </h3>
        <div>
          <label className="text-sm font-body text-[var(--text-secondary)] block mb-1.5">
            Current Password
          </label>
          <input
            type="password"
            value={passwords.current}
            onChange={(e) =>
              setPasswords((p) => ({ ...p, current: e.target.value }))
            }
            className={inputClassName("currentPassword")}
            disabled={loading.password}
          />
          {errors.currentPassword && (
            <p className="text-xs text-red-500 mt-1">
              {errors.currentPassword}
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-body text-[var(--text-secondary)] block mb-1.5">
              New Password
            </label>
            <input
              type="password"
              value={passwords.new}
              onChange={(e) =>
                setPasswords((p) => ({ ...p, new: e.target.value }))
              }
              className={inputClassName("newPassword")}
              disabled={loading.password}
            />
            {errors.newPassword && (
              <p className="text-xs text-red-500 mt-1">{errors.newPassword}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-body text-[var(--text-secondary)] block mb-1.5">
              Confirm Password
            </label>
            <input
              type="password"
              value={passwords.confirm}
              onChange={(e) =>
                setPasswords((p) => ({ ...p, confirm: e.target.value }))
              }
              className={inputClassName("confirmPassword")}
              disabled={loading.password}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-500 mt-1">
                {errors.confirmPassword}
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={handlePasswordChange}
          disabled={loading.password}
          className="w-full bg-[var(--color-accent-yellow)] hover:bg-[var(--color-accent-yellow)]/90 text-[var(--color-ink)] md:w-[200px] py-3 px-4 rounded-md transition-all disabled:opacity-50 font-medium flex items-center justify-center gap-2"
        >
          {loading.password ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Updating...
            </>
          ) : (
            "Update Password"
          )}
        </button>
      </div>

      {/* Change PIN */}
      <div className="neo-card bg-[var(--bg-primary)] p-6 space-y-4 border border-[var(--border-color)] rounded-xl shadow-soft">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-[var(--text-primary)] text-sm">
            CHANGE TRANSACTION PIN
          </h3>
          {isBvnNotSubmitted && (
            <div className="flex items-center gap-1 text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-md">
              <AlertCircle className="w-3 h-3" />
              <span className="text-xs font-medium">BVN Required</span>
            </div>
          )}
        </div>

        {isBvnNotSubmitted && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-3 mb-4">
            <p className="text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                You need to submit your BVN for verification before you can
                change your transaction PIN. Please go to the Profile tab to
                complete your BVN verification.
              </span>
            </p>
          </div>
        )}

        <div>
          <label className="text-sm font-body text-[var(--text-secondary)] block mb-1.5">
            Current PIN
          </label>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pins.current}
            onChange={(e) =>
              setPins((p) => ({
                ...p,
                current: e.target.value.replace(/\D/g, ""),
              }))
            }
            className={inputClassName("currentPin")}
            disabled={loading.pin || isBvnNotSubmitted}
          />
          {errors.currentPin && (
            <p className="text-xs text-red-500 mt-1">{errors.currentPin}</p>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-body text-[var(--text-secondary)] block mb-1.5">
              New PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pins.new}
              onChange={(e) =>
                setPins((p) => ({
                  ...p,
                  new: e.target.value.replace(/\D/g, ""),
                }))
              }
              className={inputClassName("newPin")}
              disabled={loading.pin || isBvnNotSubmitted}
            />
            {errors.newPin && (
              <p className="text-xs text-red-500 mt-1">{errors.newPin}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-body text-[var(--text-secondary)] block mb-1.5">
              Confirm PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pins.confirm}
              onChange={(e) =>
                setPins((p) => ({
                  ...p,
                  confirm: e.target.value.replace(/\D/g, ""),
                }))
              }
              className={inputClassName("confirmPin")}
              disabled={loading.pin || isBvnNotSubmitted}
            />
            {errors.confirmPin && (
              <p className="text-xs text-red-500 mt-1">{errors.confirmPin}</p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={handlePinChange}
          disabled={loading.pin || isBvnNotSubmitted}
          className={`w-full md:w-[200px] py-3 px-4 rounded-md transition-all font-medium flex items-center justify-center gap-2 ${
            isBvnNotSubmitted
              ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              : "bg-[var(--color-accent-yellow)] hover:bg-[var(--color-accent-yellow)]/90 text-[var(--color-ink)]"
          }`}
        >
          {loading.pin ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Updating...
            </>
          ) : isBvnNotSubmitted ? (
            "BVN Required"
          ) : (
            "Update PIN"
          )}
        </button>
      </div>

      {/* Change Signature */}
      <div className="neo-card bg-[var(--bg-primary)] p-6 space-y-4 border border-[var(--border-color)] rounded-xl shadow-soft">
        <h3 className="font-heading text-[var(--text-primary)] text-sm">
          CHANGE SIGNATURE
        </h3>
        <SignaturePanel
          onSaveStart={() => setSignatureLoading(true)}
          onSaveEnd={() => setSignatureLoading(false)}
        />
      </div>
    </div>
  );
};

export default SecurityTab;