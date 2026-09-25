"use client";

import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { useVerificationModal } from "@/app/context/verificationModalContext";
import { useUserContextData } from "@/app/context/userData";

const IdentityVerificationModal = () => {
  const router = useRouter();
  const { isOpen, closeVerificationModal } = useVerificationModal();
  const { userData } = useUserContextData();

  const isBusiness = userData?.purpose === "business";

  const handleStart = () => {
    closeVerificationModal();
    router.push("/verification");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && closeVerificationModal()}>
      <DialogContent className="sm:max-w-md bg-(--bg-primary) border border-(--border-color) squircle-lg p-0 overflow-hidden">
        <div className="bg-(--color-accent-yellow) p-6 text-center space-y-2">
          <div className="mx-auto h-14 w-14 squircle-md bg-black/10 flex items-center justify-center">
            <ShieldCheck className="h-7 w-7 text-(--color-ink)" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-(--color-ink)">
              Verify your identity
            </DialogTitle>
            <DialogDescription className="text-(--color-ink)/80 text-sm">
              Quick verification to unlock all Zidwell features.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <p className="text-sm font-semibold text-(--text-primary) mb-3">
              You&apos;ll need:
            </p>
            <ul className="space-y-2.5">
              {[
                "A valid government ID (BVN, NIN, Passport, or Driver's License)",
                "A 4-digit transaction PIN",
                isBusiness ? "Your CAC number (if registered)" : null,
              ]
                .filter(Boolean)
                .map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <span className="h-5 w-5 rounded-full bg-(--color-lemon-green)/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="h-2 w-2 rounded-full bg-(--color-lemon-green)" />
                    </span>
                    <span className="text-(--text-primary)">{item}</span>
                  </li>
                ))}
            </ul>
          </div>

          <div className="rounded-lg bg-(--bg-secondary) p-3 text-xs text-(--text-secondary)">
            <strong className="text-(--text-primary)">⏱ Time needed:</strong>{" "}
            about 3–5 minutes. Your data is encrypted and secure.
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={closeVerificationModal}
              className="flex-1 squircle-md border-(--border-color) text-(--text-primary) hover:bg-(--bg-secondary) cursor-pointer"
            >
              Later
            </Button>
            <Button
              onClick={handleStart}
              className="flex-1 squircle-md bg-(--color-accent-yellow) text-(--color-ink) hover:opacity-90 font-semibold cursor-pointer"
            >
              Start Verification
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IdentityVerificationModal;