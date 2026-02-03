"use client";

import React, { useRef, useEffect } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

const RichTextEditor = ({ 
  value, 
  onChange, 
  placeholder = 'Start writing...'
}: { 
  value: string; 
  onChange: (value: string) => void; 
  placeholder?: string;
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillInstanceRef = useRef<Quill | null>(null);

  // Custom CSS for Quill editor with proper paragraph spacing
  const editorStyles = `
    /* Fix paragraph spacing in Quill editor */
    .ql-editor {
      font-size: 16px;
      line-height: 1.6;
    }
    
    .ql-editor p {
      margin-bottom: 1em !important;
    }
    
    .ql-editor h1 {
      margin: 1.5em 0 0.5em 0 !important;
    }
    
    .ql-editor h2 {
      margin: 1.25em 0 0.5em 0 !important;
    }
    
    .ql-editor h3 {
      margin: 1em 0 0.5em 0 !important;
    }
    
    /* Ensure proper spacing for lists */
    .ql-editor ul,
    .ql-editor ol {
      margin: 0 0 1em 0 !important;
      padding-left: 1.5em;
    }
    
    .ql-editor li {
      margin: 0.25em 0;
    }
    
    /* Blockquote spacing */
    .ql-editor blockquote {
      margin: 1em 0 !important;
      padding-left: 1em;
      border-left: 3px solid #ccc;
    }
    
    /* Container styling */
    .ql-container {
      font-size: 16px;
      min-height: 300px;
      font-family: inherit;
    }
  `;

  useEffect(() => {
    if (!editorRef.current || quillInstanceRef.current) return;

    const quill = new Quill(editorRef.current, {
      theme: 'snow',
      placeholder,
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline', 'strike'],
          [{ 'header': [1, 2, 3, false] }],
          ['blockquote', 'code-block'],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          ['link', 'image'],
          ['clean']
        ],
        clipboard: {
          matchVisual: false, // Prevents spacing issues
        }
      }
    });

    quillInstanceRef.current = quill;

    // Set initial value
    if (value) {
      quill.clipboard.dangerouslyPasteHTML(value);
    }

    // Handle text changes
    quill.on('text-change', () => {
      onChange(quill.root.innerHTML);
    });

    return () => {
      quillInstanceRef.current = null;
    };
  }, []);

  // Update when value changes from outside
  useEffect(() => {
    if (quillInstanceRef.current && value !== quillInstanceRef.current.root.innerHTML) {
      quillInstanceRef.current.clipboard.dangerouslyPasteHTML(value);
    }
  }, [value]);

  return (
    <>
      <style>{editorStyles}</style>
      <div ref={editorRef} className="min-h-[300px]" />
    </>
  );
};

export default RichTextEditor;