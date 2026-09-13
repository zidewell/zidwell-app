// app/dashboard/services/payment/edit/[id]/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import {
  ArrowLeft,
  Save,
  Loader2,
  X,
  ImagePlus,
  AlertCircle,
  Eye,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { useStore, Student, FeeItem } from "@/app/hooks/useStore";
import DashboardSidebar from "@/app/components/dashboard-component/DashboardSidebar";
import DashboardHeader from "@/app/components/dashboard-component/DashboardHeader";
import SchoolFields from "@/app/components/payment-page-components/SchoolFields";
import RichTextArea from "@/app/components/payment-page-components/RichTextArea";

const baseUrl =
  process.env.NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_DEV_URL || "http://localhost:3000"
    : process.env.NEXT_PUBLIC_BASE_URL || "https://zidwell.com";

const typeLabels: Record<string, string> = {
  school: "School Fees",
  donation: "Donation",
  physical: "Physical Product",
  digital: "Digital Product",
  services: "Service",
  real_estate: "Real Estate Investment",
  stock: "Stock Investment",
  savings: "Savings / Ajo",
  crypto: "Crypto Investment",
  link: "Payment Link",
};

const IMAGE_SPECS = "1350 x 1080 (5:4) — max 10MB";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

// ─── Upload helper ───
// Handles both already-uploaded URLs and raw base64 data URLs.
async function uploadImageIfNeeded(
  image: string,
  type: string
): Promise<string | null> {
  if (!image) return null;

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  if (!image.startsWith("data:image")) {
    return null;
  }

  try {
    const res = await fetch("/api/payment-page/upload-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image, type }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.url || null;
  } catch (err) {
    console.error("Upload failed:", err);
    return null;
  }
}

const EditPaymentPage = () => {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { updatePage, getPageDetails } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState<any>(null);

  // ─── Form state ───
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [productImages, setProductImages] = useState<string[]>([]);
  const [price, setPrice] = useState("");
  const [priceType, setPriceType] = useState<"fixed" | "installment">("fixed");
  const [installmentCount, setInstallmentCount] = useState("3");
  const [installmentAmount, setInstallmentAmount] = useState(0);
  const [installmentPeriod, setInstallmentPeriod] = useState("monthly");

  // ─── School fields ───
  const [students, setStudents] = useState<Student[]>([]);
  const [schoolClass, setSchoolClass] = useState("");
  const [feeBreakdown, setFeeBreakdown] = useState<FeeItem[]>([]);
  const [requiredFields, setRequiredFields] = useState<string[]>([]);

  // ─── Digital fields ───
  const [downloadUrl, setDownloadUrl] = useState("");
  const [accessLink, setAccessLink] = useState("");
  const [emailDelivery, setEmailDelivery] = useState(true);

  // ─── Physical fields ───
  const [requiresShipping, setRequiresShipping] = useState(true);

  // ─── Services fields ───
  const [bookingEnabled, setBookingEnabled] = useState(false);
  const [customerNoteEnabled, setCustomerNoteEnabled] = useState(true);

  // ─── Stock ───
  const [stock, setStock] = useState<number | null>(null);
  const [allowMultiple, setAllowMultiple] = useState(true);

  const productRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) loadPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadPage = async () => {
    try {
      const pageData = await getPageDetails(id);
      if (!pageData) return;

      setPage(pageData);
      setTitle(pageData.title || "");
      setDescription(pageData.description || "");
      setProductImages(pageData.productImages || []);
      setPrice(pageData.price?.toString() || "");
      setPriceType(
        pageData.priceType === "installment" ? "installment" : "fixed"
      );
      setInstallmentCount(pageData.installmentCount?.toString() || "3");

      const meta = pageData.metadata || {};

      // School
      setStudents(meta.students || []);
      setSchoolClass(meta.className || "");
      setFeeBreakdown(meta.feeBreakdown || []);
      setRequiredFields(meta.requiredFields || []);

      // Installment
      if (meta.installmentPeriod) setInstallmentPeriod(meta.installmentPeriod);
      if (meta.installmentAmount)
        setInstallmentAmount(Number(meta.installmentAmount));

      // Digital
      if (meta.downloadUrl !== undefined)
        setDownloadUrl(meta.downloadUrl || "");
      if (meta.accessLink !== undefined) setAccessLink(meta.accessLink || "");
      if (meta.emailDelivery !== undefined)
        setEmailDelivery(meta.emailDelivery !== false);

      // Physical
      if (meta.requiresShipping !== undefined) {
        setRequiresShipping(meta.requiresShipping !== false);
      }

      // Services
      if (meta.bookingEnabled !== undefined) {
        setBookingEnabled(meta.bookingEnabled === true);
      }
      if (meta.customerNoteEnabled !== undefined) {
        setCustomerNoteEnabled(meta.customerNoteEnabled !== false);
      }

      // Stock
      if (meta.stock !== undefined && meta.stock !== null) {
        setStock(Number(meta.stock));
      }
      if (meta.allowMultiple !== undefined) {
        setAllowMultiple(meta.allowMultiple !== false);
      }
    } catch (error: any) {
      console.error("Error loading page:", error);
      await Swal.fire({
        icon: "error",
        title: "Failed to Load",
        text: error.message || "Could not load the page data.",
        confirmButtonColor: "#FDC020",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const total = Number(price) || 0;
    const count = Number(installmentCount) || 1;
    if (total > 0 && count > 0) {
      setInstallmentAmount(Math.round((total / count) * 100) / 100);
    } else {
      setInstallmentAmount(0);
    }
  }, [price, installmentCount]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const processFile = (file: File): Promise<string | null> => {
      return new Promise((resolve) => {
        if (file.size > MAX_IMAGE_BYTES) {
          Swal.fire({
            icon: "warning",
            title: "File Too Large",
            text: `"${file.name}" exceeds 10MB. Please compress it.`,
            confirmButtonColor: "#FDC020",
          });
          resolve(null);
          return;
        }
        const reader = new FileReader();
        reader.onload = (ev) =>
          resolve((ev.target?.result as string) || null);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
    };

    Promise.all(Array.from(files).map(processFile)).then((results) => {
      const valid = results.filter((r): r is string => r !== null);
      if (valid.length > 0) {
        setProductImages((prev) => [...prev, ...valid]);
      }
    });

    e.target.value = "";
  };

  const removeProductImage = (index: number) => {
    setProductImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      await Swal.fire({
        icon: "warning",
        title: "Title Required",
        text: "Please enter a page title before saving.",
        confirmButtonColor: "#FDC020",
      });
      return;
    }

    setSaving(true);

    try {
      // ─── Upload any new base64 images ───
      const uploadedProductImages: string[] = [];
      for (const img of productImages) {
        const url = await uploadImageIfNeeded(img, "products");
        if (url) uploadedProductImages.push(url);
      }

      // ─── Build metadata (merged with existing) ───
      const existingMeta = page?.metadata || {};
      const metadata: any = {
        ...existingMeta,
      };

      // School
      if (page?.pageType === "school") {
        metadata.students = students;
        metadata.className = schoolClass;
        metadata.feeBreakdown = feeBreakdown;
        metadata.requiredFields = requiredFields;
      }

      // Digital
      if (page?.pageType === "digital") {
        metadata.downloadUrl = downloadUrl || null;
        metadata.accessLink = accessLink || null;
        metadata.emailDelivery = emailDelivery;
      }

      // Physical
      if (page?.pageType === "physical") {
        metadata.requiresShipping = requiresShipping;
      }

      // Services
      if (page?.pageType === "services") {
        metadata.bookingEnabled = bookingEnabled;
        metadata.customerNoteEnabled = customerNoteEnabled;
      }

      // Stock (physical, digital, services, investments)
      if (
        [
          "physical",
          "digital",
          "services",
          "real_estate",
          "stock",
          "savings",
          "crypto",
        ].includes(page?.pageType || "")
      ) {
        metadata.stock = stock;
        metadata.allowMultiple = allowMultiple;
      }

      // Installment
      if (priceType === "installment") {
        const count = Number(installmentCount) || 1;
        const total = Number(price) || 0;
        metadata.installmentCount = count;
        metadata.installmentAmount =
          count > 0 ? Math.round((total / count) * 100) / 100 : 0;
        metadata.installmentPeriod = installmentPeriod;
        metadata.totalAmount = total;
      } else if (priceType === "fixed") {
        delete metadata.installmentCount;
        delete metadata.installmentAmount;
        delete metadata.installmentPeriod;
        delete metadata.totalAmount;
      }

      // ─── Update payload (coverImage and logo intentionally omitted
      //     so the API preserves the existing ones) ───
      const updateData = {
        title: title.trim(),
        description,
        productImages: uploadedProductImages,
        priceType,
        price: Number(price) || 0,
        installmentCount:
          priceType === "installment" ? Number(installmentCount) : undefined,
        metadata,
      };

      await updatePage(id, updateData);

      await Swal.fire({
        icon: "success",
        title: "Page Updated",
        text: "Your changes have been saved successfully.",
        confirmButtonColor: "#FDC020",
        confirmButtonText: "Done",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });

      router.push(`/dashboard/services/payment/page/${id}`);
    } catch (error: any) {
      console.error("Error updating page:", error);
      await Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: error.message || "Something went wrong. Please try again.",
        confirmButtonColor: "#FDC020",
        confirmButtonText: "OK",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#FDC020]" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2">Page not found</h1>
          <Button
            onClick={() => router.push("/dashboard/services/payment/dashboard")}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const isSchool = page.pageType === "school";
  const isDonation = page.pageType === "donation";
  const isDigital = page.pageType === "digital";
  const isPhysical = page.pageType === "physical";
  const isServices = page.pageType === "services";
  const showStock = [
    "physical",
    "digital",
    "services",
    "real_estate",
    "stock",
    "savings",
    "crypto",
  ].includes(page.pageType);

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-72 min-h-screen flex flex-col">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-3xl mx-auto">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 pb-32"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Edit {typeLabels[page.pageType] || "Page"}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    {page.slug}
                  </p>
                </div>
                <a
                  href={`/store/${page.metadata?.storeSlug || ""}/${page.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm hover:bg-muted transition-colors"
                >
                  <Eye className="h-4 w-4" /> View
                </a>
              </div>

              {/* ─── Title ─── */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">
                  Page Title *
                </Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter page title"
                  className="h-12"
                />
              </div>

              {/* ─── Description ─── */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">
                  Description
                </Label>
                <RichTextArea
                  value={description}
                  onChange={setDescription}
                  placeholder="Describe your page"
                  minHeight="200px"
                />
              </div>

              {/* ─── Product Images ─── */}
              {!isDonation && !isSchool && (
                <div>
                  <Label className="text-sm font-semibold mb-2 block">
                    Product Images
                  </Label>
                  <input
                    type="file"
                    ref={productRef}
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                  />
                  <div className="flex gap-3 flex-wrap mb-3">
                    {productImages.map((img, i) => (
                      <div
                        key={i}
                        className="relative h-20 w-20 rounded-lg overflow-hidden border border-border"
                      >
                        <img
                          src={img}
                          className="w-full h-full object-cover"
                          alt={`Product ${i + 1}`}
                        />
                        <button
                          onClick={() => removeProductImage(i)}
                          type="button"
                          className="absolute top-0 right-0 p-0.5 bg-red-500 rounded-full text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => productRef.current?.click()}
                      type="button"
                      className="h-20 w-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center hover:border-[#FDC020] transition-colors"
                    >
                      <ImagePlus className="h-5 w-5 text-muted-foreground" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {IMAGE_SPECS}
                  </p>
                </div>
              )}

              {/* ─── School Specific Fields ─── */}
              {isSchool && (
                <SchoolFields
                  students={students}
                  setStudents={setStudents}
                  className={schoolClass}
                  setClassName={setSchoolClass}
                  feeBreakdown={feeBreakdown}
                  setFeeBreakdown={setFeeBreakdown}
                  requiredFields={requiredFields}
                  setRequiredFields={setRequiredFields}
                />
              )}

              {/* ─── Digital Specific Fields ─── */}
              {isDigital && (
                <div className="space-y-4 p-5 rounded-2xl border border-border bg-card">
                  <h3 className="text-sm font-bold">Delivery</h3>

                  <div>
                    <Label className="text-sm font-medium mb-1.5 block">
                      Download URL
                    </Label>
                    <Input
                      value={downloadUrl}
                      onChange={(e) => setDownloadUrl(e.target.value)}
                      placeholder="https://drive.google.com/file/..."
                      className="h-11"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Link to the file buyers get after payment
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-1.5 block">
                      Access Link (alternative)
                    </Label>
                    <Input
                      value={accessLink}
                      onChange={(e) => setAccessLink(e.target.value)}
                      placeholder="https://your-course.com/access"
                      className="h-11"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailDelivery}
                      onChange={(e) => setEmailDelivery(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">
                      Send the download link via email after payment
                    </span>
                  </label>
                </div>
              )}

              {/* ─── Physical Specific Fields ─── */}
              {isPhysical && (
                <div className="space-y-4 p-5 rounded-2xl border border-border bg-card">
                  <h3 className="text-sm font-bold">Shipping</h3>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requiresShipping}
                      onChange={(e) => setRequiresShipping(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">
                      Collect the buyer's delivery address at checkout
                    </span>
                  </label>
                </div>
              )}

              {/* ─── Services Specific Fields ─── */}
              {isServices && (
                <div className="space-y-4 p-5 rounded-2xl border border-border bg-card">
                  <h3 className="text-sm font-bold">Service options</h3>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bookingEnabled}
                      onChange={(e) => setBookingEnabled(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">
                      Let customers pick a date & time
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customerNoteEnabled}
                      onChange={(e) =>
                        setCustomerNoteEnabled(e.target.checked)
                      }
                      className="rounded"
                    />
                    <span className="text-sm">
                      Allow customers to leave a note about their request
                    </span>
                  </label>
                </div>
              )}

              {/* ─── Stock ─── */}
              {showStock && (
                <div className="space-y-4 p-5 rounded-2xl border border-border bg-card">
                  <h3 className="text-sm font-bold">Inventory</h3>

                  <div>
                    <Label className="text-sm font-medium mb-1.5 block">
                      Available Quantity
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        min={0}
                        value={stock === null ? "" : stock}
                        onChange={(e) => {
                          const val = e.target.value;
                          setStock(
                            val === "" ? null : Math.max(0, parseInt(val) || 0)
                          );
                        }}
                        placeholder="Leave empty for unlimited"
                        className="h-11"
                      />
                      {stock !== null && (
                        <button
                          type="button"
                          onClick={() => setStock(null)}
                          className="text-xs text-muted-foreground hover:text-foreground underline whitespace-nowrap"
                        >
                          Unlimited
                        </button>
                      )}
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowMultiple}
                      onChange={(e) => setAllowMultiple(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">
                      Allow buying multiple units at once
                    </span>
                  </label>
                </div>
              )}

              {/* ─── Pricing ─── */}
              {!isDonation && (
                <>
                  <div>
                    <Label className="text-sm font-semibold mb-3 block">
                      Pricing
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPriceType("fixed")}
                        className={`p-3 rounded-xl border-2 transition-colors ${
                          priceType === "fixed"
                            ? "border-[#FDC020] bg-[#FDC020]/10"
                            : "border-border hover:border-[#FDC020]/50"
                        }`}
                      >
                        Fixed Price
                      </button>
                      <button
                        type="button"
                        onClick={() => setPriceType("installment")}
                        className={`p-3 rounded-xl border-2 transition-colors ${
                          priceType === "installment"
                            ? "border-[#FDC020] bg-[#FDC020]/10"
                            : "border-border hover:border-[#FDC020]/50"
                        }`}
                      >
                        Installment
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label className="text-sm font-semibold mb-2 block">
                        {priceType === "installment"
                          ? "Total Amount (₦)"
                          : "Amount (₦)"}
                      </Label>
                      <Input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="0.00"
                        className="h-12"
                        disabled={isSchool}
                      />
                      {isSchool && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Amount is calculated from the fee breakdown
                        </p>
                      )}
                    </div>
                    {priceType === "installment" && (
                      <>
                        <div className="w-32">
                          <Label className="text-sm font-semibold mb-2 block">
                            Installments
                          </Label>
                          <Input
                            type="number"
                            value={installmentCount}
                            onChange={(e) =>
                              setInstallmentCount(e.target.value)
                            }
                            min={2}
                            max={24}
                            className="h-12"
                          />
                        </div>
                        <div className="w-32">
                          <Label className="text-sm font-semibold mb-2 block">
                            Period
                          </Label>
                          <select
                            value={installmentPeriod}
                            onChange={(e) =>
                              setInstallmentPeriod(e.target.value)
                            }
                            className="h-12 w-full rounded-xl border border-border bg-background px-3"
                          >
                            <option value="weekly">Weekly</option>
                            <option value="bi-weekly">Bi-Weekly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>

                  {priceType === "installment" && installmentAmount > 0 && (
                    <div className="p-4 rounded-xl bg-[#FDC020]/10 border border-[#FDC020]/20">
                      <p className="text-sm">
                        Customer pays{" "}
                        <strong>₦{installmentAmount.toLocaleString()}</strong>{" "}
                        per installment
                      </p>
                    </div>
                  )}

                  {priceType === "installment" &&
                    page?.metadata?.installmentState &&
                    Object.keys(page.metadata.installmentState).length > 0 && (
                      <div className="flex items-start gap-2 p-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10">
                        <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
                            Existing payments on this plan
                          </p>
                          <p className="text-xs text-yellow-700/80 dark:text-yellow-400/70 mt-0.5">
                            Buyers have already made payments. Changing the
                            plan structure won't reset their balance. The
                            account table remains the source of truth.
                          </p>
                        </div>
                      </div>
                    )}
                </>
              )}
            </motion.div>
          </div>
        </main>

        {/* ─── Sticky Save Button ─── */}
        <div className="fixed bottom-0 left-0 right-0 lg:left-72 bg-card/90 backdrop-blur-lg border-t border-border p-4 z-40">
          <div className="max-w-3xl mx-auto">
            <Button
              variant="default"
              size="lg"
              className="w-full py-6 text-base bg-[#FDC020] text-[#191919] hover:bg-[#e6a800] disabled:opacity-50"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" /> Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditPaymentPage;