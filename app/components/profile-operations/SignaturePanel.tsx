// app/components/new-profile/SignaturePanel.tsx
import React, { useRef, useState, useEffect, useCallback } from "react";
import SignaturePad from "signature_pad";
import { useUserContextData } from "@/app/context/userData";
import Swal from "sweetalert2";
import { Loader2, Check } from "lucide-react";

interface SignaturePanelProps {
  onSaveStart?: () => void;
  onSaveEnd?: () => void;
}

const SignaturePanel: React.FC<SignaturePanelProps> = ({
  onSaveStart,
  onSaveEnd,
}) => {
  const { userData } = useUserContextData();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasSavedSignature, setHasSavedSignature] = useState(false);

  // Load saved signature from database
  useEffect(() => {
    const loadSavedSignature = async () => {
      if (!userData?.id) {
        setInitialLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/saved-signature?userId=${userData.id}`,
        );
        const result = await response.json();

        if (result.success && result.signature) {
          setSignature(result.signature);
          setHasSavedSignature(true);
        }
      } catch (error) {
        console.error("Error loading saved signature:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    loadSavedSignature();
  }, [userData?.id]);

  // Initialize signature pad
  useEffect(() => {
    if (!isMounted || !canvasRef.current || initialLoading) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const resizeCanvas = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;

      canvas.width = width * ratio;
      canvas.height = height * ratio;

      if (ctx) {
        ctx.scale(ratio, ratio);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = "var(--color-accent-yellow)";
        ctx.lineWidth = 2;
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    signaturePadRef.current = new SignaturePad(canvas, {
      backgroundColor: "rgb(255, 255, 255)",
      penColor: "var(--color-accent-yellow)",
      minWidth: 1,
      maxWidth: 2.5,
      throttle: 16,
    });

    signaturePadRef.current.addEventListener("beginStroke", () => {
      setIsDrawing(true);
    });

    signaturePadRef.current.addEventListener("endStroke", () => {
      setIsDrawing(false);
    });

    // Load saved signature into canvas if exists
    if (signature && signaturePadRef.current) {
      const loadSignature = async () => {
        try {
          await signaturePadRef.current?.fromDataURL(signature);
        } catch (error) {
          console.error("Error loading signature into canvas:", error);
        }
      };
      loadSignature();
    }

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (signaturePadRef.current) {
        signaturePadRef.current.off();
      }
    };
  }, [isMounted, initialLoading, signature]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleClear = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
      setSignature(null);
      setHasSavedSignature(false);
    }
  };

  const handleSave = async () => {
    if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) {
      Swal.fire({
        icon: "warning",
        title: "No Signature",
        text: "Please draw your signature first",
        confirmButtonColor: "var(--color-accent-yellow)",
      });
      return;
    }

    if (!userData?.id) return;

    setLoading(true);
    onSaveStart?.();

    try {
      const signatureData = signaturePadRef.current.toDataURL();

      const response = await fetch("/api/saved-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userData.id,
          signature: signatureData,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save signature");
      }

      setSignature(signatureData);
      setHasSavedSignature(true);

      Swal.fire({
        icon: "success",
        title: "Signature Saved",
        text: "Your signature has been saved successfully",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message,
        confirmButtonColor: "var(--color-accent-yellow)",
      });
    } finally {
      setLoading(false);
      onSaveEnd?.();
    }
  };

  const handleUpdate = async () => {
    if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) {
      Swal.fire({
        icon: "warning",
        title: "No Signature",
        text: "Please draw your signature first",
        confirmButtonColor: "var(--color-accent-yellow)",
      });
      return;
    }

    if (!userData?.id) return;

    setLoading(true);
    onSaveStart?.();

    try {
      const signatureData = signaturePadRef.current.toDataURL();

      const response = await fetch("/api/saved-signature", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userData.id,
          signature: signatureData,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          return handleSave();
        }
        throw new Error(result.error || "Failed to update signature");
      }

      setSignature(signatureData);

      Swal.fire({
        icon: "success",
        title: "Signature Updated",
        text: "Your signature has been updated successfully",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message,
        confirmButtonColor: "var(--color-accent-yellow)",
      });
    } finally {
      setLoading(false);
      onSaveEnd?.();
    }
  };

  if (!isMounted || initialLoading) {
    return (
      <div className="space-y-3">
        <label className="text-sm font-body text-[var(--text-secondary)] block">
          Signature
        </label>
        <div className="h-32 bg-[var(--bg-secondary)] animate-pulse rounded-md border-2 border-[var(--color-accent-yellow)] flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--color-accent-yellow)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-body text-[var(--text-secondary)] block">
          Signature
        </label>
        {hasSavedSignature && (
          <span className="text-xs flex items-center gap-1 text-[var(--color-lemon-green)] bg-[var(--color-lemon-green)]/10 px-2 py-1 rounded-full">
            <Check className="w-3 h-3" />
            Saved signature loaded
          </span>
        )}
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-full h-32 bg-white border-2 border-[var(--color-accent-yellow)] rounded-md cursor-crosshair"
          style={{ touchAction: "none" }}
        />
        {(!signaturePadRef.current || signaturePadRef.current.isEmpty()) &&
          !isDrawing &&
          !hasSavedSignature && (
            <p className="absolute inset-0 flex items-center justify-center text-sm text-[var(--text-secondary)] pointer-events-none">
              Draw your signature here
            </p>
          )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleClear}
          disabled={loading}
          className="flex-1 bg-transparent text-[var(--text-primary)] border-2 border-[var(--color-accent-yellow)] hover:bg-[var(--color-accent-yellow)]/5 py-3 px-4 rounded-md transition-all font-medium disabled:opacity-50"
        >
          Clear
        </button>

        {hasSavedSignature ? (
          <button
            type="button"
            onClick={handleUpdate}
            disabled={loading}
            className="flex-1 bg-[var(--color-accent-yellow)] hover:bg-[var(--color-accent-yellow)]/90 text-[var(--color-ink)] py-3 px-4 rounded-md transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Signature"
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="flex-1 bg-[var(--color-accent-yellow)] hover:bg-[var(--color-accent-yellow)]/90 text-[var(--color-ink)] py-3 px-4 rounded-md transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Signature"
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default SignaturePanel;