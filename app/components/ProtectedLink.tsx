// app/components/ProtectedLink.tsx
"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUserContextData } from "@/app/context/userData";

interface ProtectedLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  icon?: any;
}

// Use the same verification logic as the context
const isUserVerified = (userData: any): boolean => {
  if (!userData) return false;
  return (
    userData.bvn_verification === 'verified' ||
    userData.identity_verified === true ||
    userData.kyc_level === 'personal_verified' ||
    userData.kyc_level === 'business_verified' ||
    userData.verification_completed === true
  );
};

export const ProtectedLink = ({
  href,
  children,
  className = "",
  onClick,
  icon: Icon,
}: ProtectedLinkProps) => {
  const router = useRouter();
  const { userData } = useUserContextData();

  const verified = isUserVerified(userData);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();

    if (onClick) {
      onClick();
    }

    if (!verified) {
      router.push("/onboarding");
    } else {
      router.push(href);
    }
  };

  return (
    <Link
      href={verified ? href : "/onboarding"}
      onClick={handleClick}
      className={className}
    >
      {Icon && <Icon className="w-5 h-5" />}
      {children}
    </Link>
  );
};