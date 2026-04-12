// app/page/[id]/page.tsx
'use client';

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Eye, CreditCard, TrendingUp, Users, Copy, Wallet, BarChart3, ExternalLink, GraduationCap, CheckCircle2, XCircle, Shield, Globe, Phone, MousePointer, ShoppingCart, Video } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useStore, isInvestmentType } from "@/app/hooks/useStore";
import DashboardSidebar from "@/app/components/dashboard-component/DashboardSidebar";
import DashboardHeader from "@/app/components/dashboard-component/DashboardHeader";

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
};

const PageDetail = () => {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { pages } = useStore();
  const page = pages.find((p) => p.id === id);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!page) {
    return (
      <div className="min-h-screen bg-[#f7f0e2] dark:bg-[#0e0e0e] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2 text-[#141414] dark:text-[#f5f5f5]">Page not found</h1>
          <Button variant="default" onClick={() => router.push("/dashboard/services/payment/dashboard")}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  const isInvestment = isInvestmentType(page.pageType);
  const pageUrl = `zidwell.com/pay/${page.slug}`;

  const stats = [
    { label: "Page Views", value: page.pageViews || 0, icon: Eye, color: "text-[#e1bf46]" },
    { label: "Payments", value: page.totalPayments || 0, icon: CreditCard, color: "text-[#28a36a]" },
    { label: "Revenue", value: `₦${(page.totalRevenue || 0).toLocaleString()}`, icon: TrendingUp, color: "text-[#e1bf46]" },
    { label: "Conversion", value: page.pageViews && page.pageViews > 0 ? `${Math.round(((page.totalPayments || 0) / page.pageViews) * 100)}%` : "0%", icon: BarChart3, color: "text-[#28a36a]" },
  ];

  const investmentStats = isInvestment ? [
    { label: "Total Investments", value: `₦${(page.totalInvestments || 0).toLocaleString()}`, icon: TrendingUp, color: "text-[#e1bf46]" },
    { label: "Participants", value: page.totalParticipants || 0, icon: Users, color: "text-[#28a36a]" },
    { label: "Avg Contribution", value: `₦${(page.totalParticipants ? Math.round((page.totalInvestments || 0) / page.totalParticipants) : 0).toLocaleString()}`, icon: BarChart3, color: "text-[#e1bf46]" },
  ] : [];

  const engagementStats = isInvestment ? [
    { label: "Page Clicks", value: 0, icon: MousePointer },
    { label: "Video Views", value: 0, icon: Video },
    { label: "Abandon Cart", value: 0, icon: ShoppingCart },
  ] : [];

  return (
    <div className="min-h-screen dark:bg-[#0e0e0e]">
      <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="lg:pl-72 min-h-screen flex flex-col">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-3xl mx-auto space-y-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-start gap-4">
                {page.logo ? (
                  <img src={page.logo} className="h-16 w-16 rounded-2xl object-cover" alt="Logo" />
                ) : (
                  <div className="h-16 w-16 rounded-2xl bg-[#e9e2d7] dark:bg-[#242424] flex items-center justify-center">
                    <CreditCard className="h-7 w-7 text-[#6b6b6b] dark:text-[#a6a6a6]" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-bold text-[#141414] dark:text-[#f5f5f5]">{page.title}</h1>
                    <span className="px-2 py-0.5 rounded-full bg-[#e1bf46]/10 text-[#e1bf46] text-xs font-medium">{typeLabels[page.pageType]}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#6b6b6b] dark:text-[#a6a6a6] truncate">{pageUrl}</span>
                    <button onClick={() => navigator.clipboard.writeText(pageUrl)} className="text-[#6b6b6b] dark:text-[#a6a6a6] hover:text-[#023528] dark:hover:text-[#f5f5f5] transition-colors">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="flex gap-3">
              <Button variant="default" onClick={() => router.push(`/pay/${page.slug}`)}>
                <ExternalLink className="h-4 w-4 mr-1" /> View Page
              </Button>
              <Button variant="outline">
                <Wallet className="h-4 w-4 mr-1" /> Withdraw
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 rounded-2xl bg-[#f9f6ef] dark:bg-[#121212] border border-[#ded4c3] dark:border-[#474747]">
                  <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
                  <div className="text-2xl font-bold text-[#141414] dark:text-[#f5f5f5]">{s.value}</div>
                  <div className="text-xs text-[#6b6b6b] dark:text-[#a6a6a6]">{s.label}</div>
                </motion.div>
              ))}
            </div>

            {isInvestment && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  {investmentStats.map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 rounded-2xl bg-[#f9f6ef] dark:bg-[#121212] border border-[#ded4c3] dark:border-[#474747]">
                      <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
                      <div className="text-xl font-bold text-[#141414] dark:text-[#f5f5f5]">{s.value}</div>
                      <div className="text-xs text-[#6b6b6b] dark:text-[#a6a6a6]">{s.label}</div>
                    </motion.div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {engagementStats.map((s, i) => (
                    <div key={s.label} className="p-4 rounded-2xl bg-[#f9f6ef] dark:bg-[#121212] border border-[#ded4c3] dark:border-[#474747]">
                      <s.icon className="h-5 w-5 text-[#6b6b6b] dark:text-[#a6a6a6] mb-2" />
                      <div className="text-xl font-bold text-[#141414] dark:text-[#f5f5f5]">{s.value}</div>
                      <div className="text-xs text-[#6b6b6b] dark:text-[#a6a6a6]">{s.label}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="p-5 rounded-2xl bg-[#034936] text-[#f7f0e2]">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                <Wallet className="h-4 w-4" /> Dedicated Virtual Account
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-[#f7f0e2]/60">Bank</span>
                  <p className="font-medium">{page.bankName || "Zidwell Bank"}</p>
                </div>
                <div>
                  <span className="text-[#f7f0e2]/60">Account Number</span>
                  <p className="font-mono font-bold text-lg">{page.virtualAccount || "0000000000"}</p>
                </div>
              </div>
            </div>

            {isInvestment && page.termsAndConditions && (
              <div className="p-5 rounded-2xl bg-[#f9f6ef] dark:bg-[#121212] border border-[#ded4c3] dark:border-[#474747]">
                <h3 className="font-bold text-sm mb-3 text-[#141414] dark:text-[#f5f5f5]">Terms & Conditions</h3>
                <p className="text-sm text-[#6b6b6b] dark:text-[#a6a6a6] whitespace-pre-wrap max-h-48 overflow-y-auto">{page.termsAndConditions}</p>
              </div>
            )}

            {isInvestment && page.riskExplanation && (
              <div className="p-5 rounded-2xl bg-[#f9f6ef] dark:bg-[#121212] border border-[#ded4c3] dark:border-[#474747]">
                <h3 className="font-bold text-sm mb-3 text-[#141414] dark:text-[#f5f5f5]">Risk Explanation</h3>
                <p className="text-sm text-[#6b6b6b] dark:text-[#a6a6a6] whitespace-pre-wrap">{page.riskExplanation}</p>
              </div>
            )}

            {isInvestment && (page.cacCertificate || page.taxClearance || page.website || page.contactInfo) && (
              <div className="p-5 rounded-2xl bg-[#f9f6ef] dark:bg-[#121212] border border-[#ded4c3] dark:border-[#474747] space-y-3">
                <h3 className="font-bold text-sm flex items-center gap-2 text-[#141414] dark:text-[#f5f5f5]"><Shield className="h-4 w-4 text-[#e1bf46]" /> Trust Signals</h3>
                {page.cacCertificate && <div className="flex items-center gap-2 text-sm text-[#28a36a]"><CheckCircle2 className="h-3.5 w-3.5" /> CAC Certificate uploaded</div>}
                {page.taxClearance && <div className="flex items-center gap-2 text-sm text-[#28a36a]"><CheckCircle2 className="h-3.5 w-3.5" /> Tax Clearance uploaded</div>}
                {page.website && <div className="flex items-center gap-2 text-sm"><Globe className="h-3.5 w-3.5 text-[#6b6b6b] dark:text-[#a6a6a6]" /> {page.website}</div>}
                {page.contactInfo && <div className="flex items-center gap-2 text-sm"><Phone className="h-3.5 w-3.5 text-[#6b6b6b] dark:text-[#a6a6a6]" /> {page.contactInfo}</div>}
              </div>
            )}

            {page.pageType === "school" && page.students && page.students.length > 0 && (
              <div className="p-5 rounded-2xl bg-[#f9f6ef] dark:bg-[#121212] border border-[#ded4c3] dark:border-[#474747]">
                <h3 className="font-bold text-sm mb-4 flex items-center gap-2 text-[#141414] dark:text-[#f5f5f5]">
                  <GraduationCap className="h-4 w-4 text-[#e1bf46]" /> Student Payment Status
                </h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-[#28a36a]/10 text-center">
                    <div className="text-xl font-bold text-[#28a36a]">{page.students.filter(s => s.paid).length}</div>
                    <div className="text-xs text-[#6b6b6b] dark:text-[#a6a6a6]">Paid</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#ee4343]/10 text-center">
                    <div className="text-xl font-bold text-[#ee4343]">{page.students.filter(s => !s.paid).length}</div>
                    <div className="text-xs text-[#6b6b6b] dark:text-[#a6a6a6]">Unpaid</div>
                  </div>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {page.students.map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[#e9e2d7]/50 dark:bg-[#242424]/50">
                      <div>
                        <p className="text-sm font-medium text-[#141414] dark:text-[#f5f5f5]">{s.name}</p>
                        <p className="text-xs text-[#6b6b6b] dark:text-[#a6a6a6]">{s.regNumber || "No reg #"} · {s.className}</p>
                      </div>
                      {s.paid ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-[#28a36a]"><CheckCircle2 className="h-3.5 w-3.5" /> Paid</span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-medium text-[#ee4343]"><XCircle className="h-3.5 w-3.5" /> Unpaid</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {page.pageType === "donation" && page.showDonorList && (
              <div className="p-6 rounded-2xl bg-[#f9f6ef] dark:bg-[#121212] border border-[#ded4c3] dark:border-[#474747] text-center">
                <Users className="h-8 w-8 text-[#6b6b6b]/40 dark:text-[#a6a6a6]/40 mx-auto mb-3" />
                <h3 className="font-bold mb-1 text-[#141414] dark:text-[#f5f5f5]">Donor List</h3>
                <p className="text-sm text-[#6b6b6b] dark:text-[#a6a6a6]">Donors will appear here as payments come in</p>
              </div>
            )}

            {page.pageType === "physical" && (
              <div className="p-6 rounded-2xl bg-[#f9f6ef] dark:bg-[#121212] border border-[#ded4c3] dark:border-[#474747] text-center">
                <Users className="h-8 w-8 text-[#6b6b6b]/40 dark:text-[#a6a6a6]/40 mx-auto mb-3" />
                <h3 className="font-bold mb-1 text-[#141414] dark:text-[#f5f5f5]">Orders</h3>
                <p className="text-sm text-[#6b6b6b] dark:text-[#a6a6a6]">Customer orders with shipping status will appear here</p>
              </div>
            )}

            {page.pageType === "digital" && (
              <div className="p-5 rounded-2xl bg-[#f9f6ef] dark:bg-[#121212] border border-[#ded4c3] dark:border-[#474747]">
                <h3 className="font-bold text-sm mb-2 text-[#141414] dark:text-[#f5f5f5]">Digital Delivery</h3>
                <p className="text-sm text-[#6b6b6b] dark:text-[#a6a6a6]">
                  {page.downloadUrl && <>Download URL: <span className="font-mono text-xs">{page.downloadUrl}</span></>}
                  {page.accessLink && <>{page.downloadUrl && " · "}Access Link: <span className="font-mono text-xs">{page.accessLink}</span></>}
                </p>
              </div>
            )}

            {page.pageType === "services" && page.bookingEnabled && (
              <div className="p-6 rounded-2xl bg-[#f9f6ef] dark:bg-[#121212] border border-[#ded4c3] dark:border-[#474747] text-center">
                <Users className="h-8 w-8 text-[#6b6b6b]/40 dark:text-[#a6a6a6]/40 mx-auto mb-3" />
                <h3 className="font-bold mb-1 text-[#141414] dark:text-[#f5f5f5]">Bookings</h3>
                <p className="text-sm text-[#6b6b6b] dark:text-[#a6a6a6]">Customer bookings with dates will appear here</p>
              </div>
            )}

            <div className="p-6 rounded-2xl bg-[#f9f6ef] dark:bg-[#121212] border border-[#ded4c3] dark:border-[#474747] text-center">
              <Users className="h-8 w-8 text-[#6b6b6b]/40 dark:text-[#a6a6a6]/40 mx-auto mb-3" />
              <h3 className="font-bold mb-1 text-[#141414] dark:text-[#f5f5f5]">{isInvestment ? "No investors yet" : "No customers yet"}</h3>
              <p className="text-sm text-[#6b6b6b] dark:text-[#a6a6a6]">Share your payment link to start receiving {isInvestment ? "investments" : "payments"}</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PageDetail;