// app/dashboard/services/contract/edit/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import RichTextArea from "@/app/components/sign-contract-form-component/RichTextArea";
import SignContractInput from "@/app/components/sign-contract-form-component/SignContractInput";
import SignContractToggle from "@/app/components/sign-contract-form-component/SignContractToggle";
import PreviewTab from "@/app/components/sign-contract-form-component/PreviewTab";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import {
  Edit,
  Eye,
  FileText,
  Save,
  Loader2,
  ArrowLeft,
  Scale,
  AlertTriangle,
  Trash2,
  Check,
  Download,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { useRouter } from "next/navigation";
import { useUserContextData } from "@/app/context/userData";
import Swal from "sweetalert2";
import { Badge } from "@/app/components/ui/badge";
import { Label } from "@/app/components/ui/label";
import { Switch } from "@/app/components/ui/switch";
import Loader from "@/app/components/Loader";
import { Input } from "@/app/components/ui/input";
import { SignaturePad } from "@/app/components/SignaturePad";

type Contract = {
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
  metadata?: Record<string, any>;
};

type FormState = {
  receiverName: string;
  receiverEmail: string;
  receiverPhone: string;
  contractTitle: string;
  contractContent: string;
  ageConsent: boolean;
  termsConsent: boolean;
  status: "pending" | "draft" | "signed";
  contractId: string;
  contractType: string;
  contractDate: string;
};

type AttachmentFile = {
  file: File;
  name: string;
  size: number;
  type: string;
  previewUrl?: string;
};

export default function EditContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { userData } = useUserContextData();
  const [contractId, setContractId] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isFormLocked, setIsFormLocked] = useState(false);

  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [includeLawyerSignature, setIncludeLawyerSignature] = useState(false);
  const [creatorName, setCreatorName] = useState("");
  const [creatorSignature, setCreatorSignature] = useState<string | null>(null);
  const [localCreatorName, setLocalCreatorName] = useState("");
  const [saveSignatureForFuture, setSaveSignatureForFuture] = useState(false);

  // Local signature state for the signature pad
  const [localSignature, setLocalSignature] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState("create");

  const [errors, setErrors] = useState({
    contractTitle: "",
    receiverName: "",
    receiverEmail: "",
    contractContent: "",
    ageConsent: "",
    termsConsent: "",
  });

  const [form, setForm] = useState<FormState>({
    receiverName: "",
    receiverEmail: "",
    receiverPhone: "",
    contractTitle: "",
    contractContent: "",
    ageConsent: false,
    termsConsent: false,
    status: "pending",
    contractId: "",
    contractType: "custom",
    contractDate: new Date().toISOString().split("T")[0],
  });

  // Unwrap params
  useEffect(() => {
    const unwrapParams = async () => {
      const unwrapped = await params;
      setContractId(unwrapped.id);
    };
    unwrapParams();
  }, [params]);

  // Update local signature when creatorSignature changes
  useEffect(() => {
    setLocalSignature(creatorSignature);
  }, [creatorSignature]);

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
        headers: {
          "Content-Type": "application/json",
        },
      });

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
      } else {
        Swal.fire({
          icon: "error",
          title: "Load Failed",
          text: "Failed to load saved signature. Please try again.",
          confirmButtonColor: "var(--color-accent-yellow)",
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
      if (!userData?.id) {
        return false;
      }

      const res = await fetch("/api/contract/saved-signature", {
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

    if (save && localSignature && userData?.id) {
      try {
        const saved = await saveSignatureToDatabase(localSignature);
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
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Save Failed",
          text: "Failed to save signature. Please try again.",
          confirmButtonColor: "var(--color-accent-yellow)",
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

  const fetchContract = async () => {
    if (!contractId) return;

    try {
      setLoading(true);

      const res = await fetch(`/api/contract/get-contract?id=${contractId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || `Failed to fetch contract (${res.status})`,
        );
      }

      if (!data.contract) {
        throw new Error("Contract data is empty");
      }

      const contract = data.contract;

      const formData: FormState = {
        receiverName: contract.signee_name || "",
        receiverEmail: contract.signee_email || "",
        receiverPhone: contract.phone_number?.toString() || "",
        contractTitle: contract.contract_title || "",
        contractContent: contract.contract_text || "",
        ageConsent: contract.age_consent || false,
        termsConsent: contract.terms_consent || false,
        status: contract.status || "pending",
        contractId: contract.id || contract.token || "",
        contractType: contract.contract_type || "custom",
        contractDate:
          contract.contract_date || new Date().toISOString().split("T")[0],
      };

      setForm(formData);

      // Set additional state
      if (contract.creator_name) {
        setCreatorName(contract.creator_name);
        setLocalCreatorName(contract.creator_name);
      } else if (userData?.fullName) {
        const fullName = `${userData.fullName}`;
        setCreatorName(fullName);
        setLocalCreatorName(fullName);
      }

      if (contract.creator_signature) {
        setCreatorSignature(contract.creator_signature);
        setLocalSignature(contract.creator_signature);
      }
      if (contract.include_lawyer_signature) {
        setIncludeLawyerSignature(contract.include_lawyer_signature);
      }

      // Check if contract is signed
      if (contract.status === "signed") {
        Swal.fire({
          icon: "info",
          title: "Contract Already Signed",
          text: "This contract has been signed. Editing is limited.",
          confirmButtonColor: "var(--color-accent-yellow)",
        });
      }
    } catch (error) {
      console.error("❌ Failed to fetch contract", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error instanceof Error ? error.message : "Failed to load contract",
        confirmButtonColor: "var(--color-accent-yellow)",
      }).then(() => {
        router.push("/dashboard/services/contract");
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contractId) {
      fetchContract();
    }
  }, [contractId]);

  useEffect(() => {
    if (
      form.contractTitle ||
      form.contractContent ||
      form.receiverName ||
      form.receiverEmail ||
      form.receiverPhone ||
      form.ageConsent ||
      form.termsConsent ||
      attachments.length > 0 ||
      localSignature
    ) {
      setHasUnsavedChanges(true);
    }
  }, [
    form.contractTitle,
    form.contractContent,
    form.receiverName,
    form.receiverEmail,
    form.receiverPhone,
    form.ageConsent,
    form.termsConsent,
    attachments.length,
    localSignature,
  ]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (
        hasUnsavedChanges &&
        (form.contractTitle.trim() ||
          form.contractContent.trim() ||
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
    attachments.length,
    localSignature,
  ]);

  const validateFormFields = (): boolean => {
    const newErrors = {
      contractTitle: "",
      receiverName: "",
      receiverEmail: "",
      contractContent: "",
      ageConsent: "",
      termsConsent: "",
    };

    let hasErrors = false;

    if (!form.contractTitle.trim()) {
      newErrors.contractTitle = "Contract title is required.";
      hasErrors = true;
    }

    if (!form.receiverName.trim()) {
      newErrors.receiverName = "Signer full name is required.";
      hasErrors = true;
    }

    if (!form.receiverEmail.trim()) {
      newErrors.receiverEmail = "Signee email is required.";
      hasErrors = true;
    } else if (form.receiverEmail.trim() === userData?.email) {
      newErrors.receiverEmail =
        "Sorry, the signee email address cannot be the same as the initiator's email address.";
      hasErrors = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.receiverEmail)) {
      newErrors.receiverEmail = "Invalid email format.";
      hasErrors = true;
    }

    if (!form.contractContent.trim()) {
      newErrors.contractContent = "Contract content cannot be empty.";
      hasErrors = true;
    }

    if (!form.ageConsent) {
      newErrors.ageConsent = "You must confirm you are 18 years or older.";
      hasErrors = true;
    }

    if (!form.termsConsent) {
      newErrors.termsConsent = "You must agree to the contract terms.";
      hasErrors = true;
    }

    setErrors(newErrors);
    return !hasErrors;
  };

  const validateSignature = (): boolean => {
    if (!localSignature) {
      Swal.fire({
        icon: "warning",
        title: "Signature Required",
        text: "Please add your signature in the form before submitting.",
        confirmButtonColor: "var(--color-accent-yellow)",
      });
      return false;
    }

    if (!creatorName.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Name Required",
        text: "Please enter your full legal name in the creator name field.",
        confirmButtonColor: "var(--color-accent-yellow)",
      });
      return false;
    }

    return true;
  };

  const updateContractInDatabase = async (): Promise<boolean> => {
    try {
      if (!userData?.id) {
        throw new Error("User not authenticated");
      }

      const payload = {
        id: contractId,
        contract_title: form.contractTitle,
        contract_text: form.contractContent,
        contract_date: form.contractDate,
        signee_name: form.receiverName,
        signee_email: form.receiverEmail,
        phone_number: form.receiverPhone
          ? parseFloat(form.receiverPhone.replace(/\D/g, ""))
          : null,
        age_consent: form.ageConsent,
        terms_consent: form.termsConsent,
        status: form.status,
        include_lawyer_signature: includeLawyerSignature,
        creator_name: creatorName,
        creator_signature: localSignature || creatorSignature,
      };

      const res = await fetch("/api/contract/update-contract", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      console.log("Update contract response:", result);

      if (!res.ok) {
        throw new Error(
          result.message || result.error || "Failed to update contract",
        );
      }

      return true;
    } catch (err) {
      console.error("Update contract error:", err);
      throw err;
    }
  };

  const handleUpdateContract = async () => {
    if (isFormLocked || saving) return;

    if (!validateFormFields()) {
      const errorMessages = [];
      if (errors.contractTitle) errorMessages.push(errors.contractTitle);
      if (errors.receiverName) errorMessages.push(errors.receiverName);
      if (errors.receiverEmail) errorMessages.push(errors.receiverEmail);
      if (errors.contractContent) errorMessages.push(errors.contractContent);
      if (errors.ageConsent) errorMessages.push(errors.ageConsent);
      if (errors.termsConsent) errorMessages.push(errors.termsConsent);

      if (errorMessages.length > 0) {
        Swal.fire({
          icon: "error",
          title: "Please fix the following errors:",
          html: errorMessages.map((msg) => `• ${msg}`).join("<br>"),
          confirmButtonColor: "var(--color-accent-yellow)",
        });
      }
      return;
    }

    const signatureValid = validateSignature();
    if (!signatureValid) {
      return;
    }

    setSaving(true);
    setIsFormLocked(true);

    try {
      const updateSuccess = await updateContractInDatabase();

      if (updateSuccess) {
        Swal.fire({
          icon: "success",
          title: "Contract Updated!",
          html: `
            <div class="text-center">
              <p>Your contract has been updated successfully.</p>
              <p class="text-sm text-(--text-secondary) mt-2">
                <strong>Contract ID:</strong> ${form.contractId}
              </p>
            </div>
          `,
          confirmButtonColor: "var(--color-accent-yellow)",
          timer: 3000,
          showConfirmButton: false,
        }).then(() => {
          setHasUnsavedChanges(false);
          setIsFormLocked(false);
          router.push("/dashboard/services/contract");
        });
      }
    } catch (error) {
      console.error("Error updating contract:", error);
      setIsFormLocked(false);
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: "Failed to update contract. Please try again.",
        confirmButtonColor: "var(--color-accent-yellow)",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFormChange = (field: keyof FormState, value: any) => {
    if (isFormLocked || isSigned) return;
    setForm((prev) => ({ ...prev, [field]: value }));
    const errorField = field as keyof typeof errors;
    if (errors[errorField]) {
      setErrors((prev) => ({ ...prev, [errorField]: "" }));
    }
  };

  const resetForm = () => {
    if (isFormLocked) {
      Swal.fire({
        icon: "warning",
        title: "Form is Processing",
        text: "Cannot reset form while processing is in progress.",
        confirmButtonColor: "var(--color-accent-yellow)",
      });
      return;
    }

    Swal.fire({
      title: "Reset Changes?",
      text: "This will discard all unsaved changes and reload the original contract.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "var(--color-accent-yellow)",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Reset",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        fetchContract();
        setHasUnsavedChanges(false);

        Swal.fire({
          icon: "success",
          title: "Changes Reset",
          text: "All changes have been discarded.",
          confirmButtonColor: "var(--color-accent-yellow)",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    });
  };

  const handleCancel = () => {
    if (isFormLocked) {
      Swal.fire({
        icon: "warning",
        title: "Form is Processing",
        text: "Cannot cancel while processing is in progress.",
        confirmButtonColor: "var(--color-accent-yellow)",
      });
      return;
    }

    if (hasUnsavedChanges) {
      Swal.fire({
        title: "Discard Changes?",
        text: "You have unsaved changes. Are you sure you want to leave?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "var(--color-accent-yellow)",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, Discard",
        cancelButtonText: "Continue Editing",
      }).then((result) => {
        if (result.isConfirmed) {
          router.push("/dashboard/services/contract");
        }
      });
    } else {
      router.push("/dashboard/services/contract");
    }
  };

  const handleCreatorNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isFormLocked || isSigned) return;
    const name = e.target.value;
    setLocalCreatorName(name);
    setCreatorName(name);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }

  const isSigned = form.status === "signed";

  return (
    <>
      <div className="min-h-screen bg-(--bg-primary)">
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="text-(--color-accent-yellow) hover:bg-(--bg-secondary) text-sm md:text-base"
                disabled={isFormLocked}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="hidden md:block">Back to Contracts</span>
              </Button>

              <div>
                <h1 className="md:text-3xl text-xl font-bold mb-2 text-(--text-primary)">
                  Edit Contract
                </h1>
                <p className="text-(--text-secondary)">
                  Update and manage your contract details
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {hasUnsavedChanges && (
                <Badge
                  variant="outline"
                  className="bg-yellow-50 text-yellow-700 border-yellow-200"
                >
                  <AlertTriangle className="w-3 h-3 mr-1" />
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
                  className="bg-(--color-lemon-green)/10 text-(--color-lemon-green) border-(--color-lemon-green)/20"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Signed
                </Badge>
              )}
              <Badge
                variant="outline"
                className={`
                  ${
                    form.status === "signed"
                      ? "bg-(--color-lemon-green)/10 text-(--color-lemon-green) border-(--color-lemon-green)/20"
                      : form.status === "pending"
                        ? "bg-(--color-accent-yellow)/10 text-(--color-accent-yellow) border-(--color-accent-yellow)/20"
                        : "bg-(--bg-secondary) text-(--text-secondary) border-(--border-color)"
                  }
                `}
              >
                {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
              </Badge>
            </div>
          </div>

          {isSigned && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                <p className="text-yellow-800 text-sm">
                  <strong>Note:</strong> This contract has been signed. You can
                  view and download it, but editing is limited.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-center">
            <div className="w-full max-w-3xl lg:max-w-4xl">
              <Card className="p-6 h-fit bg-(--bg-primary) border border-(--border-color) shadow-soft squircle-lg">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetForm}
                      disabled={!hasUnsavedChanges || isFormLocked || isSigned}
                      className="text-(--text-secondary) hover:text-(--text-primary) disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Reset Changes
                    </Button>
                  </div>
                  <div className="text-sm text-(--text-secondary)">
                    Contract ID: {form.contractId}
                  </div>
                </div>

                <Tabs
                  value={activeTab}
                  onValueChange={(value) => {
                    if (isFormLocked) return;
                    setActiveTab(value);
                  }}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2 mb-8">
                    <TabsTrigger
                      value="create"
                      className="gap-2"
                      disabled={isFormLocked}
                    >
                      <Edit className="h-4 w-4" />
                      Edit Contract
                    </TabsTrigger>
                    <TabsTrigger
                      value="preview"
                      className="gap-2"
                      disabled={isFormLocked}
                    >
                      <Eye className="h-4 w-4" />
                      Preview
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="create" className="space-y-6">
                    <section className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-lg font-medium text-(--text-primary)">
                          Contract Details
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveTab("preview")}
                          disabled={!form.contractContent || isFormLocked}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                      </div>

                      <div className="p-4 bg-(--bg-secondary) border border-(--border-color) rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-(--text-primary)">
                              Your Saved Signature
                            </p>
                            <p className="text-xs text-(--text-secondary) mt-1">
                              Load your saved signature to use in this contract
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={loadSignatureManually}
                            disabled={
                              !userData?.id ||
                              !!localSignature ||
                              isFormLocked ||
                              isSigned
                            }
                            className="border-(--border-color) text-(--text-primary) hover:bg-(--bg-secondary)"
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
                          <div className="mt-3 p-3 bg-(--bg-primary) border border-(--color-lemon-green)/30 rounded-lg">
                            <div className="flex items-center">
                              <div className="h-6 w-6 bg-(--color-lemon-green)/10 rounded-full flex items-center justify-center mr-2">
                                <Check className="h-4 w-4 text-(--color-lemon-green)" />
                              </div>
                              <p className="text-sm text-(--color-lemon-green)">
                                Signature loaded successfully!
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex md:flex-row flex-col gap-3">
                        <div className="space-y-2 w-full">
                          <Label
                            htmlFor="creator-name"
                            className="text-(--text-primary) font-medium"
                          >
                            PARTY A (Creator) *
                          </Label>
                          <Input
                            id="creator-name"
                            value={localCreatorName}
                            onChange={handleCreatorNameChange}
                            placeholder="Enter your full legal name as it should appear on the contract"
                            disabled={isFormLocked || isSigned}
                            className="border-(--border-color) bg-(--bg-primary) text-(--text-primary) focus:ring-(--color-accent-yellow) focus:border-(--color-accent-yellow)"
                            style={{ outline: "none", boxShadow: "none" }}
                          />
                        </div>

                        <div className="space-y-2 w-full">
                          <Label
                            htmlFor="receiver-name"
                            className="text-(--text-primary) font-medium"
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
                            disabled={isFormLocked || isSigned}
                            className="border-(--border-color) bg-(--bg-primary) text-(--text-primary) focus:ring-(--color-accent-yellow) focus:border-(--color-accent-yellow)"
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
                          <div className="space-y-1">
                            <Label
                              htmlFor="contract-date"
                              className="text-xs font-medium text-(--text-secondary)"
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
                              className="w-full border-(--border-color) bg-(--bg-primary) text-(--text-primary) focus:ring-(--color-accent-yellow) focus:border-(--color-accent-yellow)"
                              style={{ outline: "none", boxShadow: "none" }}
                              max={new Date().toISOString().split("T")[0]}
                              disabled={isFormLocked || isSigned}
                            />
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
                            // disabled={isFormLocked || isSigned}
                          />
                          {errors.receiverEmail && (
                            <p className="text-xs text-red-500 mt-1">
                              {errors.receiverEmail}
                            </p>
                          )}
                        </div>
                        <div>
                          <SignContractInput
                            label="Phone Number (Optional)"
                            placeholder="+234 000 000 0000"
                            id={"receiver-phone"}
                            value={form.receiverPhone}
                            onchange={(e) =>
                              handleFormChange("receiverPhone", e.target.value)
                            }
                            // disabled={isFormLocked || isSigned}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        <div className="w-full">
                          <Label className="block text-xs font-medium text-(--text-secondary) mb-2">
                            Contract Title{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            value={form.contractTitle}
                            onChange={(e) =>
                              handleFormChange("contractTitle", e.target.value)
                            }
                            placeholder="Enter contract title"
                            disabled={isFormLocked || isSigned}
                            className="border-(--border-color) bg-(--bg-primary) text-(--text-primary) focus:ring-(--color-accent-yellow) focus:border-(--color-accent-yellow)"
                            style={{ outline: "none", boxShadow: "none" }}
                          />
                          {errors.contractTitle && (
                            <p className="text-xs text-red-500 mt-1">
                              {errors.contractTitle}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <Label className="block text-xs font-medium text-(--text-secondary)">
                            Contract Content{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <span className="text-xs text-(--text-secondary)">
                            {form.contractContent.length} characters
                          </span>
                        </div>
                        <RichTextArea
                          value={form.contractContent}
                          onChange={(value) =>
                            handleFormChange("contractContent", value)
                          }
                          // disabled={isFormLocked || isSigned}
                        />
                        {errors.contractContent && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.contractContent}
                          </p>
                        )}
                      </div>

                      {attachments.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-(--border-color)">
                          <h4 className="text-lg font-medium text-(--text-primary) mb-4">
                            Attachments ({attachments.length})
                          </h4>
                          <div className="space-y-3">
                            {attachments.map((attachment, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-3 border border-(--border-color) rounded-lg hover:bg-(--bg-secondary)"
                              >
                                <div className="flex items-center">
                                  <FileText className="h-5 w-5 text-(--text-secondary) mr-3" />
                                  <div>
                                    <p className="text-sm font-medium text-(--text-primary)">
                                      {attachment.name}
                                    </p>
                                    <p className="text-xs text-(--text-secondary)">
                                      {(attachment.size / 1024).toFixed(2)} KB •{" "}
                                      {attachment.type}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-(--text-secondary) mt-2">
                            Note: Attachments cannot be modified in edit mode
                          </p>
                        </div>
                      )}
                    </section>

                    <section className="space-y-4">
                      <h4 className="text-lg font-medium text-(--text-primary)">
                        Consent Declarations
                      </h4>
                      <SignContractToggle
                        ageConsent={form.ageConsent}
                        setAgeConsent={(value) =>
                          handleFormChange("ageConsent", value)
                        }
                        setTermsConsent={(value) =>
                          handleFormChange("termsConsent", value)
                        }
                        termsConsent={form.termsConsent}
                        disabled={isFormLocked || isSigned}
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

                    {/* Signature Section */}
                    <section className="border border-(--border-color) rounded-lg p-6 bg-(--bg-secondary) print:hidden">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                        <div className="mb-4 sm:mb-0">
                          <h4 className="text-lg font-semibold text-(--text-primary)">
                            Add Your Signature
                          </h4>
                          <p className="text-sm text-(--text-secondary)">
                            Draw or upload your signature to complete the
                            contract
                          </p>
                        </div>
                        {localSignature && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearSignature}
                            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 w-full sm:w-auto"
                            disabled={isFormLocked || isSigned}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Clear Signature
                          </Button>
                        )}
                      </div>

                      {/* Load Saved Signature Button */}
                      {userData?.id && !localSignature && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-blue-800">
                                Saved Signature Available
                              </p>
                              <p className="text-xs text-blue-600 mt-1">
                                You have a signature saved for future use. Would
                                you like to load it?
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={loadSignatureManually}
                              className="border-blue-300 text-blue-700 hover:bg-blue-100"
                              disabled={isFormLocked || isSigned}
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
                          onChange={(signature) =>
                            handleSignatureChange(signature)
                          }
                          label="Your Signature"
                          disabled={isFormLocked || isSigned}
                        />

                        {/* Save Signature Toggle */}
                        {userData?.id && !isSigned && (
                          <div className="flex items-center space-x-3 p-4 bg-(--bg-primary) border border-(--border-color) rounded-lg">
                            <Switch
                              id="save-signature-toggle"
                              checked={saveSignatureForFuture}
                              onCheckedChange={handleSaveSignatureToggle}
                              className="data-[state=checked]:bg-(--color-accent-yellow)"
                              disabled={
                                (!localSignature && saveSignatureForFuture) ||
                                isFormLocked ||
                                isSigned
                              }
                            />
                            <div className="space-y-1 flex-1">
                              <Label
                                htmlFor="save-signature-toggle"
                                className="cursor-pointer text-sm font-medium text-(--text-primary)"
                              >
                                Save signature for future use
                              </Label>
                              <p className="text-xs text-(--text-secondary)">
                                Your signature will be securely stored and
                                automatically loaded for future contracts
                              </p>
                              {!localSignature && saveSignatureForFuture && (
                                <p className="text-xs text-amber-600 mt-1">
                                  Please create a signature first to enable
                                  saving
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </section>

                    <div className="flex gap-3 pt-4 border-t border-(--border-color)">
                      <Button
                        onClick={handleCancel}
                        variant="outline"
                        size="lg"
                        className="flex-1"
                        disabled={saving || isFormLocked}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleUpdateContract}
                        size="lg"
                        className="flex-1 bg-(--color-accent-yellow) hover:bg-(--color-accent-yellow)/90 text-(--color-ink)"
                        disabled={saving || isFormLocked || isSigned}
                      >
                        {saving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Update Contract
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
                      disabled={isFormLocked || isSigned}
                    />
                  </TabsContent>
                </Tabs>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
