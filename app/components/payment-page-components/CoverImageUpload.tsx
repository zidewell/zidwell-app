// app/components/payment-page-components/CoverImageUpload.tsx

"use client";

import { useRef } from "react";
import { Upload, X, Move, ZoomIn, ZoomOut } from "lucide-react";
import { Label } from "@/app/components/ui/label";

interface CoverImageUploadProps {
  coverPreview: string | null;
  isDragOver: boolean;
  currentImageSpecs: { description: string };
  imagePosition: { x: number; y: number };
  imageScale: number;
  isDragging: boolean;
  showImageControls: boolean;
  imageContainerRef: React.RefObject<HTMLDivElement | null>;
  imageRef: React.RefObject<HTMLImageElement | null>;
  onFileSelect: (file: File) => void;
  onDragEnter: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onWheel: (e: React.WheelEvent) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onRemove: () => void;
}

export function CoverImageUpload({
  coverPreview,
  isDragOver,
  currentImageSpecs,
  imagePosition,
  imageScale,
  isDragging,
  showImageControls,
  imageContainerRef,
  imageRef,
  onFileSelect,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onWheel,
  onZoomIn,
  onZoomOut,
  onReset,
  onRemove,
}: CoverImageUploadProps) {
  const coverRef = useRef<HTMLInputElement>(null);

  const handleClick = () => coverRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <Label className="text-sm font-semibold text-(--text-primary)">
          Cover Image{" "}
          <span className="text-(--text-secondary)">(Optional)</span>
        </Label>
        <div className="text-xs text-(--text-secondary)">
          Recommended: {currentImageSpecs.description}
        </div>
      </div>

      <input
        type="file"
        ref={coverRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />

      {coverPreview ? (
        <div
          ref={imageContainerRef}
          className="relative overflow-hidden rounded-2xl cursor-move group"
          style={{ height: "280px", backgroundColor: "#0a0a0a" }}
          onMouseEnter={() => {}}
          onMouseLeave={() => {}}
          onWheel={onWheel}
        >
          <img
            ref={imageRef}
            src={coverPreview}
            alt="Cover preview"
            className="w-full h-full object-cover select-none"
            style={{
              objectPosition: `${imagePosition.x}% ${imagePosition.y}%`,
              transform: `scale(${imageScale})`,
              transition: isDragging
                ? "none"
                : "transform 0.2s ease, object-position 0.2s ease",
            }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            draggable={false}
          />
          {showImageControls && (
            <>
              <div className="absolute bottom-4 right-4 flex gap-2 bg-black/70 rounded-lg p-2 backdrop-blur-sm z-10">
                <button
                  onClick={onZoomOut}
                  className="p-1.5 hover:bg-white/20 rounded"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <button
                  onClick={onReset}
                  className="p-1.5 hover:bg-white/20 rounded"
                  title="Reset"
                >
                  <Move className="h-4 w-4" />
                </button>
                <button
                  onClick={onZoomIn}
                  className="p-1.5 hover:bg-white/20 rounded"
                  title="Zoom In"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button
                  onClick={onRemove}
                  className="p-1.5 hover:bg-white/20 rounded"
                  title="Remove"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="absolute bottom-4 left-4 bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                {currentImageSpecs.description}
              </div>
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm whitespace-nowrap">
                Drag to reposition • Scroll to zoom
              </div>
            </>
          )}
        </div>
      ) : (
        <div
          onClick={handleClick}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
          className={`w-full h-56 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 cursor-pointer group ${
            isDragOver
              ? "border-(--color-accent-yellow) bg-(--color-accent-yellow)/20"
              : "border-(--border-color) bg-(--bg-secondary)/50 hover:border-(--color-accent-yellow)"
          }`}
        >
          <Upload
            className={`h-8 w-8 transition-colors ${
              isDragOver
                ? "text-(--color-accent-yellow)"
                : "text-(--text-secondary) group-hover:text-(--color-accent-yellow)"
            }`}
          />
          <span
            className={`text-sm transition-colors ${
              isDragOver
                ? "text-(--color-accent-yellow)"
                : "text-(--text-secondary) group-hover:text-(--color-accent-yellow)"
            }`}
          >
            {isDragOver ? "Drop image here" : "Click or drag & drop to upload"}
          </span>
          <span className="text-xs text-(--text-secondary)">
            {currentImageSpecs.description}
          </span>
          <span className="text-xs text-(--text-secondary)">
            If no cover image, your logo will be used as fallback
          </span>
        </div>
      )}
    </div>
  );
}
