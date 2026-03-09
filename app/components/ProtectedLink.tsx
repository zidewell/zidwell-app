"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useVerificationModal } from "@/app/context/verificationModalContext";
import { useUserContextData } from "@/app/context/userData";

interface ProtectedLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  icon?: any;
}

export const ProtectedLink = ({ 
  href, 
  children, 
  className = "", 
  onClick,
  icon: Icon 
}: ProtectedLinkProps) => {
  const router = useRouter();
  const { userData } = useUserContextData();
  const { openVerificationModal } = useVerificationModal();

  const isVerified = userData?.bvnVerification === "verified";

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (onClick) {
      onClick();
    }

    if (!isVerified) {
      openVerificationModal();
    } else {
      router.push(href);
    }
  };

  return (
    <Link
      href={isVerified ? href : "#"}
      onClick={handleClick}
      className={className}
    >
      {Icon && <Icon className="w-5 h-5" />}
      {children}
    </Link>
  );
};

export const ProtectedButton = ({ 
  onClick,
  children, 
  className = "",
  icon: Icon 
}: { 
  onClick?: () => void;
  children: ReactNode; 
  className?: string;
  icon?: any;
}) => {
  const { userData } = useUserContextData();
  const { openVerificationModal } = useVerificationModal();

  const isVerified = userData?.bvnVerification === "verified";

  const handleClick = () => {
    if (!isVerified) {
      openVerificationModal();
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <button onClick={handleClick} className={className}>
      {Icon && <Icon className="w-5 h-5" />}
      {children}
    </button>
  );
};