// "use client";

// import React, { useRef, useEffect } from "react";
// import Quill from "quill";
// import "quill/dist/quill.snow.css";
// import { Trash2, Eraser } from "lucide-react";
// import { Button } from "@/app/components/ui/button";

// interface RichTextEditorProps {
//   value: string;
//   onChange: (value: string) => void;
//   placeholder?: string;
//   readOnly?: boolean;
// }
// const cleanQuillHTML = (html: string): string => {
//   if (!html) return "";

//   let cleaned = html
//     .replace(/<span class="ql-ui"[^>]*><\/span>/g, "")
//     .replace(/<span[^>]*data-list="[^"]*"[^>]*>/g, "")
//     .replace(/<\/span>/g, "");

//   cleaned = cleaned
//     .replace(/<li>\s*<br>\s*<\/li>/g, "")
//     .replace(/<li><br><\/li>/g, "")
//     .replace(/<li>\s*<\/li>/g, "");

//   cleaned = cleaned.replace(/\s+data-list="[^"]*"/g, "");

//   cleaned = cleaned.replace(/<p>\s*<\/p>/g, "");

//   cleaned = cleaned
//     .replace(/<h[1-6]>\s*<br>\s*<\/h[1-6]>/g, "")
//     .replace(/<h[1-6]><br><\/h[1-6]>/g, "");

//   return cleaned.trim();
// };

// const BlogRichTextEditor = ({
//   value,
//   onChange,
//   placeholder = "Start writing your story...",
//   readOnly = false,
// }: RichTextEditorProps) => {
//   const editorRef = useRef<HTMLDivElement>(null);
//   const quillInstanceRef = useRef<Quill | null>(null);

//   // Initialize Quill
//   useEffect(() => {
//     if (!editorRef.current || quillInstanceRef.current) return;

//     const quill = new Quill(editorRef.current, {
//       theme: "snow",
//       placeholder,
//       readOnly,
//       modules: {
//         toolbar: {
//           container: [
//             ["bold", "italic", "underline"], // Text formatting
//             [{ header: [1, 2, 3, false] }], // Headings
//             ["image", "code-block"],
//             [{ list: "ordered" }, { list: "bullet" }], // Lists
//             [{ align: [] }], // Alignment
//             ["link"], // Links
//           ],
//         },
//         clipboard: {
//           matchVisual: true,
//         },
//         history: {
//           delay: 1000,
//           maxStack: 50,
//           userOnly: true,
//         },
//       },
//       formats: [
//         "header",
//         "bold",
//         "italic",
//         "underline",
//         "list",
//         "bullet",
//         "ordered",
//         "align",
//         "link",
//       ],
//     });

//     quillInstanceRef.current = quill;

//     // Set initial value - clean it first
//     if (value) {
//       const initialValue = cleanQuillHTML(value);
//       quill.clipboard.dangerouslyPasteHTML(initialValue);
//     }

//     // Handle text changes - clean HTML before sending to parent
//     quill.on("text-change", () => {
//       const html = quill.root.innerHTML;
//       const cleanedHtml = cleanQuillHTML(html);
//       onChange(cleanedHtml);
//     });

//     return () => {
//       quillInstanceRef.current = null;
//     };
//   }, []);

//   // Update value when prop changes
//   useEffect(() => {
//     if (
//       quillInstanceRef.current &&
//       value !== quillInstanceRef.current.root.innerHTML
//     ) {
//       const cleanedValue = cleanQuillHTML(value);
//       quillInstanceRef.current.clipboard.dangerouslyPasteHTML(cleanedValue);
//     }
//   }, [value]);

//   // Update readOnly state
//   useEffect(() => {
//     if (quillInstanceRef.current) {
//       quillInstanceRef.current.enable(!readOnly);
//     }
//   }, [readOnly]);

//   // Handle clear all content
//   const handleClearAll = () => {
//     if (quillInstanceRef.current) {
//       quillInstanceRef.current.setText("");
//       onChange("");
//     }
//   };

