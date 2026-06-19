// app/components/payment-page-components/LogoUpload.tsx

"use client";

import { useRef } from "react";
import { Upload, X } from "lucide-react";
import { Label } from "@/app/components/ui/label";

interface LogoUploadProps {
  logoPreview: string | null;
  logoBase64: string | null;
  userProfilePicture: string | null;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
}

export function LogoUpload({
  logoPreview,
  logoBase64,
  userProfilePicture,
  onFileSelect,
  onRemove,
}: LogoUploadProps) {
  const logoRef = useRef<HTMLInputElement>(null);

  const isDefaultLogo = !logoBase64 && userProfilePicture;

  return (
    <div>
      <Label className="text-sm font-semibold mb-2 block text-(--text-primary)">
        Logo / Profile Picture
      </Label>
      <div className="flex items-center gap-4">
        {logoPreview ? (
          <div className="relative group">
            <img
              src={logoPreview}
              alt="Logo"
              className={`h-20 w-20 object-cover border border-(--border-color) ${
                isDefaultLogo ? "rounded-full" : "rounded-2xl"
              }`}
            />
            {logoBase64 && (
              <button
                onClick={onRemove}
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-[var(--destructive)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
              >
                <X className="h-3 w-3 text-white" />
              </button>
            )}
          </div>
        ) : (
          <div className="h-20 w-20 rounded-2xl bg-(--bg-secondary) border-2 border-dashed border-(--border-color) flex items-center justify-center">
            <Upload className="h-6 w-6 text-(--text-secondary)" />
          </div>
        )}
        <div className="flex-1">
          <input
            type="file"
            ref={logoRef}
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFileSelect(file);
            }}
          />
          <button
            onClick={() => logoRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-(--border-color) rounded-xl bg-(--bg-secondary)/50 hover:border-(--color-accent-yellow) transition-colors"
          >
            <Upload className="h-4 w-4" />
            <span className="text-sm text-(--text-secondary)">Upload Logo</span>
          </button>
          <p className="text-xs text-(--text-secondary) mt-1">
            Square image recommended (e.g., 200x200px)
          </p>
        </div>
      </div>
    </div>
  );
}
