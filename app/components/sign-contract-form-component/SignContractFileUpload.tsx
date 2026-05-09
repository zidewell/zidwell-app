// app/components/sign-contract-form-component/SignContractFileUpload.tsx
"use client";

import React, { useRef, useState, DragEvent } from "react";
import { Button } from "../ui/button";
import { Upload } from "lucide-react";
// import { FiUpload } from "react-icons/fi";

interface SignContractFileUploadProps {
  onFileSelect: (file: File) => void;
}

const SignContractFileUpload: React.FC<SignContractFileUploadProps> = ({
  onFileSelect,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFileName(file.name);
      onFileSelect(file);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFileName(file.name);
      onFileSelect(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 cursor-pointer 
        ${dragOver ? "border-(--color-accent-yellow) bg-(--color-accent-yellow)/10 shadow-lg" : "border-(--border-color) hover:border-(--color-accent-yellow) hover:bg-(--bg-secondary)"}
      `}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => fileInputRef.current?.click()}
    >
      <div className="flex flex-col items-center justify-center gap-3">
        <div className="text-(--text-secondary) text-4xl">
          <Upload className="h-7 w-7" />
        </div>
        <p className="text-(--text-secondary) text-sm">
          {selectedFileName
            ? `Selected file: ${selectedFileName}`
            : "Drag and drop a file here, or click to browse"}
        </p>
        <input
          type="file"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        <Button
          variant="outline"
          className="mt-2 flex items-center gap-2"
          onClick={() => fileInputRef.current?.click()}
        >
          Upload Document
        </Button>
      </div>
    </div>
  );
};

export default SignContractFileUpload;