//   // Handle clear formatting
//   const handleClearFormatting = () => {
//     if (quillInstanceRef.current) {
//       const quill = quillInstanceRef.current;
//       const range = quill.getSelection();
//       if (range) {
//         quill.removeFormat(range.index, range.length);
//       } else {
//         quill.removeFormat(0, quill.getLength());
//       }
//       const html = quill.root.innerHTML;
//       const cleanedHtml = cleanQuillHTML(html);
//       onChange(cleanedHtml);
//     }
//   };

//   // Custom CSS for full-width editor
//   const editorStyles = `
//     .ql-container {
//       font-family: inherit;
//       font-size: 16px;
//       min-height: 300px;
//       border: none !important;
//       border-radius: 0 !important;
//       height: 100%;
//     }
    
//     .ql-toolbar {
//       border: none !important;
//       border-bottom: 1px solid #e5e7eb !important;
//       border-radius: 0 !important;
//       background-color: #f9fafb;
//       padding: 0.5rem !important;
//     }
    
//     .ql-toolbar .ql-formats {
//       margin-right: 8px;
//     }
    
//     .ql-toolbar button {
//       width: 28px;
//       height: 28px;
//       border-radius: 4px;
//     }
    
//     .ql-toolbar button:hover {
//       background-color: #e5e7eb;
//     }
    
//     .ql-toolbar button.ql-active {
//       background-color: #dbeafe;
//       color: #2563eb;
//     }
    
//     .ql-editor {
//       min-height: 300px;
//       padding: 0;
//       font-size: 16px;
//       line-height: 1.75;
//       color: #1f2937;
//       height: 100%;
//       width: 100%;
//     }
    
//     .ql-editor p {
//       margin-bottom: 1rem;
//     }
    
//     .ql-editor h1, .ql-editor h2, .ql-editor h3 {
//       margin-top: 1.5rem;
//       margin-bottom: 1rem;
//     }
    
//     .ql-editor ul, .ql-editor ol {
//       padding-left: 1.5rem;
//       margin-bottom: 1rem;
//     }
    
//     .ql-editor.ql-blank::before {
//       color: #9ca3af;
//       font-style: normal;
//       left: 0;
//     }
    
//     .ql-container.ql-snow {
//       border: none !important;
//     }
    
//     .ql-toolbar.ql-snow {
//       border: none !important;
//       border-bottom: 1px solid #e5e7eb !important;
//     }
//   `;

//   return (
//     <div className="w-full h-full flex flex-col border border-gray-200 rounded-lg overflow-hidden">
//       <style>{editorStyles}</style>

//       {/* Custom toolbar with clear buttons */}
//       <div className="flex items-center justify-between p-2 bg-muted border-b border-border">
//         {/* Quill toolbar container */}

//         <div className="flex-1">
//           <div
//             ref={editorRef}
//             className="[&_.ql-toolbar]:p-0 [&_.ql-toolbar]:border-none [&_.ql-toolbar]:bg-transparent"
//           />
//         </div>
//       </div>
//       <div className="flex gap-2 ml-4">
//         <Button
//           size="sm"
//           variant="ghost"
//           onClick={handleClearFormatting}
//           className="h-8 px-2 text-xs"
//           title="Clear Formatting"
//           type="button"
//         >
//           <Eraser className="h-3 w-3 mr-1" />
//           Clear Format
//         </Button>
//         <Button
//           size="sm"
//           variant="outline"
//           onClick={handleClearAll}
//           className="h-8 px-2 text-xs"
//           title="Clear All Content"
//           type="button"
//         >
//           <Trash2 className="h-3 w-3 mr-1" />
//           Clear All
//         </Button>
//       </div>
//     </div>
//   );
// };

// export { cleanQuillHTML };
// export default BlogRichTextEditor;
"use client";

