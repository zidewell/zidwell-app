"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, RotateCcw, X, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface SelfieCaptureProps {
  onCapture: (dataUrl: string) => void;
  onClear?: () => void;
  disabled?: boolean;
  /** When false, the "Open Camera" button is disabled with a hint. */
  cameraEnabled?: boolean;
  /** Message shown when cameraEnabled is false. */
  disabledHint?: string;
}

type State = "idle" | "requesting" | "streaming" | "captured" | "error";

export default function SelfieCapture({
  onCapture,
  onClear,
  disabled,
  cameraEnabled = true,
  disabledHint = "Complete the fields above to enable the camera.",
}: SelfieCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [state, setState] = useState<State>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, []);

  const startCamera = async () => {
    if (!cameraEnabled) return;

    setErrorMessage(null);
    setState("requesting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setState("streaming");
    } catch (err: any) {
      const name = err?.name || "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setErrorMessage(
          "Camera access was denied. Please allow camera access in your browser settings, then try again."
        );
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setErrorMessage(
          "No camera found on this device. Verification requires a working camera."
        );
      } else {
        setErrorMessage("Could not access the camera. Please try again.");
      }
      setState("error");
    }
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video) return;

    const maxWidth = 640;
    const scale = Math.min(1, maxWidth / video.videoWidth);
    const width = Math.round(video.videoWidth * scale);
    const height = Math.round(video.videoHeight * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);

    stopStream();
    setCapturedImage(dataUrl);
    setState("captured");
    onCapture(dataUrl);
  };

  const retake = () => {
    setCapturedImage(null);
    onClear?.();
    startCamera();
  };

  return (
    <div className="space-y-3">
      {/* Preview / camera box */}
      <div
        className={cn(
          "relative w-full aspect-[4/3] rounded-2xl overflow-hidden border-2 border-dashed",
          state === "captured"
            ? "border-(--color-lemon-green)"
            : "border-(--border-color)",
          "bg-(--bg-secondary)"
        )}
      >
        {state === "captured" && capturedImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={capturedImage}
            alt="Selfie preview"
            className="w-full h-full object-cover"
          />
        )}

        {(state === "idle" || state === "error") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 gap-3">
            <div className="h-14 w-14 rounded-full bg-(--color-accent-yellow)/20 flex items-center justify-center">
              <Camera className="h-7 w-7 text-(--color-accent-yellow)" />
            </div>
            <p className="text-sm text-(--text-secondary) max-w-xs">
              {state === "error"
                ? errorMessage
                : cameraEnabled
                ? "Take a clear selfie in good lighting. Make sure your full face is visible."
                : disabledHint}
            </p>
          </div>
        )}

        {(state === "requesting" || state === "streaming") && (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
            {state === "requesting" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {state === "idle" && (
          <Button
            type="button"
            onClick={startCamera}
            disabled={disabled || !cameraEnabled}
            className="h-11 px-4 squircle-md bg-(--color-accent-yellow) text-(--color-ink) hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Camera className="h-4 w-4 mr-2" />
            Open Camera
          </Button>
        )}

        {state === "streaming" && (
          <>
            <Button
              type="button"
              onClick={capture}
              className="h-11 px-4 squircle-md bg-(--color-accent-yellow) text-(--color-ink) hover:opacity-90 cursor-pointer"
            >
              <Camera className="h-4 w-4 mr-2" />
              Capture
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                stopStream();
                setState("idle");
              }}
              className="h-11 px-4 squircle-md border-(--border-color) text-(--text-primary) cursor-pointer"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </>
        )}

        {state === "error" && (
          <Button
            type="button"
            onClick={startCamera}
            disabled={disabled || !cameraEnabled}
            className="h-11 px-4 squircle-md bg-(--color-accent-yellow) text-(--color-ink) hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Camera className="h-4 w-4 mr-2" />
            Try Camera Again
          </Button>
        )}

        {state === "captured" && (
          <Button
            type="button"
            variant="outline"
            onClick={retake}
            disabled={disabled}
            className="h-11 px-4 squircle-md border-(--border-color) text-(--text-primary) cursor-pointer"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Retake
          </Button>
        )}
      </div>
    </div>
  );
}