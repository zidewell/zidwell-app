"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "../ui/button"; 
import { Eraser, Upload, X, Download } from "lucide-react";

interface SignaturePadProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  disabled?: boolean;
  onLoadSaved?: () => Promise<void>; 
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  value,
  onChange,
  label,
  disabled = false,
  onLoadSaved,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<any>(null);
  const [mode, setMode] = useState<"draw" | "upload">("draw");
  const [isMounted, setIsMounted] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isLoadingSignature, setIsLoadingSignature] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const saveSignature = useCallback(() => {
    if (padRef.current && !padRef.current.isEmpty()) {
      const dataUrl = padRef.current.toDataURL();
      onChange(dataUrl);
    } else if (padRef.current?.isEmpty()) {
      onChange("");
    }
  }, [onChange]);

  const debouncedSave = useCallback(
    debounce(() => {
      saveSignature();
    }, 300),
    [saveSignature],
  );

  const getCanvasDimensions = useCallback(() => {
    if (!canvasRef.current) return { width: 400, height: 192 };
    const rect = canvasRef.current.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }, []);

  const initializeSignaturePad = useCallback(async () => {
    if (!canvasRef.current || !isMounted || mode !== "draw" || disabled) return;

    try {
      const SignaturePadLib = await import("signature_pad");

      if (padRef.current) {
        padRef.current.off();
        padRef.current.clear();
      }

      const dimensions = getCanvasDimensions();
      const canvas = canvasRef.current;
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = dimensions.width * dpr;
      canvas.height = dimensions.height * dpr;
      canvas.style.width = `${dimensions.width}px`;
      canvas.style.height = `${dimensions.height}px`;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }

      padRef.current = new SignaturePadLib.default(canvas, {
        backgroundColor: "rgba(255, 255, 255, 0)",
        penColor: "#FDC020",
        minWidth: 1.5,
        maxWidth: 2.5,
        throttle: 16,
        velocityFilterWeight: 0.7,
        minDistance: 2,
      });

      padRef.current.addEventListener("beginStroke", () => setIsDrawing(true));
      padRef.current.addEventListener("endStroke", () => {
        setIsDrawing(false);
        debouncedSave();
      });

      if (value && mode === "draw") {
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
  }, [isMounted, mode, disabled, value, debouncedSave, saveSignature, getCanvasDimensions]);

  const handleLoadSavedSignature = async () => {
    if (!onLoadSaved) return;
    setIsLoadingSignature(true);
    try {
      await onLoadSaved();
    } catch (error) {
      console.error("Error loading signature:", error);
    } finally {
      setIsLoadingSignature(false);
    }
  };

  useEffect(() => {
    if (isMounted && mode === "draw" && !disabled && canvasRef.current) {
      initializeSignaturePad();
    }
    return () => {
      if (padRef.current && !padRef.current.isEmpty()) {
        const dataUrl = padRef.current.toDataURL();
        onChange(dataUrl);
      }
    };
  }, [isMounted, mode, disabled, initializeSignaturePad, onChange]);

  useEffect(() => {
    if (!isMounted || mode !== "draw" || disabled) return;

    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (padRef.current && canvasRef.current && isInitialized) {
          const canvas = canvasRef.current;
          const newDimensions = getCanvasDimensions();

          if (newDimensions.width !== canvasSize.width || newDimensions.height !== canvasSize.height) {
            const data = padRef.current.toData();
            const isEmpty = padRef.current.isEmpty();
            const dpr = window.devicePixelRatio || 1;
            
            canvas.width = newDimensions.width * dpr;
            canvas.height = newDimensions.height * dpr;
            canvas.style.width = `${newDimensions.width}px`;
            canvas.style.height = `${newDimensions.height}px`;

            const ctx = canvas.getContext("2d");
            if (ctx) ctx.scale(dpr, dpr);

            const SignaturePadLib = require("signature_pad");
            padRef.current = new SignaturePadLib.default(canvas, {
              backgroundColor: "rgba(255, 255, 255, 0)",
              penColor: "#FDC020",
              minWidth: 1.5,
              maxWidth: 2.5,
              throttle: 16,
              velocityFilterWeight: 0.7,
              minDistance: 2,
            });

            padRef.current.addEventListener("beginStroke", () => setIsDrawing(true));
            padRef.current.addEventListener("endStroke", () => {
              setIsDrawing(false);
              debouncedSave();
            });

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
  }, [isMounted, mode, disabled, isInitialized, canvasSize, debouncedSave, saveSignature, getCanvasDimensions]);

  const handleClear = useCallback(() => {
    if (mode === "draw" && padRef.current) {
      padRef.current.clear();
      onChange("");
    } else if (mode === "upload") {
      onChange("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [mode, onChange]);

  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
      reader.onerror = () => alert("Error reading file. Please try again.");
      reader.readAsDataURL(file);
    }
  }, [onChange]);

  const switchToDrawMode = useCallback(() => {
    if (padRef.current && !padRef.current.isEmpty()) {
      onChange(padRef.current.toDataURL());
    }
    setMode("draw");
    setTimeout(() => setIsInitialized(false), 50);
  }, [onChange]);

  const switchToUploadMode = useCallback(() => {
    if (padRef.current && !padRef.current.isEmpty()) {
      onChange(padRef.current.toDataURL());
    }
    setMode("upload");
  }, [onChange]);

  const handleCanvasMouseLeave = useCallback(() => {
    if (isDrawing && padRef.current && !padRef.current.isEmpty()) {
      debouncedSave();
      setIsDrawing(false);
    }
  }, [isDrawing, debouncedSave]);

  useEffect(() => {
    if (isMounted && mode === "draw" && !disabled && canvasRef.current) {
      const checkAndInitialize = () => {
        if (!isInitialized || padRef.current === null) initializeSignaturePad();
      };
      checkAndInitialize();
      const timeoutId = setTimeout(checkAndInitialize, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [isMounted, mode, disabled, isInitialized, initializeSignaturePad, value]);

  useEffect(() => {
    if (!isMounted || mode !== "draw" || disabled) return;
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && canvasRef.current && padRef.current) {
        setTimeout(() => initializeSignaturePad(), 100);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isMounted, mode, disabled, initializeSignaturePad]);

  if (disabled && value) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--text-primary)]">{label}</label>
        <div className="h-48 rounded-lg border-2 border-[var(--border-color)] bg-[var(--bg-primary)] p-4 squircle-md">
          <img src={value} alt="Signature" className="h-full w-full object-contain" />
        </div>
      </div>
    );
  }

  if (!isMounted) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-[var(--text-primary)]">{label}</label>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" disabled>Draw</Button>
            <Button type="button" variant="ghost" size="sm" disabled><Upload className="h-4 w-4" /></Button>
          </div>
        </div>
        <div className="h-48 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] animate-pulse squircle-md" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-[var(--text-primary)]">{label}</label>
        <div className="flex gap-2">
          {onLoadSaved && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleLoadSavedSignature}
              disabled={disabled || isLoadingSignature}
              className="text-xs border-[var(--color-accent-yellow)] text-[var(--color-accent-yellow)] hover:bg-[var(--color-accent-yellow)]/10 squircle-sm"
            >
              <Download className="h-3 w-3 mr-1" />
              {isLoadingSignature ? "Loading..." : "Load"}
            </Button>
          )}
          <Button
            type="button"
            variant={mode === "draw" ? "secondary" : "ghost"}
            size="sm"
            onClick={switchToDrawMode}
            disabled={disabled}
            className={mode === "draw" ? "bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:bg-[var(--color-accent-yellow)]/90" : "border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"}
          >
            Draw
          </Button>
          <Button
            type="button"
            variant={mode === "upload" ? "secondary" : "ghost"}
            size="sm"
            onClick={switchToUploadMode}
            disabled={disabled}
            className={mode === "upload" ? "bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:bg-[var(--color-accent-yellow)]/90" : "border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"}
          >
            <Upload className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {mode === "draw" ? (
        <div className="relative h-48">
          <canvas
            ref={canvasRef}
            className="w-full h-full rounded-lg border border-[var(--border-color)] bg-white cursor-crosshair touch-none squircle-md"
            onMouseLeave={handleCanvasMouseLeave}
            onTouchEnd={handleCanvasMouseLeave}
          />
          {(!value || (padRef.current && padRef.current.isEmpty())) && (
            <p className="absolute inset-0 flex items-center justify-center text-sm text-[var(--text-secondary)] pointer-events-none">
              Draw your signature here
            </p>
          )}
          {(value || (padRef.current && !padRef.current.isEmpty())) && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleClear}
              className="absolute top-2 right-2 h-8 w-8 bg-white/80 hover:bg-white border border-[var(--border-color)]"
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
              accept="image/*"
              onChange={handleUpload}
              className="block w-full text-sm text-[var(--text-secondary)]
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-medium
                file:bg-[var(--color-accent-yellow)] file:text-[var(--color-ink)]
                hover:file:bg-[var(--color-accent-yellow)]/90
                disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={disabled}
            />
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleClear}
                className="absolute -right-2 -top-2 h-6 w-6 bg-white hover:bg-white border border-[var(--border-color)] rounded-full"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {value ? (
            <div className="h-48 rounded-lg border-2 border-[var(--border-color)] bg-[var(--bg-primary)] p-4 squircle-md">
              <img src={value} alt="Uploaded signature" className="h-full w-full object-contain" />
            </div>
          ) : (
            <div className="h-48 rounded-lg border-2 border-dashed border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col items-center justify-center squircle-lg">
              <Upload className="h-10 w-10 text-[var(--text-secondary)] mb-2" />
              <p className="text-sm text-[var(--text-secondary)]">Upload a signature image</p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">PNG, JPG, GIF • Max 2MB</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}