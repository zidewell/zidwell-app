// app/components/profile-operations/SecurityTab.tsx
import React, { useState } from "react";
import { useUserContextData } from "@/app/context/userData";
import SignaturePanel from "./SignaturePanel";
import Swal from "sweetalert2";
import { supabase } from "@/app/supabase/supabase";
import { Loader2, AlertCircle } from "lucide-react";

const SecurityTab: React.FC = () => {
  const { userData } = useUserContextData();
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [pins, setPins] = useState({ current: "", new: "", confirm: "" });
  const [loading, setLoading] = useState({ password: false, pin: false });
  const [, setSignatureLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isBvnNotSubmitted = userData?.bvnVerification === "not_submitted";

  const inputBase =
    "w-full bg-(--bg-primary) border border-(--border-color) rounded-lg px-3 py-2 text-sm font-body text-(--text-primary) placeholder:text-(--text-secondary) transition-colors focus:outline-none focus:border-(--color-accent-yellow) focus:ring-2 focus:ring-(--color-accent-yellow)/20 disabled:opacity-50 disabled:cursor-not-allowed";
  const inputCls = (field: string) => `${inputBase} ${errors[field] ? "border-red-500" : ""}`;
  const labelCls = "block text-[13px] font-medium text-(--text-secondary) mb-1.5";
  const errCls = "text-xs text-red-500 mt-1";

  const handlePasswordChange = async () => {
    const newErrors: Record<string, string> = {};
    if (!passwords.current) newErrors.currentPassword = "Current password is required";
    if (!passwords.new) newErrors.newPassword = "New password is required";
    if (!passwords.confirm) newErrors.confirmPassword = "Please confirm your password";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    if (passwords.new !== passwords.confirm) { setErrors({ ...newErrors, confirmPassword: "Passwords do not match" }); return; }
    if (passwords.new.length < 6) { setErrors({ ...newErrors, newPassword: "Password must be at least 6 characters" }); return; }

    setLoading((prev) => ({ ...prev, password: true }));
    setErrors({});
    try {
      if (!userData?.email) throw new Error("User not authenticated");
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: userData.email, password: passwords.current });
      if (signInError) { setErrors({ currentPassword: "Current password is incorrect" }); return; }
      const { error: updateError } = await supabase.auth.updateUser({ password: passwords.new });
      if (updateError) throw updateError;
      setPasswords({ current: "", new: "", confirm: "" });
      Swal.fire({ icon: "success", title: "Password updated successfully", timer: 1500, showConfirmButton: false });
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "Error", text: err.message });
    } finally {
      setLoading((prev) => ({ ...prev, password: false }));
    }
  };

  const handlePinChange = async () => {
    if (isBvnNotSubmitted) {
      Swal.fire({ icon: "warning", title: "BVN Verification Required", text: "Please submit your BVN for verification before changing your transaction PIN.", confirmButtonColor: "var(--color-accent-yellow)" });
      return;
    }
    const newErrors: Record<string, string> = {};
    if (!pins.current) newErrors.currentPin = "Current PIN is required";
    if (!pins.new) newErrors.newPin = "New PIN is required";
    if (!pins.confirm) newErrors.confirmPin = "Please confirm your PIN";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    if (pins.new !== pins.confirm) { setErrors({ ...newErrors, confirmPin: "PINs do not match" }); return; }
    if (pins.new.length !== 4 || !/^\d+$/.test(pins.new)) { setErrors({ ...newErrors, newPin: "PIN must be 4 digits" }); return; }
    if (pins.current === pins.new) { setErrors({ ...newErrors, newPin: "New PIN must be different from current PIN" }); return; }

    setLoading((prev) => ({ ...prev, pin: true }));
    setErrors({});
    try {
      if (!userData?.id) throw new Error("User not authenticated");
      const response = await fetch("/api/profile/update-transaction-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userData.id, currentPin: pins.current, newPin: pins.new }),
      });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 429) {
          Swal.fire({ icon: "info", title: "PIN Change Cooldown", text: result.error || "You can only change your PIN once per day. Please try again later.", confirmButtonColor: "var(--color-accent-yellow)" });
          return;
        }
        if (response.status === 409) {
          Swal.fire({ icon: "info", title: "PIN Just Changed", text: "Your PIN was just updated. Please refresh the page.", confirmButtonColor: "var(--color-accent-yellow)" });
          return;
        }
        throw new Error(result.error || "Failed to update PIN");
      }
      setPins({ current: "", new: "", confirm: "" });
      Swal.fire({ icon: "success", title: "PIN updated successfully", text: "You can change your PIN again after the cooldown period.", timer: 2000, showConfirmButton: false });
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "Error", text: err.message });
    } finally {
      setLoading((prev) => ({ ...prev, pin: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <div className="bg-(--bg-primary) border border-(--border-color) rounded-xl p-6 space-y-4 shadow-soft">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-(--text-secondary)">Change Password</h3>
        <div>
          <label htmlFor="cur-pw" className={labelCls}>Current Password</label>
          <input id="cur-pw" type="password" value={passwords.current}
            onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
            className={inputCls("currentPassword")} disabled={loading.password} />
          {errors.currentPassword && <p className={errCls}>{errors.currentPassword}</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="new-pw" className={labelCls}>New Password</label>
            <input id="new-pw" type="password" value={passwords.new}
              onChange={(e) => setPasswords((p) => ({ ...p, new: e.target.value }))}
              className={inputCls("newPassword")} disabled={loading.password} />
            {errors.newPassword && <p className={errCls}>{errors.newPassword}</p>}
          </div>
          <div>
            <label htmlFor="conf-pw" className={labelCls}>Confirm Password</label>
            <input id="conf-pw" type="password" value={passwords.confirm}
              onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
              className={inputCls("confirmPassword")} disabled={loading.password} />
            {errors.confirmPassword && <p className={errCls}>{errors.confirmPassword}</p>}
          </div>
        </div>
        <button type="button" onClick={handlePasswordChange} disabled={loading.password}
          className="w-full md:w-[200px] bg-(--color-accent-yellow) hover:bg-(--color-accent-yellow)/90 text-(--color-ink) py-2.5 px-4 rounded-lg transition-all disabled:opacity-50 font-semibold text-sm flex items-center justify-center gap-2">
          {loading.password ? (<><Loader2 className="w-4 h-4 animate-spin" />Updating...</>) : "Update Password"}
        </button>
      </div>

      {/* Change PIN */}
      <div className="bg-(--bg-primary) border border-(--border-color) rounded-xl p-6 space-y-4 shadow-soft">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-(--text-secondary)">Change Transaction PIN</h3>
          {isBvnNotSubmitted && (
            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs font-medium">
              <AlertCircle className="w-3 h-3" /> BVN Required
            </div>
          )}
        </div>

        {isBvnNotSubmitted && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <p className="text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>You need to submit your BVN for verification before you can change your transaction PIN. Please go to the Profile tab to complete your BVN verification.</span>
            </p>
          </div>
        )}

        <div>
          <label htmlFor="cur-pin" className={labelCls}>Current PIN</label>
          <input id="cur-pin" type="password" inputMode="numeric" maxLength={4}
            value={pins.current}
            onChange={(e) => setPins((p) => ({ ...p, current: e.target.value.replace(/\D/g, "") }))}
            className={inputCls("currentPin")} disabled={loading.pin || isBvnNotSubmitted} />
          {errors.currentPin && <p className={errCls}>{errors.currentPin}</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="new-pin" className={labelCls}>New PIN</label>
            <input id="new-pin" type="password" inputMode="numeric" maxLength={4}
              value={pins.new}
              onChange={(e) => setPins((p) => ({ ...p, new: e.target.value.replace(/\D/g, "") }))}
              className={inputCls("newPin")} disabled={loading.pin || isBvnNotSubmitted} />
            {errors.newPin && <p className={errCls}>{errors.newPin}</p>}
          </div>
          <div>
            <label htmlFor="conf-pin" className={labelCls}>Confirm PIN</label>
            <input id="conf-pin" type="password" inputMode="numeric" maxLength={4}
              value={pins.confirm}
              onChange={(e) => setPins((p) => ({ ...p, confirm: e.target.value.replace(/\D/g, "") }))}
              className={inputCls("confirmPin")} disabled={loading.pin || isBvnNotSubmitted} />
            {errors.confirmPin && <p className={errCls}>{errors.confirmPin}</p>}
          </div>
        </div>
        <button type="button" onClick={handlePinChange} disabled={loading.pin || isBvnNotSubmitted}
          className={`w-full md:w-[200px] py-2.5 px-4 rounded-lg transition-all font-semibold text-sm flex items-center justify-center gap-2 ${
            isBvnNotSubmitted
              ? "bg-(--bg-secondary) text-(--text-secondary) cursor-not-allowed"
              : "bg-(--color-accent-yellow) hover:bg-(--color-accent-yellow)/90 text-(--color-ink) disabled:opacity-50"
          }`}>
          {loading.pin ? (<><Loader2 className="w-4 h-4 animate-spin" />Updating...</>) : isBvnNotSubmitted ? "BVN Required" : "Update PIN"}
        </button>
      </div>

      {/* Change Signature */}
      <div className="bg-(--bg-primary) border border-(--border-color) rounded-xl p-6 space-y-4 shadow-soft">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-(--text-secondary)">Change Signature</h3>
        <SignaturePanel
          onSaveStart={() => setSignatureLoading(true)}
          onSaveEnd={() => setSignatureLoading(false)}
        />
      </div>
    </div>
  );
};

export default SecurityTab;