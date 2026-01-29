"use client";

import React, { useRef, useEffect, useState } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { 
  Bold, Italic, Underline, List, ListOrdered, 
  Quote, Link2, Image, Video, Mic, Heading1, 
  Heading2, Heading3, AlignLeft, AlignCenter, 
  AlignRight, Indent, Outdent, Trash2, Eraser,
  Save, Eye, Send,
  type LucideIcon 
} from 'lucide-react';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

// Define toolbar button types
type ToolbarButton = {
  type: 'button';
  icon: LucideIcon;
  label: string;
  command: string;
  isDialog?: boolean;
} | {
  type: 'separator';
};

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  onSaveDraft?: () => void;
  onPreview?: () => void;
  onPublish?: () => void;
  isLoading?: boolean;
}

const RichTextEditor = ({ 
  value, 
  onChange, 
  placeholder = 'Start writing your story...',
  readOnly = false,
  onSaveDraft,
  onPreview,
  onPublish,
  isLoading = false
}: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillInstanceRef = useRef<Quill | null>(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');

  // Create toolbar buttons matching your desired UI
  const toolbarButtons: ToolbarButton[] = [
    { type: 'button', icon: Bold, label: 'Bold', command: 'bold' },
    { type: 'button', icon: Italic, label: 'Italic', command: 'italic' },
    { type: 'button', icon: Underline, label: 'Underline', command: 'underline' },
    { type: 'separator' },
    { type: 'button', icon: Heading1, label: 'Heading 1', command: 'h1' },
    { type: 'button', icon: Heading2, label: 'Heading 2', command: 'h2' },
    { type: 'button', icon: Heading3, label: 'Heading 3', command: 'h3' },
    { type: 'separator' },
    { type: 'button', icon: List, label: 'Bullet List', command: 'ul' },
    { type: 'button', icon: ListOrdered, label: 'Numbered List', command: 'ol' },
    { type: 'button', icon: Quote, label: 'Quote', command: 'quote' },
    { type: 'separator' },
    { type: 'button', icon: AlignLeft, label: 'Align Left', command: 'left' },
    { type: 'button', icon: AlignCenter, label: 'Align Center', command: 'center' },
    { type: 'button', icon: AlignRight, label: 'Align Right', command: 'right' },
    { type: 'separator' },
    { type: 'button', icon: Indent, label: 'Indent', command: 'indent' },
    { type: 'button', icon: Outdent, label: 'Outdent', command: 'outdent' },
    { type: 'separator' },
    { 
      type: 'button', 
      icon: Link2, 
      label: 'Add Link', 
      command: 'link',
      isDialog: true 
    },
    { 
      type: 'button', 
      icon: Image, 
      label: 'Add Image', 
      command: 'image',
      isDialog: true 
    },
    { 
      type: 'button', 
      icon: Video, 
      label: 'Add Video', 
      command: 'video',
      isDialog: true 
    },
    { type: 'button', icon: Mic, label: 'Add Audio', command: 'audio' },
  ];

  // Initialize Quill
  useEffect(() => {
    if (!editorRef.current || quillInstanceRef.current) return;

    const quill = new Quill(editorRef.current, {
      theme: 'snow',
      placeholder,
      readOnly,
      modules: {
        toolbar: {
          container: '#custom-toolbar',
          handlers: {
            link: () => setShowLinkDialog(true),
          }
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
        'list', 'bullet',
        'align',
        'link', 'image', 'video',
        'blockquote',
        'indent',
      ],
    });

    quillInstanceRef.current = quill;

    // Set initial value
    if (value) {
      quill.clipboard.dangerouslyPasteHTML(value);
    }

    // Handle text changes
    quill.on('text-change', () => {
      const html = quill.root.innerHTML;
      onChange(html);
    });

    return () => {
      quillInstanceRef.current = null;
    };
  }, []);

  // Update value when prop changes
  useEffect(() => {
    if (quillInstanceRef.current && value !== quillInstanceRef.current.root.innerHTML) {
      quillInstanceRef.current.clipboard.dangerouslyPasteHTML(value);
    }
  }, [value]);

  // Update readOnly state
  useEffect(() => {
    if (quillInstanceRef.current) {
      quillInstanceRef.current.enable(!readOnly);
    }
  }, [readOnly]);

  // Handle toolbar button clicks
  const handleToolbarClick = (command: string) => {
    if (!quillInstanceRef.current) return;

    const quill = quillInstanceRef.current;
    const range = quill.getSelection();
    if (!range) return;

    switch (command) {
      case 'bold':
        quill.format('bold', !quill.getFormat(range).bold);
        break;
      case 'italic':
        quill.format('italic', !quill.getFormat(range).italic);
        break;
      case 'underline':
        quill.format('underline', !quill.getFormat(range).underline);
        break;
      case 'h1':
        quill.format('header', 1);
        break;
      case 'h2':
        quill.format('header', 2);
        break;
      case 'h3':
        quill.format('header', 3);
        break;
      case 'ul':
        quill.format('list', 'bullet');
        break;
      case 'ol':
        quill.format('list', 'ordered');
        break;
      case 'quote':
        quill.format('blockquote', true);
        break;
      case 'left':
        quill.format('align', '');
        break;
      case 'center':
        quill.format('align', 'center');
        break;
      case 'right':
        quill.format('align', 'right');
        break;
      case 'indent':
        quill.format('indent', '+1');
        break;
      case 'outdent':
        quill.format('indent', '-1');
        break;
      case 'audio':
        // Handle audio insertion (custom implementation)
        const audioUrl = prompt('Enter audio URL:');
        if (audioUrl) {
          const audioEmbed = `<audio controls src="${audioUrl}"></audio>`;
          quill.clipboard.dangerouslyPasteHTML(range.index, audioEmbed);
        }
        break;
    }
  };

  // Handle insert link
  const handleInsertLink = () => {
    if (!quillInstanceRef.current || !linkUrl.trim()) return;

    const quill = quillInstanceRef.current;
    const range = quill.getSelection();
    
    if (range) {
      if (range.length > 0) {
        quill.format('link', linkUrl);
      } else {
        quill.insertText(range.index, linkText || linkUrl, { link: linkUrl });
      }
    }

    setLinkUrl('');
    setLinkText('');
    setShowLinkDialog(false);
  };

  // Handle insert image
  const handleInsertImage = () => {
    if (!quillInstanceRef.current || !imageUrl.trim()) return;

    const quill = quillInstanceRef.current;
    const range = quill.getSelection();
    
    if (range) {
      quill.insertEmbed(range.index, 'image', imageUrl);
    }

    setImageUrl('');
    setShowImageDialog(false);
  };

  // Handle insert video
  const handleInsertVideo = () => {
    if (!quillInstanceRef.current || !videoUrl.trim()) return;

    const quill = quillInstanceRef.current;
    const range = quill.getSelection();
    
    if (range) {
      quill.insertEmbed(range.index, 'video', videoUrl);
    }

    setVideoUrl('');
    setShowVideoDialog(false);
  };

  // Handle clear all content
  const handleClearAll = () => {
    if (quillInstanceRef.current) {
      quillInstanceRef.current.setText('');
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
    }
  };

  // Custom CSS to match your desired UI
  const editorStyles = `
    .ql-container {
      font-family: inherit;
      font-size: 16px;
      min-height: 400px;
      border: none !important;
      border-radius: 0 !important;
    }
    
    .ql-toolbar {
      display: none !important; /* Hide default Quill toolbar */
    }
    
    .ql-editor {
      min-height: 400px;
      padding: 1.5rem;
      font-size: 16px;
      line-height: 1.8;
      color: #374151;
    }
    
    .ql-editor h1 {
      font-size: 2.5rem;
      font-weight: 700;
      margin: 1.5rem 0 1rem;
    }
    
    .ql-editor h2 {
      font-size: 2rem;
      font-weight: 600;
      margin: 1.25rem 0 0.75rem;
    }
    
    .ql-editor h3 {
      font-size: 1.5rem;
      font-weight: 600;
      margin: 1rem 0 0.5rem;
    }
    
    .ql-editor blockquote {
      border-left: 4px solid #d1d5db;
      padding-left: 1rem;
      margin: 1rem 0;
      font-style: italic;
      color: #6b7280;
    }
    
    .ql-editor.ql-blank::before {
      color: #9ca3af;
      font-style: normal;
      left: 1.5rem;
    }
    
    /* Image and video styling */
    .ql-editor img {
      max-width: 100%;
      height: auto;
      border-radius: 0.5rem;
    }
    
    .ql-editor video {
      max-width: 100%;
      height: auto;
      border-radius: 0.5rem;
    }
    
    .ql-editor audio {
      width: 100%;
      margin: 1rem 0;
    }
  `;

  return (
    <div className="space-y-4">
      <style>{editorStyles}</style>
      
      {/* Custom toolbar - matching your desired UI */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-secondary/50 rounded-lg border border-border">
        <TooltipProvider>
          {toolbarButtons.map((btn, index) => {
            if (btn.type === 'separator') {
              return (
                <Separator 
                  key={index} 
                  orientation="vertical" 
                  className="h-6 mx-1" 
                />
              );
            }

            if (btn.isDialog && btn.command === 'link') {
              return (
                <Dialog 
                  key={btn.command} 
                  open={showLinkDialog} 
                  onOpenChange={setShowLinkDialog}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={isLoading}
                          title={btn.label}
                        >
                          <btn.icon className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{btn.label}</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Insert Link</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="link-url">URL</Label>
                        <Input
                          id="link-url"
                          placeholder="https://example.com"
                          value={linkUrl}
                          onChange={(e) => setLinkUrl(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="link-text">Text (optional)</Label>
                        <Input
                          id="link-text"
                          placeholder="Link text"
                          value={linkText}
                          onChange={(e) => setLinkText(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowLinkDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleInsertLink}>
                        Insert Link
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              );
            }

            if (btn.isDialog && btn.command === 'image') {
              return (
                <Dialog 
                  key={btn.command} 
                  open={showImageDialog} 
                  onOpenChange={setShowImageDialog}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={isLoading}
                          title={btn.label}
                        >
                          <btn.icon className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{btn.label}</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Insert Image</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="image-url">Image URL</Label>
                        <Input
                          id="image-url"
                          placeholder="https://example.com/image.jpg"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Enter the URL of the image you want to insert
                      </p>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowImageDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleInsertImage}>
                        Insert Image
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              );
            }

            if (btn.isDialog && btn.command === 'video') {
              return (
                <Dialog 
                  key={btn.command} 
                  open={showVideoDialog} 
                  onOpenChange={setShowVideoDialog}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={isLoading}
                          title={btn.label}
                        >
                          <btn.icon className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{btn.label}</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Insert Video</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="video-url">Video URL</Label>
                        <Input
                          id="video-url"
                          placeholder="https://example.com/video.mp4"
                          value={videoUrl}
                          onChange={(e) => setVideoUrl(e.target.value)}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Enter the URL of the video you want to insert
                      </p>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowVideoDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleInsertVideo}>
                        Insert Video
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              );
            }

            return (
              <Tooltip key={btn.command}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleToolbarClick(btn.command)}
                    disabled={isLoading}
                    title={btn.label}
                  >
                    <btn.icon className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{btn.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>

      {/* Quill editor */}
      <div className="border border-input rounded-md overflow-hidden">
        <div ref={editorRef} className="min-h-[400px] text-lg leading-relaxed" />
      </div>

      {/* Bottom action buttons - matching your desired UI */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClearFormatting}
            className="h-8 px-3 text-xs"
            disabled={isLoading}
          >
            <Eraser className="h-3 w-3 mr-1" />
            Clear Format
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleClearAll}
            className="h-8 px-3 text-xs"
            disabled={isLoading}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Clear All
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {onSaveDraft && (
            <Button 
              size="sm"
              variant="outline" 
              onClick={onSaveDraft}
              disabled={isLoading}
              className="h-8 px-3"
            >
              <Save className="w-3 h-3 mr-1" />
              Save Draft
            </Button>
          )}
          {onPreview && (
            <Button 
              size="sm"
              variant="outline"
              onClick={onPreview}
              disabled={isLoading}
              className="h-8 px-3"
            >
              <Eye className="w-3 h-3 mr-1" />
              Preview
            </Button>
          )}
          {onPublish && (
            <Button
              size="sm"
              variant="default"
              onClick={onPublish}
              disabled={isLoading}
              className="h-8 px-3 bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Send className="w-3 h-3 mr-1" />
              Publish
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RichTextEditor;