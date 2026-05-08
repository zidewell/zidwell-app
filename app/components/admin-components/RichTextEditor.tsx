"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Link,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Type,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  height?: number;
  onImagesAdded?: (
    images: Array<{ file: File; placeholderId: string }>,
  ) => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Type your message here...",
  className = "",
  height = 350,
  onImagesAdded,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<string[]>([
    value || `<p>${placeholder}</p>`,
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [pendingImages, setPendingImages] = useState<
    Array<{ file: File; placeholderId: string }>
  >([]);

  // Initialize editor with content
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      if (value && value.trim() !== "") {
        editorRef.current.innerHTML = value;
      } else {
        editorRef.current.innerHTML = `<p>${placeholder}</p>`;
      }
    }
  }, [value, placeholder]);

  // Save content to history
  const saveToHistory = (content: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(content);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleInput = () => {
    if (!editorRef.current) return;

    const content = editorRef.current.innerHTML;

    if (content !== history[historyIndex]) {
      saveToHistory(content);
    }

    onChange(content);
  };

  const execCommand = (
    command: string,
    value: string = "",
    showUI: boolean = false,
  ) => {
    if (!editorRef.current) return;

    editorRef.current.focus();

    const selection = window.getSelection();
    if (!selection?.rangeCount) {
      document.execCommand("insertParagraph");
      const newSelection = window.getSelection();
      if (newSelection?.rangeCount) {
        document.execCommand(command, showUI, value);
      }
      return;
    }

    document.execCommand(command, showUI, value);
    handleInput();
  };

  // Helper function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Function to compress and resize image
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        const MAX_WIDTH = 1000; // Maximum width for notifications
        const MAX_HEIGHT = 600; // Maximum height for notifications
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw and compress image
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert to JPEG with quality 0.7 (70%) for smaller file size
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to compress image"));
              return;
            }

            // Create new File object with compressed image
            const compressedFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });

            console.log(
              `✅ Image compressed: ${file.size} → ${
                compressedFile.size
              } bytes (${Math.round((compressedFile.size / file.size) * 100)}%)`,
            );
            resolve(compressedFile);
          },
          "image/jpeg",
          0.7, // Quality setting (0.7 = 70% quality)
        );
      };

      img.onerror = (error) => {
        reject(new Error("Failed to load image for compression"));
      };

      // Read the file as data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  // Image upload handler with compression
  const handleImageUpload = () => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file || !editorRef.current) return;

      // Validate file type
      const validTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!validTypes.includes(file.type)) {
        alert(`Invalid file type. Supported: JPEG, PNG, GIF, WebP`);
        return;
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        alert(
          `File too large: ${(file.size / 1024 / 1024).toFixed(
            1,
          )}MB. Maximum is 10MB.`,
        );
        return;
      }

      try {
        // Create a unique placeholder ID
        const placeholderId = `img_${Date.now()}_${Math.random()
          .toString(36)
          .substring(7)}`;

        // Show loading message
        const loadingMsg = `<div class="image-loading" data-placeholder-id="${placeholderId}" style="border:2px dashed #2b825b;padding:20px;text-align:center;color:#2b825b;border-radius:0.375rem;margin:0.5rem 0;background-color:#fefce8;">
          <div>⏳ Compressing image... (${(file.size / 1024 / 1024).toFixed(
            1,
          )}MB)</div>
        </div>`;

        execCommand("insertHTML", loadingMsg);

        // Compress the image first
        let finalFile = file;
        if (file.size > 1024 * 1024) {
          // Compress if larger than 1MB
          try {
            finalFile = await compressImage(file);
          } catch (compressError) {
            console.warn(
              "Failed to compress image, using original:",
              compressError,
            );
          }
        }

        // Convert compressed image to base64 for preview
        const base64 = await fileToBase64(finalFile);

        // Replace loading message with actual image
        const imgHTML = `<img src="${base64}" alt="Uploaded image" data-placeholder-id="${placeholderId}" data-filename="${file.name}" data-size="${finalFile.size}" data-original-size="${file.size}" style="max-width:100%;height:auto;border-radius:0.375rem;margin:0.5rem 0;border:2px dashed #2b825b;opacity:0.8;" />`;

        // Find and replace the loading div
        if (editorRef.current) {
          const editor = editorRef.current;
          const loadingDiv = editor.querySelector(
            `div[data-placeholder-id="${placeholderId}"]`,
          );
          if (loadingDiv) {
            loadingDiv.outerHTML = imgHTML;
          }
        }

        // Add to pending images list
        const newImage = { file: finalFile, placeholderId };
        const updatedPendingImages = [...pendingImages, newImage];
        setPendingImages(updatedPendingImages);

        // Notify parent component about new images
        if (onImagesAdded) {
          onImagesAdded(updatedPendingImages);
        }

        console.log("Image added successfully:", {
          filename: file.name,
          originalSize: file.size,
          compressedSize: finalFile.size,
          compressionRatio: Math.round((finalFile.size / file.size) * 100),
          type: finalFile.type,
          placeholderId,
        });

        handleInput();
      } catch (error) {
        console.error("Image processing error:", error);

        // Remove loading message if it exists
        if (editorRef.current) {
          const editor = editorRef.current;
          const loadingDiv = editor.querySelector(`div[data-placeholder-id]`);
          if (loadingDiv) {
            loadingDiv.remove();
          }
        }

        alert("Failed to process image. Please try again.");
      }
    };
  };

  // Function to replace placeholder with actual URL after upload
  const replaceImagePlaceholder = (placeholderId: string, finalUrl: string) => {
    if (!editorRef.current) return;

    const editor = editorRef.current;
    const img = editor.querySelector(
      `img[data-placeholder-id="${placeholderId}"]`,
    ) as HTMLImageElement;

    if (img) {
      img.setAttribute("src", finalUrl);
      img.removeAttribute("data-placeholder-id");
      img.removeAttribute("data-size");
      img.removeAttribute("data-original-size");
      // Use setAttribute for style to ensure it works
      img.setAttribute(
        "style",
        "max-width:100%;height:auto;border-radius:0.375rem;margin:0.5rem 0;border:1px solid #e5e7eb;opacity:1;",
      );

      // Remove from pending images
      const updatedPendingImages = pendingImages.filter(
        (img) => img.placeholderId !== placeholderId,
      );
      setPendingImages(updatedPendingImages);

      // Update the editor content
      handleInput();
    }
  };

  // Function to clear all pending images (on cancel)
  const clearPendingImages = () => {
    if (!editorRef.current) return;

    const editor = editorRef.current;
    const placeholders = editor.querySelectorAll(
      "img[data-placeholder-id], div[data-placeholder-id]",
    );
    placeholders.forEach((img) => img.remove());

    setPendingImages([]);
    handleInput();
  };

  const insertLink = () => {
    const url = prompt("Enter URL:");
    if (url) {
      execCommand("createLink", url);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      if (editorRef.current) {
        editorRef.current.innerHTML = history[newIndex];
        onChange(history[newIndex]);
      }
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      if (editorRef.current) {
        editorRef.current.innerHTML = history[newIndex];
        onChange(history[newIndex]);
      }
    }
  };

  const formatBlock = (tag: string) => {
    execCommand("formatBlock", tag);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();

    // Check if clipboard contains files/images
    const items = e.clipboardData.items;
    let hasImage = false;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          // Handle image paste by creating a file input
          const input = document.createElement("input");
          input.setAttribute("type", "file");
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          input.files = dataTransfer.files;

          // Trigger image upload with compression
          handleImageUpload();
          hasImage = true;
          break;
        }
      }
    }

    if (!hasImage) {
      // Get plain text from clipboard
      const text = e.clipboardData.getData("text/plain");
      document.execCommand("insertText", false, text);
      handleInput();
    }
  };

  const clearFormatting = () => {
    if (!editorRef.current) return;

    editorRef.current.focus();
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;

    const range = selection.getRangeAt(0);
    const content = range.extractContents();
    const textNode = document.createTextNode(content.textContent || "");

    range.deleteContents();
    range.insertNode(textNode);

    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNode(textNode);
    newRange.collapse(false);
    selection.addRange(newRange);

    handleInput();
  };

  const handleFocus = () => {
    if (
      editorRef.current &&
      editorRef.current.innerHTML === `<p>${placeholder}</p>`
    ) {
      editorRef.current.innerHTML = "";
    }
  };

  const handleBlur = () => {
    if (editorRef.current && editorRef.current.innerHTML.trim() === "") {
      editorRef.current.innerHTML = `<p>${placeholder}</p>`;
    }
  };

  return (
    <div className={`rich-text-editor relative ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border border-gray-300 rounded-t-lg bg-gray-50">
        {/* Headings */}
        <button
          type="button"
          onClick={() => formatBlock("h1")}
          className="p-2 rounded hover:bg-gray-200"
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => formatBlock("h2")}
          className="p-2 rounded hover:bg-gray-200"
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => formatBlock("h3")}
          className="p-2 rounded hover:bg-gray-200"
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Text formatting */}
        <button
          type="button"
          onClick={() => execCommand("bold")}
          className="p-2 rounded hover:bg-gray-200"
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand("italic")}
          className="p-2 rounded hover:bg-gray-200"
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand("underline")}
          className="p-2 rounded hover:bg-gray-200"
          title="Underline"
        >
          <Underline className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Lists */}
        <button
          type="button"
          onClick={() => execCommand("insertUnorderedList")}
          className="p-2 rounded hover:bg-gray-200"
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand("insertOrderedList")}
          className="p-2 rounded hover:bg-gray-200"
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Alignment */}
        <button
          type="button"
          onClick={() => execCommand("justifyLeft")}
          className="p-2 rounded hover:bg-gray-200"
          title="Align Left"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand("justifyCenter")}
          className="p-2 rounded hover:bg-gray-200"
          title="Align Center"
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand("justifyRight")}
          className="p-2 rounded hover:bg-gray-200"
          title="Align Right"
        >
          <AlignRight className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Links & Images */}
        <button
          type="button"
          onClick={insertLink}
          className="p-2 rounded hover:bg-gray-200"
          title="Insert Link"
        >
          <Link className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleImageUpload}
          className="p-2 rounded hover:bg-gray-200"
          title="Insert Image (Compressed)"
        >
          <ImageIcon className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Undo/Redo */}
        <button
          type="button"
          onClick={handleUndo}
          disabled={historyIndex === 0}
          className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleRedo}
          disabled={historyIndex === history.length - 1}
          className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Clear formatting */}
        <button
          type="button"
          onClick={clearFormatting}
          className="px-3 py-1 text-sm rounded hover:bg-gray-200"
          title="Clear Formatting"
        >
          <Type className="w-4 h-4 inline mr-1" />
          Clear
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="w-full p-4 border border-t-0 border-gray-300 rounded-b-lg focus:outline-none focus:ring-1 focus:ring-(--color-accent-yellow) focus:border-(--color-accent-yellow) overflow-y-auto bg-white"
        style={{
          height: `${height - 50}px`,
          minHeight: "200px",
        }}
        suppressContentEditableWarning
      />

      {/* Pending images info */}
      {pendingImages.length > 0 && (
        <div className="mt-2 p-3 bg-green-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium flex items-center">
              ⚠️ {pendingImages.length} image
              {pendingImages.length > 1 ? "s" : ""} ready for upload
            </span>
            <button
              type="button"
              onClick={clearPendingImages}
              className="text-xs text-yellow-700 hover:text-yellow-900 underline font-medium"
            >
              Clear all
            </button>
          </div>

          {/* Image size info */}
          <div className="space-y-1 text-xs">
            {pendingImages.map(({ file, placeholderId }) => (
              <div
                key={placeholderId}
                className="flex items-center justify-between py-1 border-t border-yellow-100 first:border-t-0"
              >
                <span className="truncate mr-2" title={file.name}>
                  {file.name.length > 30
                    ? `${file.name.substring(0, 30)}...`
                    : file.name}
                </span>
                <span className="text-yellow-700 font-medium whitespace-nowrap">
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </span>
              </div>
            ))}
          </div>

          <p className="text-xs mt-2 text-(--color-accent-yellow)">
            Images are compressed automatically. They will be uploaded when you
            submit the notification.
          </p>
        </div>
      )}

      <style jsx global>{`
        /* Editor styles */
        .rich-text-editor [contenteditable] {
          outline: none;
          line-height: 1.6;
        }

        .rich-text-editor [contenteditable] h1 {
          font-size: 1.875rem;
          font-weight: 700;
          margin: 1.5rem 0 1rem 0;
          color: #111827;
        }

        .rich-text-editor [contenteditable] h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 1.25rem 0 0.75rem 0;
          color: #111827;
        }

        .rich-text-editor [contenteditable] h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 1rem 0 0.5rem 0;
          color: #111827;
        }

        .rich-text-editor [contenteditable] p {
          margin: 0.75rem 0;
          line-height: 1.6;
        }

        .rich-text-editor [contenteditable] ul,
        .rich-text-editor [contenteditable] ol {
          margin: 0.75rem 0;
          padding-left: 1.5rem;
        }

        .rich-text-editor [contenteditable] ul li {
          list-style-type: disc;
        }

        .rich-text-editor [contenteditable] ol li {
          list-style-type: decimal;
        }

        .rich-text-editor [contenteditable] a {
          color: #2b825b;
          text-decoration: none;
        }

        .rich-text-editor [contenteditable] a:hover {
          text-decoration: underline;
        }

        .rich-text-editor [contenteditable] img {
          max-width: 100%;
          height: auto;
          border-radius: 0.375rem;
          margin: 0.5rem 0;
          border: 1px solid #e5e7eb;
        }

        .rich-text-editor [contenteditable] img[data-placeholder-id] {
          border: 2px dashed #2b825b;
          opacity: 0.8;
        }

        /* Image loading placeholder */
        .rich-text-editor [contenteditable] .image-loading {
          border: 2px dashed #2b825b;
          padding: 20px;
          text-align: center;
          color: #2b825b;
          border-radius: 0.375rem;
          margin: 0.5rem 0;
          background-color: #fefce8;
          font-size: 0.875rem;
        }

        .rich-text-editor [contenteditable] blockquote {
          border-left: 3px solid #2b825b;
          margin: 1rem 0;
          padding-left: 1rem;
          font-style: italic;
          color: #6b7280;
        }

        /* Selection */
        .rich-text-editor [contenteditable] ::selection {
          background-color: rgba(194, 147, 7, 0.2);
        }

        .rich-text-editor [contenteditable] strong,
        .rich-text-editor [contenteditable] b {
          font-weight: bold;
        }

        .rich-text-editor [contenteditable] em,
        .rich-text-editor [contenteditable] i {
          font-style: italic;
        }

        .rich-text-editor [contenteditable] u {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
