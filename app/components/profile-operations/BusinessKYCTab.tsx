// app/components/profile-operations/BusinessKYCTab.tsx
import React, { useState, useRef, useEffect } from "react";
import { useUserContextData } from "@/app/context/userData";
import Swal from "sweetalert2";
import Loader from "../Loader";
import { Loader2 } from "lucide-react";

const BusinessKYCTab: React.FC = () => {
  const { userData } = useUserContextData();
  const fileRef = useRef<HTMLInputElement>(null);
  const utilityRef = useRef<HTMLInputElement>(null);
  const [cacFile, setCacFile] = useState<File | null>(null);
  const [cacFileName, setCacFileName] = useState<string | null>(null);
  const [utilityFile, setUtilityFile] = useState<File | null>(null);
  const [utilityFileName, setUtilityFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    businessName: "",
    businessType: "",
    bnRcNumber: "",
    taxId: "",
    businessAddress: "",
    businessDescription: "",
  });

  const businessCategories = [
    "Fintech", "E-commerce", "Technology", "Consulting", "Healthcare",
    "Education", "Real Estate", "Transportation", "Agriculture",
    "Manufacturing", "Media & Entertainment", "Hospitality", "Retail",
    "Construction", "Telecommunications", "Legal Services", "Non-profit",
    "Logistics", "Beauty & Wellness", "Energy & Utilities", "Finance",
    "Food & Beverage", "Automotive", "Insurance", "Gaming",
    "Cybersecurity", "Other",
  ];

  useEffect(() => {
    const fetchBusinessInfo = async () => {
      if (!userData?.id) { setFetchLoading(false); return; }
      try {
        const res = await fetch("/api/get-business-account-details", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: userData.id }),
        });
        const result = await res.json();
        if (result.success && result.data && Object.keys(result.data).length > 0) {
          setFormData({
            businessName: result.data.business_name || "",
            businessType: result.data.business_category || "",
            bnRcNumber: result.data.registration_number || "",
            taxId: result.data.tax_id || "",
            businessAddress: result.data.business_address || "",
            businessDescription: result.data.business_description || "",
          });
        }
      } catch (err) {
        console.error("Error fetching business info:", err);
      } finally {
        setFetchLoading(false);
      }
    };
    fetchBusinessInfo();
  }, [userData?.id]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({ icon: "error", title: "File Too Large", text: "Maximum file size is 5MB" });
      return;
    }
    setCacFile(file);
    setCacFileName(file.name);
  };

  const handleUtilityUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({ icon: "error", title: "File Too Large", text: "Maximum file size is 5MB" });
      return;
    }
    setUtilityFile(file);
    setUtilityFileName(file.name);
  };

  const convertFileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.businessName.trim()) newErrors.businessName = "Business name is required";
    if (!formData.businessType) newErrors.businessType = "Business type is required";
    if (!formData.bnRcNumber.trim()) newErrors.bnRcNumber = "BN/RC number is required";
    if (!formData.taxId.trim()) newErrors.taxId = "Tax ID is required";
    if (!formData.businessAddress.trim()) newErrors.businessAddress = "Business address is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!userData?.id) {
      Swal.fire({ icon: "error", title: "Not Authenticated", text: "Please log in to continue" });
      return;
    }
    if (!validateForm()) return;
    setLoading(true);
    try {
      let cacFileBase64 = null;
      if (cacFile) cacFileBase64 = await convertFileToBase64(cacFile);

      if (utilityFile) {
        const utilFormData = new FormData();
        utilFormData.append("userId", userData.id);
        utilFormData.append("utilityBill", utilityFile);
        const utilRes = await fetch("/api/profile/upload-utility", { method: "POST", body: utilFormData });
        if (!utilRes.ok) {
          const utilError = await utilRes.json();
          throw new Error(utilError.error || "Utility bill upload failed");
        }
      }

      const response = await fetch("/api/profile/update-business-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userData.id,
          businessName: formData.businessName,
          businessType: formData.businessType,
          rcNumber: formData.bnRcNumber,
          taxId: formData.taxId,
          businessAddress: formData.businessAddress,
          businessDescription: formData.businessDescription,
          cacFileBase64,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to save business info");

      await fetch("/api/get-business-account-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userData.id, nocache: true }),
      });

      setCacFile(null);
      setCacFileName(null);
      Swal.fire({ icon: "success", title: "Success!", text: "Business information saved successfully", timer: 1500, showConfirmButton: false });
    } catch (err: any) {
      console.error("Save error:", err);
      Swal.fire({ icon: "error", title: "Error", text: err.message || "Could not save business info. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const descWordCount = formData.businessDescription.trim().split(/\s+/).filter(Boolean).length;

  const inputBase =
    "w-full bg-(--bg-primary) border border-(--border-color) rounded-lg px-3 py-2 text-sm font-body text-(--text-primary) placeholder:text-(--text-secondary) transition-colors focus:outline-none focus:border-(--color-accent-yellow) focus:ring-2 focus:ring-(--color-accent-yellow)/20 disabled:opacity-50 disabled:cursor-not-allowed";
  const inputCls = (field: string) =>
    `${inputBase} ${errors[field] ? "border-red-500" : ""}`;
  const labelCls = "block text-[13px] font-medium text-(--text-secondary) mb-1.5";
  const errCls = "text-xs text-red-500 mt-1";

  const dropzoneCls = (hasFile: boolean) =>
    `w-full border border-dashed rounded-lg px-4 py-4 text-center text-[13px] cursor-pointer transition-colors ${
      hasFile
        ? "border-(--border-color) text-(--text-primary) font-medium"
        : "border-(--border-color) text-(--text-secondary) hover:border-(--color-accent-yellow) hover:bg-(--color-accent-yellow)/5"
    } ${loading ? "opacity-50 cursor-not-allowed" : ""}`;

  if (fetchLoading) {
    return (
      <div className="bg-(--bg-primary) border border-(--border-color) rounded-xl p-6 flex justify-center items-center h-64 shadow-soft">
        <Loader />
      </div>
    );
  }

  return (
    <div className="bg-(--bg-primary) border border-(--border-color) rounded-xl p-6 space-y-5 shadow-soft">
      <div>
        <label htmlFor="biz-name" className={labelCls}>Business Name</label>
        <input id="biz-name" type="text" value={formData.businessName}
          onChange={(e) => handleChange("businessName", e.target.value)}
          className={inputCls("businessName")} placeholder="Enter business name" disabled={loading} />
        {errors.businessName && <p className={errCls}>{errors.businessName}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="biz-type" className={labelCls}>Business Type</label>
          <select id="biz-type" value={formData.businessType}
            onChange={(e) => handleChange("businessType", e.target.value)}
            className={`${inputCls("businessType")} appearance-none`} disabled={loading}>
            <option value="">Select type</option>
            {businessCategories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors.businessType && <p className={errCls}>{errors.businessType}</p>}
        </div>
        <div>
          <label htmlFor="biz-rc" className={labelCls}>BN/RC Number</label>
          <input id="biz-rc" type="text" value={formData.bnRcNumber}
            onChange={(e) => handleChange("bnRcNumber", e.target.value)}
            className={inputCls("bnRcNumber")} placeholder="BN or RC number" disabled={loading} />
          {errors.bnRcNumber && <p className={errCls}>{errors.bnRcNumber}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="biz-tax" className={labelCls}>Tax ID (TIN)</label>
        <input id="biz-tax" type="text" value={formData.taxId}
          onChange={(e) => handleChange("taxId", e.target.value)}
          className={inputCls("taxId")} placeholder="Enter Tax Identification Number" disabled={loading} />
        {errors.taxId && <p className={errCls}>{errors.taxId}</p>}
      </div>

      <div>
        <label className={labelCls}>CAC Certificate</label>
        <div role="button" tabIndex={0}
          onClick={() => !loading && fileRef.current?.click()}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); !loading && fileRef.current?.click(); } }}
          className={dropzoneCls(!!cacFileName)}>
          {cacFileName ?? "Click to upload CAC certificate (PDF, JPG, PNG) — max 5MB"}
        </div>
        <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
          onChange={handleFileUpload} disabled={loading} />
      </div>

      <div>
        <label htmlFor="biz-addr" className={labelCls}>Business Address</label>
        <input id="biz-addr" type="text" value={formData.businessAddress}
          onChange={(e) => handleChange("businessAddress", e.target.value)}
          className={inputCls("businessAddress")} placeholder="Full business address" disabled={loading} />
        {errors.businessAddress && <p className={errCls}>{errors.businessAddress}</p>}
      </div>

      <div>
        <label className={labelCls}>Utility Bill (Address Verification)</label>
        <div role="button" tabIndex={0}
          onClick={() => !loading && utilityRef.current?.click()}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); !loading && utilityRef.current?.click(); } }}
          className={dropzoneCls(!!utilityFileName)}>
          {utilityFileName ?? "Upload a recent utility bill (PDF, JPG, PNG — max 5MB)"}
        </div>
        <input ref={utilityRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
          onChange={handleUtilityUpload} disabled={loading} />
        <p className="text-xs text-(--text-secondary) mt-1.5">
          Electricity, water, or waste bill matching your business address.
        </p>
      </div>

      <div>
        <label htmlFor="biz-desc" className={labelCls}>
          Business Description
          <span className="ml-2 text-xs font-normal">({descWordCount}/100 words)</span>
        </label>
        <textarea id="biz-desc" value={formData.businessDescription}
          onChange={(e) => {
            const words = e.target.value.trim().split(/\s+/).filter(Boolean);
            if (words.length <= 100 || e.target.value.length < formData.businessDescription.length) {
              handleChange("businessDescription", e.target.value);
            }
          }}
          rows={4} className={`${inputBase} resize-none`}
          placeholder="Describe your business activities" disabled={loading} />
      </div>

      <button type="button" onClick={handleSave} disabled={loading}
        className="w-full md:w-[200px] bg-(--color-accent-yellow) hover:bg-(--color-accent-yellow)/90 text-(--color-ink) py-2.5 px-4 rounded-lg transition-all disabled:opacity-50 font-semibold text-sm flex items-center justify-center gap-2">
        {loading ? (<><Loader2 className="w-4 h-4 animate-spin" />Saving...</>) : "Save & Continue"}
      </button>
    </div>
  );
};

export default BusinessKYCTab;