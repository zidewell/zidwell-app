"use client";

import Swal from "sweetalert2";
import React, { FormEvent, useState } from "react";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import { useRouter } from "next/navigation";

const PasswordReset = () => {
  const [email, setEmail] = useState<string>("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState<boolean>(false);

  const router = useRouter();

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();

    const newErrors: { [key: string]: string } = {};

    if (!email || !/^[\w-.]+@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error);
      }

      await Swal.fire({
        title: "Password reset email sent",
        text: `Check ${email} for the reset link.`,
        icon: "success",
      });

      setEmail("");
    } catch (error: any) {
      console.error(error);

      await Swal.fire({
        title: "Failed",
        text: error.message || "Unable to send password reset email.",
        icon: "error",
      });

      setErrors({
        general: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-5 h-screen">
      {/* Back Button at Top */}
      <div className="flex justify-start mb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M19 12H5"/>
            <path d="M12 19l-7-7 7-7"/>
          </svg>
          <span>Back</span>
        </button>
      </div>

      <div className="flex flex-col justify-center items-center h-[70%]">
        <h2 className="text-2xl mb-2">Forgotten Password</h2>
        <p className="mb-4">Input your email for verification</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-[300px]">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="email">Email</Label>
            <input
              className="p-2 outline-none border border-gray-300 rounded-md bg-transparent focus:border-black"
              type="email"
              id="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {errors.email && <p className="text-red-500">{errors.email}</p>}
          {errors.general && <p className="text-red-500">{errors.general}</p>}
          <Button
            className="bg-(--color-accent-yellow) mt-4"
            type="submit"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send"}
          </Button>
        </form>
      </div>
    </main>
  );
};

export default PasswordReset;