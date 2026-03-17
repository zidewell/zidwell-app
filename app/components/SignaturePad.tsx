"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "./ui/button";
import { Eraser, Upload, X } from "lucide-react";

interface SignaturePadProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  disabled?: boolean;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  value,
  onChange,
  label,
  disabled = false,
}) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const padRef = React.useRef<any>(null);
  const [mode, setMode] = useState<"draw" | "upload">("draw");
  const [isMounted, setIsMounted] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // Ensure component is mounted to avoid hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Save signature to parent component whenever it changes
  const saveSignature = useCallback(() => {
    if (padRef.current && !padRef.current.isEmpty()) {
      const dataUrl = padRef.current.toDataURL();
      onChange(dataUrl);
    } else if (padRef.current?.isEmpty()) {
      onChange("");
    }
  }, [onChange]);

  // Debounced save function
  const debouncedSave = useCallback(
    debounce(() => {
      saveSignature();
    }, 300),
    [saveSignature],
  );

  // Get actual canvas dimensions
  const getCanvasDimensions = useCallback(() => {
    if (!canvasRef.current) return { width: 400, height: 192 };

    const rect = canvasRef.current.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
    };
  }, []);

  // Initialize signature pad
  const initializeSignaturePad = useCallback(async () => {
    if (!canvasRef.current || !isMounted || mode !== "draw" || disabled) {
      return;
    }

    try {
      const SignaturePadLib = await import("signature_pad");

      // Clear existing pad if it exists
      if (padRef.current) {
        padRef.current.off();
        padRef.current.clear();
      }

      // Get canvas dimensions
      const dimensions = getCanvasDimensions();
      const canvas = canvasRef.current;

      // Set canvas size
      const dpr = window.devicePixelRatio || 1;
      canvas.width = dimensions.width * dpr;
      canvas.height = dimensions.height * dpr;
      canvas.style.width = `${dimensions.width}px`;
      canvas.style.height = `${dimensions.height}px`;

      // Scale the context
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }

      padRef.current = new SignaturePadLib.default(canvas, {
        backgroundColor: "rgba(255, 255, 255, 0)",
        penColor: "#2b825b",
        minWidth: 1.5,
        maxWidth: 2.5,
        throttle: 16,
        velocityFilterWeight: 0.7,
        minDistance: 2,
      });

      // Set up event listeners
      padRef.current.addEventListener("beginStroke", () => {
        setIsDrawing(true);
      });

      padRef.current.addEventListener("endStroke", () => {
        setIsDrawing(false);
        debouncedSave();
      });

      // Load existing signature if available
      if (value && mode === "draw") {
        // Use setTimeout to ensure canvas is fully initialized
        setTimeout(() => {
          if (padRef.current && canvasRef.current) {
            padRef.current.fromDataURL(value, {
              width: canvas.width / dpr,
              height: canvas.height / dpr,
              callback: () => {
                padRef.current._render();
                saveSignature();
              },
            });
          }
        }, 50);
      }

      setIsInitialized(true);
      setCanvasSize(dimensions);
    } catch (error) {
      console.error("Failed to initialize signature pad:", error);
    }
  }, [
    isMounted,
    mode,
    disabled,
    value,
    debouncedSave,
    saveSignature,
    getCanvasDimensions,
  ]);

  // Initialize on mount and when dependencies change
  useEffect(() => {
    if (isMounted && mode === "draw" && !disabled && canvasRef.current) {
      initializeSignaturePad();
    }

    return () => {
      // Save before unmounting
      if (padRef.current && !padRef.current.isEmpty()) {
        const dataUrl = padRef.current.toDataURL();
        onChange(dataUrl);
      }
    };
  }, [isMounted, mode, disabled, initializeSignaturePad, onChange]);

  // Handle window resize
  useEffect(() => {
    if (!isMounted || mode !== "draw" || disabled) return;

    let resizeTimeout: NodeJS.Timeout;

    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (padRef.current && canvasRef.current && isInitialized) {
          const canvas = canvasRef.current;
          const newDimensions = getCanvasDimensions();

          // Only resize if dimensions actually changed
          if (
            newDimensions.width !== canvasSize.width ||
            newDimensions.height !== canvasSize.height
          ) {
            // Save current data
            const data = padRef.current.toData();
            const isEmpty = padRef.current.isEmpty();

            // Resize canvas
            const dpr = window.devicePixelRatio || 1;
            canvas.width = newDimensions.width * dpr;
            canvas.height = newDimensions.height * dpr;
            canvas.style.width = `${newDimensions.width}px`;
            canvas.style.height = `${newDimensions.height}px`;

            // Scale the context
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.scale(dpr, dpr);
              ctx.lineCap = "round";
              ctx.lineJoin = "round";
            }

            // Reinitialize the signature pad with new canvas
            const SignaturePadLib = require("signature_pad");
            padRef.current = new SignaturePadLib.default(canvas, {
              backgroundColor: "rgba(255, 255, 255, 0)",
              penColor: "#2b825b",
              minWidth: 1.5,
              maxWidth: 2.5,
              throttle: 16,
              velocityFilterWeight: 0.7,
              minDistance: 2,
            });

            // Set up event listeners again
            padRef.current.addEventListener("beginStroke", () => {
              setIsDrawing(true);
            });

            padRef.current.addEventListener("endStroke", () => {
              setIsDrawing(false);
              debouncedSave();
            });

            // Restore previous drawing
            if (!isEmpty && data && data.length > 0) {
              padRef.current.fromData(data);
              padRef.current._render();
            }

            setCanvasSize(newDimensions);
            saveSignature();
          }
        }
      }, 200);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener("resize", handleResize);
    };
  }, [
    isMounted,
    mode,
    disabled,
    isInitialized,
    canvasSize,
    debouncedSave,
    saveSignature,
    getCanvasDimensions,
  ]);

  // Clear signature
  const handleClear = useCallback(() => {
    if (mode === "draw" && padRef.current) {
      padRef.current.clear();
      onChange("");
    } else if (mode === "upload") {
      onChange("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [mode, onChange]);

  // Handle file upload
  const handleUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (!file.type.startsWith("image/")) {
          alert("Please upload an image file (PNG, JPG, GIF)");
          return;
        }

        if (file.size > 2 * 1024 * 1024) {
          alert("File size should be less than 2MB");
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          onChange(dataUrl);
        };
        reader.onerror = () => {
          alert("Error reading file. Please try again.");
        };
        reader.readAsDataURL(file);
      }
    },
    [onChange],
  );

  // Switch to draw mode
  const switchToDrawMode = useCallback(() => {
    // Save current state before switching
    if (padRef.current && !padRef.current.isEmpty()) {
      const dataUrl = padRef.current.toDataURL();
      onChange(dataUrl);
    }
    setMode("draw");
    // Force re-initialization after a brief delay
    setTimeout(() => {
      setIsInitialized(false);
    }, 50);
  }, [onChange]);

  // Switch to upload mode
  const switchToUploadMode = useCallback(() => {
    // Save current drawing before switching
    if (padRef.current && !padRef.current.isEmpty()) {
      const dataUrl = padRef.current.toDataURL();
      onChange(dataUrl);
    }
    setMode("upload");
  }, [onChange]);

  // Handle canvas mouse leave
  const handleCanvasMouseLeave = useCallback(() => {
    if (isDrawing && padRef.current && !padRef.current.isEmpty()) {
      debouncedSave();
      setIsDrawing(false);
    }
  }, [isDrawing, debouncedSave]);

  // Re-initialize when component becomes visible again or when value changes
  useEffect(() => {
    if (isMounted && mode === "draw" && !disabled && canvasRef.current) {
      const checkAndInitialize = () => {
        if (!isInitialized || padRef.current === null) {
          initializeSignaturePad();
        }
      };

      // Check immediately
      checkAndInitialize();

      // Also check after a delay to ensure DOM is ready
      const timeoutId = setTimeout(checkAndInitialize, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [isMounted, mode, disabled, isInitialized, initializeSignaturePad, value]);

  // Handle component visibility changes
  useEffect(() => {
    if (!isMounted || mode !== "draw" || disabled) return;

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        canvasRef.current &&
        padRef.current
      ) {
        // Re-initialize when tab becomes visible again
        setTimeout(() => {
          initializeSignaturePad();
        }, 100);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isMounted, mode, disabled, initializeSignaturePad]);

  if (disabled && value) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <div className="h-48 rounded-lg border-2 border-border bg-card p-4">
          <img
            src={value}
            alt="Signature"
            className="h-full w-full object-contain"
          />
        </div>
      </div>
    );
  }

  // Prevent rendering canvas on server to avoid hydration mismatch
  if (!isMounted) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">{label}</label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === "draw" ? "secondary" : "ghost"}
              size="sm"
              disabled
            >
              Draw
            </Button>
            <Button
              type="button"
              variant={mode === "upload" ? "secondary" : "ghost"}
              size="sm"
              disabled
            >
              <Upload className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="h-48 rounded-lg border border-gray-300 bg-gray-50 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={mode === "draw" ? "secondary" : "ghost"}
            size="sm"
            onClick={switchToDrawMode}
            disabled={disabled}
          >
            Draw
          </Button>
          <Button
            type="button"
            variant={mode === "upload" ? "secondary" : "ghost"}
            size="sm"
            onClick={switchToUploadMode}
            disabled={disabled}
          >
            <Upload className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {mode === "draw" ? (
        <div className="relative h-48">
          <canvas
            ref={canvasRef}
            className="w-full h-full rounded-lg border border-gray-300 bg-white cursor-crosshair touch-none"
            onMouseLeave={handleCanvasMouseLeave}
            onTouchEnd={handleCanvasMouseLeave}
          />
          {(!value || (padRef.current && padRef.current.isEmpty())) && (
            <p className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground pointer-events-none">
              Draw your signature here
            </p>
          )}
          {(value || (padRef.current && !padRef.current.isEmpty())) && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleClear}
              className="absolute top-2 right-2 h-8 w-8 bg-white/80 hover:bg-white border border-gray-300"
              disabled={disabled}
            >
              <Eraser className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              id="signature-upload"
              accept="image/*"
              onChange={handleUpload}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-medium
                file:bg-primary file:text-primary-foreground
                hover:file:bg-primary/90
                disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={disabled}
            />
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleClear}
                className="absolute -right-2 -top-2 h-6 w-6 bg-white hover:bg-white border border-gray-300"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {value ? (
            <div className="h-48 rounded-lg border-2 border-border bg-card p-4">
              <img
                src={value}
                alt="Uploaded signature"
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <div className="h-48 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center">
              <Upload className="h-10 w-10 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">Upload a signature image</p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, GIF • Max 2MB
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
