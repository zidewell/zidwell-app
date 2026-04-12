// app/pay/[slug]/page.tsx
'use client';

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Shield, Download, ExternalLink, Clock, TrendingUp, AlertTriangle, Globe, Phone } from "lucide-react";
import { Button } from "@/app/components/ui/button"; 
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import { Checkbox } from "@/app/components/ui/checkbox";
import { useStore, isInvestmentType } from "@/app/hooks/useStore"; 
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/app/components/ui/collapsible"; 
import InvestmentDisclaimer from "@/app/components/payment-page-components/InvestmentDisclaimer"; 

const PaymentCheckout = () => {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const { pages } = useStore();
  const [paymentDone, setPaymentDone] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  const page = pages.find((p) => p.slug === slug);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    amount: "",
    payMethod: "transfer" as "transfer" | "card",
    parentName: "",
    childName: "",
    regNumber: "",
    customFields: {} as Record<string, string>,
    donorMessage: "",
    selectedVariants: {} as Record<string, string>,
    quantity: "1",
    address: "",
    city: "",
    bookingDate: "",
    bookingTime: "",
    customerNote: "",
  });

  if (!page) {
    return (
      <div className="min-h-screen bg-[#f7f0e2] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Page not found</h1>
          <p className="text-[#3e7465] mb-4">This payment page doesn't exist or has been removed.</p>
          <Button variant="default" onClick={() => router.push("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  const isInvestment = isInvestmentType(page.pageType);

  const displayPrice =
    page.priceType === "open"
      ? Number(form.amount) || 0
      : page.priceType === "installment"
      ? Math.ceil(page.price / (page.installmentCount || 3))
      : page.price;

  const fee = Math.min(displayPrice * 0.02, 2000);
  const totalForCustomer = page.feeMode === "customer" ? displayPrice + fee : displayPrice;

  const amountValid = !isInvestment || !page.minimumAmount || (Number(form.amount || page.price) >= page.minimumAmount);

  const handlePay = () => setPaymentDone(true);

  const allImages = [...(page.coverImage ? [page.coverImage] : []), ...page.productImages];

  if (isInvestment && !disclaimerAccepted) {
    return <InvestmentDisclaimer onAccept={() => setDisclaimerAccepted(true)} />;
  }

  if (paymentDone) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-sm w-full text-center">
          <div className="h-20 w-20 rounded-full bg-[#28a36a]/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-[#28a36a]" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
          <p className="text-[#3e7465] mb-6">Your payment of ₦{totalForCustomer.toLocaleString()} has been received.</p>
          <div className="bg-[#f9f6ef] border border-[#ded4c3] rounded-2xl p-5 mb-6 text-left space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[#3e7465]">Item</span>
              <span className="font-medium">{page.title}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#3e7465]">Amount</span>
              <span className="font-medium">₦{totalForCustomer.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#3e7465]">Reference</span>
              <span className="font-mono text-xs">ZW-{Date.now().toString(36).toUpperCase()}</span>
            </div>
          </div>

          {page.pageType === "digital" && (page.downloadUrl || page.accessLink) && (
            <div className="mb-4 space-y-2">
              {page.downloadUrl && (
                <Button variant="default" className="w-full" onClick={() => window.open(page.downloadUrl, "_blank")}>
                  <Download className="h-4 w-4 mr-2" /> Download Product
                </Button>
              )}
              {page.accessLink && (
                <Button variant="outline" className="w-full" onClick={() => window.open(page.accessLink, "_blank")}>
                  <ExternalLink className="h-4 w-4 mr-2" /> Access Product
                </Button>
              )}
            </div>
          )}

          <Button variant="default" className="w-full" onClick={() => router.push(`/pay/${slug}`)}>Back to Page</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f0e2]">
      <div className="bg-[#034936] text-[#f7f0e2]">
        <div className="container py-4 flex items-center gap-3">
          <button onClick={() => router.back()}><ArrowLeft className="h-5 w-5" /></button>
          <div className="flex items-center gap-3">
            {page.logo && <img src={page.logo} className="h-10 w-10 rounded-xl object-cover" alt="Logo" />}
            <div>
              <h1 className="font-bold text-lg leading-tight">{page.title}</h1>
              <p className="text-[#f7f0e2]/60 text-xs">by zidwell.com</p>
            </div>
          </div>
        </div>
      </div>

      {allImages.length > 0 && (
        <div className="relative">
          <img src={allImages[currentImage]} alt="Product" className="w-full h-56 md:h-72 object-cover" />
          {allImages.length > 1 && (
            <>
              <button onClick={() => setCurrentImage((c) => c === 0 ? allImages.length - 1 : c - 1)} className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-[#023528]/40 flex items-center justify-center">
                <ChevronLeft className="h-4 w-4 text-[#f7f0e2]" />
              </button>
              <button onClick={() => setCurrentImage((c) => c === allImages.length - 1 ? 0 : c + 1)} className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-[#023528]/40 flex items-center justify-center">
                <ChevronRight className="h-4 w-4 text-[#f7f0e2]" />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {allImages.map((_, i) => (
                  <span key={i} className={`h-1.5 rounded-full transition-all ${i === currentImage ? "w-4 bg-[#f7f0e2]" : "w-1.5 bg-[#f7f0e2]/50"}`} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div className="container max-w-lg py-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-2">{page.title}</h2>
          {page.pageType === "school" && page.className && (
            <span className="inline-block px-3 py-1 rounded-full bg-[#e1bf46]/10 text-[#e1bf46] text-sm font-medium mb-2">{page.className}</span>
          )}
          {page.description && <p className="text-[#3e7465] text-sm leading-relaxed">{page.description}</p>}
          {page.priceType !== "open" && (
            <div className="mt-3">
              <span className="text-2xl font-bold">₦{page.price.toLocaleString()}</span>
              {page.priceType === "installment" && (
                <span className="text-sm text-[#3e7465] ml-2">({page.installmentCount} installments of ₦{Math.ceil(page.price / (page.installmentCount || 3)).toLocaleString()})</span>
              )}
            </div>
          )}
        </div>

        {isInvestment && (
          <div className="bg-[#f9f6ef] border border-[#ded4c3] rounded-2xl p-5 space-y-3">
            <h3 className="font-bold text-sm mb-1">Investment Details</h3>
            {page.minimumAmount && (
              <div className="flex justify-between text-sm">
                <span className="text-[#3e7465]">Minimum Amount</span>
                <span className="font-medium">₦{page.minimumAmount.toLocaleString()}</span>
              </div>
            )}
            {page.expectedReturn && (
              <div className="flex justify-between text-sm">
                <span className="text-[#3e7465] flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Expected Return</span>
                <span className="font-medium">{page.expectedReturn}</span>
              </div>
            )}
            {page.tenure && (
              <div className="flex justify-between text-sm">
                <span className="text-[#3e7465] flex items-center gap-1"><Clock className="h-3 w-3" /> Tenure</span>
                <span className="font-medium">{page.tenure}</span>
              </div>
            )}
            {page.charges && (
              <div className="flex justify-between text-sm">
                <span className="text-[#3e7465]">Fees / Charges</span>
                <span className="font-medium">{page.charges}</span>
              </div>
            )}
            {page.paymentFrequency && (
              <div className="flex justify-between text-sm">
                <span className="text-[#3e7465]">Frequency</span>
                <span className="font-medium capitalize">{page.paymentFrequency}</span>
              </div>
            )}
          </div>
        )}

        {isInvestment && page.termsAndConditions && (
          <Collapsible>
            <CollapsibleTrigger className="w-full p-4 rounded-2xl border border-[#ded4c3] bg-[#f9f6ef] text-left text-sm font-semibold flex items-center justify-between hover:bg-[#e9e2d7]/50 transition-colors">
              Terms & Conditions
              <ChevronLeft className="h-4 w-4 -rotate-90" />
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pt-3">
              <div className="text-sm text-[#3e7465] whitespace-pre-wrap max-h-48 overflow-y-auto p-3 rounded-xl bg-[#e9e2d7]/50">
                {page.termsAndConditions}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {isInvestment && page.riskExplanation && (
          <div className="p-4 rounded-2xl border-2 border-yellow-500/30 bg-yellow-500/5">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-bold">Risk Disclosure</span>
            </div>
            <p className="text-sm text-[#3e7465] whitespace-pre-wrap">{page.riskExplanation}</p>
          </div>
        )}

        {isInvestment && (page.cacCertificate || page.taxClearance || page.website || page.contactInfo || (page.socialLinks && page.socialLinks.length > 0)) && (
          <div className="bg-[#f9f6ef] border border-[#ded4c3] rounded-2xl p-5 space-y-3">
            <h3 className="font-bold text-sm flex items-center gap-2"><Shield className="h-4 w-4 text-[#e1bf46]" /> Provider Information</h3>
            {page.cacCertificate && (
              <div className="flex items-center gap-2 text-sm text-[#28a36a]"><CheckCircle2 className="h-3.5 w-3.5" /> CAC Certificate uploaded</div>
            )}
            {page.taxClearance && (
              <div className="flex items-center gap-2 text-sm text-[#28a36a]"><CheckCircle2 className="h-3.5 w-3.5" /> Tax Clearance uploaded</div>
            )}
            {page.website && (
              <div className="flex items-center gap-2 text-sm"><Globe className="h-3.5 w-3.5 text-[#3e7465]" /> <a href={page.website} target="_blank" rel="noopener noreferrer" className="text-[#e1bf46] hover:underline">{page.website}</a></div>
            )}
            {page.contactInfo && (
              <div className="flex items-center gap-2 text-sm"><Phone className="h-3.5 w-3.5 text-[#3e7465]" /> {page.contactInfo}</div>
            )}
            {page.socialLinks && page.socialLinks.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {page.socialLinks.map((l, i) => (
                  <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" className="px-3 py-1 rounded-full bg-[#e9e2d7] text-xs font-medium hover:bg-[#e1bf46]/10 transition-colors">{l.platform}</a>
                ))}
              </div>
            )}
            <p className="text-[10px] text-[#3e7465]">These documents are NOT verified by Zidwell</p>
          </div>
        )}

        {page.pageType === "school" && page.feeBreakdown && page.feeBreakdown.length > 0 && (
          <div className="bg-[#f9f6ef] border border-[#ded4c3] rounded-2xl p-5">
            <h3 className="font-bold text-sm mb-3">Fee Breakdown</h3>
            <div className="space-y-2">
              {page.feeBreakdown.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-[#3e7465]">{item.label}</span>
                  <span className="font-medium">₦{item.amount.toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-bold pt-2 border-t border-[#ded4c3]">
                <span>Total</span>
                <span>₦{page.feeBreakdown.reduce((s, i) => s + i.amount, 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {page.pageType === "donation" && page.suggestedAmounts && page.suggestedAmounts.length > 0 && (
          <div>
            <Label className="text-sm font-semibold mb-2 block">Select Amount</Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {page.suggestedAmounts.map((a) => (
                <button key={a} onClick={() => setForm((f) => ({ ...f, amount: String(a) }))} className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${Number(form.amount) === a ? "border-[#e1bf46] bg-[#e1bf46]/10 text-[#023528]" : "border-[#ded4c3] bg-[#f9f6ef] text-[#3e7465] hover:border-[#e1bf46]/50"}`}>
                  ₦{a.toLocaleString()}
                </button>
              ))}
            </div>
            <Input type="number" placeholder="Or enter custom amount" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} className="h-12" />
          </div>
        )}

        {page.pageType === "physical" && page.variants && page.variants.length > 0 && (
          <div className="space-y-4">
            {page.variants.map((v) => (
              <div key={v.name}>
                <Label className="text-sm font-semibold mb-2 block">{v.name}</Label>
                <div className="flex flex-wrap gap-2">
                  {v.options.filter(Boolean).map((opt) => (
                    <button key={opt} onClick={() => setForm((f) => ({ ...f, selectedVariants: { ...f.selectedVariants, [v.name]: opt } }))} className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${form.selectedVariants[v.name] === opt ? "border-[#e1bf46] bg-[#e1bf46]/10 text-[#023528]" : "border-[#ded4c3] bg-[#f9f6ef] text-[#3e7465] hover:border-[#e1bf46]/50"}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">Quantity</Label>
              <Input type="number" min={1} value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} className="h-12 w-24" />
            </div>
          </div>
        )}

        <div className="bg-[#f9f6ef] border border-[#ded4c3] rounded-2xl p-5">
          <h3 className="font-bold text-sm mb-3">Pay via Bank Transfer</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-[#3e7465]">Bank</span><span className="font-medium">{page.bankName || "Zidwell Bank"}</span></div>
            <div className="flex justify-between"><span className="text-[#3e7465]">Account Number</span><span className="font-mono font-bold text-base">{page.virtualAccount || "0000000000"}</span></div>
            <div className="flex justify-between"><span className="text-[#3e7465]">Account Name</span><span className="font-medium">Zidwell/{page.title}</span></div>
          </div>
        </div>

        <div className="text-center text-sm text-[#3e7465]">— or pay with card —</div>

        <div className="space-y-4">
          {page.pageType === "school" ? (
            <>
              <div>
                <Label className="text-sm font-semibold mb-1.5 block">Parent Full Name</Label>
                <Input placeholder="Parent's full name" value={form.parentName} onChange={(e) => setForm((f) => ({ ...f, parentName: e.target.value }))} className="h-12" />
              </div>
              <div>
                <Label className="text-sm font-semibold mb-1.5 block">Child's Full Name</Label>
                <Input placeholder="Student's full name" value={form.childName} onChange={(e) => setForm((f) => ({ ...f, childName: e.target.value }))} className="h-12" />
              </div>
              <div>
                <Label className="text-sm font-semibold mb-1.5 block">Registration Number</Label>
                <Input placeholder="Student reg number" value={form.regNumber} onChange={(e) => setForm((f) => ({ ...f, regNumber: e.target.value }))} className="h-12" />
              </div>
              {page.requiredFields?.map((field) => (
                <div key={field}>
                  <Label className="text-sm font-semibold mb-1.5 block">{field}</Label>
                  <Input placeholder={field} value={form.customFields[field] || ""} onChange={(e) => setForm((f) => ({ ...f, customFields: { ...f.customFields, [field]: e.target.value } }))} className="h-12" />
                </div>
              ))}
            </>
          ) : (
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">Full Name</Label>
              <Input placeholder="John Doe" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="h-12" />
            </div>
          )}

          <div>
            <Label className="text-sm font-semibold mb-1.5 block">Email</Label>
            <Input type="email" placeholder="john@example.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="h-12" />
          </div>
          <div>
            <Label className="text-sm font-semibold mb-1.5 block">Phone Number</Label>
            <Input type="tel" placeholder="08012345678" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="h-12" />
          </div>

          {page.priceType === "open" && page.pageType !== "donation" && (
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">Amount (₦){isInvestment && page.minimumAmount ? ` — Min ₦${page.minimumAmount.toLocaleString()}` : ""}</Label>
              <Input type="number" placeholder="Enter amount" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} className="h-12" />
              {isInvestment && page.minimumAmount && Number(form.amount) > 0 && Number(form.amount) < page.minimumAmount && (
                <p className="text-xs text-[#ee4343] mt-1">Minimum investment is ₦{page.minimumAmount.toLocaleString()}</p>
              )}
            </div>
          )}

          {page.pageType === "physical" && page.requiresShipping && (
            <>
              <div>
                <Label className="text-sm font-semibold mb-1.5 block">Delivery Address</Label>
                <Textarea placeholder="Full delivery address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} rows={2} className="resize-none" />
              </div>
              <div>
                <Label className="text-sm font-semibold mb-1.5 block">City</Label>
                <Input placeholder="Lagos, Abuja, etc." value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} className="h-12" />
              </div>
            </>
          )}

          {page.pageType === "donation" && page.allowDonorMessage && (
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">Message (optional)</Label>
              <Textarea placeholder="Leave a message..." value={form.donorMessage} onChange={(e) => setForm((f) => ({ ...f, donorMessage: e.target.value }))} rows={2} className="resize-none" />
            </div>
          )}

          {page.pageType === "services" && page.bookingEnabled && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-semibold mb-1.5 block">Preferred Date</Label>
                <Input type="date" value={form.bookingDate} onChange={(e) => setForm((f) => ({ ...f, bookingDate: e.target.value }))} className="h-12" />
              </div>
              <div>
                <Label className="text-sm font-semibold mb-1.5 block">Preferred Time</Label>
                <Input type="time" value={form.bookingTime} onChange={(e) => setForm((f) => ({ ...f, bookingTime: e.target.value }))} className="h-12" />
              </div>
            </div>
          )}
          {page.pageType === "services" && page.customerNoteEnabled && (
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">Describe your request</Label>
              <Textarea placeholder="Tell us what you need..." value={form.customerNote} onChange={(e) => setForm((f) => ({ ...f, customerNote: e.target.value }))} rows={3} className="resize-none" />
            </div>
          )}
        </div>

        <div className="bg-[#e9e2d7] rounded-2xl p-4 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-[#3e7465]">Subtotal</span><span>₦{displayPrice.toLocaleString()}</span></div>
          {page.feeMode === "customer" && (
            <div className="flex justify-between"><span className="text-[#3e7465]">Transaction fee</span><span>₦{fee.toLocaleString()}</span></div>
          )}
          <div className="flex justify-between font-bold text-base pt-2 border-t border-[#ded4c3]"><span>Total</span><span>₦{totalForCustomer.toLocaleString()}</span></div>
        </div>

        <Button variant="default" size="lg" className="w-full py-6 text-base" onClick={handlePay} disabled={!amountValid}>
          Pay ₦{totalForCustomer.toLocaleString()}
        </Button>

        <div className="flex items-center justify-center gap-2 text-xs text-[#3e7465] pb-6">
          <Shield className="h-3.5 w-3.5" /> Secured by Zidwell
        </div>
      </div>
    </div>
  );
};

export default PaymentCheckout;