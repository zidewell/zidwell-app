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


export const ProtectedLink = ({
  href,
  children,
  className = "",
  onClick,
  icon: Icon,
}: ProtectedLinkProps) => {
  const router = useRouter();
  const { userData } = useUserContextData();

  const isVerified = userData?.verification_completed === true;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();

    if (onClick) {
      onClick();
    }

    if (!isVerified) {
      router.push("/onboarding");
    } else {
      router.push(href);
    }
  };

  return (
    <Link
      href={isVerified ? href : "/onboarding"}
      onClick={handleClick}
      className={className}
    >
      {Icon && <Icon className="w-5 h-5" />}
      {children}
    </Link>
  );
};