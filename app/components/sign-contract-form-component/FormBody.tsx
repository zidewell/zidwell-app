// app/components/sign-contract-form-component/FormBody.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import RichTextArea from "./RichTextArea";
import SignContractFileUpload from "./SignContractFileUpload";
import SignContractInput from "./SignContractInput";
import SignContractToggle from "./SignContractToggle";
import PreviewTab from "./PreviewTab";
import { ContractSuccessModal } from "./ContractSuccessModal";
import confetti from "canvas-confetti";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Edit,
  Eye,
  FileText,
  Save,
  Send,
  Loader2,
  History,
  ArrowLeft,
  Trash2,
  Crown,
  AlertCircle,
  Zap,
  Sparkles,
  Star,
} from "lucide-react";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { useUserContextData } from "@/app/context/userData";
import { useSubscription } from "@/app/hooks/useSubscripion";
import Swal from "sweetalert2";
import ContractSummary from "./ContractSummary";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { SignaturePad } from "../SignaturePad";
import Link from "next/link";
import { Switch } from "../ui/switch";

// Types
type ContractDraft = {
  id: string;
  contract_id?: string;
  contract_title: string;
  contract_content?: string;
  contract_text?: string;
  contract_type: string;
  receiver_name?: string;
  receiver_email?: string;
  receiver_phone?: string;
  signee_name?: string;
  signee_email?: string;
  phone_number?: string;
  age_consent: boolean;
  terms_consent: boolean;
  status: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  token?: string;
  verification_code?: string | null;
  attachment_url?: string;
  attachment_name?: string;
  include_lawyer_signature?: boolean;
  creator_name?: string;
  creator_signature?: string;
  contract_date?: string;
  metadata?: Record<string, any>;
};

type FormState = {
  receiverName: string;
  receiverEmail: string;
  receiverPhone: string;
  contractTitle: string;
  contractContent: string;
  paymentTerms: string;
  ageConsent: boolean;
  termsConsent: boolean;
  status: "pending" | "draft";
  contractId: string;
  contractType: "custom";
  contractDate: string;
};

type AttachmentFile = {
  file: File;
  name: string;
  size: number;
  type: string;
  previewUrl?: string;
};

interface SaveContractResponse {
  success: boolean;
  signingLink?: string;
  contractId?: string;
  isUpdate?: boolean;
  error?: string;
  message?: string;
}

const CONTRACT_FEE = 1000;
const LAWYER_FEE = 10000;

