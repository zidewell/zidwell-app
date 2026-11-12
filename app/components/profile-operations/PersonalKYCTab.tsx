// app/components/profile-operations/PersonalKYCTab.tsx
import React, { useState, useEffect } from "react";
import { useUserContextData } from "@/app/context/userData";
import Swal from "sweetalert2";
import { Loader2, RefreshCw } from "lucide-react";

interface UserWalletData {
  wallet_id: string | null;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  p_bank_name: string | null;
  p_bank_code: string | null;
  p_account_name: string | null;
  p_account_number: string | null;
}

const PersonalKYCTab: React.FC = () => {
  const { userData, setUserData } = useUserContextData();
  const [loading, setLoading] = useState(false);
  const [fetchingBankDetails, setFetchingBankDetails] = useState(false);
  const [banks, setBanks] = useState<Array<{ code: string; name: string }>>([]);
  const [userBankDetails, setUserBankDetails] = useState<UserWalletData | null>(null);

  const [formData, setFormData] = useState({
    ninNumber: userData?.nin || "",
    country: userData?.country || "Nigeria",
    city: userData?.city || "",
    street: userData?.address || "",
    bankName: userData?.p_bank_name || "",
    bankCode: userData?.p_bank_code || "",
    accountNumber: userData?.p_account_number || "",
    accountName: userData?.p_account_name || "",
    idCardFile: null as File | null,
    utilityBillFile: null as File | null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (userData?.id) fetchUserBankDetails();
  }, [userData?.id]);

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const res = await fetch("/api/banks");
        const data = await res.json();
        setBanks(data?.data || []);
      } catch (err) {
        console.error("Error fetching banks:", err);
      }
    };
    fetchBanks();
  }, []);

  const fetchUserBankDetails = async (forceRefresh = false) => {
    if (!userData?.id) return;
    setFetchingBankDetails(true);
    try {
      const response = await fetch("/api/get-wallet-account-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userData.id, nocache: forceRefresh }),
      });
      const result = await response.json();
      if (result.success && result.data) {
        setUserBankDetails(result.data);
        setFormData((prev) => ({
          ...prev,
          bankName: result.data.p_bank_name || prev.bankName,
          bankCode: result.data.p_bank_code || prev.bankCode,
          accountNumber: result.data.p_account_number || prev.accountNumber,
          accountName: result.data.p_account_name || prev.accountName,
        }));
      }
    } catch (error) {
      console.error("Error fetching bank details:", error);
    } finally {
      setFetchingBankDetails(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleFileChange = (field: string, file: File | null) => {
    setFormData((prev) => ({ ...prev, [field]: file }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (formData.ninNumber && formData.ninNumber.length !== 11) newErrors.ninNumber = "NIN must be 11 digits";
    if (formData.accountNumber && formData.accountNumber.length !== 10) newErrors.accountNumber = "Account number must be 10 digits";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!userData?.id) return;
    if (!validateForm()) return;
    setLoading(true);
    try {
      const profileResponse = await fetch("/api/profile/update-profile-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userData.id,
          city: formData.city,
          state: formData.city,
          country: formData.country,
          address: formData.street,
          nin: formData.ninNumber,
          pBankName: formData.bankName,
          pBankCode: formData.bankCode,
          pAccountNumber: formData.accountNumber,
          pAccountName: formData.accountName,
        }),
      });
      if (!profileResponse.ok) throw new Error("Failed to update profile");

      if (formData.ninNumber || formData.idCardFile || formData.utilityBillFile) {
        const kycFormData = new FormData();
        kycFormData.append("userId", userData.id);
        if (formData.ninNumber) kycFormData.append("nin", formData.ninNumber);
        if (formData.idCardFile) kycFormData.append("idCard", formData.idCardFile);
        if (formData.utilityBillFile) kycFormData.append("utilityBill", formData.utilityBillFile);
        const kycResponse = await fetch("/api/profile/upload-kyc", { method: "POST", body: kycFormData });
        if (!kycResponse.ok) throw new Error("KYC upload failed");
      }

      await fetchUserBankDetails(true);

      const updatedUser = {
        ...userData,
        city: formData.city,
        address: formData.street,
        country: formData.country,
        nin: formData.ninNumber,
        kycStatus: "pending",
        p_bank_name: formData.bankName,
        p_bank_code: formData.bankCode,
        p_account_number: formData.accountNumber,
        p_account_name: formData.accountName,
      };
      setUserData(updatedUser);
      localStorage.setItem("userData", JSON.stringify(updatedUser));

      Swal.fire({ icon: "success", title: "Success", text: "Personal information saved successfully!", timer: 1500, showConfirmButton: false });
    } catch (error: any) {
      console.error("Save error:", error);
      Swal.fire({ icon: "error", title: "Error", text: error.message || "Failed to save information" });
    } finally {
      setLoading(false);
    }
  };

  const inputBase =
    "w-full bg-(--bg-primary) border border-(--border-color) rounded-lg px-3 py-2 text-sm font-body text-(--text-primary) placeholder:text-(--text-secondary) transition-colors focus:outline-none focus:border-(--color-accent-yellow) focus:ring-2 focus:ring-(--color-accent-yellow)/20 disabled:opacity-50 disabled:cursor-not-allowed";
  const inputCls = (field: string) =>
    `${inputBase} ${errors[field] ? "border-red-500" : ""}`;
  const labelCls = "block text-[13px] font-medium text-(--text-secondary) mb-1.5";
  const errCls = "text-xs text-red-500 mt-1";
  const disabled = loading || fetchingBankDetails;

  const fileInputCls =
    "w-full bg-(--bg-primary) border border-(--border-color) rounded-lg p-2 text-sm font-body text-(--text-primary) file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-(--color-accent-yellow) file:text-(--color-ink) hover:file:bg-(--color-accent-yellow)/90 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="space-y-6">
      <div className="bg-(--bg-primary) border border-(--border-color) rounded-xl p-6 space-y-5 shadow-soft">
        {userBankDetails?.p_account_name && (
          <div className="bg-(--bg-secondary) border border-(--border-color) rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-(--text-secondary)">
                Your Personal Bank Account
              </h4>
              <button onClick={() => fetchUserBankDetails(true)} disabled={fetchingBankDetails}
                className="text-(--text-secondary) hover:text-(--text-primary) text-xs flex items-center gap-1 transition-colors">
                <RefreshCw className={`w-3 h-3 ${fetchingBankDetails ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-(--text-secondary) text-xs">Bank</span>
                <p className="font-medium text-(--text-primary)">{userBankDetails.p_bank_name || "Not set"}</p>
              </div>
              <div>
                <span className="text-(--text-secondary) text-xs">Account Number</span>
                <p className="font-medium text-(--text-primary)">{userBankDetails.p_account_number || "Not set"}</p>
              </div>
              <div>
                <span className="text-(--text-secondary) text-xs">Account Name</span>
                <p className="font-medium text-(--text-primary)">{userBankDetails.p_account_name || "Not set"}</p>
              </div>
            </div>
          </div>
        )}

        <div>
          <label htmlFor="nin" className={labelCls}>NIN Number (Optional)</label>
          <input id="nin" type="text" inputMode="numeric" maxLength={11}
            value={formData.ninNumber}
            onChange={(e) => handleChange("ninNumber", e.target.value.replace(/\D/g, ""))}
            className={inputCls("ninNumber")} placeholder="Enter your 11-digit NIN" disabled={disabled} />
          {errors.ninNumber && <p className={errCls}>{errors.ninNumber}</p>}
        </div>

        <div>
          <label className={labelCls}>Address</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input type="text" value={formData.country}
              onChange={(e) => handleChange("country", e.target.value)}
              className={inputBase} placeholder="Country" disabled={disabled} />
            <input type="text" value={formData.city}
              onChange={(e) => handleChange("city", e.target.value)}
              className={inputBase} placeholder="City" disabled={disabled} />
            <input type="text" value={formData.street}
              onChange={(e) => handleChange("street", e.target.value)}
              className={inputBase} placeholder="Street Address" disabled={disabled} />
          </div>
        </div>

        <hr className="border-(--border-color)" />

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-(--text-secondary)">
              Personal Bank Account Details
            </h3>
            {fetchingBankDetails && (
              <span className="text-xs text-(--text-secondary) flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Fetching...
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="bank" className={labelCls}>Bank Name</label>
              <select id="bank" value={formData.bankCode}
                onChange={(e) => {
                  const bank = banks.find((b) => b.code === e.target.value);
                  handleChange("bankCode", e.target.value);
                  handleChange("bankName", bank?.name || "");
                }}
                className={`${inputBase} appearance-none`} disabled={disabled}>
                <option value="">Select bank</option>
                {banks.map((bank) => <option key={bank.code} value={bank.code}>{bank.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="acct" className={labelCls}>Account Number</label>
              <input id="acct" type="text" inputMode="numeric" maxLength={10}
                value={formData.accountNumber}
                onChange={(e) => handleChange("accountNumber", e.target.value.replace(/\D/g, ""))}
                className={inputCls("accountNumber")} placeholder="10-digit account number" disabled={disabled} />
              {errors.accountNumber && <p className={errCls}>{errors.accountNumber}</p>}
            </div>
          </div>
          <div className="mt-3">
            <label htmlFor="acct-name" className={labelCls}>Account Name</label>
            <input id="acct-name" type="text" value={formData.accountName}
              onChange={(e) => handleChange("accountName", e.target.value)}
              className={inputBase} placeholder="Account holder name" disabled={disabled} />
          </div>
        </div>

        <hr className="border-(--border-color)" />

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-(--text-secondary) mb-3">
            KYC Documents
          </h3>
          <div className="mb-4">
            <label className={labelCls}>
              ID Card (National ID, Voter's Card, Driver's License, Passport)
            </label>
            <input type="file" accept="image/*,application/pdf"
              onChange={(e) => handleFileChange("idCardFile", e.target.files?.[0] || null)}
              className={fileInputCls} disabled={disabled} />
          </div>
          <div>
            <label className={labelCls}>
              Utility Bill (NEPA Bill, Water Bill, or Bank Statement)
            </label>
            <input type="file" accept="image/*,application/pdf"
              onChange={(e) => handleFileChange("utilityBillFile", e.target.files?.[0] || null)}
              className={fileInputCls} disabled={disabled} />
          </div>
        </div>

        <button type="button" onClick={handleSave} disabled={disabled}
          className="w-full md:w-[200px] bg-(--color-accent-yellow) hover:bg-(--color-accent-yellow)/90 text-(--color-ink) py-2.5 px-4 rounded-lg transition-all disabled:opacity-50 font-semibold text-sm flex items-center justify-center gap-2">
          {loading ? (<><Loader2 className="w-4 h-4 animate-spin" />Saving...</>) : "Save & Continue"}
        </button>
      </div>
    </div>
  );
};

export default PersonalKYCTab;