// app/components/GlobalVerificationModal.tsx
"use client";

import { useUserContextData } from "@/app/context/userData";
import { useVerificationModal } from "@/app/context/verificationModalContext";
import OnboardingModal from "./dashboard-component/OnboardingModal"; 

const GlobalVerificationModal = () => {
  const { userData } = useUserContextData();
  const { isOpen, closeVerificationModal } = useVerificationModal();

  if (!userData) return null;

  return (
    <OnboardingModal
      userId={userData.id}
      userEmail={userData.email}
      userPhone={userData.phone}
      fullName={userData.full_name}
      purpose={userData.purpose === "business" ? "business" : "personal"}
      onComplete={() => {
        closeVerificationModal();
        // Refresh user data
        window.location.reload();
      }}
      onSkip={closeVerificationModal}
      isOpen={isOpen}
    />
  );
};

export default GlobalVerificationModal;