import React, { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import Quill from "quill";
require("quill/dist/quill.snow.css");
import { Trash2, Eraser } from "lucide-react";
import { Button } from "@/app/components/ui/button";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

const cleanQuillHTML = (html: string): string => {
  if (!html) return "";

  let cleaned = html
    .replace(/<span class="ql-ui"[^>]*><\/span>/g, "")
    .replace(/<span[^>]*data-list="[^"]*"[^>]*>/g, "")
    .replace(/<\/span>/g, "");

  cleaned = cleaned
    .replace(/<li>\s*<br>\s*<\/li>/g, "")
    .replace(/<li><br><\/li>/g, "")
    .replace(/<li>\s*<\/li>/g, "");

  cleaned = cleaned.replace(/\s+data-list="[^"]*"/g, "");

  cleaned = cleaned.replace(/<p>\s*<\/p>/g, "");

  cleaned = cleaned
    .replace(/<h[1-6]>\s*<br>\s*<\/h[1-6]>/g, "")
    .replace(/<h[1-6]><br><\/h[1-6]>/g, "");

  return cleaned.trim();
};

// Custom image handler for Quill
const imageHandler = async () => {
  return new Promise<string>((resolve, reject) => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        reject("No file selected");
        return;
      }

      // Validate file type
      const validImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
      if (!validImageTypes.includes(file.type)) {
        reject("Invalid file type. Please upload an image.");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        reject("File too large. Maximum size is 5MB.");
        return;
      }

      try {
        const formData = new FormData();
        formData.append("image", file);
        formData.append("tempId", Date.now().toString());

        const response = await fetch("/api/blog/upload-image", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to upload image");
        }

        const data = await response.json();
        resolve(data.url);
      } catch (error) {
        console.error("Error uploading image:", error);
        reject(error instanceof Error ? error.message : "Failed to upload image");
      }
    };
  });
};

