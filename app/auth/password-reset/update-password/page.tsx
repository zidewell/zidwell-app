"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import { supabase } from "@/app/supabase/supabase";

const UpdatePassword = () => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const newErrors: { [key: string]: string } = {};
    if (!password || password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      Swal.fire({
        title: "Failed to reset password",
        text: error.message,
        icon: "error",
      });
      setLoading(false);
      return;
    }

    Swal.fire({
      title: "Password Updated!",
      text: "Your password has been successfully updated.",
      icon: "success",
    });

    setLoading(false);
    router.push("/auth/login");
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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
        <h2 className="text-2xl mb-2">Set a New Password</h2>
        <p className="mb-4">Enter your new password below</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-[300px]">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <input
                className="p-2 pr-10 outline-none border border-gray-300 rounded-md bg-transparent focus:border-black w-full"
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
          {errors.password && <p className="text-red-500">{errors.password}</p>}
          <Button
            className="bg-(--color-accent-yellow) mt-4"
            type="submit"
            disabled={loading}
          >
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </div>
    </main>
  );
};

export default UpdatePassword;