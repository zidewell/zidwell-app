// app/components/new-profile/PersonalKYCTab.tsx
import React, { useState, useEffect } from "react";
import { useUserContextData } from "@/app/context/userData";
import Swal from "sweetalert2";
import Loader from "../Loader";
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
  const [wantsBusiness, setWantsBusiness] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingBankDetails, setFetchingBankDetails] = useState(false);
  const [banks, setBanks] = useState<Array<{ code: string; name: string }>>([]);
  const [userBankDetails, setUserBankDetails] = useState<UserWalletData | null>(
    null,
  );

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

  // Fetch user's personal bank details on component mount
  useEffect(() => {
    if (userData?.id) {
      console.log("🔄 Fetching bank details on mount for user:", userData.id);
      fetchUserBankDetails();
    }
  }, [userData?.id]);

  // Fetch banks list
  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const res = await fetch("/api/banks");
        const data = await res.json();
        setBanks(data?.data || []);
        console.log("✅ Banks fetched:", data?.data?.length);
      } catch (err) {
        console.error("Error fetching banks:", err);
      }
    };
    fetchBanks();
  }, []);

  // Fetch user's personal bank details from the API
  const fetchUserBankDetails = async (forceRefresh = false) => {
    if (!userData?.id) {
      console.log("❌ No user ID available");
      return;
    }

    setFetchingBankDetails(true);
    console.log(
      `🔄 Fetching bank details for user ${userData.id}, forceRefresh: ${forceRefresh}`,
    );

    try {
      const response = await fetch("/api/get-wallet-account-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userData.id,
          nocache: forceRefresh,
        }),
      });

      const result = await response.json();
      console.log("📦 API Response:", result);

      if (result.success && result.data) {
        setUserBankDetails(result.data);

        console.log("💳 Personal Bank Details from API:", {
          p_bank_name: result.data.p_bank_name,
          p_bank_code: result.data.p_bank_code,
          p_account_name: result.data.p_account_name,
          p_account_number: result.data.p_account_number,
        });

        setFormData((prev) => {
          const newFormData = {
            ...prev,
            bankName: result.data.p_bank_name || prev.bankName,
            bankCode: result.data.p_bank_code || prev.bankCode,
            accountNumber: result.data.p_account_number || prev.accountNumber,
            accountName: result.data.p_account_name || prev.accountName,
          };

          console.log("📝 Updated Form Data:", {
            bankName: newFormData.bankName,
            bankCode: newFormData.bankCode,
            accountNumber: newFormData.accountNumber,
            accountName: newFormData.accountName,
          });

          return newFormData;
        });

        console.log("✅ Personal bank details fetched and form updated");
      } else {
        console.log("❌ No data in response or success false:", result);
      }
    } catch (error) {
      console.error("❌ Error fetching bank details:", error);
    } finally {
      setFetchingBankDetails(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    console.log(`✏️ Field changed: ${field} = ${value}`);
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleFileChange = (field: string, file: File | null) => {
    console.log(`📎 File changed: ${field}`, file?.name);
    setFormData((prev) => ({ ...prev, [field]: file }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.ninNumber && formData.ninNumber.length !== 11) {
      newErrors.ninNumber = "NIN must be 11 digits";
    }

    if (formData.accountNumber && formData.accountNumber.length !== 10) {
      newErrors.accountNumber = "Account number must be 10 digits";
    }

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

      if (
        formData.ninNumber ||
        formData.idCardFile ||
        formData.utilityBillFile
      ) {
        const kycFormData = new FormData();
        kycFormData.append("userId", userData.id);
        if (formData.ninNumber) kycFormData.append("nin", formData.ninNumber);
        if (formData.idCardFile)
          kycFormData.append("idCard", formData.idCardFile);
        if (formData.utilityBillFile)
          kycFormData.append("utilityBill", formData.utilityBillFile);

        const kycResponse = await fetch("/api/profile/upload-kyc", {
          method: "POST",
          body: kycFormData,
        });

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

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Personal information saved successfully!",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error: any) {
      console.error("Save error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "Failed to save information",
      });
    } finally {
      setLoading(false);
    }
  };

  const inputClassName = (field: string) => `
    w-full bg-[var(--bg-primary)] border-2 px-3 py-2 text-sm font-body text-[var(--text-primary)] 
    placeholder:text-[var(--text-secondary)] focus:outline-none transition-colors rounded-md
    ${errors[field] ? "border-red-500" : "border-[var(--color-accent-yellow)]"}
    focus:border-[var(--color-accent-yellow)] focus:ring-2 focus:ring-[var(--color-accent-yellow)]/20 disabled:opacity-50 disabled:cursor-not-allowed
  `;

  return (
    <div className="space-y-6">
      <div className="neo-card bg-[var(--bg-primary)] p-6 space-y-5 border border-[var(--border-color)] rounded-xl shadow-soft">
        {/* Display existing personal bank account if available */}
        {userBankDetails?.p_account_name && (
          <div className="bg-[var(--color-accent-yellow)]/5 border-2 border-[var(--color-accent-yellow)] rounded-md p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-heading text-[var(--text-primary)] text-sm">
                YOUR PERSONAL BANK ACCOUNT
              </h4>
              <button
                onClick={() => fetchUserBankDetails(true)}
                disabled={fetchingBankDetails}
                className="text-[var(--color-accent-yellow)] hover:text-[var(--color-accent-yellow)]/80 text-xs flex items-center gap-1"
              >
                <RefreshCw
                  className={`w-3 h-3 ${fetchingBankDetails ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-[var(--text-secondary)] text-xs">Bank:</span>
                <p className="font-medium text-[var(--text-primary)]">
                  {userBankDetails.p_bank_name || "Not set"}
                </p>
              </div>
              <div>
                <span className="text-[var(--text-secondary)] text-xs">
                  Account Number:
                </span>
                <p className="font-medium text-[var(--text-primary)]">
                  {userBankDetails.p_account_number || "Not set"}
                </p>
              </div>
              <div>
                <span className="text-[var(--text-secondary)] text-xs">
                  Account Name:
                </span>
                <p className="font-medium text-[var(--text-primary)]">
                  {userBankDetails.p_account_name || "Not set"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* NIN Number */}
        <div>
          <label className="text-sm font-body text-[var(--text-secondary)] block mb-1.5">
            NIN Number (Optional)
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={11}
            value={formData.ninNumber}
            onChange={(e) =>
              handleChange("ninNumber", e.target.value.replace(/\D/g, ""))
            }
            className={inputClassName("ninNumber")}
            placeholder="Enter your 11-digit NIN"
            disabled={loading || fetchingBankDetails}
          />
          {errors.ninNumber && (
            <p className="text-xs text-red-500 mt-1">{errors.ninNumber}</p>
          )}
        </div>

        {/* Address */}
        <div>
          <label className="text-sm font-body text-[var(--text-secondary)] block mb-1.5">
            Address
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              value={formData.country}
              onChange={(e) => handleChange("country", e.target.value)}
              className="w-full bg-[var(--bg-primary)] border-2 border-[var(--color-accent-yellow)] px-3 py-2 text-sm font-body text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--color-accent-yellow)] focus:ring-2 focus:ring-[var(--color-accent-yellow)]/20 transition-colors rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Country"
              disabled={loading || fetchingBankDetails}
            />
            <input
              type="text"
              value={formData.city}
              onChange={(e) => handleChange("city", e.target.value)}
              className="w-full bg-[var(--bg-primary)] border-2 border-[var(--color-accent-yellow)] px-3 py-2 text-sm font-body text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--color-accent-yellow)] focus:ring-2 focus:ring-[var(--color-accent-yellow)]/20 transition-colors rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="City"
              disabled={loading || fetchingBankDetails}
            />
            <input
              type="text"
              value={formData.street}
              onChange={(e) => handleChange("street", e.target.value)}
              className="w-full bg-[var(--bg-primary)] border-2 border-[var(--color-accent-yellow)] px-3 py-2 text-sm font-body text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--color-accent-yellow)] focus:ring-2 focus:ring-[var(--color-accent-yellow)]/20 transition-colors rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Street Address"
              disabled={loading || fetchingBankDetails}
            />
          </div>
        </div>

        {/* Personal Bank Details */}
        <div className="border-t-2 border-[var(--color-accent-yellow)] pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading text-[var(--text-primary)] text-sm">
              PERSONAL BANK ACCOUNT DETAILS
            </h3>
            {fetchingBankDetails && (
              <span className="text-xs text-[var(--color-accent-yellow)] flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Fetching...
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-body text-[var(--text-secondary)] block mb-1.5">
                Bank Name
              </label>
              <select
                value={formData.bankCode}
                onChange={(e) => {
                  const bank = banks.find((b) => b.code === e.target.value);
                  handleChange("bankCode", e.target.value);
                  handleChange("bankName", bank?.name || "");
                }}
                className="w-full bg-[var(--bg-primary)] border-2 border-[var(--color-accent-yellow)] px-3 py-2 text-sm font-body text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-accent-yellow)] focus:ring-2 focus:ring-[var(--color-accent-yellow)]/20 transition-colors rounded-md disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
                disabled={loading || fetchingBankDetails}
              >
                <option value="">Select bank</option>
                {banks.map((bank) => (
                  <option key={bank.code} value={bank.code}>
                    {bank.name}
                  </option>
                ))}
              </select>
              {formData.bankName && (
                <p className="text-xs text-[var(--color-lemon-green)] mt-1">
                  Selected: {formData.bankName}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-body text-[var(--text-secondary)] block mb-1.5">
                Account Number
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={10}
                value={formData.accountNumber}
                onChange={(e) =>
                  handleChange(
                    "accountNumber",
                    e.target.value.replace(/\D/g, ""),
                  )
                }
                className={inputClassName("accountNumber")}
                placeholder="10-digit account number"
                disabled={loading || fetchingBankDetails}
              />
              {errors.accountNumber && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.accountNumber}
                </p>
              )}
            </div>
          </div>
          <div className="mt-3">
            <label className="text-sm font-body text-[var(--text-secondary)] block mb-1.5">
              Account Name
            </label>
            <input
              type="text"
              value={formData.accountName}
              onChange={(e) => handleChange("accountName", e.target.value)}
              className="w-full bg-[var(--bg-primary)] border-2 border-[var(--color-accent-yellow)] px-3 py-2 text-sm font-body text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--color-accent-yellow)] focus:ring-2 focus:ring-[var(--color-accent-yellow)]/20 transition-colors rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Account holder name"
              disabled={loading || fetchingBankDetails}
            />
          </div>
        </div>

        {/* KYC Uploads */}
        <div className="border-t-2 border-[var(--color-accent-yellow)] pt-4">
          <h3 className="font-heading text-[var(--text-primary)] text-sm mb-3">
            KYC DOCUMENTS
          </h3>

          {/* ID Card Upload */}
          <div className="mb-4">
            <label className="text-sm font-body text-[var(--text-secondary)] block mb-1.5">
              ID Card (National ID, Voter's Card, Driver's License, Passport)
            </label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) =>
                handleFileChange("idCardFile", e.target.files?.[0] || null)
              }
              className="w-full bg-[var(--bg-primary)] border-2 border-[var(--color-accent-yellow)] p-2 text-sm font-body text-[var(--text-primary)] rounded-md file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[var(--color-accent-yellow)] file:text-[var(--color-ink)] hover:file:bg-[var(--color-accent-yellow)]/90 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || fetchingBankDetails}
            />
          </div>

          {/* Utility Bill Upload */}
          <div>
            <label className="text-sm font-body text-[var(--text-secondary)] block mb-1.5">
              Utility Bill (NEPA Bill, Water Bill, or Bank Statement)
            </label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) =>
                handleFileChange("utilityBillFile", e.target.files?.[0] || null)
              }
              className="w-full bg-[var(--bg-primary)] border-2 border-[var(--color-accent-yellow)] p-2 text-sm font-body text-[var(--text-primary)] rounded-md file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[var(--color-accent-yellow)] file:text-[var(--color-ink)] hover:file:bg-[var(--color-accent-yellow)]/90 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || fetchingBankDetails}
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={loading || fetchingBankDetails}
          className="w-full bg-[var(--color-accent-yellow)] hover:bg-[var(--color-accent-yellow)]/90 text-[var(--color-ink)] md:w-[200px] py-3 px-4 rounded-md transition-all disabled:opacity-50 font-medium flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save & Continue"
          )}
        </button>
      </div>
    </div>
  );
};

export default PersonalKYCTab;