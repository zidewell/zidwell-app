"use client";

import { useState, useEffect } from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Upload, X, User } from "lucide-react";

interface LogoUploadProps {
  logo: string;
  onLogoChange: (logoUrl: string) => void;
  userProfilePicture?: string;
  userFullName?: string;
}

const LogoUpload: React.FC<LogoUploadProps> = ({
  logo,
  onLogoChange,
  userProfilePicture,
}) => {
  const [uploading, setUploading] = useState(false);
  const [displayLogo, setDisplayLogo] = useState<string>("");

  useEffect(() => {
    if (logo) {
      setDisplayLogo(logo);
    } else if (userProfilePicture) {
      setDisplayLogo(userProfilePicture);
    } else {
      setDisplayLogo("");
    }
  }, [logo, userProfilePicture]);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];

      if (!file) return;

      if (!file.type.startsWith("image/")) {
        alert("Please upload an image file (PNG, JPG, JPEG, GIF)");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }

      const objectUrl = URL.createObjectURL(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        onLogoChange(reader.result as string);
        URL.revokeObjectURL(objectUrl);
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error("Upload error:", error);
      alert("Error processing logo");
    } finally {
      setUploading(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const handleRemoveLogo = () => {
    onLogoChange("");
  };

  const isProfilePicture = !logo && userProfilePicture;

  return (
    <div className="mb-6">
      <Label htmlFor="logo" className="block mb-2 text-(--text-secondary)">
        Business Logo / Profile Picture
      </Label>
      <div className="flex items-center gap-4">
        {displayLogo && (
          <div className="relative">
            <img
              src={displayLogo}
              alt={isProfilePicture ? "Profile picture" : "Business Logo"}
              className={`h-16 w-16 rounded-lg object-cover border border-(--border-color) ${isProfilePicture ? "rounded-full" : "squircle-md"}`}
            />
            {logo && (
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive hover:bg-destructive/80 text-white flex items-center justify-center text-xs"
              >
                <X className="h-3 w-3" />
              </button>
            )}
            {isProfilePicture && (
              <div className="absolute -bottom-2 -right-2 h-5 w-5 rounded-full bg-(--color-lemon-green) text-white flex items-center justify-center text-xs">
                <User className="h-3 w-3" />
              </div>
            )}
          </div>
        )}

        {!displayLogo && (
          <div className="h-16 w-16 rounded-lg bg-(--bg-secondary) border border-(--border-color) flex items-center justify-center">
            <User className="h-8 w-8 text-(--text-secondary)" />
          </div>
        )}

        <div className="flex-1">
          <Input
            id="logo"
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
          <Label
            htmlFor="logo"
            className={`
              flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer transition-colors
              ${
                uploading
                  ? "bg-gray-100 cursor-not-allowed"
                  : "hover:bg-(--bg-secondary) border-(--border-color) text-(--text-secondary)"
              }
            `}
          >
            {uploading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-(--color-accent-yellow) border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </div>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                {logo
                  ? "Change Logo"
                  : userProfilePicture
                    ? "Upload Custom Logo"
                    : "Upload Logo"}
              </>
            )}
          </Label>
          <p className="text-xs text-(--text-secondary) mt-1">
            {userProfilePicture && !logo
              ? "Currently using your profile picture. Upload a custom logo to replace it."
              : "PNG, JPG, GIF up to 5MB. Logo will be saved when invoice is generated."}
          </p>
          {isProfilePicture && (
            <p className="text-xs text-(--color-lemon-green) mt-1">
              ✓ Using your profile picture as the business logo
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogoUpload;
