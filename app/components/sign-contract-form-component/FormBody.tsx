"use client";

import { useState, useEffect, useCallback } from "react";
import RichTextArea from "./RichTextArea";
import SignContractFileUpload from "./SignContractFileUpload";
import SignContractInput from "./SignContractInput";
import SignContractSelect from "./SignContractSelect";
import SignContractToggle from "./SignContractToggle";
import PreviewTab from "./PreviewTab";
import { ContractSuccessModal } from "./ContractSuccessModal";
import confetti from "canvas-confetti";
import { contractTitles } from "@/app/data/sampleContracts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Edit,
  Eye,
  FileText,
  Save,
  Send,
  Upload,
  Loader2,
  History,
  ArrowLeft,
  Copy,
  X,
  Scale,
  Download,
  Check,
  Trash2,
} from "lucide-react";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { useRouter } from "next/navigation";
import { useUserContextData } from "@/app/context/userData";
import Swal from "sweetalert2";
import PinPopOver from "../PinPopOver";
import ContractSummary from "./ContractSummary";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Input } from "../ui/input";
import { SignaturePad } from "../SignaturePad"; 

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

interface DraftsResponse {
  success: boolean;
  drafts: ContractDraft[];
  count: number;
  error?: string;
}

interface SaveContractResponse {
  success: boolean;
  signingLink?: string;
  contractId?: string;
  isUpdate?: boolean;
  error?: string;
  message?: string;
}

interface PaymentResponse {
  error?: string;
  message?: string;
}

