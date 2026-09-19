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
  Captions,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import Image from "next/image";
import { useUserContextData } from "@/app/context/userData";
import { ProtectedLink } from "../ProtectedLink";
import { useTheme } from "../ThemeProvider";

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

export const ALLOWED_PAYMENT_EMAILS = new Set([
  "characterinternational@gmail.com",
  "ibrahimlawalabbalolo@gmail.com",
  "abbalolo360@gmail.com",
  "boluwatife525@gmail.com",
  "verifiedaboki@gmail.com",
]);

const canAccessPaymentPage = (userEmail?: string | null) => {
  if (!userEmail) return false;
  return ALLOWED_PAYMENT_EMAILS.has(userEmail.toLowerCase());
};

const isPathActive = (pathname: string | null, href: string) => {
  if (!pathname) return false;
  if (pathname === href) return true;
  if (pathname.startsWith(href + "/")) return true;
  return false;
};

interface DashboardSidebarProps {
  open: boolean;
  onClose: () => void;
}

const DashboardSidebar = ({ open, onClose }: DashboardSidebarProps) => {
  const [showBalance, setShowBalance] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const pathname = usePathname();
  const { userData, balance } = useUserContextData();
  const { theme, setTheme } = useTheme();

  // ✅ Derive effective collapse at render time — mobile never collapses
  const effectiveCollapsed = !isMobile && collapsed;

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true" && window.innerWidth >= 1024) {
      setCollapsed(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed]);

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

  // ------- Nav Item Component -------
  const NavItem = ({
    item,
    isActive,
    protected: isProtected = false,
    collapsed: isCollapsed = false,
  }: {
    item: any;
    isActive: boolean;
    protected?: boolean;
    collapsed?: boolean;
  }) => {
    const protectedLinks = [
      "/dashboard/fund-account",
      "/dashboard/fund-account/transfer-page",
      "/dashboard/services/buy-airtime",
      "/dashboard/services/buy-data",
      "/dashboard/services/buy-power",
      "/dashboard/services/buy-cable-tv",
      "/dashboard/services/create-invoice",
    ];

    const shouldProtect = isProtected || protectedLinks.includes(item.href);

    const baseClass = `
      group relative flex items-center gap-3 rounded-xl text-sm font-medium
      transition-all duration-200 ease-out
      ${
        isCollapsed
          ? "justify-center px-2 py-2.5 mx-auto w-11 h-11"
          : "px-3 py-2.5 w-full"
      }
      ${
        isActive
          ? "bg-(--color-accent-yellow) text-(--color-ink) shadow-sm"
          : "text-(--text-secondary) hover:bg-(--bg-secondary) hover:text-(--text-primary)"
      }
    `;

    const inner = (
      <>
        <item.icon
          className={`shrink-0 ${isCollapsed ? "w-5 h-5" : "w-[18px] h-[18px]"}`}
          strokeWidth={isActive ? 2.2 : 1.9}
        />
        {!isCollapsed && (
          <span className="truncate flex-1 text-left">{item.name}</span>
        )}
      </>
    );

    const tooltip = isCollapsed ? (
      <span
        className="
          pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2
          whitespace-nowrap rounded-lg
          bg-(--bg-primary) border border-(--border-color)
          text-(--text-primary) text-xs font-medium
          px-2.5 py-1.5 opacity-0 group-hover:opacity-100
          transition-opacity duration-150 z-50 shadow-md
        "
      >
        {item.name}
      </span>
    ) : null;

    if (item.href === "/dashboard/services/payment/dashboard") {
      if (canAccessPaymentPage(userData?.email)) {
        return (
          <div className="relative">
            <Link
              href={item.href}
              onClick={onClose}
              className={baseClass}
              aria-current={isActive ? "page" : undefined}
            >
              {inner}
            </Link>
            {tooltip}
          </div>
        );
      }
      return null;
    }

    if (shouldProtect) {
      return (
        <div className="relative">
          <ProtectedLink
            href={item.href}
            onClick={onClose}
            className={baseClass}
          >
            {inner}
          </ProtectedLink>
          {tooltip}
        </div>
      );
    }

    return (
      <div className="relative">
        <Link
          href={item.href}
          onClick={onClose}
          className={baseClass}
          aria-current={isActive ? "page" : undefined}
        >
          {inner}
        </Link>
        {tooltip}
      </div>
    );
  };

  const formatBalance = () => {
    if (!showBalance) return "*****";
    if (balance != null) return formatNumber(balance);
    return "0.00";
  };

  const showPaymentPage = canAccessPaymentPage(userData?.email);

  // ------- Section heading -------
  const SectionLabel = ({ children }: { children: React.ReactNode }) => {
    if (effectiveCollapsed) {
      return (
        <div className="my-3 mx-auto w-6 border-t border-(--border-color)" />
      );
    }
    return (
      <h3 className="text-[10px] font-semibold text-(--text-secondary) uppercase tracking-wider mb-2 px-3">
        {children}
      </h3>
    );
  };

  // ------- Theme toggle -------
  const ThemeToggle = ({ compact = false }: { compact?: boolean }) => (
    <div
      className={`flex items-center gap-1 p-1 bg-(--bg-secondary) rounded-xl ${
        compact ? "justify-center" : ""
      }`}
    >
      <button
        onClick={() => setTheme("light")}
        className={`p-2 rounded-lg transition-all ${
          theme === "light"
            ? "bg-(--color-accent-yellow) text-(--color-ink) shadow-sm"
            : "text-(--text-secondary) hover:text-(--text-primary)"
        }`}
        aria-label="Light mode"
      >
        <Sun size={16} />
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`p-2 rounded-lg transition-all ${
          theme === "dark"
            ? "bg-(--color-accent-yellow) text-(--color-ink) shadow-sm"
            : "text-(--text-secondary) hover:text-(--text-primary)"
        }`}
        aria-label="Dark mode"
      >
        <Moon size={16} />
      </button>
    </div>
  );

  // ------- Navigation content -------
  const NavigationContent = () => (
    <div className="space-y-5">
      <div className="space-y-1">
        <NavItem
          item={{
            name: "Dashboard",
            href: "/dashboard",
            icon: LayoutDashboard,
          }}
          isActive={isPathActive(pathname, "/dashboard")}
          collapsed={effectiveCollapsed}
        />
      </div>

      <div className="space-y-1">
        <SectionLabel>Wallet</SectionLabel>
        <NavItem
          item={{
            name: "Fund Wallet",
            href: "/dashboard/fund-account",
            icon: Wallet,
          }}
          isActive={isPathActive(pathname, "/dashboard/fund-account")}
          collapsed={effectiveCollapsed}
        />
        <NavItem
          item={{
            name: "Transfer",
            href: "/dashboard/fund-account/transfer-page",
            icon: Send,
          }}
          isActive={isPathActive(
            pathname,
            "/dashboard/fund-account/transfer-page",
          )}
          collapsed={effectiveCollapsed}
        />
        <NavItem
          item={{
            name: "Transactions",
            href: "/dashboard/transactions",
            icon: ArrowLeftRight,
          }}
          isActive={isPathActive(pathname, "/dashboard/transactions")}
          collapsed={effectiveCollapsed}
        />
      </div>

      <div className="space-y-1">
        <SectionLabel>Business Tools</SectionLabel>
        {showPaymentPage && (
          <NavItem
            item={{
              name: "Online Store",
              href: "/dashboard/services/payment/dashboard",
              icon: CreditCard,
            }}
            isActive={
              isPathActive(pathname, "/dashboard/services/payment/dashboard") ||
              isPathActive(pathname, "/dashboard/store")
            }
            collapsed={effectiveCollapsed}
          />
        )}
        <NavItem
          item={{
            name: "Bookkeeping",
            href: "/dashboard/services/bookkeeping",
            icon: BookOpen,
          }}
          isActive={isPathActive(pathname, "/dashboard/services/bookkeeping")}
          collapsed={effectiveCollapsed}
        />
        <NavItem
          item={{
            name: "Invoices",
            href: "/dashboard/services/create-invoice",
            icon: FileText,
          }}
          isActive={isPathActive(
            pathname,
            "/dashboard/services/create-invoice",
          )}
          collapsed={effectiveCollapsed}
        />
        <NavItem
          item={{
            name: "Receipts",
            href: "/dashboard/services/receipt",
            icon: Receipt,
          }}
          isActive={isPathActive(pathname, "/dashboard/services/receipt")}
          collapsed={effectiveCollapsed}
        />
        <NavItem
          item={{
            name: "Contracts",
            href: "/dashboard/services/contract",
            icon: FileSignature,
          }}
          isActive={isPathActive(pathname, "/dashboard/services/contract")}
          collapsed={effectiveCollapsed}
        />
        <NavItem
          item={{
            name: "Tax Management",
            href: "/dashboard/services/tax-filing",
            icon: Calculator,
          }}
          isActive={isPathActive(pathname, "/dashboard/services/tax-filing")}
          collapsed={effectiveCollapsed}
        />
      </div>

      <div className="space-y-1">
        <SectionLabel>Buy Services</SectionLabel>
        <NavItem
          item={{
            name: "Buy Airtime",
            href: "/dashboard/services/buy-airtime",
            icon: Smartphone,
          }}
          isActive={isPathActive(pathname, "/dashboard/services/buy-airtime")}
          collapsed={effectiveCollapsed}
        />
        <NavItem
          item={{
            name: "Buy Data",
            href: "/dashboard/services/buy-data",
            icon: Wifi,
          }}
          isActive={isPathActive(pathname, "/dashboard/services/buy-data")}
          collapsed={effectiveCollapsed}
        />
        <NavItem
          item={{
            name: "Cable TV",
            href: "/dashboard/services/buy-cable-tv",
            icon: Tv,
          }}
          isActive={isPathActive(pathname, "/dashboard/services/buy-cable-tv")}
          collapsed={effectiveCollapsed}
        />
      </div>

      <div className="space-y-1">
        <SectionLabel>More</SectionLabel>
        <NavItem
          item={{ name: "Blog / Articles", href: "/blog", icon: Newspaper }}
          isActive={isPathActive(pathname, "/blog")}
          collapsed={effectiveCollapsed}
        />
      </div>
    </div>
  );

  const PreferencesContent = () => (
    <div className="space-y-2">
      {preferenceItems.map((item) => (
        <NavItem
          key={item.name}
          item={item}
          isActive={isPathActive(pathname, item.href)}
          collapsed={effectiveCollapsed}
        />
      ))}

      {!effectiveCollapsed && (
        <div className="pt-2 mt-2 border-t border-(--border-color)">
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-xs font-medium text-(--text-secondary)">
              Theme
            </span>
            <ThemeToggle />
          </div>
        </div>
      )}

      {effectiveCollapsed && (
        <div className="flex justify-center pt-2">
          <ThemeToggle compact />
        </div>
      )}

      {userData && (
        <>
          {[
            "super_admin",
            "finance_admin",
            "operations_admin",
            "support_admin",
            "legal_admin",
          ].includes(userData?.role) && (
            <NavItem
              item={{ name: "Admin Panel", href: "/admin", icon: Settings }}
              isActive={isPathActive(pathname, "/admin")}
              collapsed={effectiveCollapsed}
            />
          )}
          {["super_admin", "operations_admin", "blog_admin"].includes(
            userData?.role,
          ) && (
            <NavItem
              item={{ name: "Blog Admin", href: "/blog/admin", icon: Captions }}
              isActive={isPathActive(pathname, "/blog/admin")}
              collapsed={effectiveCollapsed}
            />
          )}
        </>
      )}
    </div>
  );

  // ------- Logo header -------
  const LogoHeader = ({ onToggle }: { onToggle?: () => void }) => (
    <div
      className={`flex items-center h-16 border-b border-(--border-color) ${
        effectiveCollapsed ? "justify-center px-2" : "justify-between px-4"
      }`}
    >
      <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
        <Image
          src="/logo.png"
          alt="Zidwell Logo"
          width={32}
          height={32}
          className="w-8 h-8 object-contain shrink-0"
        />
        {!effectiveCollapsed && (
          <span className="text-lg font-bold tracking-tight text-(--text-primary) truncate uppercase">
            Zidwell
          </span>
        )}
      </Link>

      {onToggle && (
        <button
          onClick={onToggle}
          className="text-(--text-secondary) hover:text-(--text-primary) transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );

  // ------- Wallet card -------
  const WalletCard = () => {
    if (!userData || !userData.fullName) return null;

    if (effectiveCollapsed) {
      return (
        <div className="px-2 py-3 border-b border-(--border-color) flex justify-center">
          <div className="w-10 h-10 rounded-xl bg-(--color-accent-yellow) text-(--color-ink) flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
      );
    }

    return (
      <div className="p-4 border-b border-(--border-color)">
        <div className="rounded-2xl bg-(--bg-secondary) border border-(--border-color) p-4">
          <p className="text-[10px] text-(--text-secondary) uppercase tracking-wider mb-1">
            Wallet Balance
          </p>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-(--text-primary) tabular-nums">
              ₦{formatBalance()}
            </span>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="p-1 rounded-md hover:bg-(--bg-primary) transition-colors"
              aria-label={showBalance ? "Hide balance" : "Show balance"}
            >
              {showBalance ? (
                <Eye className="w-3.5 h-3.5 text-(--text-secondary)" />
              ) : (
                <EyeOff className="w-3.5 h-3.5 text-(--text-secondary)" />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ------- Collapse toggle (desktop only) -------
  const CollapseToggle = () => (
    <button
      onClick={() => setCollapsed((c) => !c)}
      className="
        hidden lg:flex items-center justify-center w-9 h-9 rounded-xl
        text-(--text-secondary) hover:text-(--text-primary)
        hover:bg-(--bg-secondary)
        transition-all duration-200
      "
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
      {collapsed ? (
        <PanelLeftOpen className="w-[18px] h-[18px]" strokeWidth={1.9} />
      ) : (
        <PanelLeftClose className="w-[18px] h-[18px]" strokeWidth={1.9} />
      )}
    </button>
  );

  // ------- Thin scrollbar styles -------
  const sidebarScrollStyles = `
    .sidebar-scroll::-webkit-scrollbar {
      width: 6px;
    }
    .sidebar-scroll::-webkit-scrollbar-track {
      background: transparent;
    }
    .sidebar-scroll::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.12);
      border-radius: 9999px;
    }
    .sidebar-scroll::-webkit-scrollbar-thumb:hover {
      background: rgba(0, 0, 0, 0.22);
    }
    .dark .sidebar-scroll::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.12);
    }
    .dark .sidebar-scroll::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.22);
    }
    .sidebar-scroll {
      scrollbar-width: thin;
      scrollbar-color: rgba(0, 0, 0, 0.15) transparent;
    }
    .dark .sidebar-scroll {
      scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
    }
  `;

  // ------- Mobile sidebar (full width) -------
  const MobileSidebar = () => (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-full
          bg-(--bg-primary)
          border-r border-(--border-color)
          transition-transform duration-300 ease-in-out
          flex flex-col
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="shrink-0">
          <LogoHeader onToggle={onClose} />
          <WalletCard />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto sidebar-scroll">
          <nav className="p-3">
            <NavigationContent />
          </nav>

          <div className="p-3 border-t border-(--border-color)">
            <SectionLabel>Preferences</SectionLabel>
            <PreferencesContent />
          </div>
        </div>
      </aside>
    </>
  );

  // ------- Desktop sidebar -------
  const DesktopSidebar = () => (
    <aside
      className={`
        hidden lg:flex flex-col fixed top-0 left-0 z-40 h-screen
        bg-(--bg-primary)
        border-r border-(--border-color)
        transition-all duration-300 ease-in-out
        ${effectiveCollapsed ? "w-[72px]" : "w-72"}
      `}
    >
      <div className="shrink-0">
        <div
          className={`flex items-center h-16 border-b border-(--border-color) ${
            effectiveCollapsed ? "justify-center px-2" : "justify-between px-4"
          }`}
        >
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 min-w-0"
          >
            <Image
              src="/logo.png"
              alt="Zidwell Logo"
              width={32}
              height={32}
              className="w-8 h-8 object-contain shrink-0"
            />
            {!effectiveCollapsed && (
              <span className="text-lg font-bold tracking-tight text-(--text-primary) truncate uppercase">
                Zidwell
              </span>
            )}
          </Link>

          {!effectiveCollapsed && <CollapseToggle />}
        </div>

        {effectiveCollapsed && (
          <div className="flex justify-center py-2 border-b border-(--border-color)">
            <CollapseToggle />
          </div>
        )}

        <WalletCard />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto sidebar-scroll">
        <nav className="p-3">
          <NavigationContent />
        </nav>

        <div className="p-3 border-t border-(--border-color)">
          {!effectiveCollapsed && <SectionLabel>Preferences</SectionLabel>}
          <PreferencesContent />
        </div>
      </div>
    </aside>
  );

  return (
    <>
      <style>{sidebarScrollStyles}</style>

      <div className="lg:hidden">
        <MobileSidebar />
      </div>
      <div className="hidden lg:block">
        <DesktopSidebar />
      </div>

      <style>{`
        :root {
          --sidebar-width: ${effectiveCollapsed ? "72px" : "288px"};
        }
        @media (max-width: 1023px) {
          :root {
            --sidebar-width: 0px;
          }
        }
      `}</style>
    </>
  );
};

export default DashboardSidebar;