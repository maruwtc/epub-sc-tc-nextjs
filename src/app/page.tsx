'use client';

import { useState, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, Upload, X, FileText } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function EPUBConverter() {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
    addFiles(selectedFiles);
  };

  const addFiles = (selectedFiles: File[]) => {
    // Validate that each file has a .epub extension
    const validFiles = selectedFiles.filter(file => file.name.toLowerCase().endsWith('.epub'));

    if (validFiles.length === 0 && selectedFiles.length > 0) {
      setError('Please upload valid EPUB files only.');
      return;
    }

    setFiles(prev => [...prev, ...validFiles]);
    setError(null);
    setSuccess(false);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (files.length === 0) {
      setError('Please select at least one EPUB file to convert.');
      return;
    }

    try {
      setIsUploading(true);
      setProgress(10);
      setError(null);

      const formData = new FormData();
      files.forEach(file => {
        formData.append('file', file);
      });

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 5;
          return newProgress < 90 ? newProgress : prev;
        });
      }, 200);

      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(95);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Conversion failed');
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);

      // Create an anchor element and trigger download
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = 'converted-files.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);

      setProgress(100);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred during conversion');
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="container mx-auto max-w-xl py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            EPUB Converter
          </CardTitle>
          <CardDescription>
            Convert one or more EPUB files from Simplified Chinese to Traditional Chinese
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="file-upload">Upload EPUB File(s)</Label>
                <input
                  ref={fileInputRef}
                  id="file-upload"
                  type="file"
                  accept=".epub,application/epub+zip"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  multiple
                  className="hidden"
                />

                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                    ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
                    ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={triggerFileInput}
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Upload className="h-10 w-10 text-gray-400" />
                    <p className="text-sm font-medium">
                      Drop EPUB files here or <span className="text-blue-500">click to browse</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      Only .epub files are supported
                    </p>
                  </div>
                </div>

                {files.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium mb-2">Selected files:</h3>
                    <ul className="space-y-2">
                      {files.map((file, index) => (
                        <li key={`${file.name}-${index}`} className="flex items-center justify-between bg-gray-50 p-2 rounded-md text-sm">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2 text-gray-500" />
                            <span>{file.name} <span className="text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span></span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="text-gray-500 hover:text-red-500"
                            disabled={isUploading}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Converting...</span>
                    <span className="text-sm">{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="bg-green-50 text-green-800 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>
                    Your EPUB files have been successfully converted and downloaded.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </form>
        </CardContent>

        <CardFooter>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={files.length === 0 || isUploading}
            className="w-full"
          >
            {isUploading ? (
              <span className="flex items-center gap-2">
                Converting <span className="animate-spin">⟳</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Upload className="h-4 w-4" /> Convert EPUB{files.length > 1 ? 's' : ''}
              </span>
            )}
          </Button>
        </CardFooter>
      </Card>

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>This converter transforms Simplified Chinese EPUB books to Traditional Chinese.</p>
        <p className="mt-2">
          It handles text content, filenames, and updates language tags. You can upload multiple files at once.
        </p>
      </div>
    </div>
  );
}