const FormBody: React.FC = () => {
  const router = useRouter();
  const { userData } = useUserContextData();

  const inputCount = 4;
  const [isPinOpen, setIsPinOpen] = useState(false); // Changed from isOpen
  const [pin, setPin] = useState<string[]>(Array(inputCount).fill(""));
  const [isProcessingPayment, setIsProcessingPayment] = useState(false); // Main processing state
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
  const [totalAmount, setTotalAmount] = useState(10);
  const [saveSignatureForFuture, setSaveSignatureForFuture] = useState(false);
  const CONTRACT_FEE = 10;
  const LAWYER_FEE = 10000;

  const [creatorName, setCreatorName] = useState(
    userData?.firstName && userData?.lastName
      ? `${userData.firstName} ${userData.lastName}`
      : ""
  );
  const [creatorSignature, setCreatorSignature] = useState<string | null>(null);
  const [localCreatorName, setLocalCreatorName] = useState(creatorName);

  // Local signature state for the signature pad
  const [localSignature, setLocalSignature] = useState<string | null>(null);

  useEffect(() => {
    if (includeLawyerSignature) {
      setTotalAmount(CONTRACT_FEE + LAWYER_FEE);
    } else {
      setTotalAmount(CONTRACT_FEE);
    }
  }, [includeLawyerSignature]);

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
    pin: "",
    ageConsent: "",
    termsConsent: "",
  });

  // Update local signature when creatorSignature changes
  useEffect(() => {
    setLocalSignature(creatorSignature);
  }, [creatorSignature]);

  const triggerContractConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#C29307", "#ffd700", "#ffed4e", "#ffffff", "#fbbf24"],
    });

    setTimeout(() => {
      confetti({
        particleCount: 80,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#C29307", "#ffd700", "#ffed4e"],
      });
      confetti({
        particleCount: 80,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#C29307", "#ffd700", "#ffed4e"],
      });
    }, 150);

    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { y: 0.8 },
        colors: ["#C29307", "#ffd700", "#ffed4e"],
      });
    }, 300);
  };

  const generateContractId = useCallback(() => {
    // Generate a proper UUID for database
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
  }, [
    isInitialLoad,
    form.contractTitle,
    form.contractContent,
    form.paymentTerms,
    form.receiverName,
    form.receiverEmail,
    form.receiverPhone,
    form.ageConsent,
    form.termsConsent,
    form.contractDate,
    attachments.length,
    localSignature,
  ]);

  useEffect(() => {
    if (userData?.id) {
      loadUserDrafts();
    }
  }, [userData?.id]);

  useEffect(() => {
    return () => {
      setIsProcessingPayment(false);
      setIsPinOpen(false);
      setShowContractSummary(false);
      setShowSuccessModal(false);
      setPin(Array(inputCount).fill(""));
    };
  }, [inputCount]);

  const loadUserDrafts = async () => {
    try {
      if (!userData?.id) {
        console.log("No user data found");
        return;
      }

      setIsLoadingDrafts(true);
      const res = await fetch(
        `/api/contract/contract-drafts?userId=${userData.id}`
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const result: DraftsResponse = await res.json();

      if (result.success && result.drafts && result.drafts.length > 0) {
        setDrafts(result.drafts);

        if (
          !form.contractTitle &&
          !form.contractContent &&
          !form.paymentTerms &&
          !form.receiverName &&
          !form.receiverEmail &&
          !form.contractDate &&
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
              confirmButtonColor: "#C29307",
              cancelButtonColor: "#6b7280",
              denyButtonColor: "#3b82f6",
              width: 500,
              customClass: {
                popup: "rounded-lg",
                title: "text-xl font-bold",
                htmlContainer: "text-gray-600",
              },
            }).then((swalResult) => {
              if (swalResult.isConfirmed) {
                const recentDraft = result.drafts[0];
                loadDraftIntoForm(recentDraft);
              } else if (swalResult.isDenied) {
                showDraftsList(result.drafts);
              } else if (swalResult.dismiss === Swal.DismissReason.cancel) {
                console.log("User chose to start fresh");
              }
            });
          }, 1000);
        }
      } else {
        console.log("No drafts found");
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

      const res = await fetch(
        `/api/saved-signature?userId=${userData.id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await res.json();

      if (res.ok && data.success) {
        if (data.signature) {
          setCreatorSignature(data.signature);
          setLocalSignature(data.signature);
          setSaveSignatureForFuture(true);

          Swal.fire({
            icon: "success",
            title: "Signature Loaded",
            text: "Your saved signature has been loaded.",
            confirmButtonColor: "#C29307",
            timer: 2000,
            showConfirmButton: false,
          });
        } else {
          Swal.fire({
            icon: "info",
            title: "No Saved Signature",
            text: "No saved signature found. Please create a new one.",
            confirmButtonColor: "#C29307",
            timer: 2000,
            showConfirmButton: false,
          });
        }
      } else {
        Swal.fire({
          icon: "error",
          title: "Load Failed",
          text: "Failed to load saved signature. Please try again.",
          confirmButtonColor: "#C29307",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Load Failed",
        text: "Failed to load saved signature. Please try again.",
        confirmButtonColor: "#C29307",
      });
    }
  };

  const saveSignatureToDatabase = async (signatureDataUrl: string) => {
    try {
      if (!userData?.id) {
        return false;
      }

      const res = await fetch("/api/saved-signature", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userData.id,
          signature: signatureDataUrl,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  };

  const handleSaveSignatureToggle = async (save: boolean) => {
    setSaveSignatureForFuture(save);

    if (save && creatorSignature && userData?.id) {
      try {
        const saved = await saveSignatureToDatabase(creatorSignature);
        if (saved) {
          Swal.fire({
            icon: "success",
            title: "Signature Saved",
            text: "Your signature has been saved for future use.",
            confirmButtonColor: "#C29307",
            timer: 2000,
            showConfirmButton: false,
          });
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Save Failed",
          text: "Failed to save signature. Please try again.",
          confirmButtonColor: "#C29307",
        });
      }
    }

    if (!save && userData?.id) {
      try {
        await deleteSavedSignature();
      } catch (error) {}
    }
  };

  const handleSignatureChange = async (signature: string | null) => {
    setLocalSignature(signature);
    setCreatorSignature(signature);

    if (!signature && saveSignatureForFuture && userData?.id) {
      try {
        await deleteSavedSignature();
      } catch (error) {}
    }

    if (signature && saveSignatureForFuture && userData?.id) {
      try {
        await saveSignatureToDatabase(signature);
      } catch (error) {}
    }
  };

  const deleteSavedSignature = async () => {
    try {
      if (!userData?.id) return false;

      const res = await fetch("/api/contract/saved-signature", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: userData.id }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        return true;
      } else {
        return false;
      }
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

    const formData: FormState = {
      receiverName: draft.receiver_name || draft.signee_name || "",
      receiverEmail: draft.receiver_email || draft.signee_email || "",
      receiverPhone:
        draft.receiver_phone || draft.phone_number?.toString() || "",
      contractTitle: draft.contract_title || "",
      contractContent: draft.contract_content || draft.contract_text || "",
      paymentTerms: paymentTerms,
      ageConsent: draft.age_consent || false,
      termsConsent: draft.terms_consent || false,
      status: (draft.status as "pending" | "draft") || "draft",
      contractId: draftContractId,
      contractType: "custom",
      contractDate:
        draft.contract_date || new Date().toISOString().split("T")[0],
    };

    setForm(formData);
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

    if (draft.attachment_url || draft.attachment_name) {
      Swal.fire({
        icon: "info",
        title: "Attachment Notice",
        text: "This draft had an attachment. You'll need to re-upload the file.",
        confirmButtonColor: "#C29307",
      });
    }

    setTimeout(() => {
      Swal.fire({
        icon: "success",
        title: "Draft Loaded!",
        text: "Your draft has been loaded into the form successfully.",
        confirmButtonColor: "#C29307",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });
    }, 300);
  };

  const showDraftsList = (draftsList: ContractDraft[]) => {
    const draftListHTML = draftsList
      .map(
        (draft, index) => `
    <div style="padding: 12px; border-bottom: 1px solid #e5e7eb; cursor: pointer; transition: background-color 0.2s;" 
         data-draft-index="${index}"
         class="hover:bg-gray-50 rounded">
      <strong class="text-gray-900">${
        draft.contract_title || "Untitled Contract"
      }</strong><br>
      <small class="text-gray-600">To: ${
        draft.receiver_name || draft.signee_name || "No recipient"
      }</small><br>
      <small class="text-gray-500">Created: ${new Date(
        draft.created_at
      ).toLocaleDateString()}</small>
    </div>
  `
      )
      .join("");

    Swal.fire({
      title: "Select a Draft to Load",
      html: `
    <div style="text-align: left; max-height: 300px; overflow-y auto; padding-right: 4px;">
      ${draftListHTML}
    </div>
  `,
      showConfirmButton: true,
      confirmButtonText: "Close",
      confirmButtonColor: "#C29307",
      width: 500,
      customClass: {
        popup: "rounded-lg",
        title: "text-xl font-bold mb-4",
        htmlContainer: "text-gray-600",
      },
      didOpen: () => {
        const draftElements = document.querySelectorAll("[data-draft-index]");
        draftElements.forEach((element) => {
          element.addEventListener("click", () => {
            const index = parseInt(
              element.getAttribute("data-draft-index") || "0"
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
      if (
        hasUnsavedChanges &&
        (form.contractTitle.trim() ||
          form.contractContent.trim() ||
          form.paymentTerms.trim() ||
          form.contractDate ||
          attachments.length > 0 ||
          localSignature)
      ) {
        e.preventDefault();
        e.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [
    hasUnsavedChanges,
    form.contractTitle,
    form.contractContent,
    form.paymentTerms,
    form.contractDate,
    attachments.length,
    localSignature,
  ]);

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
        initiator_name:
          userData.firstName && userData.lastName
            ? `${userData.firstName} ${userData.lastName}`
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
        has_attachments: attachments.length > 0,
        attachment_count: attachments.length,
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(
          result.error || result.message || "Failed to save draft"
        );
      }

      Swal.fire({
        icon: "success",
        title: "Draft Saved!",
        text: "Your contract draft has been saved successfully.",
        confirmButtonColor: "#C29307",
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
      pin: "",
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
      newErrors.receiverEmail =
        "Sorry, the signee email address cannot be the same as the initiator's email address.";
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
        text: "Please add your signature in the form before submitting.",
        confirmButtonColor: "#C29307",
      });
      return false;
    }

    if (!creatorName.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Name Required",
        text: "Please enter your full legal name in the creator name field.",
        confirmButtonColor: "#C29307",
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
        confirmButtonColor: "#C29307",
        confirmButtonText: "OK",
        width: 500,
        customClass: {
          popup: "rounded-lg",
          title: "text-xl font-bold",
          htmlContainer: "text-gray-600",
        },
      });
      return false;
    }

    const signatureValid = validateSignature();
    if (!signatureValid) {
      return false;
    }
    return true;
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
          }
        );

        const result = await res.json();

        if (!res.ok) {
          throw new Error(
            result.error || `Failed to upload: ${attachment.name}`
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
    isDraft: boolean = false
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
        initiator_name:
          userData.firstName && userData.lastName
            ? `${userData.firstName} ${userData.lastName}`
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
          base_fee: CONTRACT_FEE,
          lawyer_fee: includeLawyerSignature ? LAWYER_FEE : 0,
          total_fee: totalAmount,
          creator_name: creatorName,
          creator_signature: localSignature || creatorSignature,
          payment_terms: form.paymentTerms,
          contract_date: form.contractDate,
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
      if (!isDraft) await handleRefund();

      Swal.fire(
        "Error",
        (err as Error)?.message || "Something went wrong",
        "error"
      );

      return { success: false };
    }
  };

  const handleDeduct = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      const pinString = pin.join("");

      fetch("/api/pay-app-service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userData?.id,
          pin: pinString,
          amount: totalAmount,
          description: includeLawyerSignature
            ? "Contract with lawyer signature successfully generated"
            : "Contract successfully generated",
          service: "contract",
          include_lawyer_signature: includeLawyerSignature,
        }),
      })
        .then(async (res) => {
          const data: PaymentResponse = await res.json();
          if (!res.ok) {
            Swal.fire("Error", data.error || "Something went wrong", "error");
            resolve(false);
          } else {
            resolve(true);
          }
        })
        .catch((err) => {
          Swal.fire("Error", err.message, "error");
          resolve(false);
        });
    });
  };

  const handleRefund = async () => {
    try {
      const res = await fetch("/api/refund-service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userData?.id,
          amount: totalAmount,
          description: includeLawyerSignature
            ? "Refund for failed contract generation with lawyer signature"
            : "Refund for failed contract generation",
        }),
      });

      const data: PaymentResponse = await res.json();

      if (res.ok) {
        Swal.fire({
          icon: "info",
          title: "Refund Processed",
          text: includeLawyerSignature
            ? `₦${totalAmount.toLocaleString()} has been refunded to your wallet due to failed contract sending.`
            : "₦10 has been refunded to your wallet due to failed contract sending.",
        });
      } else {
        throw new Error(data.error || "Refund failed");
      }
    } catch (err) {
      Swal.fire({
        icon: "warning",
        title: "Refund Failed",
        text: "Payment deduction was made, but refund failed. Please contact support.",
      });
    }
  };

  // Helper function to reset all loading states
  const resetAllLoadingStates = () => {
    setIsProcessingPayment(false);
    setPin(Array(inputCount).fill(""));
  };

  const processPaymentAndSubmit = async () => {
    try {
      // Payment processing starts here (after PIN confirmation)
      setIsProcessingPayment(true);
      
      const paymentSuccess = await handleDeduct();

      if (paymentSuccess) {
        const result = await handleSaveContract(false);
        if (result.success) {
          setGeneratedSigningLink(result.signingLink || "");
          setSavedContractId(result.contractId || "");

          triggerContractConfetti();

          // Reset all loading states since we're done
          resetAllLoadingStates();
          setIsPinOpen(false);
          setPin(Array(inputCount).fill(""));

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
          
          // Show success modal
          setTimeout(() => {
            setShowSuccessModal(true);
          }, 300);
        } else {
          await handleRefund();
          resetAllLoadingStates();
          setIsPinOpen(false);
          setPin(Array(inputCount).fill(""));
        }
      } else {
        // Payment failed
        resetAllLoadingStates();
        setIsPinOpen(false);
        setPin(Array(inputCount).fill(""));
      }
    } catch (error) {
      resetAllLoadingStates();
      setIsPinOpen(false);
      setPin(Array(inputCount).fill(""));
      Swal.fire({
        icon: "error",
        title: "Processing Failed",
        text: "Failed to process payment. Please try again.",
        confirmButtonColor: "#C29307",
      });
    }
  };

  const handleCreatorNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isProcessingPayment) return;
    const name = e.target.value;
    setLocalCreatorName(name);
    setCreatorName(name);
  };

  const handleSummaryConfirm = (options?: {
    includeLawyerSignature: boolean;
  }) => {
    setShowContractSummary(false);
    if (options?.includeLawyerSignature !== undefined) {
      setIncludeLawyerSignature(options.includeLawyerSignature);
    }
    setIsPinOpen(true);
  };

  const handleSummaryBack = () => {
    setShowContractSummary(false);
    resetAllLoadingStates();
    setIsPinOpen(false);
    setPin(Array(inputCount).fill(""));
  };

  const handleCopySigningLink = () => {
    if (generatedSigningLink) {
      navigator.clipboard.writeText(generatedSigningLink);
      Swal.fire({
        icon: "success",
        title: "Contract Link Copied!",
        text: "Contract link copied to clipboard",
        confirmButtonColor: "#C29307",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });
    }
  };

  const handleSubmit = async (isDraft: boolean = false) => {
    // Prevent multiple submissions
    if (isProcessingPayment || isSavingDraft) {
      return;
    }

    if (isDraft) {
      await handleSaveDraft();
      return;
    }

    try {
      const inputsValid = validateInputs();

      if (!inputsValid) {
        return;
      }

      // Only proceed if validation passed
      setShowContractSummary(true);
    } catch (error) {
      console.error("Submit error:", error);
      Swal.fire({
        icon: "error",
        title: "Submission Error",
        text: "An error occurred while processing your request.",
        confirmButtonColor: "#C29307",
      });
    }
  };

  const resetForm = () => {
    if (isProcessingPayment) {
      Swal.fire({
        icon: "warning",
        title: "Form is Processing",
        text: "Cannot clear form while submission is in progress.",
        confirmButtonColor: "#C29307",
      });
      return;
    }

    Swal.fire({
      title: "Clear Form?",
      text: "This will remove all current form data, including uploaded attachments.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#C29307",
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
        setCreatorName(
          userData?.firstName && userData?.lastName
            ? `${userData.firstName} ${userData.lastName}`
            : ""
        );
        setLocalCreatorName(
          userData?.firstName && userData?.lastName
            ? `${userData.firstName} ${userData.lastName}`
            : ""
        );
        setHasUnsavedChanges(false);
        setErrors({
          contractTitle: "",
          receiverName: "",
          receiverEmail: "",
          contractContent: "",
          contractDate: "",
          pin: "",
          ageConsent: "",
          termsConsent: "",
        });

        Swal.fire({
          icon: "success",
          title: "Form Reset",
          text: "Form has been cleared successfully.",
          confirmButtonColor: "#C29307",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    });
  };

  const handleFormChange = (field: keyof FormState, value: any) => {
    if (isProcessingPayment) return;
    setForm((prev) => ({ ...prev, [field]: value }));
    const errorField = field as keyof typeof errors;
    if (errors[errorField]) {
      setErrors((prev) => ({ ...prev, [errorField]: "" }));
    }
  };

  const handleSelectChange = (value: string) => {
    if (isProcessingPayment) return;
    handleFormChange("contractTitle", value);
  };

  const handleFileUpload = (file: File) => {
    if (isProcessingPayment) {
      Swal.fire({
        icon: "warning",
        title: "Form is Processing",
        text: "Cannot upload files while submission is in progress.",
        confirmButtonColor: "#C29307",
      });
      return;
    }

    let previewUrl: string | undefined;
    if (file.type.startsWith("image/")) {
      previewUrl = URL.createObjectURL(file);
    }

    const newAttachment: AttachmentFile = {
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      previewUrl,
    };

    setAttachments((prev) => [...prev, newAttachment]);
    setHasUnsavedChanges(true);

    Swal.fire({
      icon: "success",
      title: "File Added!",
      text: `${file.name} has been added as an attachment.`,
      confirmButtonColor: "#C29307",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const handleRemoveAttachment = (index: number) => {
    if (isProcessingPayment) {
      Swal.fire({
        icon: "warning",
        title: "Form is Processing",
        text: "Cannot remove attachments while submission is in progress.",
        confirmButtonColor: "#C29307",
      });
      return;
    }

    const attachmentToRemove = attachments[index];

    if (attachmentToRemove.previewUrl) {
      URL.revokeObjectURL(attachmentToRemove.previewUrl);
    }

    setAttachments((prev) => prev.filter((_, i) => i !== index));
    setHasUnsavedChanges(true);
  };

  const handleLawyerToggle = useCallback(
    (checked: boolean) => {
      if (isProcessingPayment) return;
      setIncludeLawyerSignature(checked);
    },
    [isProcessingPayment]
  );

  useEffect(() => {
    return () => {
      attachments.forEach((attachment) => {
        if (attachment.previewUrl) {
          URL.revokeObjectURL(attachment.previewUrl);
        }
      });
    };
  }, [attachments]);

  return (
    <>
      {/* Pin Popup */}
      <PinPopOver
        setIsOpen={(newValue) => {
          setIsPinOpen(newValue);
          if (!newValue) {
            resetAllLoadingStates();
            setPin(Array(inputCount).fill(""));
          }
        }}
        isOpen={isPinOpen}
        pin={pin}
        setPin={setPin}
        inputCount={inputCount}
        onConfirm={async (pinCode) => {
          await processPaymentAndSubmit();
        }}
       
      />

      
      <ContractSummary
        contractTitle={form.contractTitle}
        contractContent={form.contractContent}
        contractDate={form.contractDate}
        initiatorName={`${userData?.firstName || ""} ${
          userData?.lastName || ""
        }`}
        initiatorEmail={userData?.email || ""}
        receiverName={form.receiverName}
        receiverEmail={form.receiverEmail}
        receiverPhone={form.receiverPhone}
        amount={CONTRACT_FEE}
        confirmContract={showContractSummary}
        onBack={handleSummaryBack}
        onConfirm={handleSummaryConfirm}
        contractType="Custom Contract"
        dateCreated={new Date(form.contractDate).toLocaleDateString()}
        attachments={attachments}
        currentLawyerSignature={includeLawyerSignature}
        onClose={() => {
          setShowContractSummary(false);
          resetAllLoadingStates();
          setIsPinOpen(false);
          setPin(Array(inputCount).fill(""));
        }}
      />

      {/* Success Modal */}
      <ContractSuccessModal
        open={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          resetAllLoadingStates();
          setIsPinOpen(false);
          setPin(Array(inputCount).fill(""));
          setShowContractSummary(false);
        }}
        onNewContract={() => {
          setShowSuccessModal(false);
          resetAllLoadingStates();
          setIsPinOpen(false);
          setPin(Array(inputCount).fill(""));
          setShowContractSummary(false);
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

      {/* Main Form Content */}
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (isProcessingPayment) {
                    Swal.fire({
                      icon: "warning",
                      title: "Form is Processing",
                      text: "Cannot navigate away while submission is in progress.",
                      confirmButtonColor: "#C29307",
                    });
                    return;
                  }
                  router.back();
                }}
                className="text-[#C29307] hover:bg-white/10 text-sm md:text-base"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="hidden md:block">Back</span>
              </Button>

              <div>
                <h1 className="md:text-3xl text-xl font-bold mb-2">
                  Create Contract
                </h1>
                <p className="text-muted-foreground">
                  Generate a professional contract and send for signatures
                </p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-2">
              {hasUnsavedChanges && (
                <Badge
                  variant="outline"
                  className="bg-yellow-50 text-yellow-700 border-yellow-200"
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
                  {attachments.length} attachment(s)
                </Badge>
              )}
              {includeLawyerSignature && (
                <Badge
                  variant="outline"
                  className="bg-purple-50 text-purple-700 border-purple-200"
                >
                  <Scale className="w-3 h-3 mr-1" />
                  Lawyer Signature
                </Badge>
              )}
              {localSignature && (
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200"
                >
                  ✓ Signed
                </Badge>
              )}
              {isProcessingPayment && (
                <Badge
                  variant="outline"
                  className="bg-red-50 text-red-700 border-red-200"
                >
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Processing Payment...
                </Badge>
              )}
            </div>
          </div>

         
            <div className="flex justify-between md:items-center mb-6 flex-col md:flex-row gap-3 ">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (isProcessingPayment) {
                      Swal.fire({
                        icon: "warning",
                        title: "Form is Processing",
                        text: "Cannot view drafts while submission is in progress.",
                        confirmButtonColor: "#C29307",
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
                        confirmButtonColor: "#C29307",
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
                  className="text-gray-600 hover:text-gray-900"
                >
                  Clear Form
                </Button>
              </div>
              <div className="text-sm text-gray-500">
                Contract ID: {form.contractId}
              </div>
            </div>

            <Tabs
              value={activeTab}
              onValueChange={(value) => {
                if (isProcessingPayment) return;
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
                  {/* <div className="flex justify-between items-center">
                    <h4 className="text-lg font-medium">Contract Details</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab("preview")}
                      disabled={!form.contractContent || isProcessingPayment}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                  </div>

                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Your Saved Signature
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Load your saved signature to use in this contract
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={loadSignatureManually}
                        disabled={
                          !userData?.id || !!localSignature || isProcessingPayment
                        }
                        className="border-gray-300 text-gray-700 hover:bg-gray-100"
                      >
                        {localSignature ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Signature Loaded
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Load Saved Signature
                          </>
                        )}
                      </Button>
                    </div>
                    {localSignature && (
                      <div className="mt-3 p-3 bg-white border border-green-200 rounded-lg">
                        <div className="flex items-center">
                          <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center mr-2">
                            <Check className="h-4 w-4 text-green-600" />
                          </div>
                          <p className="text-sm text-green-700">
                            Signature loaded successfully!
                          </p>
                        </div>
                      </div>
                    )}
                  </div> */}

                  <div className="w-full">
                    <Label className="block text-xs font-medium text-gray-600 mb-2">
                      Contract Title <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={form.contractTitle}
                      onChange={(e: any) =>
                        handleFormChange("contractTitle", e.target.value)
                      }
                      placeholder="Enter contract title"
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
                        className="text-gray-700 font-medium"
                      >
                        PARTY A (Creator) *
                      </Label>
                      <Input
                        id="creator-name"
                        value={localCreatorName}
                        onChange={handleCreatorNameChange}
                        placeholder="Enter your full legal name as it should appear on the contract"
                      />
                    </div>

                    <div className="space-y-2 w-full">
                      <Label
                        htmlFor="receiver-name"
                        className="text-gray-700 font-medium"
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
                      <div className="space-y-1">
                        <Label
                          htmlFor="contract-date"
                          className="text-xs font-medium text-gray-600"
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
                          className="w-full"
                          max={new Date().toISOString().split("T")[0]}
                        />
                        {errors.contractDate && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.contractDate}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <SignContractInput
                        label="Email Address*"
                        placeholder="john@example.com"
                        id={"receiver-email"}
                        value={form.receiverEmail}
                        onchange={(e) =>
                          handleFormChange("receiverEmail", e.target.value)
                        }
                      />
                      {errors.receiverEmail && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.receiverEmail}
                        </p>
                      )}
                    </div>
                    <div>
                      <SignContractInput
                        label="Phone Number"
                        placeholder="+234 000 000 0000"
                        id={"receiver-phone"}
                        value={form.receiverPhone}
                        onchange={(e) =>
                          handleFormChange("receiverPhone", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label className="block text-xs font-medium text-gray-600">
                        Contract Content <span className="text-red-500">*</span>
                      </Label>
                      <span className="text-xs text-gray-500">
                        {form.contractContent.length} characters
                      </span>
                    </div>
                    <RichTextArea
                      value={form.contractContent}
                      onChange={(value) =>
                        handleFormChange("contractContent", value)
                      }
                    />
                    {errors.contractContent && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.contractContent}
                      </p>
                    )}
                  </div>

                  <div className="mt-6">
                    <div className="flex justify-between items-center mb-2">
                      <Label className="block text-xs font-medium text-gray-600">
                        PAYMENT TERMS (if any)
                      </Label>
                      <span className="text-xs text-gray-500">
                        {form.paymentTerms.length} characters
                      </span>
                    </div>
                    <div className="">
                      <textarea
                        value={form.paymentTerms}
                        onChange={(e) =>
                          handleFormChange("paymentTerms", e.target.value)
                        }
                        placeholder="Specify payment terms, schedules, amounts, methods, and deadlines if applicable..."
                        className="w-full h-20 p-4 text-sm resize-none border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C29307] focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                        rows={6}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Optional: Include payment amounts, schedules, methods, and
                      deadlines
                    </p>
                  </div>
                </section>

                <section className="space-y-4">
                  <h4 className="text-lg font-medium">Consent Declarations</h4>
                  <SignContractToggle
                    ageConsent={form.ageConsent}
                    setAgeConsent={(value) =>
                      handleFormChange("ageConsent", value)
                    }
                    setTermsConsent={(value) =>
                      handleFormChange("termsConsent", value)
                    }
                    termsConsent={form.termsConsent}
                  />
                  <div className="space-y-2">
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
                </section>

                {/* Signature Section - Moved here under consent toggles */}
                <section className="md:border md:border-gray-200 rounded-lg md:p-6 md:bg-gray-50 print:hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                    <div className="mb-4 sm:mb-0">
                      <h4 className="text-lg font-semibold text-gray-900">
                        Add Your Signature
                      </h4>
                      <p className="text-sm text-gray-600">
                        Draw or upload your signature to complete the contract
                      </p>
                    </div>
                    {localSignature && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearSignature}
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 w-full sm:w-auto"
                        disabled={isProcessingPayment}
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
                            You have a signature saved for future use. Would you
                            like to load it?
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={loadSignatureManually}
                          disabled={isProcessingPayment}
                          className="border-blue-300 text-blue-700 hover:bg-blue-100"
                        >
                          Load Saved Signature
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-6">
                    {/* Signature Pad Component */}
                    <SignaturePad
                      value={localSignature || ""}
                      onChange={(signature) => handleSignatureChange(signature)}
                      label="Your Signature"
                      disabled={isProcessingPayment}
                    />

                    {/* Save Signature Toggle */}
                    {userData?.id && (
                      <div className="flex items-center space-x-3 p-4 bg-white border border-gray-200 rounded-lg">
                        <Switch
                          id="save-signature-toggle"
                          checked={saveSignatureForFuture}
                          onCheckedChange={handleSaveSignatureToggle}
                          className="data-[state=checked]:bg-[#C29307]"
                          disabled={(!localSignature && saveSignatureForFuture) || isProcessingPayment}
                        />
                        <div className="space-y-1 flex-1">
                          <Label
                            htmlFor="save-signature-toggle"
                            className="cursor-pointer text-sm font-medium text-gray-700"
                          >
                            Save signature for future use
                          </Label>
                          <p className="text-xs text-gray-500">
                            Your signature will be securely stored and automatically
                            loaded for future contracts
                          </p>
                          {!localSignature && saveSignatureForFuture && (
                            <p className="text-xs text-amber-600 mt-1">
                              Please create a signature first to enable saving
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                <div className="flex flex-col md:flex-row gap-3 pt-4 ">
                  <Button
                    onClick={() => handleSubmit(true)}
                    variant="outline"
                    size="lg"
                    className="md:flex-1 hover:bg-blue-50"
                    disabled={
                      isProcessingPayment ||
                      isSavingDraft ||
                      (!form.contractTitle.trim() &&
                        !form.contractContent.trim() &&
                        !localSignature)
                    }
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
                    className="md:flex-1 bg-[#C29307] text-white hover:bg-[#b38606] disabled:opacity-70 disabled:cursor-not-allowed"
                    disabled={
                      isProcessingPayment || isSavingDraft
                    }
                  >
                    {isProcessingPayment ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send for Signature
                      </>
                    )}
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
                 
                />
              </TabsContent>
            </Tabs>
         
       
        </div>
      </div>
    </>
  );
};

export default FormBody;