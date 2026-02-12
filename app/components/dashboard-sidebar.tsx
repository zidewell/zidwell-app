"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  FileText,
  FileSpreadsheet,
  User,
  Menu,
  X,
  Smartphone,
  Wifi,
  Tv,
  Lightbulb,
  Settings,
  Eye,
  EyeOff,
  Send,
  Captions,
  ChartColumnIncreasing,
} from "lucide-react";
import Image from "next/image";
import { useUserContextData } from "../context/userData";

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

export default function DashboardSidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showBalance, setShowBalance] = useState(false);

  const pathname = usePathname();
  const { userData, balance } = useUserContextData();

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }

    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [isMobileMenuOpen]);

  const NavItem = ({ item, isActive }: { item: any; isActive: boolean }) => (
    <Link
      href={item.href}
      onClick={() => setIsMobileMenuOpen(false)}
      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
        isActive
          ? "bg-yellow-500/20 text-[#C29307] border-r-2 border-[#C29307]"
          : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
      }`}
    >
      <item.icon className="w-5 h-5" />
      <span className="font-medium">{item.name}</span>
    </Link>
  );

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

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className={
          isMobileMenuOpen
            ? "lg:hidden fixed top-4 right-3 z-50 p-2 bg-gray-900 text-white rounded-lg "
            : `lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 text-white rounded-lg`
        }
      >
        {isMobileMenuOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-62 bg-gray-900 overflow-y-auto transform transition-transform duration-300 ease-in-out lg:translate-x-0 overflow-hidden ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full w-[300px]">
          {/* Logo and welcome */}
          <div className="p-5 border-b border-gray-700">
            <div className="flex items-center space-x-3 mb-4">
              <Link href="/dashboard" className="flex items-center">
                <Image
                  src="/logo.png"
                  alt="Zidwell Logo"
                  width={32}
                  height={32}
                  className="mr-2 w-16 object-contain"
                />
                <h1 className="font-bold text-lg text-white">Zidwell</h1>
              </Link>
            </div>
            {userData && userData.firstName ? (
              <div className="space-y-2">
                <p className="text-gray-400 text-sm">
                  Welcome Back {`${userData.firstName}`}
                </p>
                {balance != null && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Wallet Balance</p>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-300 text-sm font-medium">
                          ₦{formatBalance()}
                        </span>
                        <button
                          onClick={() => setShowBalance(!showBalance)}
                          className="p-1 hover:bg-gray-800 rounded-md transition-colors duration-200"
                          aria-label={
                            showBalance ? "Hide balance" : "Show balance"
                          }
                        >
                          {showBalance ? (
                            <Eye className="w-4 h-4 text-gray-400 hover:text-gray-300" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-gray-400 hover:text-gray-300" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Navigation */}
          <div className="flex-1 px-2 py-6 space-y-2">
            <NavItem
              item={{
                name: "Dashboard",
                href: "/dashboard",
                icon: LayoutDashboard,
              }}
              isActive={pathname === "/dashboard"}
            />

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
                name: "My Transaction",
                href: "/dashboard/transactions",
                icon: Receipt,
              }}
              isActive={pathname === "/dashboard/transactions"}
            />

            <NavItem
              item={{
                name: "Airtime",
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

            {/* Pay Bills Links - Now Visible */}
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

            <NavItem
              item={{
                name: "Create Invoice",
                href: "/dashboard/services/create-invoice",
                icon: FileSpreadsheet,
              }}
              isActive={pathname === "/dashboard/services/create-invoice"}
            />

            <NavItem
              item={{
                name: "Create Receipt",
                href: "/dashboard/services/receipt",
                icon: Receipt,
              }}
              isActive={pathname === "/dashboard/services/receipt"}
            />

            <NavItem
              item={{
                name: "Create Agreement",
                href: "/dashboard/services/contract",
                icon: FileText,
              }}
              isActive={pathname === "/dashboard/services/contract"}
            />
            <NavItem
              item={{
                name: "Bookkeeping",
                href: "/dashboard/services/bookkeeping",
                icon: ChartColumnIncreasing,
              }}
              isActive={pathname === "/dashboard/services/bookkeeping"}
            />

            <NavItem
              item={{
                name: "Tax Manager",
                href: "/dashboard/services/tax-filing",
                icon: FileSpreadsheet,
              }}
              isActive={pathname === "/dashboard/services/tax-filing"}
            />
          </div>

          {/* Preferences */}
          <div className="px-4 py-6 border-t border-gray-700">
            <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">
              Preferences
            </h3>
            <div className="space-y-2">
              {preferenceItems.map((item) => (
                <NavItem
                  key={item.name}
                  item={item}
                  isActive={pathname === item.href}
                />
              ))}

              {userData &&
                [
                  "super_admin",
                  "finance_admin",
                  "operations_admin",
                  "support_admin",
                  "legal_admin",
                ].includes(userData?.role) && (

                  <>
                  <Link
                    href="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      pathname === "/admin"
                        ? "bg-yellow-500/20 text-[#C29307] border-r-2 border-[#C29307]"
                        : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    <span className="font-medium">Admin</span>
                  </Link>
                  <Link
                    href="/blog/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      pathname === "/blog/admin"
                        ? "bg-yellow-500/20 text-[#C29307] border-r-2 border-[#C29307]"
                        : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
                    }`}
                  >
                    <Captions className="w-4 h-4"/>
                  
                    <span className="font-medium">Blog Admin</span>
                  </Link>
                  </>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}