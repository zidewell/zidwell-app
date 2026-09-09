import React, { useRef, useEffect, useState } from "react";
import "quill/dist/quill.snow.css";
import { Trash2, Eraser } from "lucide-react";
import { Button } from "../ui/button";

// Load Quill only on client side
let Quill: any = null;
if (typeof window !== "undefined") {
  import("quill").then((module) => {
    Quill = module.default;
  });
}

interface RichTextAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  minHeight?: string;
  maxHeight?: string;
}

const RichTextArea = ({
  value,
  onChange,
  placeholder = "Enter your contract details here...",
  readOnly = false,
  minHeight = "300px",
  maxHeight = "500px",
}: RichTextAreaProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillInstance = useRef<any>(null);
  const [isQuillLoaded, setIsQuillLoaded] = useState(false);

  // Load Quill dynamically
  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadQuill = async () => {
      if (!Quill) {
        const module = await import("quill");
        Quill = module.default;
      }
      setIsQuillLoaded(true);
    };

    loadQuill();

    return () => {
      if (quillInstance.current) {
        quillInstance.current = null;
      }
    };
  }, []);

  // Initialize Quill
  useEffect(() => {
    if (!isQuillLoaded || !editorRef.current || quillInstance.current) return;

    // Configure Quill
    const toolbarOptions = [
      ["bold", "italic", "underline"],
      [{ header: [1, 2, 3, false] }],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ align: [] }],
      ["link"],
      ["clean"],
    ];

    try {
      const quill = new Quill(editorRef.current, {
        theme: "snow",
        placeholder,
        readOnly,
        modules: {
          toolbar: toolbarOptions,
          clipboard: {
            matchVisual: false,
          },
          keyboard: {
            bindings: {
              "list autofill": {
                key: " ",
                prefix: /^(\d+\.|-|\*|\+)$/,
                handler: function (range: any, context: any) {
                  return true;
                },
              },
            },
          },
        },
      });

      quillInstance.current = quill;

      if (value) {
        quill.root.innerHTML = value;
      }

      quill.on("text-change", () => {
        const content = quill.root.innerHTML;
        onChange(content);
      });

      quill.root.addEventListener("keydown", (e: KeyboardEvent) => {
        if (e.key === "Backspace" || e.key === "Delete") {
          setTimeout(() => {
            const content = quill.root.innerHTML;
            onChange(content);
          }, 0);
        }
      });
    } catch (error) {
      console.error("Error initializing Quill:", error);
    }

    return () => {
      if (quillInstance.current) {
        quillInstance.current = null;
      }
    };
  }, [isQuillLoaded]);

  // Update content when value prop changes
  useEffect(() => {
    if (!quillInstance.current || !value) return;

    const currentContent = quillInstance.current.root.innerHTML;
    if (value !== currentContent) {
      quillInstance.current.root.innerHTML = value;
    }
  }, [value]);

  // Update readOnly state
  useEffect(() => {
    if (!quillInstance.current) return;
    quillInstance.current.enable(!readOnly);
  }, [readOnly]);

  const handleClearAll = () => {
    if (!quillInstance.current) return;
    quillInstance.current.setText("");
    onChange("");
  };

  const handleClearFormatting = () => {
    if (!quillInstance.current) return;

    const quill = quillInstance.current;
    const range = quill.getSelection();

    if (range && range.length > 0) {
      quill.removeFormat(range.index, range.length);
    } else {
      const length = quill.getLength();
      if (length > 1) {
        quill.removeFormat(0, length - 1);
      }
    }

    const content = quill.root.innerHTML;
    onChange(content);
  };

  // ✅ Updated styles - Editor on top, buttons at bottom
  const editorStyles = `
    .ql-container {
      font-family: var(--font-be-vietnam), inherit;
      font-size: 16px;
      min-height: ${minHeight};
      max-height: ${maxHeight};
      border: none !important;
      border-radius: 0 !important;
      overflow-y: auto !important;
    }
    
    .ql-toolbar {
      border: none !important;
      border-bottom: 1px solid var(--border-color) !important;
      background-color: var(--bg-secondary);
      padding: 0.5rem !important;
      border-radius: 8px 8px 0 0 !important;
      flex-wrap: wrap !important;
      gap: 2px !important;
    }
    
    /* Mobile responsive toolbar */
    @media (max-width: 640px) {
      .ql-toolbar {
        padding: 0.25rem !important;
      }
      
      .ql-toolbar .ql-formats {
        margin-right: 2px !important;
        padding: 2px !important;
      }
      
      .ql-toolbar button {
        width: 24px !important;
        height: 24px !important;
        padding: 2px !important;
      }
      
      .ql-toolbar .ql-formats:first-child {
        margin-right: 0px !important;
      }
    }
    
    .ql-toolbar .ql-formats {
      margin-right: 6px;
      display: inline-flex;
      align-items: center;
    }
    
    .ql-toolbar button {
      width: 28px;
      height: 28px;
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    
    .ql-toolbar button:hover {
      background-color: var(--bg-secondary);
    }
    
    .ql-toolbar button.ql-active {
      background-color: var(--color-accent-yellow)/20;
      color: var(--color-accent-yellow);
    }
    
    .ql-editor {
      min-height: ${minHeight};
      max-height: ${maxHeight};
      padding: 1rem;
      font-size: 16px;
      line-height: 1.75;
      color: var(--text-primary);
      background-color: var(--bg-primary);
      border-radius: 0 !important;
      overflow-y: auto !important;
    }
    
    /* Mobile responsive editor */
    @media (max-width: 640px) {
      .ql-editor {
        padding: 0.75rem;
        font-size: 15px;
        line-height: 1.6;
        min-height: 200px;
      }
      
      .ql-editor h1 { font-size: 1.5em; }
      .ql-editor h2 { font-size: 1.25em; }
      .ql-editor h3 { font-size: 1.1em; }
      
      .ql-editor ul, .ql-editor ol {
        padding-left: 1rem;
      }
    }
    
    .ql-editor p {
      margin-bottom: 0.75rem;
    }
    
    .ql-editor h1, .ql-editor h2, .ql-editor h3 {
      margin-top: 1.25rem;
      margin-bottom: 0.75rem;
      font-weight: 600;
    }
    
    .ql-editor h1 { font-size: 2em; }
    .ql-editor h2 { font-size: 1.5em; }
    .ql-editor h3 { font-size: 1.17em; }
    
    .ql-editor ul, .ql-editor ol {
      padding-left: 1.5rem;
      margin-bottom: 0.75rem;
    }
    
    .ql-editor li {
      margin-bottom: 0.25rem;
    }
    
    .ql-editor.ql-blank::before {
      color: var(--text-secondary);
      font-style: normal;
      left: 1rem;
      top: 1rem;
      font-size: 15px;
    }

    /* Mobile placeholder */
    @media (max-width: 640px) {
      .ql-editor.ql-blank::before {
        left: 0.75rem;
        top: 0.75rem;
        font-size: 14px;
      }
    }

    /* Custom scrollbar */
    .ql-editor::-webkit-scrollbar,
    .ql-container::-webkit-scrollbar {
      width: 6px;
    }
    
    .ql-editor::-webkit-scrollbar-track,
    .ql-container::-webkit-scrollbar-track {
      background: var(--bg-secondary);
      border-radius: 10px;
    }
    
    .ql-editor::-webkit-scrollbar-thumb,
    .ql-container::-webkit-scrollbar-thumb {
      background: var(--color-accent-yellow);
      border-radius: 10px;
    }
    
    .ql-editor::-webkit-scrollbar-thumb:hover,
    .ql-container::-webkit-scrollbar-thumb:hover {
      background: var(--color-accent-yellow-dark);
    }
  `;

  if (!isQuillLoaded) {
    return (
      <div
        className="border border-(--border-color) rounded-lg bg-(--bg-secondary) flex items-center justify-center"
        style={{ minHeight }}
      >
        <p className="text-(--text-secondary)">Loading editor...</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden bg-(--bg-primary) border border-(--border-color)">
      <style>{editorStyles}</style>

      {/* Editor Area */}
      <div className="w-full">
        <div
          ref={editorRef}
          className="[&_.ql-toolbar]:border-0 [&_.ql-toolbar]:bg-transparent [&_.ql-toolbar]:p-1 sm:[&_.ql-toolbar]:p-2 w-full"
        />
      </div>

      {/* ✅ Action Buttons - Bottom (Clear Format & Clear All) */}
      <div className="flex flex-wrap items-center justify-end gap-1 sm:gap-2 px-2 sm:px-3 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <Button
          size="sm"
          variant="ghost"
          onClick={handleClearFormatting}
          className="h-7 sm:h-8 px-2 sm:px-3 text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 hover:text-[#FDC020] hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Clear formatting"
          type="button"
        >
          <Eraser className="h-3 w-3 mr-1" />
          Clear Format
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleClearAll}
          className="h-7 sm:h-8 px-2 sm:px-3 text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          title="Clear all content"
          type="button"
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Clear All
        </Button>
      </div>
    </div>
  );
};

export default RichTextArea;