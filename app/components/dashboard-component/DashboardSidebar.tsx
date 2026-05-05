"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Receipt,
  FileSignature,
  CreditCard,
  ArrowLeftRight,
  Calculator,
  BarChart3,
  Newspaper,
  Settings,
  X,
  User,
  Eye,
  EyeOff,
  Send,
  Wallet,
  Smartphone,
  Wifi,
  Tv,
  Lightbulb,
  Captions,
} from "lucide-react";
import Image from "next/image";
import { useUserContextData } from "@/app/context/userData";
import { ProtectedLink } from "../ProtectedLink";

const formatNumber = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const preferenceItems = [
  { name: "My Profile", href: "/dashboard/profile", icon: User },
];

const ALLOWED_PAYMENT_EMAILS = new Set([
  "characterinternational@gmail.com",
  "abdullahtimilehin15@gmail.com",
  "ebrusikefavour@gmail.com",
  "skillfidelafrica@gmail.com",
  "abbalolo360@gmail.com"
]);

const canAccessPaymentPage = (userEmail?: string | null) => {
  if (!userEmail) return false;
  return ALLOWED_PAYMENT_EMAILS.has(userEmail.toLowerCase());
};

interface DashboardSidebarProps {
  open: boolean;
  onClose: () => void;
}

const DashboardSidebar = ({ open, onClose }: DashboardSidebarProps) => {
  const [showBalance, setShowBalance] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const pathname = usePathname();
  const { userData, balance } = useUserContextData();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (open && isMobile) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }

    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [open, isMobile]);

  const NavItem = ({ item, isActive }: { item: any; isActive: boolean }) => {
    const protectedLinks = [
      "/dashboard/fund-account",
      "/dashboard/fund-account/transfer-page",
      "/dashboard/services/buy-airtime",
      "/dashboard/services/buy-data",
      "/dashboard/services/buy-power",
      "/dashboard/services/buy-cable-tv",
      "/dashboard/services/create-invoice",
    ];

    const isProtected = protectedLinks.includes(item.href);

    const commonClassName = `flex items-center gap-4 p-3 rounded-md text-sm font-bold uppercase tracking-wide border-2 transition-all duration-150 ${
      isActive
        ? "bg-[var(--color-accent-yellow)] text-[var(--color-ink)] border-[var(--border-color)] shadow-[2px_2px_0px_var(--border-color)]"
        : "border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-color)] hover:shadow-[2px_2px_0px_var(--border-color)]"
    }`;

    if (isProtected) {
      return (
        <ProtectedLink
          href={item.href}
          onClick={onClose}
          className={commonClassName}
        >
          <item.icon className="w-5 h-5 shrink-0" />
          <span className="font-medium">{item.name}</span>
        </ProtectedLink>
      );
    }

    return (
      <Link href={item.href} onClick={onClose} className={commonClassName}>
        <item.icon className="w-5 h-5 shrink-0" />
        <span className="font-medium">{item.name}</span>
      </Link>
    );
  };

  const formatBalance = () => {
    if (!showBalance) return "*****";
    if (balance != null) return formatNumber(balance);
    return "0.00";
  };

  const showPaymentPage = canAccessPaymentPage(userData?.email);

  const NavigationContent = () => (
    <div className="space-y-6">
      <NavItem
        item={{ name: "Dashboard", href: "/dashboard", icon: LayoutDashboard }}
        isActive={pathname === "/dashboard"}
      />

      <div className="space-y-2">
        <NavItem
          item={{ name: "Fund Wallet", href: "/dashboard/fund-account", icon: Wallet }}
          isActive={pathname === "/dashboard/fund-account"}
        />
        <NavItem
          item={{ name: "Transfer", href: "/dashboard/fund-account/transfer-page", icon: Send }}
          isActive={pathname === "/dashboard/fund-account/transfer-page"}
        />
        <NavItem
          item={{ name: "Transactions", href: "/dashboard/transactions", icon: ArrowLeftRight }}
          isActive={pathname === "/dashboard/transactions"}
        />
      </div>

      <div>
        <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2 px-4">
          Business Tools
        </h3>
        <div className="space-y-2">
          <NavItem
            item={{ name: "Bookkeeping", href: "/dashboard/services/bookkeeping", icon: BookOpen }}
            isActive={pathname === "/dashboard/services/bookkeeping"}
          />
          <NavItem
            item={{ name: "Invoices", href: "/dashboard/services/create-invoice", icon: FileText }}
            isActive={pathname === "/dashboard/services/create-invoice"}
          />
          <NavItem
            item={{ name: "Receipts", href: "/dashboard/services/receipt", icon: Receipt }}
            isActive={pathname === "/dashboard/services/receipt"}
          />
          <NavItem
            item={{ name: "Contracts", href: "/dashboard/services/contract", icon: FileSignature }}
            isActive={pathname === "/dashboard/services/contract" || pathname === "/dashboard/services/contract/create-contract-form"}
          />
          {showPaymentPage && (
            <NavItem
              item={{ name: "Payment Pages", href: "/dashboard/services/payment/dashboard", icon: CreditCard }}
              isActive={pathname === "/dashboard/services/payment"}
            />
          )}
          <NavItem
            item={{ name: "Tax Management", href: "/dashboard/services/tax-filing", icon: Calculator }}
            isActive={pathname === "/dashboard/services/tax-filing"}
          />
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2 px-4">
          Buy Services
        </h3>
        <div className="space-y-2">
          <NavItem
            item={{ name: "Buy Airtime", href: "/dashboard/services/buy-airtime", icon: Smartphone }}
            isActive={pathname === "/dashboard/services/buy-airtime"}
          />
          <NavItem
            item={{ name: "Buy Data", href: "/dashboard/services/buy-data", icon: Wifi }}
            isActive={pathname === "/dashboard/services/buy-data"}
          />
          <NavItem
            item={{ name: "Buy Light", href: "/dashboard/services/buy-power", icon: Lightbulb }}
            isActive={pathname === "/dashboard/services/buy-power"}
          />
          <NavItem
            item={{ name: "Cable TV", href: "/dashboard/services/buy-cable-tv", icon: Tv }}
            isActive={pathname === "/dashboard/services/buy-cable-tv"}
          />
        </div>
      </div>

      <NavItem
        item={{ name: "Blog / Articles", href: "/blog", icon: Newspaper }}
        isActive={pathname === "/blog" || pathname.startsWith("/blog/")}
      />
    </div>
  );

  const PreferencesContent = () => (
    <div className="space-y-2">
      {preferenceItems.map((item) => (
        <NavItem key={item.name} item={item} isActive={pathname === item.href} />
      ))}

      {userData && (
        <>
          {["super_admin", "finance_admin", "operations_admin", "support_admin", "legal_admin"].includes(userData?.role) && (
            <NavItem
              item={{ name: "Admin Panel", href: "/admin", icon: Settings }}
              isActive={pathname === "/admin" || pathname.startsWith("/admin/")}
            />
          )}
          {["super_admin", "operations_admin", "blog_admin"].includes(userData?.role) && (
            <NavItem
              item={{ name: "Blog Admin", href: "/blog/admin", icon: Captions }}
              isActive={pathname === "/blog/admin"}
            />
          )}
        </>
      )}
    </div>
  );

  const MobileSidebar = () => (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-[#141414]/40 dark:bg-[#000000]/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-72 bg-[var(--bg-primary)] border-r-2 border-[var(--border-color)]
          transition-transform duration-300 ease-in-out overflow-y-auto
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex flex-col min-h-full">
          <div className="flex items-center justify-between h-20 px-7 border-b-2 border-[var(--border-color)]">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Zidwell Logo"
                width={32}
                height={32}
                className="w-8 object-contain"
              />
              <span className="text-2xl font-bold tracking-tight text-[var(--text-primary)] uppercase">
                Zidwell
              </span>
            </Link>
            <button
              onClick={onClose}
              className="lg:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {userData && userData.fullName && (
            <div className="p-5 border-b-2 border-[var(--border-color)]">
              <div className="space-y-2">
                <p className="text-[var(--text-secondary)] text-sm">
                  Welcome Back, {userData.fullName}
                </p>
                {balance != null && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[var(--text-secondary)] text-xs">
                        Wallet Balance
                      </p>
                      <div className="flex items-center gap-1">
                        <span className="text-[var(--text-primary)] text-sm font-bold">
                          ₦{formatBalance()}
                        </span>
                        <button
                          onClick={() => setShowBalance(!showBalance)}
                          className="p-1 hover:bg-[var(--bg-secondary)] rounded-md transition-colors duration-200"
                          aria-label={showBalance ? "Hide balance" : "Show balance"}
                        >
                          {showBalance ? (
                            <Eye className="w-4 h-4 text-[var(--text-secondary)]" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-[var(--text-secondary)]" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <nav className="flex-1 p-5">
            <NavigationContent />
          </nav>

          <div className="p-5 border-t-2 border-[var(--border-color)]">
            <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
              Preferences
            </h3>
            <PreferencesContent />
          </div>
        </div>
      </aside>
    </>
  );

  const DesktopSidebar = () => (
    <aside className="hidden lg:block fixed top-0 left-0 z-40 h-screen w-72 bg-[var(--bg-primary)] border-r-2 border-[var(--border-color)] overflow-y-auto">
      <div className="flex flex-col min-h-full">
        <div className="flex items-center h-20 px-7 border-b-2 border-[var(--border-color)]">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Zidwell Logo"
              width={32}
              height={32}
              className="w-8 object-contain"
            />
            <span className="text-2xl font-bold tracking-tight text-[var(--text-primary)] uppercase">
              Zidwell
            </span>
          </Link>
        </div>

        {userData && userData.fullName && (
          <div className="p-5 border-b-2 border-[var(--border-color)]">
            <div className="space-y-2">
              <p className="text-[var(--text-secondary)] text-sm">
                Welcome Back, {userData.fullName}
              </p>
              {balance != null && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[var(--text-secondary)] text-xs">
                      Wallet Balance
                    </p>
                    <div className="flex items-center gap-1">
                      <span className="text-[var(--text-primary)] text-sm font-bold">
                        ₦{formatBalance()}
                      </span>
                      <button
                        onClick={() => setShowBalance(!showBalance)}
                        className="p-1 hover:bg-[var(--bg-secondary)] rounded-md transition-colors duration-200"
                        aria-label={showBalance ? "Hide balance" : "Show balance"}
                      >
                        {showBalance ? (
                          <Eye className="w-4 h-4 text-[var(--text-secondary)]" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-[var(--text-secondary)]" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <nav className="flex-1 p-5">
          <NavigationContent />
        </nav>

        <div className="p-5 border-t-2 border-[var(--border-color)]">
          <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
            Preferences
          </h3>
          <PreferencesContent />
        </div>
      </div>
    </aside>
  );

  return (
    <>
      <div className="lg:hidden"><MobileSidebar /></div>
      <div className="hidden lg:block"><DesktopSidebar /></div>
    </>
  );
};

export default DashboardSidebar;