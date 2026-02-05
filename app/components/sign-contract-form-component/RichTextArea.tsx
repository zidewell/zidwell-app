import React, { useRef, useEffect } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { Trash2, Eraser } from 'lucide-react';
import { Button } from '../ui/button';

interface ContractEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

// Function to clean Quill HTML artifacts
const cleanQuillHTML = (html: string): string => {
  if (!html) return "";
  
  // Remove Quill UI spans
  let cleaned = html
    .replace(/<span class="ql-ui"[^>]*><\/span>/g, '')
    .replace(/<span[^>]*data-list="[^"]*"[^>]*>/g, '')
    .replace(/<\/span>/g, '');
  
  // Remove empty list items
  cleaned = cleaned
    .replace(/<li>\s*<br>\s*<\/li>/g, '')
    .replace(/<li><br><\/li>/g, '')
    .replace(/<li>\s*<\/li>/g, '');
  
  // Remove data-list attributes
  cleaned = cleaned.replace(/\s+data-list="[^"]*"/g, '');
  
  // Clean up empty paragraphs
  cleaned = cleaned
    .replace(/<p>\s*<br>\s*<\/p>/g, '')
    .replace(/<p><br><\/p>/g, '')
    .replace(/<p>\s*<\/p>/g, '');
  
  // Remove empty headers
  cleaned = cleaned
    .replace(/<h[1-6]>\s*<br>\s*<\/h[1-6]>/g, '')
    .replace(/<h[1-6]><br><\/h[1-6]>/g, '');
  
  return cleaned.trim();
};

const RichTextArea = ({ 
  value, 
  onChange, 
  placeholder = 'Enter your contract details here...', 
  readOnly = false 
}: ContractEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillInstanceRef = useRef<Quill | null>(null);

  // Initialize Quill
  useEffect(() => {
    if (!editorRef.current || quillInstanceRef.current) return;

    const quill = new Quill(editorRef.current, {
      theme: 'snow',
      placeholder,
      readOnly,
      modules: {
        toolbar: {
          container: [
            ['bold', 'italic', 'underline'],               // Text formatting
            [{ 'header': [1, 2, 3, false] }],              // Headings
            [{ 'list': 'ordered' }, { 'list': 'bullet' }], // Lists
            [{ 'align': [] }],                             // Alignment
            ['link'],                                      // Links
          ],
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
        'header',
        'bold', 'italic', 'underline',
        'list', 'bullet', 'ordered',
        'align',
        'link',
      ],
    });

    quillInstanceRef.current = quill;

    // Set initial value - clean it first
    if (value) {
      // Store the cleaned value in a separate variable
      const initialValue = cleanQuillHTML(value);
      quill.clipboard.dangerouslyPasteHTML(initialValue);
    }

    // Handle text changes - clean HTML before sending to parent
    quill.on('text-change', () => {
      const html = quill.root.innerHTML;
      const cleanedHtml = cleanQuillHTML(html);
      onChange(cleanedHtml);
    });

    return () => {
      quillInstanceRef.current = null;
    };
  }, []);

  // Update value when prop changes
  useEffect(() => {
    if (quillInstanceRef.current && value !== quillInstanceRef.current.root.innerHTML) {
      // Clean the incoming value before setting it in the editor
      const cleanedValue = cleanQuillHTML(value);
      quillInstanceRef.current.clipboard.dangerouslyPasteHTML(cleanedValue);
    }
  }, [value]);

  // Update readOnly state
  useEffect(() => {
    if (quillInstanceRef.current) {
      quillInstanceRef.current.enable(!readOnly);
    }
  }, [readOnly]);

  // Handle clear all content
  const handleClearAll = () => {
    if (quillInstanceRef.current) {
      quillInstanceRef.current.setText('');
      // Trigger onChange with empty string
      onChange('');
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
        // If no selection, clear formatting of entire document
        quill.removeFormat(0, quill.getLength());
      }
      // Get the cleaned HTML after clearing formatting
      const html = quill.root.innerHTML;
      const cleanedHtml = cleanQuillHTML(html);
      onChange(cleanedHtml);
    }
  };

  // Custom CSS
  const editorStyles = `
    .ql-container {
      font-family: inherit;
      font-size: 14px;
      min-height: 224px;
      border: none !important;
      border-radius: 0 0 0.5rem 0.5rem !important;
    }
    
    .ql-toolbar {
      border: none !important;
      border-bottom: 1px solid #e5e7eb !important;
      border-radius: 0.5rem 0.5rem 0 0 !important;
      background-color: #f9fafb;
      padding: 0.75rem !important;
    }
    
    .ql-toolbar .ql-formats {
      margin-right: 12px;
    }
    
    .ql-editor {
      min-height: 224px;
      padding: 1rem;
      font-size: 14px;
      line-height: 1.6;
      color: #374151;
    }
    
    .ql-editor.ql-blank::before {
      color: #9ca3af;
      font-style: normal;
      left: 1rem;
    }
    
    .ql-toolbar button {
      width: 32px;
      height: 32px;
      border-radius: 4px;
    }
    
    .ql-toolbar button:hover {
      background-color: #e5e7eb;
    }
    
    .ql-toolbar button.ql-active {
      background-color: #dbeafe;
      color: #2563eb;
    }
  `;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <style>{editorStyles}</style>
      
      {/* Custom toolbar with clear buttons */}
      <div className="flex items-start justify-between p-3 bg-muted border-b border-border">
        {/* Quill toolbar container */}
        <div className="flex-1">
          <div ref={editorRef} className="[&_.ql-toolbar]:p-0 [&_.ql-toolbar]:border-none [&_.ql-toolbar]:bg-transparent" />
        </div>
        
        {/* Clear buttons */}
        <div className="flex gap-2 ml-4">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClearFormatting}
            className="h-8 px-3 text-xs"
            title="Clear Formatting"
            type="button"
          >
            <Eraser className="h-4 w-4 mr-1" />
            Clear Format
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleClearAll}
            className="h-8 px-3 text-xs"
            title="Clear All Content"
            type="button"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        </div>
      </div>
    </div>
  );
};

// Export the clean function for use in other components
export { cleanQuillHTML };
export default RichTextArea;