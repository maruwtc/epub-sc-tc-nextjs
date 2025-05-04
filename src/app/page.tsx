'use client';

import { useState, useRef, useEffect } from 'react';
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
import {
  AlertCircle,
  CheckCircle,
  Upload,
  X,
  FileText,
  Trash2,
  BookOpen,
  ChevronDown,
  Languages,
  Download,
  Info
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

export default function EPUBConverter() {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [conversionMode, setConversionMode] = useState('sc-to-tc');
  const [showFAQ, setShowFAQ] = useState(false);
  const [totalSize, setTotalSize] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate total file size when files change
  useEffect(() => {
    const size = files.reduce((acc, file) => acc + file.size, 0);
    setTotalSize(size);
  }, [files]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) as File[] : [];
    addFiles(selectedFiles);
  };

  interface IAddFiles {
    (selectedFiles: File[]): void;
  }

  const addFiles: IAddFiles = (selectedFiles: File[]): void => {
    // Validate that each file has a .epub extension
    const validFiles: File[] = selectedFiles.filter((file: File) =>
      file.name.toLowerCase().endsWith('.epub')
    );
    const invalidFiles: File[] = selectedFiles.filter((file: File) =>
      !file.name.toLowerCase().endsWith('.epub')
    );

    if (invalidFiles.length > 0) {
      setError(
        `${invalidFiles.length} file(s) were rejected. Please upload valid EPUB files only.`
      );
      setTimeout(() => setError(null), 5000);
    }

    if (validFiles.length > 0) {
      setFiles((prev: File[]) => [...prev, ...validFiles]);
      setSuccess(false);
    }
  };

  interface IRemoveFile {
    (index: number): void;
  }

  const removeFile: IRemoveFile = (index: number): void => {
    setFiles((prev: File[]): File[] =>
      prev.filter((_: File, i: number): boolean => i !== index)
    );
  };

  const clearAllFiles = () => {
    setFiles([]);
  };

  interface IHandleDragEnter {
    (e: React.DragEvent<HTMLDivElement>): void;
  }

  const handleDragEnter: IHandleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave: IHandleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver: IHandleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop: IHandleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleSubmit = async () => {
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

      // Add conversion mode to the request
      formData.append('conversionMode', conversionMode);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + Math.random() * 3;
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
        let message: string;
        // try JSON first
        try {
          const err = await response.json();
          message = err.error || JSON.stringify(err);
        } catch {
          // fallback to plain text (HTML error page or whatever)
          message = await response.text();
        }
        throw new Error(message || 'Conversion failed');
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);

      // Create an anchor element and trigger download
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = files.length > 1 ? 'converted-files.zip' : files[0].name.replace('.epub', '-converted.epub');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);

      setProgress(100);
      setSuccess(true);
      setTimeout(() => setProgress(0), 2000);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred during conversion');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  interface IFormatFileSize {
    (bytes: number): string;
  }

  const formatFileSize: IFormatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getConversionModeLabel = () => {
    switch (conversionMode) {
      case 'sc-to-tc': return 'Simplified to Traditional Chinese';
      case 'tc-to-sc': return 'Traditional to Simplified Chinese';
      default: return 'Simplified to Traditional Chinese';
    }
  };

  return (
    <div className="container mx-auto max-w-3xl py-8">
      <div className="transition-all duration-300">
        <Card className="border border-gray-200 dark:border-gray-700 shadow-lg">
          <CardHeader className="text-white rounded-t-lg">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8" />
              <div>
                <CardTitle className="text-2xl font-bold">
                  EPUB Chinese Converter
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Convert EPUB files between Simplified and Traditional Chinese with ease
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid grid-cols-2 mx-6 mt-4">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload Files
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Languages className="h-4 w-4" />
                Conversion Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload">
              <CardContent className="pt-6">
                <div className="grid gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="file-upload" className="flex items-center gap-2">
                      <Upload className="h-4 w-4" /> Upload EPUB File(s)
                    </Label>
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
                      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300
                        ${isDragging
                          ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'}
                        ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onClick={triggerFileInput}
                    >
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="p-4 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                          <Upload className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <p className="font-medium dark:text-gray-200">
                          Drop EPUB files here or <span className="text-blue-600 dark:text-blue-400 underline">click to browse</span>
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Only .epub files are supported
                        </p>
                        {conversionMode && (
                          <Badge variant="outline" className="mt-2 bg-blue-50 dark:bg-blue-900/30">
                            {getConversionModeLabel()}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {files.length > 0 && (
                      <div className="mt-6">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-medium dark:text-gray-200">
                            Selected files ({files.length})
                            {totalSize > 0 && (
                              <span className="text-gray-500 dark:text-gray-400 ml-2">
                                Total: {formatFileSize(totalSize)}
                              </span>
                            )}
                          </h3>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearAllFiles}
                            disabled={isUploading || files.length === 0}
                            className="text-xs flex items-center gap-1"
                          >
                            <Trash2 className="h-3 w-3" /> Clear All
                          </Button>
                        </div>
                        <div className="max-h-64 overflow-y-auto pr-2 space-y-2 border rounded-md p-2 dark:border-gray-700">
                          {files.map((file, index) => (
                            <div
                              key={`${file.name}-${index}`}
                              className="flex items-center justify-between p-2 rounded-md text-sm bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                              <div className="flex items-center truncate mr-2">
                                <FileText className="h-4 w-4 mr-2 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                                <span className="truncate dark:text-gray-200">{file.name}</span>
                                <span className="text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">({formatFileSize(file.size)})</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors flex-shrink-0"
                                disabled={isUploading}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {isUploading && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium dark:text-gray-200">Converting...</span>
                        <span className="text-sm dark:text-gray-200">{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <p className="text-xs text-center text-gray-500 dark:text-gray-400 animate-pulse">
                        Converting {files.length} file{files.length > 1 ? 's' : ''}. Please wait...
                      </p>
                    </div>
                  )}

                  {error && (
                    <div>
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    </div>
                  )}

                  {success && (
                    <div>
                      <Alert className="bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <AlertTitle>Success</AlertTitle>
                        <AlertDescription>
                          Your EPUB files have been successfully converted and downloaded.
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                </div>
              </CardContent>
            </TabsContent>

            <TabsContent value="settings">
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium dark:text-gray-200">Conversion Mode</Label>
                  <div className="grid grid-cols-1 gap-2">
                    <div
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${conversionMode === 'sc-to-tc'
                        ? 'border-blue-500 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/10'
                        }`}
                      onClick={() => setConversionMode('sc-to-tc')}
                    >
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full mr-2 ${conversionMode === 'sc-to-tc'
                          ? 'bg-blue-500 dark:bg-blue-600'
                          : 'border border-gray-300 dark:border-gray-600'
                          }`} />
                        <div>
                          <p className="font-medium dark:text-gray-200">Simplified to Traditional Chinese</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Convert Simplified Chinese text to Traditional Chinese</p>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${conversionMode === 'tc-to-sc'
                        ? 'border-blue-500 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/10'
                        }`}
                      onClick={() => setConversionMode('tc-to-sc')}
                    >
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full mr-2 ${conversionMode === 'tc-to-sc'
                          ? 'bg-blue-500 dark:bg-blue-600'
                          : 'border border-gray-300 dark:border-gray-600'
                          }`} />
                        <div>
                          <p className="font-medium dark:text-gray-200">Traditional to Simplified Chinese</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Convert Traditional Chinese text to Simplified Chinese</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <Label className="text-sm font-medium dark:text-gray-200">Advanced Options</Label>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center space-x-2 border rounded-lg p-4 dark:border-gray-700">
                      <input type="checkbox" id="metadata" className="rounded text-blue-500" />
                      <div>
                        <Label htmlFor="metadata" className="font-medium cursor-pointer dark:text-gray-200">Update Metadata</Label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Update language tags and other metadata in the EPUB file</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 border rounded-lg p-4 dark:border-gray-700">
                      <input type="checkbox" id="filenames" className="rounded text-blue-500" defaultChecked />
                      <div>
                        <Label htmlFor="filenames" className="font-medium cursor-pointer dark:text-gray-200">Convert Filenames</Label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Also convert Chinese characters in filenames within the EPUB</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </TabsContent>
          </Tabs>

          <CardFooter className="flex flex-col space-y-4 pt-4 pb-6">
            <Button
              variant="outline"
              onClick={handleSubmit}
              disabled={files.length === 0 || isUploading}
              className="w-full py-2"
            >
              {isUploading ? (
                <span className="flex items-center gap-2">
                  Converting <span className="animate-spin">⟳</span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Convert {files.length > 0 ? `${files.length} EPUB${files.length > 1 ? 's' : ''}` : 'EPUB Files'}
                </span>
              )}
            </Button>

            <div>
              <button
                type="button"
                onClick={() => setShowFAQ(!showFAQ)}
                className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <Info className="h-4 w-4" />
                {showFAQ ? 'Hide Info' : 'Show More Info'}
                <ChevronDown className={`h-4 w-4 transition-transform ${showFAQ ? 'rotate-180' : ''}`} />
              </button>

              {showFAQ && (
                <div className="mt-4 text-sm text-gray-600 dark:text-gray-300 space-y-2 bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                  <p className="font-medium">What does this converter do?</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Converts text content between Simplified and Traditional Chinese</li>
                    <li>Updates metadata and language tags in the EPUB files</li>
                    <li>Preserves all formatting and structure</li>
                    <li>Handles file and folder names within the EPUB</li>
                    <li>Converts multiple files in a single batch</li>
                  </ul>
                  <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                    For more information or support, please contact us at support@example.com
                  </p>
                </div>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}