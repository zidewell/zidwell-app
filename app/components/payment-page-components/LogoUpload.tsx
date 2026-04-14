"use client";

import { useState, useEffect } from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Upload, X, User } from "lucide-react";

interface LogoUploadProps {
  logo: string;
  onLogoChange: (logoUrl: string) => void;
  userProfilePicture?: string; // Add this prop
  userFullName?: string; // Optional: for alt text
}

const LogoUpload: React.FC<LogoUploadProps> = ({ 
  logo, 
  onLogoChange, 
  userProfilePicture
}) => {
  const [uploading, setUploading] = useState(false);
  const [displayLogo, setDisplayLogo] = useState<string>("");

  // Determine which logo to display
  useEffect(() => {
    if (logo) {
      // User has uploaded a custom logo
      setDisplayLogo(logo);
    } else if (userProfilePicture) {
      // Show user's profile picture as default
      setDisplayLogo(userProfilePicture);
    } else {
      // No logo available
      setDisplayLogo("");
    }
  }, [logo, userProfilePicture]);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];

      if (!file) return;

      // Client-side validation
      if (!file.type.startsWith("image/")) {
        alert("Please upload an image file (PNG, JPG, JPEG, GIF)");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }

      // Create temporary object URL for preview (doesn't upload to server yet)
      const objectUrl = URL.createObjectURL(file);

      // Convert to base64 for temporary storage in form state
      const reader = new FileReader();
      reader.onloadend = () => {
        onLogoChange(reader.result as string);
        // Clean up object URL since we have base64 now
        URL.revokeObjectURL(objectUrl);
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error("Upload error:", error);
      alert("Error processing logo");
    } finally {
      setUploading(false);
      // Reset file input
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const handleRemoveLogo = () => {
    // Clear the custom logo, but keep the profile picture if available
    onLogoChange("");
  };

  // Check if the current display logo is from user profile
  const isProfilePicture = !logo && userProfilePicture;

  return (
    <div className="mb-6">
      <Label htmlFor="logo" className="block mb-2">
        Business Logo / Profile Picture
      </Label>
      <div className="flex items-center gap-4">
        {displayLogo && (
          <div className="relative">
            <img
              src={displayLogo}
              alt={isProfilePicture ? `Profile picture` : "Business Logo"}
              className={`h-16 w-16 rounded-lg object-cover ${isProfilePicture ? 'rounded-full' : ''}`}
            />
            {/* Only show remove button if there's a custom logo */}
            {logo && (
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center text-xs"
              >
                <X className="h-3 w-3" />
              </button>
            )}
            {/* Show badge if it's profile picture */}
            {isProfilePicture && (
              <div className="absolute -bottom-2 -right-2 h-5 w-5 rounded-full bg-green-500 text-white flex items-center justify-center text-xs">
                <User className="h-3 w-3" />
              </div>
            )}
          </div>
        )}
        
        {!displayLogo && (
          <div className="h-16 w-16 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <User className="h-8 w-8 text-gray-400" />
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
                  : "hover:bg-gray-50 dark:hover:bg-gray-800"
              }
            `}
          >
            {uploading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </div>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                {logo ? "Change Logo" : userProfilePicture ? "Upload Custom Logo" : "Upload Logo"}
              </>
            )}
          </Label>
          <p className="text-xs text-muted-foreground mt-1">
            {userProfilePicture && !logo 
              ? "Currently using your profile picture. Upload a custom logo to replace it." 
              : "PNG, JPG, GIF up to 5MB. Logo will be saved when invoice is generated."}
          </p>
          {/* {isProfilePicture && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              ✓ Using your profile picture as the business logo
            </p>
          )} */}
        </div>
      </div>
    </div>
  );
};

export default LogoUpload;