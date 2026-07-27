// app/components/OnboardingModal.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Check,
  X,
  Loader2,
  User,
  Building2,
  CreditCard,
  Shield,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Mail,
  Phone,
  Globe,
  MapPin,
  FileText,
  Award,
  Store,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Copy,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import confetti from "canvas-confetti";

interface OnboardingModalProps {
  userId: string;
  userEmail: string;
  userPhone: string;
  fullName: string;
  purpose: "personal" | "business";
  onComplete: () => void;
  onSkip: () => void;
  isOpen: boolean;
}

const OnboardingModal = ({
  userId,
  userEmail,
  userPhone,
  fullName,
  purpose,
  onComplete,
  onSkip,
  isOpen,
}: OnboardingModalProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<
    "idle" | "verifying" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [direction, setDirection] = useState(1);

  const isBusiness = purpose === "business";

  // Identity verification states
  const [identityType, setIdentityType] = useState<"bvn" | "nin">("bvn");
  const [identityNumber, setIdentityNumber] = useState("");
  const [identityData, setIdentityData] = useState<any>(null);

  // PIN setup states
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [pinSet, setPinSet] = useState(false);

  // Business verification states
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [cacNumber, setCacNumber] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessWebsite, setBusinessWebsite] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [businessData, setBusinessData] = useState<any>(null);
  const [cacVerified, setCacVerified] = useState(false);

  // Account creation states
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [copied, setCopied] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const steps = [
    {
      id: "identity",
      title: "Identity Verification",
      description: "Verify your identity using BVN or NIN",
      icon: <User className="h-5 w-5" />,
    },
    {
      id: "pin",
      title: "Set Transaction PIN",
      description: "Create a secure PIN for transactions",
      icon: <Shield className="h-5 w-5" />,
    },
    ...(isBusiness
      ? [
          {
            id: "business",
            title: "Business Verification",
            description: "Provide your business details",
            icon: <Building2 className="h-5 w-5" />,
          },
        ]
      : []),
    {
      id: "complete",
      title: "Account Activation",
      description: "Your account is being activated",
      icon: <Sparkles className="h-5 w-5" />,
    },
  ];

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setVerificationStatus("idle");
      setErrorMessage("");
      setIdentityNumber("");
      setPin("");
      setConfirmPin("");
      setPinSet(false);
      setIdentityData(null);
      setBusinessData(null);
      setCacVerified(false);
      setShowSuccessModal(false);
    }
  }, [isOpen]);

  // Handle identity verification
  const handleIdentityVerification = async () => {
    if (!identityNumber || identityNumber.length !== 11) {
      setErrorMessage("Please enter a valid 11-digit BVN or NIN");
      return;
    }

    setLoading(true);
    setVerificationStatus("verifying");
    setErrorMessage("");

    try {
      const endpoint =
        identityType === "bvn"
          ? "/api/users-verification/bvn"
          : "/api/users-verification/nin";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number: identityNumber }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        const result = data.data.data || data.data;
        const kyc = result.kyc || result;

        setIdentityData({
          firstName: kyc.firstName || kyc.first_name || "",
          lastName: kyc.lastName || kyc.last_name || kyc.surname || "",
          dateOfBirth: kyc.dateOfBirth || kyc.date_of_birth || kyc.birthdate || "",
          phone: kyc.phoneNumber || kyc.phone || kyc.telephoneno || "",
          gender: kyc.gender || "",
        });

        setVerificationStatus("success");
        setErrorMessage("");

        await Swal.fire({
          icon: "success",
          title: `${identityType.toUpperCase()} Verified!`,
          text: `Your ${identityType.toUpperCase()} has been verified successfully.`,
          timer: 1500,
          showConfirmButton: false,
        });

        setTimeout(() => {
          setDirection(1);
          setCurrentStep(1);
        }, 500);
      } else {
        setVerificationStatus("error");
        setErrorMessage(data.message || `${identityType.toUpperCase()} verification failed`);
        await Swal.fire({
          icon: "error",
          title: "Verification Failed",
          text: data.message || `Invalid ${identityType.toUpperCase()}. Please check and try again.`,
          confirmButtonColor: "#FDC020",
        });
      }
    } catch (error: any) {
      setVerificationStatus("error");
      setErrorMessage(error.message || "Verification failed. Please try again.");
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to verify. Please check your connection and try again.",
        confirmButtonColor: "#FDC020",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle PIN setup
  const handlePinSetup = () => {
    if (!pin || pin.length !== 4) {
      setErrorMessage("Please enter a 4-digit PIN");
      return;
    }

    if (pin !== confirmPin) {
      setErrorMessage("PINs do not match");
      return;
    }

    setPinSet(true);

    setTimeout(() => {
      if (isBusiness) {
        setDirection(1);
        setCurrentStep(2);
      } else {
        handleCompleteVerification();
      }
    }, 500);
  };

  // Handle CAC verification
  const handleCacVerification = async () => {
    if (!cacNumber || cacNumber.length < 4) {
      setErrorMessage("Please enter a valid RC number");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/users-verification/cac", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rc_number: cacNumber, company_type: "RC" }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        const result = data.data.data || data.data;
        const businessInfo = result.business_info || result;

        setBusinessData({
          businessName: businessInfo.company_name || businessInfo.business_name || "",
          businessAddress: businessInfo.address || businessInfo.business_address || "",
          businessType: businessInfo.company_type || businessInfo.business_type || "",
          businessIndustry: businessInfo.industry || businessInfo.business_industry || "",
          registrationDate: businessInfo.registration_date || businessInfo.registrationDate || "",
        });

        // Auto-populate fields
        if (businessInfo.company_name) setBusinessName(businessInfo.company_name);
        if (businessInfo.address) setBusinessAddress(businessInfo.address);

        setCacVerified(true);

        await Swal.fire({
          icon: "success",
          title: "CAC Verified!",
          text: "Business registration verified. Fields have been auto-populated.",
          timer: 1500,
          showConfirmButton: false,
        });

        handleCompleteVerification();
      } else {
        setErrorMessage(data.message || "CAC verification failed");
        await Swal.fire({
          icon: "error",
          title: "CAC Verification Failed",
          text: data.message || "Invalid RC number. Please check and try again.",
          confirmButtonColor: "#FDC020",
        });
      }
    } catch (error: any) {
      setErrorMessage(error.message || "CAC verification failed");
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to verify CAC. Please check your connection and try again.",
        confirmButtonColor: "#FDC020",
      });
    } finally {
      setLoading(false);
    }
  };

  // Complete verification and create wallet
  const handleCompleteVerification = async () => {
    setLoading(true);
    setVerificationStatus("verifying");

    try {
      // Prepare payload based on user type
      const payload: any = {
        userId,
        fullName,
        email: userEmail,
        phone: userPhone,
        purpose,
        identityType,
        identityNumber,
        transactionPin: pin,
        identityData,
      };

      if (isBusiness) {
        payload.business = {
          isRegistered: isRegistered || false,
          businessName,
          cacNumber: isRegistered ? cacNumber : null,
          businessAddress,
          businessCategory,
          businessDescription,
          mapUrl,
          businessEmail,
          businessPhone,
          businessWebsite,
          cacVerified,
          businessData,
        };
      }

      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Verification failed");
      }

      setVerificationStatus("success");

      // Set account details for success modal
      setAccountName(result.wallet?.accountName || fullName);
      setAccountNumber(result.wallet?.accountNumber || generateAccountNumber());
      setBankName(result.wallet?.bankName || "Wema Bank");

      setShowSuccessModal(true);
      setCurrentStep(steps.length - 1);

      confetti({
        particleCount: 180,
        spread: 100,
        origin: { y: 0.6 },
        colors: ["#00B64F", "#FDC020", "#191919", "#FFFFFF"],
      });

      setTimeout(() => {
        setShowSuccessModal(false);
        onComplete();
      }, 3000);
    } catch (error: any) {
      setVerificationStatus("error");
      setErrorMessage(error.message || "Something went wrong");
      await Swal.fire({
        icon: "error",
        title: "Verification Failed",
        text: error.message || "Something went wrong. Please try again.",
        confirmButtonColor: "#FDC020",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAccountNumber = () => {
    return Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join("");
  };

  const handleCopyAccountNumber = async () => {
    try {
      await navigator.clipboard.writeText(accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      Swal.fire({
        icon: "error",
        title: "Copy failed",
        text: "Please copy the account number manually.",
      });
    }
  };

  const canProceed = () => {
    if (currentStep === 0) {
      return verificationStatus === "success";
    }
    if (currentStep === 1) {
      return pinSet;
    }
    if (currentStep === 2 && isBusiness) {
      if (isRegistered === null) return false;
      if (isRegistered) {
        return cacVerified && businessName.trim().length > 1;
      }
      return businessName.trim().length > 1 && businessAddress.trim().length > 4;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 0 && verificationStatus === "success") {
      setDirection(1);
      setCurrentStep(1);
    } else if (currentStep === 1 && pinSet) {
      if (isBusiness) {
        setDirection(1);
        setCurrentStep(2);
      } else {
        handleCompleteVerification();
      }
    } else if (currentStep === 2 && isBusiness) {
      if (isRegistered) {
        if (!cacVerified) {
          handleCacVerification();
        } else {
          handleCompleteVerification();
        }
      } else {
        handleCompleteVerification();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(currentStep - 1);
    }
  };

  // Render identity verification step
  const renderIdentityStep = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3">
        <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
            Your data is secure
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            Your BVN/NIN is encrypted and used only for identity verification.
          </p>
        </div>
      </div>

      {/* Verification Type */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Select Verification Type
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setIdentityType("bvn")}
            className={`h-14 rounded-xl border-2 font-medium text-sm transition-all ${
              identityType === "bvn"
                ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 text-gray-900 dark:text-gray-100"
                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <CreditCard className="h-4 w-4" />
              BVN
            </div>
          </button>
          <button
            type="button"
            onClick={() => setIdentityType("nin")}
            className={`h-14 rounded-xl border-2 font-medium text-sm transition-all ${
              identityType === "nin"
                ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 text-gray-900 dark:text-gray-100"
                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <FileText className="h-4 w-4" />
              NIN
            </div>
          </button>
        </div>
      </div>

      {/* Verification Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {identityType.toUpperCase()} Number
        </label>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              inputMode="numeric"
              maxLength={11}
              value={identityNumber}
              onChange={(e) => {
                setIdentityNumber(e.target.value.replace(/\D/g, ""));
                setErrorMessage("");
              }}
              placeholder="Enter 11-digit number"
              className="w-full h-14 px-4 pr-12 rounded-xl text-base bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 outline-none transition-all tracking-widest"
              disabled={
                verificationStatus === "verifying" ||
                verificationStatus === "success"
              }
            />
            {verificationStatus === "success" && (
              <Check className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500 h-5 w-5" />
            )}
            {verificationStatus === "error" && (
              <X className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500 h-5 w-5" />
            )}
          </div>
          <button
            type="button"
            onClick={handleIdentityVerification}
            disabled={
              loading ||
              !identityNumber ||
              identityNumber.length !== 11 ||
              verificationStatus === "success"
            }
            className="h-14 px-6 rounded-xl bg-yellow-400 text-gray-900 font-semibold hover:bg-yellow-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : verificationStatus === "success" ? (
              <Check className="h-5 w-5" />
            ) : (
              "Verify"
            )}
          </button>
        </div>
        {errorMessage && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errorMessage}
          </p>
        )}
      </div>

      {/* Verification Result */}
      {verificationStatus === "success" && identityData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="font-medium text-green-700 dark:text-green-300">
              Identity Verified
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {identityData.firstName && (
              <div>
                <span className="text-green-600 dark:text-green-400 font-medium">
                  First Name
                </span>
                <p className="text-green-800 dark:text-green-200">
                  {identityData.firstName}
                </p>
              </div>
            )}
            {identityData.lastName && (
              <div>
                <span className="text-green-600 dark:text-green-400 font-medium">
                  Last Name
                </span>
                <p className="text-green-800 dark:text-green-200">
                  {identityData.lastName}
                </p>
              </div>
            )}
            {identityData.dateOfBirth && (
              <div>
                <span className="text-green-600 dark:text-green-400 font-medium">
                  Date of Birth
                </span>
                <p className="text-green-800 dark:text-green-200">
                  {identityData.dateOfBirth}
                </p>
              </div>
            )}
            {identityData.phone && (
              <div>
                <span className="text-green-600 dark:text-green-400 font-medium">
                  Phone
                </span>
                <p className="text-green-800 dark:text-green-200">
                  {identityData.phone}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );

  // Render PIN setup step
  const renderPinStep = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-start gap-3">
        <Shield className="h-5 w-5 text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
            Secure Transaction PIN
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Create a 4-digit PIN for secure transactions and account access.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Transaction PIN
        </label>
        <div className="relative">
          <input
            type={showPin ? "text" : "password"}
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/\D/g, ""));
              setErrorMessage("");
            }}
            placeholder="4-digit PIN"
            className="w-full h-14 px-4 pr-12 rounded-xl text-base bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 outline-none transition-all tracking-widest"
            disabled={pinSet}
          />
          <button
            type="button"
            onClick={() => setShowPin(!showPin)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            {showPin ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Confirm PIN
        </label>
        <div className="relative">
          <input
            type={showConfirmPin ? "text" : "password"}
            inputMode="numeric"
            maxLength={4}
            value={confirmPin}
            onChange={(e) => {
              setConfirmPin(e.target.value.replace(/\D/g, ""));
              setErrorMessage("");
            }}
            placeholder="Confirm 4-digit PIN"
            className="w-full h-14 px-4 pr-12 rounded-xl text-base bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 outline-none transition-all tracking-widest"
            disabled={pinSet}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPin(!showConfirmPin)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            {showConfirmPin ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {errorMessage && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          {errorMessage}
        </p>
      )}

      {pinSet && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 flex items-center gap-2"
        >
          <CheckCircle className="h-5 w-5 text-green-500" />
          <span className="text-sm text-green-700 dark:text-green-300 font-medium">
            PIN set successfully!
          </span>
        </motion.div>
      )}
    </div>
  );

  // Render business verification step
  const renderBusinessStep = () => (
    <div className="space-y-6">
      {/* Registration Status */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Is your business registered with CAC?
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setIsRegistered(true)}
            className={`h-14 rounded-xl border-2 font-medium text-sm transition-all ${
              isRegistered === true
                ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 text-gray-900 dark:text-gray-100"
                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Award className="h-4 w-4" />
              Yes
            </div>
          </button>
          <button
            type="button"
            onClick={() => setIsRegistered(false)}
            className={`h-14 rounded-xl border-2 font-medium text-sm transition-all ${
              isRegistered === false
                ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 text-gray-900 dark:text-gray-100"
                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Store className="h-4 w-4" />
              No
            </div>
          </button>
        </div>
        {isRegistered === false && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
              We'll verify your business manually. This may take 1-2 business
              days.
            </p>
          </div>
        )}
      </div>

      {/* Business Name */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {isRegistered === true ? "Registered Business Name" : "Business Name"}
        </label>
        <input
          type="text"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder={
            isRegistered === true
              ? "Zidwell Technologies Ltd"
              : "e.g. Johanne's Kitchen"
          }
          className="w-full h-14 px-4 rounded-xl text-base bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 outline-none transition-all"
        />
      </div>

      {/* CAC Number */}
      {isRegistered === true && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            CAC Registration Number
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={cacNumber}
              onChange={(e) => setCacNumber(e.target.value)}
              placeholder="RC1234567"
              className="flex-1 h-14 px-4 rounded-xl text-base bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 outline-none transition-all"
              disabled={cacVerified}
            />
            <button
              type="button"
              onClick={handleCacVerification}
              disabled={
                loading ||
                !cacNumber ||
                cacNumber.length < 4 ||
                cacVerified
              }
              className="h-14 px-6 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : cacVerified ? (
                <Check className="h-5 w-5" />
              ) : (
                "Verify"
              )}
            </button>
          </div>
          {cacVerified && businessData && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 space-y-2"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="font-medium text-green-700 dark:text-green-300 text-sm">
                  CAC Verified
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {businessData.businessName && (
                  <div>
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      Name
                    </span>
                    <p className="text-green-800 dark:text-green-200">
                      {businessData.businessName}
                    </p>
                  </div>
                )}
                {businessData.businessAddress && (
                  <div>
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      Address
                    </span>
                    <p className="text-green-800 dark:text-green-200">
                      {businessData.businessAddress}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Business Address */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Business Address
        </label>
        <input
          type="text"
          value={businessAddress}
          onChange={(e) => setBusinessAddress(e.target.value)}
          placeholder="12 Admiralty Way, Lekki, Lagos"
          className="w-full h-14 px-4 rounded-xl text-base bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 outline-none transition-all"
        />
      </div>

      {/* Business Category */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Business Category
        </label>
        <select
          value={businessCategory}
          onChange={(e) => setBusinessCategory(e.target.value)}
          className="w-full h-14 px-4 rounded-xl text-base bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 outline-none transition-all"
        >
          <option value="">Select category</option>
          <option value="technology">Technology</option>
          <option value="retail">Retail</option>
          <option value="services">Services</option>
          <option value="manufacturing">Manufacturing</option>
          <option value="agriculture">Agriculture</option>
          <option value="education">Education</option>
          <option value="healthcare">Healthcare</option>
          <option value="finance">Finance</option>
          <option value="real_estate">Real Estate</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Business Email */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Business Email <span className="text-gray-400">(optional)</span>
        </label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="email"
            value={businessEmail}
            onChange={(e) => setBusinessEmail(e.target.value)}
            placeholder="business@example.com"
            className="w-full h-14 pl-11 pr-4 rounded-xl text-base bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 outline-none transition-all"
          />
        </div>
      </div>

      {/* Business Phone */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Business Phone <span className="text-gray-400">(optional)</span>
        </label>
        <div className="relative">
          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="tel"
            value={businessPhone}
            onChange={(e) => setBusinessPhone(e.target.value)}
            placeholder="080 1234 5678"
            className="w-full h-14 pl-11 pr-4 rounded-xl text-base bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 outline-none transition-all"
          />
        </div>
      </div>

      {/* Business Website */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Business Website <span className="text-gray-400">(optional)</span>
        </label>
        <div className="relative">
          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="url"
            value={businessWebsite}
            onChange={(e) => setBusinessWebsite(e.target.value)}
            placeholder="https://example.com"
            className="w-full h-14 pl-11 pr-4 rounded-xl text-base bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 outline-none transition-all"
          />
        </div>
      </div>

      {/* Business Description */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Business Description <span className="text-gray-400">(optional)</span>
        </label>
        <textarea
          value={businessDescription}
          onChange={(e) => setBusinessDescription(e.target.value)}
          placeholder="Tell us what your business does..."
          className="min-h-24 w-full px-4 py-3 rounded-xl text-base bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 outline-none transition-all resize-vertical"
        />
      </div>

      {/* Map URL */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Google Maps URL <span className="text-gray-400">(optional)</span>
        </label>
        <div className="relative">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="url"
            value={mapUrl}
            onChange={(e) => setMapUrl(e.target.value)}
            placeholder="https://maps.google.com/..."
            className="w-full h-14 pl-11 pr-4 rounded-xl text-base bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 outline-none transition-all"
          />
        </div>
      </div>

      {errorMessage && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          {errorMessage}
        </p>
      )}
    </div>
  );

  // Render success modal
  const renderSuccessModal = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-8 space-y-6"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", damping: 15 }}
        className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
      >
        <CheckCircle className="h-10 w-10 text-green-500" />
      </motion.div>

      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Account Activated! 🎉
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Your account has been fully verified and activated.
        </p>
      </div>

      <div className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Bank Name
          </p>
          <p className="font-semibold text-gray-900 dark:text-gray-100">
            {bankName}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Account Name
          </p>
          <p className="font-semibold text-gray-900 dark:text-gray-100">
            {accountName}
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Account Number
          </p>
          <div className="flex items-center gap-3">
            <p className="font-display text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-widest">
              {accountNumber}
            </p>
            <button
              onClick={handleCopyAccountNumber}
              className="h-10 px-4 rounded-xl text-sm font-semibold flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 transition-colors"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 flex gap-3">
        <Sparkles className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-yellow-700 dark:text-yellow-300 leading-relaxed">
          <strong>Fund Your Account with ₦2,000 or More to Activate It.</strong>{" "}
          Account activation happens instantly once the account is funded.
        </p>
      </div>

      <button
        onClick={() => {
          setShowSuccessModal(false);
          onComplete();
        }}
        className="w-full h-14 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold text-base transition-all"
      >
        Go to Dashboard
      </button>
    </motion.div>
  );

  // Render loading state
  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center py-12 space-y-6">
      <div className="relative">
        <div className="h-20 w-20 rounded-full border-4 border-yellow-200 border-t-yellow-400 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-yellow-400 animate-spin" />
        </div>
      </div>
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Activating Your Account
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Please wait while we complete your verification...
        </p>
      </div>
      <div className="w-full max-w-xs bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <motion.div
          className="h-full bg-yellow-400 rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 3, ease: "easeInOut" }}
        />
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25 }}
        className="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-800"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {currentStep === 0 && "Verify Your Identity"}
                {currentStep === 1 && "Set Transaction PIN"}
                {currentStep === 2 && isBusiness && "Verify Your Business"}
                {currentStep >= steps.length - 1 && "Account Activation"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Step {Math.min(currentStep + 1, steps.length)} of {steps.length}
              </p>
            </div>
            <button
              onClick={onSkip}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Skip for now
            </button>
          </div>

          {/* Progress Steps */}
          <div className="mt-4 flex items-center gap-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex-1">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex-1 h-1.5 rounded-full transition-all ${
                      index <= currentStep
                        ? "bg-yellow-400"
                        : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  />
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <div
                    className={`flex items-center gap-1.5 text-xs ${
                      index === currentStep
                        ? "text-gray-900 dark:text-gray-100 font-medium"
                        : index < currentStep
                        ? "text-green-600 dark:text-green-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {index < currentStep ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <div
                        className={`h-2 w-2 rounded-full ${
                          index === currentStep
                            ? "bg-yellow-400"
                            : "bg-gray-300 dark:bg-gray-600"
                        }`}
                      />
                    )}
                    <span className="hidden sm:inline">{step.title}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              initial={{ opacity: 0, x: direction * 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -direction * 20 }}
              transition={{ duration: 0.3 }}
            >
              {currentStep === 0 && renderIdentityStep()}
              {currentStep === 1 && renderPinStep()}
              {currentStep === 2 && isBusiness && renderBusinessStep()}
              {currentStep >= steps.length - 1 &&
                (verificationStatus === "verifying" ? renderLoading() : renderSuccessModal())}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        {currentStep < steps.length - 1 && verificationStatus !== "verifying" && (
          <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-6">
            <div className="flex gap-3">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 h-14 rounded-xl border-2 border-gray-200 dark:border-gray-700 font-semibold text-base hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                >
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed() || loading}
                className="flex-1 h-14 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : currentStep === 0 ? (
                  <>
                    Verify & Continue
                    <ArrowRight className="h-4 w-4" />
                  </>
                ) : currentStep === 1 ? (
                  <>
                    Set PIN & Continue
                    <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Complete
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default OnboardingModal;