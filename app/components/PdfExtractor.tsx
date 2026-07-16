"use client";

import { useState, useRef } from 'react';
import { 
  Upload, FileText, X, CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ExtractedFile {
  id: string;
  name: string;
  size: number;
  status: 'processing' | 'preview' | 'error';
  error?: string;
  previewData?: {
    fileName: string;
    pageCount: number;
    text: string;
    preview: string;
    charCount: number;
    wordCount: number;
  };
}

interface PDFExtractorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PDFExtractor({ open, onOpenChange }: PDFExtractorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pathInputRef = useRef<HTMLInputElement>(null);
  
  const [files, setFiles] = useState<ExtractedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [showFullText, setShowFullText] = useState(false);
  const [serverPath, setServerPath] = useState('');

  const selectedFile = files.find(f => f.id === selectedFileId);
  const previewData = selectedFile?.previewData;
  const isPreviewReady = selectedFile?.status === 'preview' && previewData;

  const extractPDF = async (file: File | string, isServerFile: boolean = false) => {
    const formData = new FormData();
    
    if (isServerFile) {
      formData.append('filePath', file as string);
    } else {
      formData.append('file', file as File);
    }

    const response = await fetch('/api/journal/parse-bank-statement', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to extract PDF');
    }

    return result.data;
  };

  const handleFileSelect = async (fileList: FileList | null) => {
    if (!fileList) return;

    for (const file of fileList) {
      const fileId = crypto.randomUUID();
      
      const newFile: ExtractedFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        status: 'processing',
      };

      setFiles(prev => [...prev, newFile]);

      try {
        const previewData = await extractPDF(file);
        setFiles(prev =>
          prev.map(f =>
            f.id === fileId
              ? { ...f, status: 'preview', previewData }
              : f
          )
        );
        if (!selectedFileId) setSelectedFileId(fileId);
        toast.success(`Extracted ${previewData.wordCount} words from PDF`);
      } catch (error: any) {
        setFiles(prev =>
          prev.map(f =>
            f.id === fileId
              ? { ...f, status: 'error', error: error.message }
              : f
          )
        );
        toast.error(`Failed to extract "${file.name}"`);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleServerFile = async () => {
    const path = pathInputRef.current?.value;
    if (!path) {
      toast.error('Please enter a file path');
      return;
    }

    const fileId = crypto.randomUUID();
    const fileName = path.split('/').pop() || path.split('\\').pop() || path;
    
    const newFile: ExtractedFile = {
      id: fileId,
      name: fileName,
      size: 0,
      status: 'processing',
    };

    setFiles(prev => [...prev, newFile]);

    try {
      const previewData = await extractPDF(path, true);
      setFiles(prev =>
        prev.map(f =>
          f.id === fileId
            ? { ...f, status: 'preview', previewData, size: previewData.fileSize || 0 }
            : f
        )
      );
      if (!selectedFileId) setSelectedFileId(fileId);
      toast.success(`Extracted ${previewData.wordCount} words from ${fileName}`);
    } catch (error: any) {
      setFiles(prev =>
        prev.map(f =>
          f.id === fileId
            ? { ...f, status: 'error', error: error.message }
            : f
        )
      );
      toast.error(`Failed to extract "${fileName}"`);
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    if (selectedFileId === id) {
      setSelectedFileId(files.find(f => f.id !== id)?.id || null);
    }
  };

  const clearAll = () => {
    setFiles([]);
    setSelectedFileId(null);
    setShowFullText(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (pathInputRef.current) {
      pathInputRef.current.value = '';
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-(--bg-primary) border-(--border-color)">
        <DialogHeader>
          <DialogTitle className="text-xl text-(--text-primary) font-display">
            PDF Text Extractor
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload from computer */}
          <div
            className={cn(
              'border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer',
              dragActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-(--border-color) hover:border-blue-500/50'
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              multiple
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
            <Upload className="h-12 w-12 mx-auto text-(--text-secondary)/40 mb-4" />
            <p className="text-(--text-primary) font-medium">
              Drop your PDF here or click to browse
            </p>
            <p className="text-sm text-(--text-secondary) mt-1">
              Upload PDFs from your computer
            </p>
          </div>

          {/* Read from server with fs */}
          <div className="border border-(--border-color) rounded-xl p-4">
            <p className="text-sm font-medium text-(--text-secondary) mb-3">
              📂 Read from server (fs)
            </p>
            <div className="flex gap-2">
              <input
                ref={pathInputRef}
                type="text"
                placeholder="Enter file path e.g. ./uploads/document.pdf"
                className="flex-1 border border-(--border-color) rounded-lg px-3 py-2 text-sm bg-(--bg-primary) text-(--text-primary)"
                onChange={(e) => setServerPath(e.target.value)}
              />
              <Button
                onClick={handleServerFile}
                className="bg-blue-500 text-white hover:bg-blue-600"
              >
                Extract
              </Button>
            </div>
            <p className="text-xs text-(--text-secondary) mt-2">
              Reads PDF directly from your server's file system
            </p>
          </div>

          {/* File list and preview */}
          {files.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-(--text-secondary)">
                  {files.length} file{files.length > 1 ? 's' : ''} extracted
                </p>
                <Button
                  onClick={clearAll}
                  variant="outline"
                  className="border-(--border-color) text-(--text-secondary)"
                >
                  Clear All
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all cursor-pointer',
                      selectedFileId === file.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-(--border-color) hover:bg-(--bg-secondary)',
                      file.status === 'error' && 'border-destructive/50 bg-destructive/5'
                    )}
                    onClick={() => {
                      setSelectedFileId(file.id);
                      setShowFullText(false);
                    }}
                  >
                    <FileText className={cn(
                      'h-4 w-4 flex-shrink-0',
                      file.status === 'error' ? 'text-destructive' :
                      'text-(--text-secondary)'
                    )} />
                    <span className="text-sm truncate max-w-[120px]">{file.name}</span>
                    {file.status === 'preview' && <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />}
                    {file.status === 'error' && <AlertCircle className="h-3 w-3 text-destructive flex-shrink-0" />}
                    {file.status === 'processing' && <Loader2 className="h-3 w-3 animate-spin text-blue-500 flex-shrink-0" />}
                    <button
                      type="button"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        removeFile(file.id); 
                      }}
                      className="ml-1 p-0.5 hover:bg-(--bg-primary) rounded flex-shrink-0"
                    >
                      <X className="h-3 w-3 text-(--text-secondary)" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Preview */}
              {isPreviewReady && (
                <div className="border border-(--border-color) rounded-xl overflow-hidden">
                  <div className="grid grid-cols-3 gap-4 p-4 bg-(--bg-secondary) border-b border-(--border-color)">
                    <div>
                      <p className="text-xs text-(--text-secondary) uppercase tracking-wider">Pages</p>
                      <p className="font-semibold text-(--text-primary)">{previewData.pageCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-(--text-secondary) uppercase tracking-wider">Words</p>
                      <p className="font-semibold text-(--text-primary)">{previewData.wordCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-(--text-secondary) uppercase tracking-wider">Characters</p>
                      <p className="font-semibold text-(--text-primary)">{previewData.charCount}</p>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-(--text-secondary)">
                        {showFullText ? 'Full Text' : 'Preview'}
                      </p>
                      {previewData.text.length > 2000 && (
                        <button
                          onClick={() => setShowFullText(!showFullText)}
                          className="text-sm text-blue-500 hover:underline"
                        >
                          {showFullText ? 'Show less' : 'Show full text'}
                        </button>
                      )}
                    </div>
                    <div className="bg-(--bg-secondary) rounded-lg p-4 max-h-64 overflow-y-auto">
                      <pre className="text-sm text-(--text-primary) whitespace-pre-wrap font-sans">
                        {showFullText ? previewData.text : previewData.preview}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-(--text-secondary) text-center">
            PDFs are processed securely. No data is stored permanently.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}