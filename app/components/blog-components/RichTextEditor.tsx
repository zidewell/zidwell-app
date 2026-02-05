"use client";

import React, { useRef, useEffect, useState, KeyboardEvent as ReactKeyboardEvent } from 'react';
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
  const [isInitialized, setIsInitialized] = useState(false);

  // Custom CSS for Quill editor with proper paragraph spacing
  const editorStyles = `
    /* Fix paragraph spacing in Quill editor */
    .ql-container {
      font-family: inherit;
      font-size: 16px;
      min-height: 300px;
      line-height: 1.8;
    }
    
    .ql-editor {
      min-height: 300px;
      font-size: 16px;
      line-height: 1.8;
    }
    
    /* Ensure proper paragraph spacing */
    .ql-editor p {
      margin-bottom: 1.5em !important;
      margin-top: 0 !important;
      line-height: 1.8;
    }
    
    .ql-editor p:first-child {
      margin-top: 0 !important;
    }
    
    .ql-editor p:last-child {
      margin-bottom: 0 !important;
    }
    
    /* Add spacing between paragraphs */
    .ql-editor p + p {
      margin-top: 1.5em !important;
    }
    
    /* Heading spacing */
    .ql-editor h1 {
      margin: 2em 0 1em 0 !important;
      font-size: 2em;
      line-height: 1.3;
    }
    
    .ql-editor h2 {
      margin: 1.75em 0 0.75em 0 !important;
      font-size: 1.5em;
      line-height: 1.3;
    }
    
    .ql-editor h3 {
      margin: 1.5em 0 0.5em 0 !important;
      font-size: 1.17em;
      line-height: 1.3;
    }
    
    /* List spacing */
    .ql-editor ul,
    .ql-editor ol {
      margin: 1.5em 0 1.5em 1.5em !important;
      padding-left: 1.5em;
      line-height: 1.8;
    }
    
    .ql-editor li {
      margin: 0.5em 0;
      line-height: 1.8;
    }
    
    /* Blockquote spacing */
    .ql-editor blockquote {
      margin: 1.5em 0 !important;
      padding: 1em 1.5em;
      border-left: 4px solid #C29307;
      background: #f9f9f9;
      font-style: italic;
      line-height: 1.8;
    }
    
    /* Code block spacing */
    .ql-editor pre.ql-syntax,
    .ql-editor .ql-code-block-container {
      margin: 1.5em 0 !important;
      padding: 1em;
      background: #f5f5f5;
      border-radius: 4px;
      overflow-x: auto;
      line-height: 1.5;
    }
    
    /* Customize the toolbar */
    .ql-toolbar {
      border-top-left-radius: 8px;
      border-top-right-radius: 8px;
      border-color: #e5e7eb;
    }
    
    .ql-container {
      border-bottom-left-radius: 8px;
      border-bottom-right-radius: 8px;
      border-color: #e5e7eb;
    }
    
    .ql-container.ql-snow {
      border-top: none;
    }
    
    /* Focus states */
    .ql-container.ql-snow:focus-within {
      border-color: #C29307;
      box-shadow: 0 0 0 2px rgba(194, 147, 7, 0.1);
    }
    
    /* Custom styles for your theme */
    .ql-editor a {
      color: #C29307;
      text-decoration: underline;
    }
    
    /* Remove default Quill styling that might interfere */
    .ql-editor.ql-blank::before {
      color: #9ca3af;
      font-style: normal;
      left: 15px;
      right: 15px;
    }
  `;

  // Helper function to format text with proper paragraphs
  const formatTextWithParagraphs = (text: string): string => {
    if (!text) return '';
    
    // Split by double newlines (paragraphs)
    let paragraphs = text.split(/\n\s*\n/);
    
    // If no double newlines, try to split by single newlines and group
    if (paragraphs.length === 1) {
      paragraphs = text.split('\n').filter(line => line.trim().length > 0);
    }
    
    // Wrap each paragraph in <p> tags
    const formattedParagraphs = paragraphs
      .map(paragraph => {
        const trimmed = paragraph.trim();
        if (!trimmed) return '';
        
        // Clean up the paragraph content
        let cleanParagraph = trimmed
          .replace(/\s+/g, ' ') // Replace multiple spaces with single space
          .replace(/^\s+|\s+$/g, ''); // Trim
        
        // Ensure proper punctuation spacing
        cleanParagraph = cleanParagraph
          .replace(/\s+\./g, '.')
          .replace(/\s+,/g, ',')
          .replace(/\s+;/g, ';')
          .replace(/\s+:/g, ':')
          .replace(/\s+\?/g, '?')
          .replace(/\s+!/g, '!');
        
        return `<p style="margin-bottom: 1.5em; margin-top: 0; line-height: 1.8;">${cleanParagraph}</p>`;
      })
      .filter(p => p.length > 0);
    
    // Join with empty paragraph for spacing (if more than one paragraph)
    if (formattedParagraphs.length > 1) {
      return formattedParagraphs.join('');
    }
    
    return formattedParagraphs.join('') || '<p><br></p>';
  };

  // Function to clean and format HTML content
  const cleanAndFormatHTML = (html: string): string => {
    if (!html) return '<p><br></p>';
    
    let cleaned = html;
    
    // Replace divs with paragraphs
    cleaned = cleaned.replace(/<div[^>]*>/gi, '<p>');
    cleaned = cleaned.replace(/<\/div>/gi, '</p>');
    
    // Replace line breaks within paragraphs with proper spacing
    cleaned = cleaned.replace(/<p[^>]*>(.*?)<\/p>/gi, (match, content) => {
      // Remove any existing style attributes
      const cleanContent = content
        .replace(/<br\s*\/?>\s*<br\s*\/?>/gi, '</p><p>') // Double br becomes new paragraph
        .replace(/<br\s*\/?>/gi, ' ') // Single br becomes space
        .replace(/\s+/g, ' ') // Multiple spaces to single
        .trim();
      
      return `<p style="margin-bottom: 1.5em; margin-top: 0; line-height: 1.8;">${cleanContent}</p>`;
    });
    
    // Remove empty paragraphs
    cleaned = cleaned.replace(/<p[^>]*>\s*<\/p>/gi, '');
    cleaned = cleaned.replace(/<p[^>]*><br\s*\/?><\/p>/gi, '');
    
    // Ensure we have at least one paragraph
    if (!cleaned.trim() || cleaned === '<p><br></p>') {
      cleaned = '<p style="margin-bottom: 1.5em; margin-top: 0; line-height: 1.8;"><br></p>';
    }
    
    return cleaned;
  };

  // Initialize Quill editor
  useEffect(() => {
    if (!editorRef.current || quillInstanceRef.current) return;

    try {
      // Create Quill instance
      const quill = new Quill(editorRef.current, {
        theme: 'snow',
        placeholder,
        modules: {
          toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['link', 'image'],
            ['clean']
          ],
          clipboard: {
            matchVisual: false,
          }
        }
      });

      quillInstanceRef.current = quill;
      setIsInitialized(true);

      // Set initial value if provided
      if (value) {
        const formattedValue = cleanAndFormatHTML(value);
        quill.clipboard.dangerouslyPasteHTML(formattedValue);
      }

      // Handle text changes
      quill.on('text-change', () => {
        let html = quill.root.innerHTML;
        
        // Apply formatting to the HTML
        html = cleanAndFormatHTML(html);
        
        onChange(html);
      });

      return () => {
        quillInstanceRef.current = null;
      };
    } catch (error) {
      console.error('Error initializing Quill editor:', error);
    }
  }, []);

  // Update when value changes from outside
  useEffect(() => {
    if (quillInstanceRef.current && value !== quillInstanceRef.current.root.innerHTML && isInitialized) {
      // Get current selection to restore cursor position
      const selection = quillInstanceRef.current.getSelection();
      
      // Clean and format the incoming value
      const formattedValue = cleanAndFormatHTML(value);
      
      quillInstanceRef.current.clipboard.dangerouslyPasteHTML(formattedValue);
      
      // Restore cursor position if there was one
      if (selection) {
        setTimeout(() => {
          quillInstanceRef.current?.setSelection(selection);
        }, 0);
      }
    }
  }, [value, isInitialized]);

  return (
    <>
      <style>{editorStyles}</style>
      <div className="border rounded-lg overflow-hidden">
        <div ref={editorRef} className="min-h-[300px]" />
        <div className="p-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
          Tip: Press <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Enter</kbd> for new paragraph, <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Shift + Enter</kbd> for line break within paragraph
        </div>
      </div>
    </>
  );
};

export default RichTextEditor;