const FormBody: React.FC = () => {
  const router = useRouter();
  const { userData } = useUserContextData();
  const { userTier, isPremium, isGrowth, isElite, isZidLite, hasRequiredTier } =
    useSubscription();

  const inputCount = 4;
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedSigningLink, setGeneratedSigningLink] = useState<string>("");
  const [savedContractId, setSavedContractId] = useState<string>("");
  const [showContractSummary, setShowContractSummary] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [includeLawyerSignature, setIncludeLawyerSignature] = useState(false);
  const [saveSignatureForFuture, setSaveSignatureForFuture] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  // Determine user tier
  const isFree = userTier === "free";
  const isZidLiteUser = userTier === "zidlite";
  const isGrowthUser = userTier === "growth";
  const isPremiumUser = userTier === "premium" || userTier === "elite";
  const hasUnlimitedContracts = isPremiumUser || isGrowthUser;

  // Contract limits based on tier
  const contractLimit = isFree
    ? 1
    : isZidLiteUser
      ? 2
      : isGrowthUser
        ? 5
        : Infinity;

  // Get tier icon and color
  const getTierInfo = () => {
    if (isElite)
      return {
        icon: Sparkles,
        color: "text-purple-600",
        bg: "bg-purple-100",
        label: "Elite",
      };
    if (isPremium)
      return {
        icon: Crown,
        color: "text-[var(--color-accent-yellow)]",
        bg: "bg-[var(--color-accent-yellow)]/10",
        label: "Premium",
      };
    if (isGrowth)
      return {
        icon: Zap,
        color: "text-[var(--color-accent-yellow)]",
        bg: "bg-[var(--color-accent-yellow)]/10",
        label: "Growth",
      };
    if (isZidLite)
      return {
        icon: Zap,
        color: "text-blue-600",
        bg: "bg-blue-100",
        label: "ZidLite",
      };
    return {
      icon: Star,
      color: "text-[var(--text-secondary)]",
      bg: "bg-[var(--bg-secondary)]",
      label: "Free Trial",
    };
  };

  const tierInfo = getTierInfo();
  const TierIcon = tierInfo.icon;

  const [creatorName, setCreatorName] = useState(
    userData?.fullName ? `${userData.fullName}` : "",
  );
  const [creatorSignature, setCreatorSignature] = useState<string | null>(null);
  const [localCreatorName, setLocalCreatorName] = useState(creatorName);

  // Local signature state
  const [localSignature, setLocalSignature] = useState<string | null>(null);

  // Contract count for tier limits
  const [contractCount, setContractCount] = useState(0);

  const [form, setForm] = useState<FormState>({
    receiverName: "",
    receiverEmail: "",
    receiverPhone: "",
    contractTitle: "",
    contractContent: "",
    paymentTerms: "",
    ageConsent: false,
    termsConsent: false,
    status: "pending",
    contractId: "",
    contractType: "custom",
    contractDate: new Date().toISOString().split("T")[0],
  });

  const [drafts, setDrafts] = useState<ContractDraft[]>([]);
  const [activeTab, setActiveTab] = useState("create");

  const [errors, setErrors] = useState({
    contractTitle: "",
    receiverName: "",
    receiverEmail: "",
    contractContent: "",
    contractDate: "",
    ageConsent: "",
    termsConsent: "",
  });

  // Update local signature when creatorSignature changes
  useEffect(() => {
    setLocalSignature(creatorSignature);
  }, [creatorSignature]);

  // Fetch contract count for tier limits
  useEffect(() => {
    const fetchContractCount = async () => {
      if (!userData?.email) return;

      try {
        const res = await fetch("/api/contract/get-contract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userEmail: userData.email }),
        });

        if (res.ok) {
          const data = await res.json();
          setContractCount(data.contracts?.length || 0);
        }
      } catch (error) {
        console.error("Error fetching contracts:", error);
      }
    };

    fetchContractCount();
  }, [userData?.email]);

  const triggerContractConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["var(--color-accent-yellow)", "#ffd700", "#ffed4e", "#ffffff", "#fbbf24"],
    });

    setTimeout(() => {
      confetti({
        particleCount: 80,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["var(--color-accent-yellow)", "#ffd700", "#ffed4e"],
      });
      confetti({
        particleCount: 80,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["var(--color-accent-yellow)", "#ffd700", "#ffed4e"],
      });
    }, 150);
  };

  const generateContractId = useCallback(() => {
    return crypto.randomUUID();
  }, []);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      contractId: generateContractId(),
    }));
    setIsInitialLoad(false);
  }, [generateContractId]);

  useEffect(() => {
    if (
      !isInitialLoad &&
      (form.contractTitle ||
        form.contractContent ||
        form.paymentTerms ||
        form.receiverName ||
        form.receiverEmail ||
        form.receiverPhone ||
        form.ageConsent ||
        form.termsConsent ||
        form.contractDate ||
        attachments.length > 0 ||
        localSignature)
    ) {
      setHasUnsavedChanges(true);
    }
  }, [isInitialLoad, form, attachments.length, localSignature]);

  useEffect(() => {
    if (userData?.id) {
      loadUserDrafts();
    }
  }, [userData?.id]);

  const loadUserDrafts = async () => {
    try {
      if (!userData?.id) return;

      setIsLoadingDrafts(true);
      const res = await fetch(
        `/api/contract/contract-drafts?userId=${userData.id}`,
      );

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const result = await res.json();

      if (result.success && result.drafts && result.drafts.length > 0) {
        setDrafts(result.drafts);

        if (
          !form.contractTitle &&
          !form.contractContent &&
          !form.paymentTerms &&
          !form.receiverName &&
          !form.receiverEmail &&
          attachments.length === 0
        ) {
          setTimeout(() => {
            Swal.fire({
              title: "Drafts Found!",
              html: `You have <strong>${
                result.drafts.length
              }</strong> saved draft${
                result.drafts.length !== 1 ? "s" : ""
              }.<br><br>Would you like to load the most recent one?`,
              icon: "info",
              showCancelButton: true,
              showDenyButton: true,
              confirmButtonText: "Load Recent",
              denyButtonText: "View All Drafts",
              cancelButtonText: "Start Fresh",
              confirmButtonColor: "var(--color-accent-yellow)",
              cancelButtonColor: "#6b7280",
              denyButtonColor: "#3b82f6",
              width: 500,
            }).then((swalResult) => {
              if (swalResult.isConfirmed) {
                const recentDraft = result.drafts[0];
                loadDraftIntoForm(recentDraft);
              } else if (swalResult.isDenied) {
                showDraftsList(result.drafts);
              }
            });
          }, 1000);
        }
      }
    } catch (error) {
      console.error("Failed to load drafts:", error);
    } finally {
      setIsLoadingDrafts(false);
    }
  };

  const loadSignatureManually = async () => {
    try {
      if (!userData?.id) {
        Swal.fire({
          icon: "warning",
          title: "Not Logged In",
          text: "You need to be logged in to load saved signatures.",
        });
        return;
      }

      const res = await fetch(`/api/saved-signature?userId=${userData.id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (res.ok && data.success && data.signature) {
        setCreatorSignature(data.signature);
        setLocalSignature(data.signature);
        setSaveSignatureForFuture(true);

        Swal.fire({
          icon: "success",
          title: "Signature Loaded",
          text: "Your saved signature has been loaded.",
          confirmButtonColor: "var(--color-accent-yellow)",
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "info",
          title: "No Saved Signature",
          text: "No saved signature found. Please create a new one.",
          confirmButtonColor: "var(--color-accent-yellow)",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Load Failed",
        text: "Failed to load saved signature. Please try again.",
        confirmButtonColor: "var(--color-accent-yellow)",
      });
    }
  };

  const saveSignatureToDatabase = async (signatureDataUrl: string) => {
    try {
      if (!userData?.id) return false;

      const res = await fetch("/api/saved-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userData.id,
          signature: signatureDataUrl,
        }),
      });

      const data = await res.json();
      return res.ok && data.success;
    } catch (error) {
      return false;
    }
  };

  const handleSaveSignatureToggle = async (save: boolean) => {
    setSaveSignatureForFuture(save);

    if (save && creatorSignature && userData?.id) {
      const saved = await saveSignatureToDatabase(creatorSignature);
      if (saved) {
        Swal.fire({
          icon: "success",
          title: "Signature Saved",
          text: "Your signature has been saved for future use.",
          confirmButtonColor: "var(--color-accent-yellow)",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    }

    if (!save && userData?.id) {
      await deleteSavedSignature();
    }
  };

  const handleSignatureChange = async (signature: string | null) => {
    setLocalSignature(signature);
    setCreatorSignature(signature);

    if (!signature && saveSignatureForFuture && userData?.id) {
      await deleteSavedSignature();
    }

    if (signature && saveSignatureForFuture && userData?.id) {
      await saveSignatureToDatabase(signature);
    }
  };

  const deleteSavedSignature = async () => {
    try {
      if (!userData?.id) return false;

      const res = await fetch("/api/contract/saved-signature", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userData.id }),
      });

      const data = await res.json();
      return res.ok && data.success;
    } catch (error) {
      return false;
    }
  };

  const clearSignature = () => {
    setLocalSignature(null);
    setCreatorSignature(null);
  };

const loadDraftIntoForm = (draft: ContractDraft) => {
  const draftContractId =
    draft.metadata?.contract_id ||
    draft.contract_id ||
    draft.id ||
    generateContractId();

  const paymentTerms = draft.metadata?.payment_terms || "";
  
  // Get the contract content
  let contractContent = draft.contract_content || draft.contract_text || "";
  
  // Log the raw content for debugging
  console.log('Raw draft content:', {
    contract_content: draft.contract_content,
    contract_text: draft.contract_text,
    type: typeof contractContent,
    length: contractContent.length
  });
  
  // Check if the content is wrapped in quotes (JSON string)
  if (typeof contractContent === 'string') {
    // Remove any extra quotes that might be wrapping the content
    if (contractContent.startsWith('"') && contractContent.endsWith('"')) {
      try {
        contractContent = JSON.parse(contractContent);
      } catch (e) {
        // If parsing fails, just remove the quotes
        contractContent = contractContent.slice(1, -1);
      }
    }
    
    // If it's a JSON string that contains HTML, ensure it's properly decoded
    try {
      const parsed = JSON.parse(contractContent);
      if (typeof parsed === 'string') {
        contractContent = parsed;
      }
    } catch {
      // Not JSON, keep as is
    }
    
    // Decode HTML entities if present
    const textarea = document.createElement('textarea');
    textarea.innerHTML = contractContent;
    if (textarea.innerHTML !== contractContent) {
      contractContent = textarea.value;
    }
  }

  setForm({
    receiverName: draft.receiver_name || draft.signee_name || "",
    receiverEmail: draft.receiver_email || draft.signee_email || "",
    receiverPhone:
      draft.receiver_phone || draft.phone_number?.toString() || "",
    contractTitle: draft.contract_title || "",
    contractContent: contractContent, // Use the processed content
    paymentTerms: paymentTerms,
    ageConsent: draft.age_consent || false,
    termsConsent: draft.terms_consent || false,
    status: (draft.status as "pending" | "draft") || "draft",
    contractId: draftContractId,
    contractType: "custom",
    contractDate:
      draft.contract_date || new Date().toISOString().split("T")[0],
  });

  setHasUnsavedChanges(false);

  if (draft.creator_name) {
    setCreatorName(draft.creator_name);
    setLocalCreatorName(draft.creator_name);
  }
  if (draft.creator_signature) {
    setCreatorSignature(draft.creator_signature);
    setLocalSignature(draft.creator_signature);
  }
  if (draft.include_lawyer_signature) {
    setIncludeLawyerSignature(draft.include_lawyer_signature);
  }


  setTimeout(() => {
    Swal.fire({
      icon: "success",
      title: "Draft Loaded!",
      text: "Your draft has been loaded into the form successfully.",
      confirmButtonColor: "var(--color-accent-yellow)",
      timer: 2000,
      showConfirmButton: false,
    });
  }, 300);
};
  const showDraftsList = (draftsList: ContractDraft[]) => {
    const draftListHTML = draftsList
      .map(
        (draft, index) => `
        <div style="padding: 12px; border-bottom: 1px solid var(--border-color); cursor: pointer;" 
             data-draft-index="${index}" class="hover:bg-[var(--bg-secondary)]">
          <strong>${draft.contract_title || "Untitled Contract"}</strong><br>
          <small>To: ${draft.receiver_name || draft.signee_name || "No recipient"}</small><br>
          <small>Created: ${new Date(draft.created_at).toLocaleDateString()}</small>
        </div>
      `,
      )
      .join("");

    Swal.fire({
      title: "Select a Draft to Load",
      html: `<div style="max-height: 300px; overflow-y: auto;">${draftListHTML}</div>`,
      showConfirmButton: true,
      confirmButtonText: "Close",
      confirmButtonColor: "var(--color-accent-yellow)",
      width: 500,
      didOpen: () => {
        document.querySelectorAll("[data-draft-index]").forEach((element) => {
          element.addEventListener("click", () => {
            const index = parseInt(
              element.getAttribute("data-draft-index") || "0",
            );
            loadDraftIntoForm(draftsList[index]);
            Swal.close();
          });
        });
      },
    });
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleSaveDraft = async () => {
    try {
      setIsSavingDraft(true);

      if (!userData?.id) {
        Swal.fire({
          icon: "warning",
          title: "Unauthorized",
          text: "You must be logged in to save a draft.",
        });
        return;
      }

      if (
        !form.contractTitle.trim() &&
        !form.contractContent.trim() &&
        !form.paymentTerms.trim() &&
        attachments.length === 0 &&
        !localSignature
      ) {
        Swal.fire({
          icon: "warning",
          title: "No Content",
          text: "Please add some content before saving as draft.",
        });
        return;
      }

      const draftContractId = form.contractId || generateContractId();

      const payload = {
        userId: userData.id,
        initiator_email: userData.email || "",
        initiator_name: userData.fullName
          ? `${userData.fullName}`
          : userData.email || "",
        contract_id: draftContractId,
        contractTitle: form.contractTitle || "Untitled Contract",
        contractContent: form.contractContent,
        paymentTerms: form.paymentTerms,
        receiverName: form.receiverName,
        receiverEmail: form.receiverEmail,
        receiverPhone: form.receiverPhone,
        ageConsent: form.ageConsent,
        termsConsent: form.termsConsent,
        contract_date: form.contractDate,
        contract_type: "custom",
        status: "draft",
        is_draft: true,
        creator_name: creatorName,
        creator_signature: localSignature || creatorSignature,
        include_lawyer_signature: includeLawyerSignature,
        metadata: {
          payment_terms: form.paymentTerms,
          contract_date: form.contractDate,
        },
      };

      const res = await fetch("/api/contract/contract-drafts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(
          result.error || result.message || "Failed to save draft",
        );
      }

      Swal.fire({
        icon: "success",
        title: "Draft Saved!",
        text: "Your contract draft has been saved successfully.",
        confirmButtonColor: "var(--color-accent-yellow)",
      });

      setHasUnsavedChanges(false);
      setForm((prev) => ({ ...prev, contractId: draftContractId }));

      await loadUserDrafts();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Failed to Save Draft",
        text: (err as Error)?.message || "An unexpected error occurred.",
      });
    } finally {
      setIsSavingDraft(false);
    }
  };

  const validateFormFields = (): {
    isValid: boolean;
    errorMessages: string[];
  } => {
    const newErrors = {
      contractTitle: "",
      receiverName: "",
      receiverEmail: "",
      contractContent: "",
      contractDate: "",
      ageConsent: "",
      termsConsent: "",
    };

    let hasErrors = false;
    const errorMessages: string[] = [];

    if (!form.contractTitle.trim()) {
      newErrors.contractTitle = "Contract title is required.";
      hasErrors = true;
      errorMessages.push("• Contract title is required");
    }

    if (!form.receiverName.trim()) {
      newErrors.receiverName = "Signer full name is required.";
      hasErrors = true;
      errorMessages.push("• Signer full name is required");
    }

    if (!form.receiverEmail.trim()) {
      newErrors.receiverEmail = "Signee email is required.";
      hasErrors = true;
      errorMessages.push("• Signee email is required");
    } else if (form.receiverEmail.trim() === userData?.email) {
      newErrors.receiverEmail = "Signee email cannot be the same as yours.";
      hasErrors = true;
      errorMessages.push("• Signee email cannot be the same as your email");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.receiverEmail)) {
      newErrors.receiverEmail = "Invalid email format.";
      hasErrors = true;
      errorMessages.push("• Invalid email format");
    }

    if (!form.contractContent.trim()) {
      newErrors.contractContent = "Contract content cannot be empty.";
      hasErrors = true;
      errorMessages.push("• Contract content cannot be empty");
    }

    if (!form.ageConsent) {
      newErrors.ageConsent = "You must confirm you are 18 years or older.";
      hasErrors = true;
      errorMessages.push("• You must confirm you are 18 years or older");
    }

    if (!form.termsConsent) {
      newErrors.termsConsent = "You must agree to the contract terms.";
      hasErrors = true;
      errorMessages.push("• You must agree to the contract terms");
    }

    if (!form.contractDate) {
      newErrors.contractDate = "Contract date is required.";
      hasErrors = true;
      errorMessages.push("• Contract date is required");
    }

    setErrors(newErrors);
    return { isValid: !hasErrors, errorMessages };
  };

  const validateSignature = (): boolean => {
    if (!localSignature) {
      Swal.fire({
        icon: "warning",
        title: "Signature Required",
        text: "Please add your signature before submitting.",
        confirmButtonColor: "var(--color-accent-yellow)",
      });
      return false;
    }

    if (!creatorName.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Name Required",
        text: "Please enter your full legal name.",
        confirmButtonColor: "var(--color-accent-yellow)",
      });
      return false;
    }

    return true;
  };

  const validateInputs = (): boolean => {
    const { isValid: formValid, errorMessages } = validateFormFields();

    if (!formValid) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        html: `
          <div class="text-left">
            <p class="font-semibold mb-2">Please fix the following errors:</p>
            <ul class="list-disc pl-4 space-y-1">
              ${errorMessages.map((msg) => `<li>${msg}</li>`).join("")}
            </ul>
          </div>
        `,
        confirmButtonColor: "var(--color-accent-yellow)",
        width: 500,
      });
      return false;
    }

    return validateSignature();
  };

  const uploadAttachmentFiles = async (): Promise<
    Array<{
      url: string;
      path: string;
      name: string;
      type: string;
      size: number;
    }>
  > => {
    if (attachments.length === 0 || !userData?.id) return [];

    const uploadedFiles = [];
    setUploadingFile(true);

    try {
      for (const attachment of attachments) {
        const formData = new FormData();
        formData.append("file", attachment.file);
        formData.append("userId", userData.id);
        formData.append("contractId", form.contractId);

        const res = await fetch(
          "/api/contract/send-contracts/upload-contract-file",
          {
            method: "POST",
            body: formData,
          },
        );

        const result = await res.json();

        if (!res.ok) {
          throw new Error(
            result.error || `Failed to upload: ${attachment.name}`,
          );
        }

        uploadedFiles.push({
          url: result.fileUrl,
          path: result.filePath,
          name: attachment.name,
          type: attachment.type,
          size: attachment.size,
        });
      }

      return uploadedFiles;
    } catch (err) {
      Swal.fire("Upload Failed", (err as Error).message, "error");
      return [];
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSaveContract = async (
    isDraft: boolean = false,
  ): Promise<SaveContractResponse> => {
    try {
      if (!userData?.id) {
        Swal.fire("Unauthorized", "You must be logged in", "warning");
        return { success: false };
      }

      const attachmentsData = isDraft ? [] : await uploadAttachmentFiles();

      const contractIdToUse = form.contractId || generateContractId();

      const payload = {
        userId: userData.id,
        initiator_email: userData.email || "",
        initiator_name: userData.fullName
          ? `${userData.fullName}`
          : userData.email || "",
        contract_id: contractIdToUse,
        contract_title: form.contractTitle,
        contract_content: form.contractContent,
        payment_terms: form.paymentTerms,
        receiver_name: form.receiverName,
        receiver_email: form.receiverEmail,
        receiver_phone: form.receiverPhone,
        age_consent: form.ageConsent,
        terms_consent: form.termsConsent,
        contract_date: form.contractDate,
        contract_type: "custom",
        status: isDraft ? "draft" : "pending",
        is_draft: isDraft,
        include_lawyer_signature: includeLawyerSignature,
        creator_name: creatorName,
        creator_signature: localSignature || creatorSignature,
        metadata: {
          attachments: attachmentsData,
          attachment_count: attachments.length,
          lawyer_signature: includeLawyerSignature,
          payment_terms: form.paymentTerms,
          contract_date: form.contractDate,
          creator_name: creatorName,
          creator_signature: localSignature || creatorSignature,
        },
      };

      const res = await fetch("/api/contract/send-contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result: SaveContractResponse = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to save contract");
      }

      if (!isDraft && result.isUpdate) {
        await loadUserDrafts();
      }

      return {
        success: true,
        signingLink: isDraft ? undefined : result.signingLink,
        contractId: payload.contract_id,
      };
    } catch (err) {
      Swal.fire(
        "Error",
        (err as Error)?.message || "Something went wrong",
        "error",
      );
      return { success: false };
    }
  };

  const processContractAndSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Save the contract
      const result = await handleSaveContract(false);

      if (result.success) {
        setGeneratedSigningLink(result.signingLink || "");
        setSavedContractId(result.contractId || "");

        triggerContractConfetti();

        setIsSubmitting(false);
        setHasUnsavedChanges(false);

        // Reset form
        setForm({
          receiverName: "",
          receiverEmail: "",
          receiverPhone: "",
          contractTitle: "",
          contractContent: "",
          paymentTerms: "",
          ageConsent: false,
          termsConsent: false,
          status: "pending",
          contractId: generateContractId(),
          contractType: "custom",
          contractDate: new Date().toISOString().split("T")[0],
        });
        setAttachments([]);
        setIncludeLawyerSignature(false);
        setCreatorSignature(null);
        setLocalSignature(null);

        setShowSuccessModal(true);
      } else {
        setIsSubmitting(false);
      }
    } catch (error) {
      setIsSubmitting(false);
      Swal.fire({
        icon: "error",
        title: "Processing Failed",
        text: "Failed to process your request. Please try again.",
        confirmButtonColor: "var(--color-accent-yellow)",
      });
    }
  };

  const handleCreatorNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isSubmitting) return;
    const name = e.target.value;
    setLocalCreatorName(name);
    setCreatorName(name);
  };

  const handleSummaryConfirm = () => {
    setShowContractSummary(false);
    processContractAndSubmit();
  };

  const handleSummaryBack = () => {
    setShowContractSummary(false);
    setIsSubmitting(false);
  };

  const handleCopySigningLink = () => {
    if (generatedSigningLink) {
      navigator.clipboard.writeText(generatedSigningLink);
      Swal.fire({
        icon: "success",
        title: "Contract Link Copied!",
        text: "Contract link copied to clipboard",
        confirmButtonColor: "var(--color-accent-yellow)",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  const handleSubmit = async (isDraft: boolean = false) => {
    if (isSubmitting || isSavingDraft) return;

    // Check limit for free and ZidLite tiers
    if (!hasUnlimitedContracts && !isDraft) {
      if (contractCount >= contractLimit) {
        setShowUpgradePrompt(true);
        return;
      }
    }

    if (isDraft) {
      await handleSaveDraft();
      return;
    }

    const inputsValid = validateInputs();

    if (!inputsValid) {
      return;
    }

    setShowContractSummary(true);
  };

  const resetForm = () => {
    if (isSubmitting) {
      Swal.fire({
        icon: "warning",
        title: "Form is Processing",
        text: "Cannot clear form while submission is in progress.",
        confirmButtonColor: "var(--color-accent-yellow)",
      });
      return;
    }

    Swal.fire({
      title: "Clear Form?",
      text: "This will remove all current form data.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "var(--color-accent-yellow)",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Clear",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        setForm({
          receiverName: "",
          receiverEmail: "",
          receiverPhone: "",
          contractTitle: "",
          contractContent: "",
          paymentTerms: "",
          ageConsent: false,
          termsConsent: false,
          status: "pending",
          contractId: generateContractId(),
          contractType: "custom",
          contractDate: new Date().toISOString().split("T")[0],
        });
        setAttachments([]);
        setIncludeLawyerSignature(false);
        setCreatorSignature(null);
        setLocalSignature(null);
        setCreatorName(userData?.fullName ? `${userData.fullName}` : "");
        setLocalCreatorName(userData?.fullName ? `${userData.fullName}` : "");
        setHasUnsavedChanges(false);

        Swal.fire({
          icon: "success",
          title: "Form Reset",
          text: "Form has been cleared successfully.",
          confirmButtonColor: "var(--color-accent-yellow)",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    });
  };

  const handleFormChange = (field: keyof FormState, value: any) => {
    if (isSubmitting) return;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleFileUpload = (file: File) => {
    if (isSubmitting) {
      Swal.fire({
        icon: "warning",
        title: "Form is Processing",
        text: "Cannot upload files while submission is in progress.",
        confirmButtonColor: "var(--color-accent-yellow)",
      });
      return;
    }

    const previewUrl = file.type.startsWith("image/")
      ? URL.createObjectURL(file)
      : undefined;

    setAttachments((prev) => [
      ...prev,
      { file, name: file.name, size: file.size, type: file.type, previewUrl },
    ]);
    setHasUnsavedChanges(true);
  };

  const handleRemoveAttachment = (index: number) => {
    if (isSubmitting) {
      Swal.fire({
        icon: "warning",
        title: "Form is Processing",
        text: "Cannot remove attachments while submission is in progress.",
        confirmButtonColor: "var(--color-accent-yellow)",
      });
      return;
    }

    if (attachments[index].previewUrl) {
      URL.revokeObjectURL(attachments[index].previewUrl!);
    }

    setAttachments((prev) => prev.filter((_, i) => i !== index));
    setHasUnsavedChanges(true);
  };

  const handleLawyerToggle = (checked: boolean) => {
    if (isSubmitting) return;
    setIncludeLawyerSignature(checked);
  };

  useEffect(() => {
    return () => {
      attachments.forEach((attachment) => {
        if (attachment.previewUrl) {
          URL.revokeObjectURL(attachment.previewUrl);
        }
      });
    };
  }, [attachments]);

  const getSendButtonText = () => {
    if (isSubmitting) {
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      );
    }
    return (
      <>
        <Send className="mr-2 h-4 w-4" />
        Send for Signature
      </>
    );
  };

  const getLimitDisplay = () => {
    if (hasUnlimitedContracts) return "Unlimited";
    if (isFree) return `${Math.max(0, 1 - contractCount)}/1`;
    if (isZidLite) return `${Math.max(0, 2 - contractCount)}/2`;
    if (isGrowth) return `${Math.max(0, 5 - contractCount)}/5`;
    return "0/0";
  };

  const getTierMessage = () => {
    if (isPremiumUser || isGrowthUser) {
      return "You have unlimited contracts! Create as many as you need.";
    }
    if (isZidLiteUser) {
      return `You have ${Math.max(0, 2 - contractCount)} contract${Math.max(0, 2 - contractCount) !== 1 ? "s" : ""} remaining.`;
    }
    return `You have ${Math.max(0, 1 - contractCount)} contract${Math.max(0, 1 - contractCount) !== 1 ? "s" : ""} remaining.`;
  };

  return (
    <>
      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-primary)] rounded-xl max-w-md w-full p-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-center mb-2 text-[var(--text-primary)]">
              Contract Limit Reached
            </h3>
            <p className="text-[var(--text-secondary)] text-center mb-6">
              {isZidLiteUser
                ? "You've used all your ZidLite contracts. Upgrade to continue creating unlimited contracts!"
                : "You've used all your free contracts. Upgrade to continue creating unlimited contracts!"}
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowUpgradePrompt(false)}
              >
                Cancel
              </Button>
              <Link href="/pricing?upgrade=growth" className="flex-1">
                <Button className="w-full bg-[var(--color-accent-yellow)] hover:bg-[var(--color-accent-yellow)]/90 text-[var(--color-ink)]">
                  View Plans
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      <ContractSummary
        contractTitle={form.contractTitle}
        contractContent={form.contractContent}
        contractDate={form.contractDate}
        initiatorName={creatorName}
        initiatorEmail={userData?.email || ""}
        receiverName={form.receiverName}
        receiverEmail={form.receiverEmail}
        receiverPhone={form.receiverPhone}
        amount={0}
        confirmContract={showContractSummary}
        onBack={handleSummaryBack}
        onConfirm={handleSummaryConfirm}
        onClose={() => setShowContractSummary(false)}
        contractType="Custom Contract"
        dateCreated={new Date(form.contractDate).toLocaleDateString()}
        attachments={attachments}
        currentLawyerSignature={includeLawyerSignature}
        userTier={userTier}
        contractCount={contractCount}
        hasUnlimitedContracts={hasUnlimitedContracts}
      />

      <ContractSuccessModal
        open={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          window.location.reload();
        }}
        onNewContract={() => {
          setShowSuccessModal(false);
          window.location.reload();
        }}
        contractId={savedContractId}
        contractDate={form.contractDate}
        attachmentsCount={attachments.length}
        includeLawyerSignature={includeLawyerSignature}
        creatorSignature={!!creatorSignature}
        signingLink={generatedSigningLink}
        onCopyLink={handleCopySigningLink}
      />

      <div className="min-h-screen bg-[var(--bg-primary)]">
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (isSubmitting) {
                    Swal.fire({
                      icon: "warning",
                      title: "Form is Processing",
                      text: "Cannot navigate away while submission is in progress.",
                      confirmButtonColor: "var(--color-accent-yellow)",
                    });
                    return;
                  }
                  router.back();
                }}
                className="text-[var(--color-accent-yellow)] hover:bg-[var(--bg-secondary)]"
                disabled={isSubmitting}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="md:text-3xl text-xl font-bold text-[var(--text-primary)]">
                    Create Contract
                  </h1>
                  {/* Single Tier Badge */}
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${tierInfo.bg}`}
                  >
                    <TierIcon className={`w-4 h-4 ${tierInfo.color}`} />
                    <span className={`text-xs font-semibold ${tierInfo.color}`}>
                      {tierInfo.label}
                    </span>
                  </div>
                </div>
                <p className="text-[var(--text-secondary)]">
                  Generate a professional contract and send for signatures
                </p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-2">
              {!hasUnlimitedContracts && (
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200"
                >
                  {getLimitDisplay()} used
                </Badge>
              )}
              {hasUnlimitedContracts && (
                <Badge
                  variant="outline"
                  className="bg-purple-50 text-purple-700 border-purple-200"
                >
                  Unlimited
                </Badge>
              )}
              {hasUnsavedChanges && (
                <Badge
                  variant="outline"
                  className="bg-[var(--color-accent-yellow)]/10 text-[var(--color-accent-yellow)] border-[var(--color-accent-yellow)]/20"
                >
                  Unsaved changes
                </Badge>
              )}
              {attachments.length > 0 && (
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200"
                >
                  <FileText className="w-3 h-3 mr-1" />
                  {attachments.length}
                </Badge>
              )}
              {includeLawyerSignature && (
                <Badge
                  variant="outline"
                  className="bg-purple-50 text-purple-700 border-purple-200"
                >
                  + Lawyer Signature
                </Badge>
              )}
              {localSignature && (
                <Badge
                  variant="outline"
                  className="bg-[var(--color-lemon-green)]/10 text-[var(--color-lemon-green)] border-[var(--color-lemon-green)]/20"
                >
                  ✓ Signed
                </Badge>
              )}
            </div>
          </div>

          {/* Tier Message - For paid tiers */}
          {!isFree && (
            <div
              className={`mb-6 p-4 rounded-lg border-2 ${
                isPremiumUser
                  ? "bg-purple-50 border-purple-200"
                  : isGrowthUser
                    ? "bg-[var(--color-accent-yellow)]/5 border-[var(--color-accent-yellow)]/20"
                    : isZidLiteUser
                      ? "bg-blue-50 border-blue-200"
                      : ""
              }`}
            >
              <p
                className={`font-medium flex items-center gap-2 ${
                  isPremiumUser
                    ? "text-purple-600"
                    : isGrowthUser
                      ? "text-[var(--color-accent-yellow)]"
                      : isZidLiteUser
                        ? "text-blue-600"
                        : ""
                }`}
              >
                <span
                  className={`px-2 py-0.5 rounded text-xs font-bold ${
                    isPremiumUser
                      ? "bg-purple-100 text-purple-600 border border-purple-200"
                      : isGrowthUser
                        ? "bg-[var(--color-accent-yellow)]/10 text-[var(--color-accent-yellow)] border border-[var(--color-accent-yellow)]/20"
                        : isZidLiteUser
                          ? "bg-blue-100 text-blue-600 border border-blue-200"
                          : ""
                  }`}
                >
                  {tierInfo.label.toUpperCase()}
                </span>
                {getTierMessage()}
              </p>
            </div>
          )}

          {/* Usage Warning - Only for Free Tier */}
          {isFree &&
            !hasUnlimitedContracts &&
            contractCount >= contractLimit - 1 && (
              <div
                className={`mb-6 p-4 rounded-lg border ${
                  contractCount >= contractLimit
                    ? "bg-red-50 border-red-200"
                    : "bg-[var(--color-accent-yellow)]/5 border-[var(--color-accent-yellow)]/20"
                }`}
              >
                <div className="flex items-start gap-3">
                  <AlertCircle
                    className={`w-5 h-5 mt-0.5 ${
                      contractCount >= contractLimit
                        ? "text-red-500"
                        : "text-[var(--color-accent-yellow)]"
                    }`}
                  />
                  <div className="flex-1">
                    <p
                      className={`font-medium ${
                        contractCount >= contractLimit
                          ? "text-red-700"
                          : "text-[var(--color-accent-yellow)]"
                      }`}
                    >
                      {contractCount >= contractLimit
                        ? "Free contract limit reached"
                        : `Only ${contractLimit - contractCount} contract${contractLimit - contractCount !== 1 ? "s" : ""} remaining`}
                    </p>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      {contractCount >= contractLimit
                        ? "You've reached your free contract limit. Upgrade to continue creating contracts."
                        : `You have ${contractLimit - contractCount} free ${contractLimit - contractCount === 1 ? "contract" : "contracts"} left.`}
                    </p>
                  </div>
                </div>
              </div>
            )}

          {/* Premium Banner */}
          {(isPremiumUser || isGrowthUser) && (
            <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-purple-700 font-medium flex items-center gap-2">
                <span className="bg-purple-600 text-white px-2 py-1 rounded text-xs uppercase">
                  {userTier}
                </span>
                You have unlimited contracts! No payment required.
              </p>
            </div>
          )}

          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (isSubmitting) {
                    Swal.fire({
                      icon: "warning",
                      title: "Form is Processing",
                      text: "Cannot view drafts while submission is in progress.",
                      confirmButtonColor: "var(--color-accent-yellow)",
                    });
                    return;
                  }
                  if (drafts.length > 0) {
                    showDraftsList(drafts);
                  } else {
                    Swal.fire({
                      icon: "info",
                      title: "No Drafts",
                      text: "You don't have any saved drafts.",
                      confirmButtonColor: "var(--color-accent-yellow)",
                    });
                  }
                }}
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <History className="h-4 w-4 mr-2" />
                View Drafts ({drafts.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetForm}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Clear Form
              </Button>
            </div>
            <div className="text-sm text-[var(--text-secondary)]">
              Contract ID: {form.contractId}
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(value) => {
              if (isSubmitting) return;
              setActiveTab(value);
            }}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="create" className="gap-2">
                <Edit className="h-4 w-4" />
                Write Contract
              </TabsTrigger>
              <TabsTrigger value="preview" className="gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-6">
              <section className="space-y-4">
                <div className="w-full">
                  <Label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
                    Contract Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={form.contractTitle}
                    onChange={(e) =>
                      handleFormChange("contractTitle", e.target.value)
                    }
                    placeholder="Enter contract title"
                    disabled={isSubmitting}
                    className="border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)]"
                    style={{ outline: "none", boxShadow: "none" }}
                  />
                  {errors.contractTitle && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.contractTitle}
                    </p>
                  )}
                </div>

                <div className="flex md:flex-row flex-col gap-3">
                  <div className="space-y-2 w-full">
                    <Label
                      htmlFor="creator-name"
                      className="text-[var(--text-primary)] font-medium"
                    >
                      PARTY A (Creator) *
                    </Label>
                    <Input
                      id="creator-name"
                      value={localCreatorName}
                      onChange={handleCreatorNameChange}
                      placeholder="Enter your full legal name"
                      disabled={isSubmitting}
                      className="border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)]"
                      style={{ outline: "none", boxShadow: "none" }}
                    />
                  </div>

                  <div className="space-y-2 w-full">
                    <Label
                      htmlFor="receiver-name"
                      className="text-[var(--text-primary)] font-medium"
                    >
                      PARTY B (Signee) *
                    </Label>
                    <Input
                      id="receiver-name"
                      value={form.receiverName}
                      onChange={(e) =>
                        handleFormChange("receiverName", e.target.value)
                      }
                      placeholder="John Doe"
                      disabled={isSubmitting}
                      className="border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)]"
                      style={{ outline: "none", boxShadow: "none" }}
                    />
                    {errors.receiverName && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.receiverName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label
                      htmlFor="contract-date"
                      className="text-xs font-medium text-[var(--text-secondary)]"
                    >
                      Contract Date*
                    </Label>
                    <Input
                      id="contract-date"
                      type="date"
                      value={form.contractDate}
                      onChange={(e) =>
                        handleFormChange("contractDate", e.target.value)
                      }
                      className="w-full mt-1.5 border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)]"
                      style={{ outline: "none", boxShadow: "none" }}
                      max={new Date().toISOString().split("T")[0]}
                      disabled={isSubmitting}
                    />
                    {errors.contractDate && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.contractDate}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label
                      htmlFor="receiver-email"
                      className="text-xs font-medium text-[var(--text-secondary)]"
                    >
                      Email Address*
                    </Label>
                    <Input
                      id="receiver-email"
                      type="email"
                      placeholder="john@example.com"
                      value={form.receiverEmail}
                      onChange={(e) =>
                        handleFormChange("receiverEmail", e.target.value)
                      }
                      className="mt-1.5 border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)]"
                      style={{ outline: "none", boxShadow: "none" }}
                      disabled={isSubmitting}
                    />
                    {errors.receiverEmail && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.receiverEmail}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label
                      htmlFor="receiver-phone"
                      className="text-xs font-medium text-[var(--text-secondary)]"
                    >
                      Phone Number
                    </Label>
                    <Input
                      id="receiver-phone"
                      placeholder="+234 000 000 0000"
                      value={form.receiverPhone}
                      onChange={(e) =>
                        handleFormChange("receiverPhone", e.target.value)
                      }
                      className="mt-1.5 border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)]"
                      style={{ outline: "none", boxShadow: "none" }}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-between mb-2">
                    <Label className="block text-xs font-medium text-[var(--text-secondary)]">
                      Contract Content <span className="text-red-500">*</span>
                    </Label>
                    <span className="text-xs text-[var(--text-secondary)]">
                      {form.contractContent.length} characters
                    </span>
                  </div>
                  <RichTextArea
                    value={form.contractContent}
                    onChange={(value) =>
                      handleFormChange("contractContent", value)
                    }
                    // disabled={isSubmitting}
                  />
                  {errors.contractContent && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.contractContent}
                    </p>
                  )}
                </div>

                <div className="mt-6">
                  <div className="flex justify-between items-between mb-2">
                    <Label className="block text-xs font-medium text-[var(--text-secondary)]">
                      PAYMENT TERMS (if any)
                    </Label>
                    <span className="text-xs text-[var(--text-secondary)]">
                      {form.paymentTerms.length} characters
                    </span>
                  </div>
                  <textarea
                    value={form.paymentTerms}
                    onChange={(e) =>
                      handleFormChange("paymentTerms", e.target.value)
                    }
                    placeholder="Specify payment terms, schedules, amounts, methods, and deadlines if applicable..."
                    className="w-full h-20 p-4 text-sm resize-none border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-yellow)] focus:border-transparent disabled:bg-[var(--bg-secondary)] bg-[var(--bg-primary)] text-[var(--text-primary)]"
                    rows={6}
                    disabled={isSubmitting}
                  />
                </div>
              </section>

              <section className="space-y-4">
                <h4 className="text-lg font-medium text-[var(--text-primary)]">Consent Declarations</h4>
                <SignContractToggle
                  ageConsent={form.ageConsent}
                  setAgeConsent={(value) =>
                    handleFormChange("ageConsent", value)
                  }
                  setTermsConsent={(value) =>
                    handleFormChange("termsConsent", value)
                  }
                  termsConsent={form.termsConsent}
                  disabled={isSubmitting}
                />
                {(errors.ageConsent || errors.termsConsent) && (
                  <div className="space-y-1">
                    {errors.ageConsent && (
                      <p className="text-xs text-red-500">
                        {errors.ageConsent}
                      </p>
                    )}
                    {errors.termsConsent && (
                      <p className="text-xs text-red-500">
                        {errors.termsConsent}
                      </p>
                    )}
                  </div>
                )}
              </section>

              {/* Signature Section */}
              <section className="md:border md:border-[var(--border-color)] rounded-lg md:p-6 md:bg-[var(--bg-secondary)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                  <div className="mb-4 sm:mb-0">
                    <h4 className="text-lg font-semibold text-[var(--text-primary)]">
                      Add Your Signature
                    </h4>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Draw or upload your signature to complete the contract
                    </p>
                  </div>
                  {localSignature && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearSignature}
                      className="border-red-200 text-red-600 hover:bg-red-50"
                      disabled={isSubmitting}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear Signature
                    </Button>
                  )}
                </div>

                {/* Load Saved Signature Button */}
                {userData?.id && !localSignature && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-blue-800">
                          Saved Signature Available
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          You have a signature saved. Would you like to load it?
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={loadSignatureManually}
                        disabled={isSubmitting}
                        className="border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        Load Saved Signature
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  <SignaturePad
                    value={localSignature || ""}
                    onChange={(signature) => handleSignatureChange(signature)}
                    label="Your Signature"
                    disabled={isSubmitting}
                  />

                  {userData?.id && (
                    <div className="flex items-center space-x-3 p-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg">
                      <Switch
                        id="save-signature-toggle"
                        checked={saveSignatureForFuture}
                        onCheckedChange={handleSaveSignatureToggle}
                        className="data-[state=checked]:bg-[var(--color-accent-yellow)]"
                        disabled={
                          (!localSignature && saveSignatureForFuture) ||
                          isSubmitting
                        }
                      />
                      <div className="space-y-1 flex-1">
                        <Label
                          htmlFor="save-signature-toggle"
                          className="cursor-pointer text-sm font-medium text-[var(--text-primary)]"
                        >
                          Save signature for future use
                        </Label>
                        <p className="text-xs text-[var(--text-secondary)]">
                          Your signature will be securely stored for future
                          contracts
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <div className="flex flex-col md:flex-row gap-3 pt-4">
                <Button
                  onClick={() => handleSubmit(true)}
                  variant="outline"
                  size="lg"
                  className="md:flex-1 hover:bg-blue-50"
                  disabled={isSubmitting || isSavingDraft}
                >
                  {isSavingDraft ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Draft
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => handleSubmit(false)}
                  size="lg"
                  className="md:flex-1 bg-[var(--color-accent-yellow)] hover:bg-[var(--color-accent-yellow)]/90 text-[var(--color-ink)]"
                  disabled={isSubmitting || isSavingDraft}
                >
                  {getSendButtonText()}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="preview">
              <PreviewTab
                contractTitle={form.contractTitle}
                contractContent={form.contractContent}
                contractDate={form.contractDate}
                receiverName={form.receiverName}
                receiverEmail={form.receiverEmail}
                receiverPhone={form.receiverPhone}
                attachments={attachments}
                setActiveTab={setActiveTab}
                includeLawyerSignature={includeLawyerSignature}
                onIncludeLawyerChange={setIncludeLawyerSignature}
                creatorName={creatorName}
                onCreatorNameChange={setCreatorName}
                creatorSignature={localSignature || creatorSignature}
                localCreatorName={localCreatorName}
                setLocalCreatorName={setLocalCreatorName}
                disabled={isSubmitting}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default FormBody;