const BlogRichTextEditor = forwardRef<any, RichTextEditorProps>(
  ({ value, onChange, placeholder = "Start writing your story...", readOnly = false }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const quillInstanceRef = useRef<Quill | null>(null);
    const valueRef = useRef(value);
    const onChangeRef = useRef(onChange);

    // Keep refs updated
    useEffect(() => {
      onChangeRef.current = onChange;
      valueRef.current = value;
    }, [onChange, value]);

    // Expose quill instance via ref
    useImperativeHandle(ref, () => ({
      getQuill: () => quillInstanceRef.current,
      getLength: () => quillInstanceRef.current?.getLength(),
      getText: () => quillInstanceRef.current?.getText(),
      getContents: () => quillInstanceRef.current?.getContents(),
    }));

    // Initialize Quill
    useEffect(() => {
      if (!containerRef.current || quillInstanceRef.current) return;

      const container = containerRef.current;
      const editorContainer = container.appendChild(
        container.ownerDocument.createElement("div")
      );

      const quill = new Quill(editorContainer, {
        theme: "snow",
        placeholder,
        readOnly,
        modules: {
          toolbar: {
            container: [
              ["bold", "italic", "underline"],
              [{ header: [1, 2, 3, false] }],
              [{ list: "ordered" }, { list: "bullet" }],
              [{ align: [] }],
              ["link", "image"],
              ["code-block"],
            ],
            handlers: {
              image: function (this: any) {
                imageHandler()
                  .then((url) => {
                    const range = this.quill.getSelection();
                    const index = range ? range.index : 0;
                    this.quill.insertEmbed(index, "image", url);
                  })
                  .catch((error) => {
                    console.error("Image upload failed:", error);
                    alert(error);
                  });
              },
            },
          },
          clipboard: {
            matchVisual: true,
          },
          history: {
            delay: 1000,
            maxStack: 50,
            userOnly: true,
          },
        },
        formats: [
          "header",
          "bold",
          "italic",
          "underline",
          "list",
          "bullet",
          "ordered",
          "align",
          "link",
          "image",
          "code-block",
        ],
      });

      quillInstanceRef.current = quill;

      // Set initial value
      if (valueRef.current) {
        const initialValue = cleanQuillHTML(valueRef.current);
        quill.clipboard.dangerouslyPasteHTML(initialValue);
      }

      // Handle text changes
      quill.on(Quill.events.TEXT_CHANGE, () => {
        const html = quill.root.innerHTML;
        const cleanedHtml = cleanQuillHTML(html);
        onChangeRef.current(cleanedHtml);
      });

      return () => {
        quillInstanceRef.current = null;
        container.innerHTML = "";
      };
    }, []); // Empty dependency array - only run once on mount

    // Update readOnly state
    useEffect(() => {
      if (quillInstanceRef.current) {
        quillInstanceRef.current.enable(!readOnly);
      }
    }, [readOnly]);

    // Handle clear all content
    const handleClearAll = () => {
      if (quillInstanceRef.current) {
        quillInstanceRef.current.setText("");
        onChange("");
      }
    };

    // Handle clear formatting
    const handleClearFormatting = () => {
      if (quillInstanceRef.current) {
        const quill = quillInstanceRef.current;
        const range = quill.getSelection();
        if (range) {
          quill.removeFormat(range.index, range.length);
        } else {
          quill.removeFormat(0, quill.getLength());
        }
        const html = quill.root.innerHTML;
        const cleanedHtml = cleanQuillHTML(html);
        onChange(cleanedHtml);
      }
    };

    // Custom CSS for full-width editor with sticky positioning
    const editorStyles = `
      .ql-container {
        font-family: inherit;
        font-size: 16px;
        min-height: 400px;
        border: none !important;
        border-radius: 0 !important;
        height: 100%;
      }
      
      .ql-toolbar {
        border: none !important;
        border-bottom: 1px solid #e5e7eb !important;
        border-radius: 0 !important;
        background-color: #f9fafb;
        padding: 0.5rem !important;
      }
      
      .ql-toolbar .ql-formats {
        margin-right: 8px;
      }
      
      .ql-toolbar button {
        width: 28px;
        height: 28px;
        border-radius: 4px;
      }
      
      .ql-toolbar button:hover {
        background-color: #e5e7eb;
      }
      
      .ql-toolbar button.ql-active {
        background-color: #dbeafe;
        color: #2563eb;
      }
      
      .ql-editor {
        min-height: 400px;
        padding: 1rem;
        font-size: 16px;
        line-height: 1.75;
        color: #1f2937;
        height: 100%;
        width: 100%;
      }
      
      .ql-editor p {
        margin-bottom: 1rem;
      }
      
      .ql-editor h1, .ql-editor h2, .ql-editor h3 {
        margin-top: 1.5rem;
        margin-bottom: 1rem;
      }
      
      .ql-editor ul, .ql-editor ol {
        padding-left: 1.5rem;
        margin-bottom: 1rem;
      }
      
      .ql-editor img {
        max-width: 100%;
        height: auto;
        margin: 1rem 0;
        border-radius: 0.5rem;
      }
      
      .ql-editor.ql-blank::before {
        color: #9ca3af;
        font-style: normal;
        left: 0;
        padding: 1rem;
      }
      
      .ql-container.ql-snow {
        border: none !important;
      }
      
      .ql-toolbar.ql-snow {
        border: none !important;
        border-bottom: 1px solid #e5e7eb !important;
      }
      
      .ql-editor pre.ql-syntax {
        background-color: #1f2937;
        color: #e5e7eb;
        padding: 1rem;
        border-radius: 0.5rem;
        overflow-x: auto;
      }
    `;

    return (
      <div className="w-full h-full border border-gray-200 rounded-lg overflow-hidden bg-white">
        <style>{editorStyles}</style>

        {/* Sticky editor wrapper */}
        <div className="sticky top-0 z-10">
          {/* Editor container */}
          <div ref={containerRef} className="flex-1" />

          {/* Bottom toolbar with clear buttons */}
          <div className="flex items-center gap-2 p-2 border-t border-gray-200 bg-gray-50">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClearFormatting}
              className="h-8 px-2 text-xs text-gray-600 hover:text-gray-900"
              title="Clear Formatting"
              type="button"
            >
              <Eraser className="h-3 w-3 mr-1" />
              Clear Format
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClearAll}
              className="h-8 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
              title="Clear All Content"
              type="button"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear All
            </Button>
          </div>
        </div>
      </div>
    );
  }
);

BlogRichTextEditor.displayName = "BlogRichTextEditor";

export { cleanQuillHTML };
export default BlogRichTextEditor;