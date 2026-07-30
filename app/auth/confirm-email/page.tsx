// app/auth/email-confirm/page.jsx
"use client";

import { useEffect } from "react";
import Swal from "sweetalert2";
import { useRouter, useSearchParams } from "next/navigation";

export default function EmailConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verified = searchParams.get('verified');

  useEffect(() => {
    // Only show the success message if verified is true
    if (verified === 'true') {
      Swal.fire({
        icon: "success",
        title: "Email Verified 🎉",
        text: "Your email has been successfully verified. You can now log in to your account.",
        confirmButtonText: "Go to Login",
        confirmButtonColor: "#3085d6",
      }).then((result) => {
        if (result.isConfirmed) {
          router.push("/auth/login");
        }
      });
    } else {
      // If someone lands here directly without verification, redirect to login
      router.push("/auth/login");
    }
  }, [router, verified]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <p className="text-lg text-gray-700">Verifying your email...</p>
    </div>
  );
}