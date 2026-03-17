import React, { useRef, useEffect, useState } from 'react';
import 'quill/dist/quill.snow.css';
import { Trash2, Eraser } from 'lucide-react';
import { Button } from '../ui/button';

// Load Quill only on client side
let Quill: any = null;
if (typeof window !== 'undefined') {
  import('quill').then(module => {
    Quill = module.default;
  });
}

interface RichTextAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  minHeight?: string;
}

const RichTextArea = ({
  value,
  onChange,
  placeholder = 'Enter your contract details here...',
  readOnly = false,
  minHeight = '300px',
}: RichTextAreaProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillInstance = useRef<any>(null);
  const [isQuillLoaded, setIsQuillLoaded] = useState(false);

  // Load Quill dynamically
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadQuill = async () => {
      if (!Quill) {
        const module = await import('quill');
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
      ['bold', 'italic', 'underline'],
      [{ header: [1, 2, 3, false] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ align: [] }],
      ['link'],
      ['clean'], // Add clean button for clearing formatting
    ];

    try {
      const quill = new Quill(editorRef.current, {
        theme: 'snow',
        placeholder,
        readOnly,
        modules: {
          toolbar: toolbarOptions,
          clipboard: {
            matchVisual: false, // Prevents some formatting issues
          },
          keyboard: {
            bindings: {
              // Fix for list handling
              'list autofill': {
                key: ' ',
                prefix: /^(\d+\.|-|\*|\+)$/,
                handler: function (range: any, context: any) {
                  return true;
                }
              }
            }
          }
        },
      });

      quillInstance.current = quill;

      // Set initial content if provided
      if (value) {
        quill.root.innerHTML = value;
      }

      // Handle text changes
      quill.on('text-change', () => {
        const content = quill.root.innerHTML;
        onChange(content);
      });

      // Fix for backspace/delete issues
      quill.root.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Backspace' || e.key === 'Delete') {
          // Allow default behavior
          setTimeout(() => {
            const content = quill.root.innerHTML;
            onChange(content);
          }, 0);
        }
      });

    } catch (error) {
      console.error('Error initializing Quill:', error);
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
    quillInstance.current.setText('');
    onChange('');
  };

  const handleClearFormatting = () => {
    if (!quillInstance.current) return;
    
    const quill = quillInstance.current;
    const range = quill.getSelection();
    
    if (range && range.length > 0) {
      // Clear formatting on selected text
      quill.removeFormat(range.index, range.length);
    } else {
      // If no selection, clear formatting on entire document
      const length = quill.getLength();
      if (length > 1) {
        quill.removeFormat(0, length - 1);
      }
    }
    
    // Get updated content
    const content = quill.root.innerHTML;
    onChange(content);
  };

  // Styles
  const editorStyles = `
    .ql-container {
      font-family: inherit;
      font-size: 16px;
      min-height: ${minHeight};
      border: none !important;
    }
    
    .ql-toolbar {
      border: none !important;
      border-bottom: 1px solid #e5e7eb !important;
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
      min-height: ${minHeight};
      padding: 1rem;
      font-size: 16px;
      line-height: 1.75;
      color: #1f2937;
    }
    
    .ql-editor p {
      margin-bottom: 1rem;
    }
    
    .ql-editor h1, .ql-editor h2, .ql-editor h3 {
      margin-top: 1.5rem;
      margin-bottom: 1rem;
      font-weight: 600;
    }
    
    .ql-editor h1 { font-size: 2em; }
    .ql-editor h2 { font-size: 1.5em; }
    .ql-editor h3 { font-size: 1.17em; }
    
    .ql-editor ul, .ql-editor ol {
      padding-left: 1.5rem;
      margin-bottom: 1rem;
    }
    
    .ql-editor li {
      margin-bottom: 0.25rem;
    }
    
    .ql-editor.ql-blank::before {
      color: #9ca3af;
      font-style: normal;
      left: 1rem;
    }
  `;

  if (!isQuillLoaded) {
    return (
      <div 
        className="border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center"
        style={{ minHeight }}
      >
        <p className="text-gray-400">Loading editor...</p>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <style>{editorStyles}</style>
      
      {/* Toolbar wrapper */}
      <div className="flex items-center justify-between bg-muted border-b border-border">
        <div className="flex-1">
          <div 
            ref={editorRef} 
            className="[&_.ql-toolbar]:border-0 [&_.ql-toolbar]:bg-transparent [&_.ql-toolbar]:p-2"
          />
        </div>
        
        {/* Custom buttons */}
        <div className="flex gap-2 px-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClearFormatting}
            className="h-8 px-2 text-xs"
            title="Clear formatting"
            type="button"
          >
            <Eraser className="h-3 w-3 mr-1" />
            Clear Format
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleClearAll}
            className="h-8 px-2 text-xs"
            title="Clear all content"
            type="button"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Clear All
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RichTextArea;