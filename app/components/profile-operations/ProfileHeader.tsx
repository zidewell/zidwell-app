// app/components/new-profile/ProfileHeader.tsx
import React, { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { useUserContextData } from "@/app/context/userData";
import Swal from "sweetalert2";

type SubscriptionTier = "free" | "zidlite" | "growth" | "premium" | "elite";

interface ProfileHeaderProps {
  name: string;
  email: string;
  subscription: SubscriptionTier;
  walletActivated: boolean;
  avatarUrl?: string;
}

const tierLabels: Record<SubscriptionTier, string> = {
  free: "Free",
  zidlite: "ZidLite",
  growth: "Growth",
  premium: "Premium",
  elite: "Elite",
};

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  name,
  email,
  subscription,
  walletActivated,
  avatarUrl,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatar, setAvatar] = useState(avatarUrl || "");
  const [uploading, setUploading] = useState(false);
  const { userData, setUserData } = useUserContextData();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userData?.id) return;

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", userData.id);

      const response = await fetch("/api/profile/upload-profile-picture", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload image");
      }

      const url = URL.createObjectURL(file);
      setAvatar(url);

      const updatedUser = { ...userData, profile_picture: data.url };
      setUserData(updatedUser);
      localStorage.setItem("userData", JSON.stringify(updatedUser));

      Swal.fire({
        icon: "success",
        title: "Profile Updated!",
        text: "Your profile picture has been uploaded.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err: any) {
      console.error("Upload failed:", err);
      Swal.fire({
        icon: "error",
        title: "Upload Failed",
        text: err.message || "Something went wrong.",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="neo-card bg-card p-6 md:p-8">
      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-muted border-2 border-foreground flex items-center justify-center overflow-hidden">
            {avatar ? (
              <img
                src={avatar}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl md:text-3xl font-heading text-foreground">
                {name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#2b825b] border-2 border-foreground flex items-center justify-center disabled:opacity-50"
            aria-label="Change profile picture"
          >
            <Camera className="w-3.5 h-3.5 text-[#2b825b]-foreground" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg md:text-xl font-heading text-foreground truncate">
            {name}
          </h2>
          <p className="text-sm font-body text-muted-foreground truncate">
            {email}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs  text-[#2b825b] border-2 border-[#2b825b] px-2 py-0.5">
              {tierLabels[subscription]}
            </span>
            {walletActivated && (
              <span className="text-xs  text-[#2b825b]">Wallet Active</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
