"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Save,
  Loader2,
  X,
  Plus,
  Trash2,
  Upload,
  ImagePlus,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import { useStore, PageType, Student, FeeItem } from "@/app/hooks/useStore";
import DashboardSidebar from "@/app/components/dashboard-component/DashboardSidebar";
import DashboardHeader from "@/app/components/dashboard-component/DashboardHeader";
import SchoolFields from "@/app/components/payment-page-components/SchoolFields";

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

const EditPaymentPage = () => {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { pages, updatePage, getPageDetails } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState<any>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [price, setPrice] = useState("");
  const [priceType, setPriceType] = useState<"fixed" | "installment">("fixed");
  const [installmentCount, setInstallmentCount] = useState("3");
  const [installmentAmount, setInstallmentAmount] = useState(0);
  const [installmentPeriod, setInstallmentPeriod] = useState("monthly");

  // School fields
  const [students, setStudents] = useState<Student[]>([]);
  const [schoolClass, setSchoolClass] = useState("");
  const [feeBreakdown, setFeeBreakdown] = useState<FeeItem[]>([]);
  const [requiredFields, setRequiredFields] = useState<string[]>([]);

  const coverRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const productRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPage();
  }, [id]);

  const loadPage = async () => {
    try {
      const pageData = await getPageDetails(id);
      if (pageData) {
        setPage(pageData);
        setTitle(pageData.title || "");
        setDescription(pageData.description || "");
        setCoverImage(pageData.coverImage || null);
        setLogo(pageData.logo || null);
        setProductImages(pageData.productImages || []);
        setPrice(pageData.price?.toString() || "");
        setPriceType(pageData.priceType || "fixed");
        setInstallmentCount(pageData.installmentCount?.toString() || "3");

        if (pageData.metadata) {
          setStudents(pageData.metadata.students || []);
          setSchoolClass(pageData.metadata.className || "");
          setFeeBreakdown(pageData.metadata.feeBreakdown || []);
          setRequiredFields(pageData.metadata.requiredFields || []);
          
          if (pageData.metadata.installmentPeriod) {
            setInstallmentPeriod(pageData.metadata.installmentPeriod);
          }
          if (pageData.metadata.installmentAmount) {
            setInstallmentAmount(pageData.metadata.installmentAmount);
          }
        }
      }
    } catch (error) {
      console.error("Error loading page:", error);
      alert("Failed to load page data");
    } finally {
      setLoading(false);
    }
  };

  const calculateInstallmentAmount = () => {
    const total = Number(price) || 0;
    const count = Number(installmentCount) || 1;
    if (total > 0 && count > 0) {
      setInstallmentAmount(Math.round((total / count) * 100) / 100);
    } else {
      setInstallmentAmount(0);
    }
  };

  useEffect(() => {
    calculateInstallmentAmount();
  }, [price, installmentCount]);

  const handleImageSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "cover" | "logo" | "product"
  ) => {
    const files = e.target.files;
    if (!files) return;

    if (type === "cover") {
      const reader = new FileReader();
      reader.onload = (ev) => setCoverImage(ev.target?.result as string);
      reader.readAsDataURL(files[0]);
    } else if (type === "logo") {
      const reader = new FileReader();
      reader.onload = (ev) => setLogo(ev.target?.result as string);
      reader.readAsDataURL(files[0]);
    } else if (type === "product") {
      const newImages = [...productImages];
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          newImages.push(ev.target?.result as string);
          setProductImages(newImages);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeProductImage = (index: number) => {
    setProductImages(productImages.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert("Please enter a page title");
      return;
    }

    setSaving(true);
    try {
      const metadata: any = {
        students,
        className: schoolClass,
        requiredFields,
        feeBreakdown,
      };

      if (priceType === "installment") {
        metadata.installmentCount = Number(installmentCount);
        metadata.installmentAmount = installmentAmount;
        metadata.installmentPeriod = installmentPeriod;
        metadata.totalAmount = Number(price);
      }

      const updateData = {
        title,
        description,
        coverImage,
        logo,
        productImages,
        priceType,
        price: Number(price) || 0,
        installmentCount: priceType === "installment" ? Number(installmentCount) : undefined,
        metadata,
      };

      await updatePage(id, updateData);
      alert("Page updated successfully!");
      router.push(`/dashboard/services/payment/page/${id}`);
    } catch (error: any) {
      console.error("Error updating page:", error);
      alert(error.message || "Failed to update page");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen dark:bg-[#0e0e0e] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-(--color-accent-yellow)" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen dark:bg-[#0e0e0e] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2">Page not found</h1>
          <Button onClick={() => router.push("/dashboard/services/payment/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark:bg-[#0e0e0e]">
      <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-72 min-h-screen flex flex-col">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-3xl mx-auto">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-sm text-(--text-secondary) hover:text-(--color-accent-yellow) mb-6"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 pb-32"
            >
              <h1 className="text-2xl font-bold text-(--text-primary)">
                Edit {typeLabels[page.pageType]} Page
              </h1>

              {/* Cover Image */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">Cover Image</Label>
                <input
                  type="file"
                  ref={coverRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleImageSelect(e, "cover")}
                />
                {coverImage ? (
                  <div className="relative">
                    <img
                      src={coverImage}
                      alt="Cover"
                      className="w-full h-48 rounded-xl object-cover"
                    />
                    <button
                      onClick={() => setCoverImage(null)}
                      className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => coverRef.current?.click()}
                    className="w-full h-32 rounded-xl border-2 border-dashed border-(--border-color) flex flex-col items-center justify-center gap-2 hover:border-(--color-accent-yellow)"
                  >
                    <Upload className="h-6 w-6 text-(--text-secondary)" />
                    <span className="text-sm text-(--text-secondary)">Upload Cover Image</span>
                  </button>
                )}
              </div>

              {/* Logo */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">Logo</Label>
                <input
                  type="file"
                  ref={logoRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleImageSelect(e, "logo")}
                />
                <div className="flex items-center gap-4">
                  {logo && (
                    <div className="relative">
                      <img src={logo} alt="Logo" className="h-16 w-16 rounded-xl object-cover" />
                      <button
                        onClick={() => setLogo(null)}
                        className="absolute -top-1 -right-1 p-0.5 bg-red-500 rounded-full text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => logoRef.current?.click()}
                    className="px-4 py-2 rounded-xl border-2 border-dashed border-(--border-color) hover:border-(--color-accent-yellow)"
                  >
                    <Upload className="h-4 w-4 inline mr-1" /> Upload Logo
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">Page Title *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter page title"
                  className="h-12"
                />
              </div>

              {/* Description */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your page"
                  rows={4}
                />
              </div>

              {/* Product Images */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">Product Images</Label>
                <input
                  type="file"
                  ref={productRef}
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleImageSelect(e, "product")}
                />
                <div className="flex gap-3 flex-wrap mb-3">
                  {productImages.map((img, i) => (
                    <div key={i} className="relative h-20 w-20 rounded-lg overflow-hidden">
                      <img src={img} className="w-full h-full object-cover" alt="" />
                      <button
                        onClick={() => removeProductImage(i)}
                        className="absolute top-0 right-0 p-0.5 bg-red-500 rounded-full text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => productRef.current?.click()}
                    className="h-20 w-20 rounded-lg border-2 border-dashed flex items-center justify-center hover:border-(--color-accent-yellow)"
                  >
                    <ImagePlus className="h-5 w-5 text-(--text-secondary)" />
                  </button>
                </div>
              </div>

              {/* School Specific Fields */}
              {page.pageType === "school" && (
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

              {/* Pricing */}
              {page.pageType !== "donation" && (
                <>
                  <div>
                    <Label className="text-sm font-semibold mb-3 block">Pricing</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setPriceType("fixed")}
                        className={`p-3 rounded-xl border-2 ${
                          priceType === "fixed"
                            ? "border-(--color-accent-yellow) bg-(--color-accent-yellow)/10"
                            : "border-(--border-color)"
                        }`}
                      >
                        Fixed Price
                      </button>
                      <button
                        onClick={() => setPriceType("installment")}
                        className={`p-3 rounded-xl border-2 ${
                          priceType === "installment"
                            ? "border-(--color-accent-yellow) bg-(--color-accent-yellow)/10"
                            : "border-(--border-color)"
                        }`}
                      >
                        Installment
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label className="text-sm font-semibold mb-2 block">
                        {priceType === "installment" ? "Total Amount (₦)" : "Amount (₦)"}
                      </Label>
                      <Input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="0.00"
                        className="h-12"
                      />
                    </div>
                    {priceType === "installment" && (
                      <>
                        <div className="w-32">
                          <Label className="text-sm font-semibold mb-2 block">Installments</Label>
                          <Input
                            type="number"
                            value={installmentCount}
                            onChange={(e) => setInstallmentCount(e.target.value)}
                            min={2}
                            max={12}
                            className="h-12"
                          />
                        </div>
                        <div className="w-32">
                          <Label className="text-sm font-semibold mb-2 block">Period</Label>
                          <select
                            value={installmentPeriod}
                            onChange={(e) => setInstallmentPeriod(e.target.value)}
                            className="h-12 w-full rounded-xl border border-(--border-color) bg-(--bg-primary) px-3"
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
                    <div className="p-4 rounded-xl bg-(--color-accent-yellow)/10">
                      <p className="text-sm">
                        Customer pays <strong>₦{installmentAmount.toLocaleString()}</strong> per installment
                      </p>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </div>
        </main>

        {/* Sticky Save Button */}
        <div className="fixed bottom-0 left-0 right-0 lg:left-72 bg-(--bg-secondary)/90 backdrop-blur-lg border-t border-(--border-color) p-4 z-40">
          <div className="max-w-3xl mx-auto">
            <Button
              variant="default"
              size="lg"
              className="w-full py-6 text-base bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditPaymentPage;