// app/components/new-profile/BusinessKYCTab.tsx
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
    "Education", "Real Estate", "Transportation", "Agriculture", "Manufacturing",
    "Media & Entertainment", "Hospitality", "Retail", "Construction",
    "Telecommunications", "Legal Services", "Non-profit", "Logistics",
    "Beauty & Wellness", "Energy & Utilities", "Finance", "Food & Beverage",
    "Automotive", "Insurance", "Gaming", "Cybersecurity", "Other"
  ];

  useEffect(() => {
    const fetchBusinessInfo = async () => {
      if (!userData?.id) {
        setFetchLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/get-business-account-details", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: userData.id }),
        });

        const result = await res.json();

        if (result.success && result.data) {
          if (Object.keys(result.data).length > 0) {
            setFormData({
              businessName: result.data.business_name || "",
              businessType: result.data.business_category || "",
              bnRcNumber: result.data.registration_number || "",
              taxId: result.data.tax_id || "",
              businessAddress: result.data.business_address || "",
              businessDescription: result.data.business_description || "",
            });
          }
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
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          icon: "error",
          title: "File Too Large",
          text: "Maximum file size is 5MB",
        });
        return;
      }
      setCacFile(file);
      setCacFileName(file.name);
    }
  };

  const handleUtilityUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          icon: "error",
          title: "File Too Large",
          text: "Maximum file size is 5MB",
        });
        return;
      }
      setUtilityFile(file);
      setUtilityFileName(file.name);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.businessName.trim()) {
      newErrors.businessName = "Business name is required";
    }
    if (!formData.businessType) {
      newErrors.businessType = "Business type is required";
    }
    if (!formData.bnRcNumber.trim()) {
      newErrors.bnRcNumber = "BN/RC number is required";
    }
    if (!formData.taxId.trim()) {
      newErrors.taxId = "Tax ID is required";
    }
    if (!formData.businessAddress.trim()) {
      newErrors.businessAddress = "Business address is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!userData?.id) {
      Swal.fire({
        icon: "error",
        title: "Not Authenticated",
        text: "Please log in to continue",
      });
      return;
    }

    if (!validateForm()) return;

    setLoading(true);

    try {
      let cacFileBase64 = null;
      if (cacFile) {
        cacFileBase64 = await convertFileToBase64(cacFile);
      }

      if (utilityFile) {
        const utilFormData = new FormData();
        utilFormData.append("userId", userData.id);
        utilFormData.append("utilityBill", utilityFile);

        const utilRes = await fetch("/api/profile/upload-utility", {
          method: "POST",
          body: utilFormData,
        });

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
          cacFileBase64: cacFileBase64,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save business info");
      }

      await fetch("/api/get-business-account-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userData.id, nocache: true }),
      });

      setCacFile(null);
      setCacFileName(null);

      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Business information saved successfully",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err: any) {
      console.error("Save error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Could not save business info. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const descWordCount = formData.businessDescription.trim().split(/\s+/).filter(Boolean).length;

  const inputClassName = (field: string) => `
    w-full bg-background border-2 px-3 py-2 text-sm font-body text-foreground 
    placeholder:text-muted-foreground focus:outline-none transition-colors rounded-md
    ${errors[field] ? 'border-red-500' : 'border-[#2b825b]'}
    focus:border-[#2b825b] focus:ring-2 focus:ring-[#2b825b]/20 disabled:opacity-50 disabled:cursor-not-allowed
  `;

  if (fetchLoading) {
    return (
      <div className="neo-card bg-card p-6 flex justify-center items-center h-64">
        <Loader />
      </div>
    );
  }

  return (
    <div className="neo-card bg-card p-6 space-y-5">
      <div>
        <label className="text-sm font-body text-muted-foreground block mb-1.5">Business Name</label>
        <input
          type="text"
          value={formData.businessName}
          onChange={(e) => handleChange("businessName", e.target.value)}
          className={inputClassName('businessName')}
          placeholder="Enter business name"
          disabled={loading}
        />
        {errors.businessName && <p className="text-xs text-red-500 mt-1">{errors.businessName}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-body text-muted-foreground block mb-1.5">Business Type</label>
          <select
            value={formData.businessType}
            onChange={(e) => handleChange("businessType", e.target.value)}
            className={`w-full bg-background border-2 px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:border-[#2b825b] focus:ring-2 focus:ring-[#2b825b]/20 transition-colors rounded-md disabled:opacity-50 disabled:cursor-not-allowed appearance-none ${
              errors.businessType ? 'border-red-500' : 'border-[#2b825b]'
            }`}
            disabled={loading}
          >
            <option value="">Select type</option>
            {businessCategories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          {errors.businessType && <p className="text-xs text-red-500 mt-1">{errors.businessType}</p>}
        </div>
        <div>
          <label className="text-sm font-body text-muted-foreground block mb-1.5">BN/RC Number</label>
          <input
            type="text"
            value={formData.bnRcNumber}
            onChange={(e) => handleChange("bnRcNumber", e.target.value)}
            className={inputClassName('bnRcNumber')}
            placeholder="BN or RC number"
            disabled={loading}
          />
          {errors.bnRcNumber && <p className="text-xs text-red-500 mt-1">{errors.bnRcNumber}</p>}
        </div>
      </div>

      <div>
        <label className="text-sm font-body text-muted-foreground block mb-1.5">Tax ID (TIN)</label>
        <input
          type="text"
          value={formData.taxId}
          onChange={(e) => handleChange("taxId", e.target.value)}
          className={inputClassName('taxId')}
          placeholder="Enter Tax Identification Number"
          disabled={loading}
        />
        {errors.taxId && <p className="text-xs text-red-500 mt-1">{errors.taxId}</p>}
      </div>

      {/* CAC Upload */}
      <div>
        <label className="text-sm font-body text-muted-foreground block mb-1.5">CAC Certificate</label>
        <div
          onClick={() => !loading && fileRef.current?.click()}
          className={`w-full border-2 border-dashed p-4 text-center cursor-pointer hover:border-[#2b825b] transition-colors rounded-md ${
            loading ? 'opacity-50 cursor-not-allowed border-[#2b825b]' : 'border-[#2b825b]'
          }`}
        >
          {cacFileName ? (
            <span className="text-sm font-body text-foreground">{cacFileName}</span>
          ) : (
            <span className="text-sm font-body text-muted-foreground">
              Click to upload CAC certificate (PDF, JPG, PNG) - Max 5MB
            </span>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={handleFileUpload}
          disabled={loading}
        />
      </div>

      <div>
        <label className="text-sm font-body text-muted-foreground block mb-1.5">Business Address</label>
        <input
          type="text"
          value={formData.businessAddress}
          onChange={(e) => handleChange("businessAddress", e.target.value)}
          className={inputClassName('businessAddress')}
          placeholder="Full business address"
          disabled={loading}
        />
        {errors.businessAddress && <p className="text-xs text-red-500 mt-1">{errors.businessAddress}</p>}
      </div>

      {/* Utility Bill Upload - Address Verification */}
      <div>
        <label className="text-sm font-body text-muted-foreground block mb-1.5">
          Utility Bill (Address Verification)
        </label>
        <div
          onClick={() => !loading && utilityRef.current?.click()}
          className={`w-full border-2 border-dashed p-4 text-center cursor-pointer hover:border-[#2b825b] transition-colors rounded-md ${
            loading ? 'opacity-50 cursor-not-allowed border-[#2b825b]' : 'border-[#2b825b]'
          }`}
        >
          {utilityFileName ? (
            <span className="text-sm font-body text-foreground">{utilityFileName}</span>
          ) : (
            <span className="text-sm font-body text-muted-foreground">
              Upload a recent utility bill (PDF, JPG, PNG — max 5MB)
            </span>
          )}
        </div>
        <input
          ref={utilityRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={handleUtilityUpload}
          disabled={loading}
        />
        <p className="text-xs font-body text-muted-foreground mt-1.5">
          Electricity, water, or waste bill matching your business address.
        </p>
      </div>

      <div>
        <label className="text-sm font-body text-muted-foreground block mb-1.5">
          Business Description
          <span className="ml-2 text-xs text-muted-foreground">({descWordCount}/100 words)</span>
        </label>
        <textarea
          value={formData.businessDescription}
          onChange={(e) => {
            const words = e.target.value.trim().split(/\s+/).filter(Boolean);
            if (words.length <= 100 || e.target.value.length < formData.businessDescription.length) {
              handleChange("businessDescription", e.target.value);
            }
          }}
          rows={4}
          className="w-full bg-background border-2 border-[#2b825b] px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#2b825b] focus:ring-2 focus:ring-[#2b825b]/20 transition-colors rounded-md resize-none disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="Describe your business activities"
          disabled={loading}
        />
      </div>

      {/* Primary Color Button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={loading}
        className="w-full bg-[#2b825b] hover:bg-[#2b825b]/90 text-white md:w-[200px] dark:bg-[#236b49] dark:hover:bg-[#174c36] py-3 px-4 rounded-md transition-all disabled:opacity-50 font-medium flex items-center justify-center gap-2"
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
  );
};

export default BusinessKYCTab;