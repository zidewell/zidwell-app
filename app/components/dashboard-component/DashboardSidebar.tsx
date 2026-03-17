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

interface DashboardSidebarProps {
  open: boolean;
  onClose: () => void;
}

const DashboardSidebar = ({ open, onClose }: DashboardSidebarProps) => {
  const [showBalance, setShowBalance] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const pathname = usePathname();
  const { userData, balance } = useUserContextData();

  // Check if mobile on mount and when window resizes
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Prevent body scroll when sidebar is open on mobile
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

  // Fixed NavItem component - ensures icons are only rendered once
  const NavItem = ({ item, isActive }: { item: any; isActive: boolean }) => {
    // List of links that require BVN verification
    const protectedLinks = [
      "/dashboard/fund-account",
      "/dashboard/fund-account/transfer-page",
      "/dashboard/services/buy-airtime",
      "/dashboard/services/buy-data",
      "/dashboard/services/buy-power",
      "/dashboard/services/buy-cable-tv",
    ];

    const isProtected = protectedLinks.includes(item.href);
    
    // Common className for both protected and regular links
    const commonClassName = `flex items-center gap-4 p-3 rounded-md text-sm font-bold uppercase tracking-wide border-2 transition-all duration-150 ${
      isActive
        ? "bg-[#2b825b] dark:bg-[#2b825b] text-white border-[#242424] dark:border-[#474747] shadow-[2px_2px_0px_#242424] dark:shadow-[2px_2px_0px_#000000]"
        : "border-transparent text-[#6b6b6b] dark:text-[#a6a6a6] hover:bg-[#f0efe7] dark:hover:bg-[#242424] hover:text-[#141414] dark:hover:text-[#f5f5f5] hover:border-[#242424] dark:hover:border-[#474747] hover:shadow-[2px_2px_0px_#242424] dark:hover:shadow-[2px_2px_0px_#000000]"
    }`;

    // If it's a protected link, use ProtectedLink but don't pass the icon prop
    if (isProtected) {
      return (
        <ProtectedLink
          href={item.href}
          onClick={onClose}
          className={commonClassName}
        >
          <item.icon className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">{item.name}</span>
        </ProtectedLink>
      );
    }

    // Regular link
    return (
      <Link
        href={item.href}
        onClick={onClose}
        className={commonClassName}
      >
        <item.icon className="w-5 h-5 flex-shrink-0" />
        <span className="font-medium">{item.name}</span>
      </Link>
    );
  };

  // Function to format balance with hidden state
  const formatBalance = () => {
    if (!showBalance) {
      return "*****";
    }
    if (balance != null) {
      return formatNumber(balance);
    }
    return "0.00";
  };

  // Shared navigation content to avoid duplication
  const NavigationContent = () => (
    <div className="space-y-6">
      {/* Dashboard */}
      <NavItem
        item={{
          name: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
        }}
        isActive={pathname === "/dashboard"}
      />

      {/* Wallet & Transactions */}
      <div className="space-y-2">
        <NavItem
          item={{
            name: "Fund Wallet",
            href: "/dashboard/fund-account",
            icon: Wallet,
          }}
          isActive={pathname === "/dashboard/fund-account"}
        />
        
        <NavItem
          item={{
            name: "Transfer",
            href: "/dashboard/fund-account/transfer-page",
            icon: Send,
          }}
          isActive={pathname === "/dashboard/fund-account/transfer-page"}
        />

        <NavItem
          item={{
            name: "Transactions",
            href: "/dashboard/transactions",
            icon: ArrowLeftRight,
          }}
          isActive={pathname === "/dashboard/transactions"}
        />
      </div>

      {/* Business Tools */}
      <div>
        <h3 className="text-xs font-semibold text-[#6b6b6b] dark:text-[#a6a6a6] uppercase tracking-wider mb-2 px-4">
          Business Tools
        </h3>
        <div className="space-y-2">
          <NavItem
            item={{
              name: "Bookkeeping",
              href: "/dashboard/services/bookkeeping",
              icon: BookOpen,
            }}
            isActive={pathname === "/dashboard/services/bookkeeping"}
          />

          <NavItem
            item={{
              name: "Invoices",
              href: "/dashboard/services/create-invoice",
              icon: FileText,
            }}
            isActive={pathname === "/dashboard/services/create-invoice"}
          />

          <NavItem
            item={{
              name: "Receipts",
              href: "/dashboard/services/receipt",
              icon: Receipt,
            }}
            isActive={pathname === "/dashboard/services/receipt"}
          />

          <NavItem
            item={{
              name: "Contracts",
              href: "/dashboard/services/contract",
              icon: FileSignature,
            }}
            isActive={pathname === "/dashboard/services/contract" || pathname === "/dashboard/services/contract/create-contract-form"}
          />

          {/* <NavItem
            item={{
              name: "Payment Pages",
              href: "/dashboard/payment-pages",
              icon: CreditCard,
            }}
            isActive={pathname === "/dashboard/payment-pages"}
          /> */}

          <NavItem
            item={{
              name: "Tax Management",
              href: "/dashboard/services/tax-filing",
              icon: Calculator,
            }}
            isActive={pathname === "/dashboard/services/tax-filing"}
          />

          <NavItem
            item={{
              name: "Reports",
              href: "/dashboard/reports",
              icon: BarChart3,
            }}
            isActive={pathname === "/dashboard/reports"}
          />
        </div>
      </div>

      {/* Buy Services */}
      <div>
        <h3 className="text-xs font-semibold text-[#6b6b6b] dark:text-[#a6a6a6] uppercase tracking-wider mb-2 px-4">
          Buy Services
        </h3>
        <div className="space-y-2">
          <NavItem
            item={{
              name: "Buy Airtime",
              href: "/dashboard/services/buy-airtime",
              icon: Smartphone,
            }}
            isActive={pathname === "/dashboard/services/buy-airtime"}
          />

          <NavItem
            item={{
              name: "Buy Data",
              href: "/dashboard/services/buy-data",
              icon: Wifi,
            }}
            isActive={pathname === "/dashboard/services/buy-data"}
          />

          <NavItem
            item={{
              name: "Buy Light",
              href: "/dashboard/services/buy-power",
              icon: Lightbulb,
            }}
            isActive={pathname === "/dashboard/services/buy-power"}
          />

          <NavItem
            item={{
              name: "Cable TV",
              href: "/dashboard/services/buy-cable-tv",
              icon: Tv,
            }}
            isActive={pathname === "/dashboard/services/buy-cable-tv"}
          />
        </div>
      </div>

      {/* Blog / Articles */}
      <NavItem
        item={{
          name: "Blog / Articles",
          href: "/blog",
          icon: Newspaper,
        }}
        isActive={pathname === "/blog" || pathname.startsWith("/blog/")}
      />
    </div>
  );

  // Shared preferences content
  const PreferencesContent = () => (
    <div className="space-y-2">
      {preferenceItems.map((item) => (
        <NavItem
          key={item.name}
          item={item}
          isActive={pathname === item.href}
        />
      ))}

      {/* Admin Links - Role Based */}
      {userData && (
        <>
          {/* Main Admin Panel */}
          {[
            "super_admin",
            "finance_admin",
            "operations_admin",
            "support_admin",
            "legal_admin",
          ].includes(userData?.role) && (
            <NavItem
              item={{
                name: "Admin Panel",
                href: "/admin",
                icon: Settings,
              }}
              isActive={pathname === "/admin" || pathname.startsWith("/admin/")}
            />
          )}

          {/* Blog Admin */}
          {["super_admin", "operations_admin", "blog_admin"].includes(
            userData?.role,
          ) && (
            <NavItem
              item={{
                name: "Blog Admin",
                href: "/blog/admin",
                icon: Captions,
              }}
              isActive={pathname === "/blog/admin"}
            />
          )}
        </>
      )}
    </div>
  );

  // Mobile Sidebar Version
  const MobileSidebar = () => (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-[#141414]/40 dark:bg-[#000000]/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-72 bg-[#ffffff] dark:bg-[#121212] border-r-2 border-[#242424] dark:border-[#474747]
          transition-transform duration-300 ease-in-out overflow-y-auto
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex flex-col min-h-full">
          {/* Logo and close button */}
          <div className="flex items-center justify-between h-20 px-7 border-b-2 border-[#242424] dark:border-[#474747]">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Zidwell Logo"
                width={32}
                height={32}
                className="w-8 object-contain"
              />
              <span className="text-2xl font-bold tracking-tight text-[#141414] dark:text-[#f5f5f5] uppercase">
                Zidwell
              </span>
            </Link>
            <button
              onClick={onClose}
              className="lg:hidden text-[#6b6b6b] dark:text-[#a6a6a6] hover:text-[#141414] dark:hover:text-[#f5f5f5]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User info */}
          {userData && userData.fullName && (
            <div className="p-5 border-b-2 border-[#242424] dark:border-[#474747]">
              <div className="space-y-2">
                <p className="text-[#6b6b6b] dark:text-[#a6a6a6] text-sm">
                  Welcome Back, {userData.fullName}
                </p>
                {balance != null && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#6b6b6b] dark:text-[#a6a6a6] text-xs">Wallet Balance</p>
                      <div className="flex items-center gap-1">
                        <span className="text-[#141414] dark:text-[#f5f5f5] text-sm font-bold">
                          ₦{formatBalance()}
                        </span>
                        <button
                          onClick={() => setShowBalance(!showBalance)}
                          className="p-1 hover:bg-[#f0efe7] dark:hover:bg-[#242424] rounded-md transition-colors duration-200"
                          aria-label={showBalance ? "Hide balance" : "Show balance"}
                        >
                          {showBalance ? (
                            <Eye className="w-4 h-4 text-[#6b6b6b] dark:text-[#a6a6a6]" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-[#6b6b6b] dark:text-[#a6a6a6]" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-5">
            <NavigationContent />
          </nav>

          {/* Preferences */}
          <div className="p-5 border-t-2 border-[#242424] dark:border-[#474747]">
            <h3 className="text-xs font-semibold text-[#6b6b6b] dark:text-[#a6a6a6] uppercase tracking-wider mb-3">
              Preferences
            </h3>
            <PreferencesContent />
          </div>
        </div>
      </aside>
    </>
  );

  // Desktop Sidebar Version - Fixed position
  const DesktopSidebar = () => (
    <aside className="hidden lg:block fixed top-0 left-0 z-40 h-screen w-72 bg-[#ffffff] dark:bg-[#121212] border-r-2 border-[#242424] dark:border-[#474747] overflow-y-auto">
      <div className="flex flex-col min-h-full">
        {/* Logo */}
        <div className="flex items-center h-20 px-7 border-b-2 border-[#242424] dark:border-[#474747]">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Zidwell Logo"
              width={32}
              height={32}
              className="w-8 object-contain"
            />
            <span className="text-2xl font-bold tracking-tight text-[#141414] dark:text-[#f5f5f5] uppercase">
              Zidwell
            </span>
          </Link>
        </div>

        {/* User info */}
        {userData && userData.fullName && (
          <div className="p-5 border-b-2 border-[#242424] dark:border-[#474747]">
            <div className="space-y-2">
              <p className="text-[#6b6b6b] dark:text-[#a6a6a6] text-sm">
                Welcome Back, {userData.fullName}
              </p>
              {balance != null && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#6b6b6b] dark:text-[#a6a6a6] text-xs">Wallet Balance</p>
                    <div className="flex items-center gap-1">
                      <span className="text-[#141414] dark:text-[#f5f5f5] text-sm font-bold">
                        ₦{formatBalance()}
                      </span>
                      <button
                        onClick={() => setShowBalance(!showBalance)}
                        className="p-1 hover:bg-[#f0efe7] dark:hover:bg-[#242424] rounded-md transition-colors duration-200"
                        aria-label={showBalance ? "Hide balance" : "Show balance"}
                      >
                        {showBalance ? (
                          <Eye className="w-4 h-4 text-[#6b6b6b] dark:text-[#a6a6a6]" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-[#6b6b6b] dark:text-[#a6a6a6]" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-5">
          <NavigationContent />
        </nav>

        {/* Preferences */}
        <div className="p-5 border-t-2 border-[#242424] dark:border-[#474747]">
          <h3 className="text-xs font-semibold text-[#6b6b6b] dark:text-[#a6a6a6] uppercase tracking-wider mb-3">
            Preferences
          </h3>
          <PreferencesContent />
        </div>
      </div>
    </aside>
  );

  // Render appropriate version based on screen size
  return (
    <>
      {/* Mobile Version */}
      <div className="lg:hidden">
        <MobileSidebar />
      </div>

      {/* Desktop Version */}
      <div className="hidden lg:block">
        <DesktopSidebar />
      </div>
    </>
  );
};

export default DashboardSidebar;