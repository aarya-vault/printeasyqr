import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, FileText, Image, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileWithProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  id: string;
}

interface EnhancedFileUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  isUploading?: boolean;
  disabled?: boolean;
  maxFiles?: number;
  acceptedFileTypes?: string[];
}

export function EnhancedFileUpload({
  files,
  onFilesChange,
  isUploading = false,
  disabled = false,
  maxFiles = 10,
  acceptedFileTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.txt']
}: EnhancedFileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Map<string, FileWithProgress>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="w-4 h-4 text-[#FFBF00]" />;
    }
    return <FileText className="w-4 h-4 text-[#FFBF00]" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles = Array.from(selectedFiles);
    const validFiles: File[] = [];

    // Validate each file
    newFiles.forEach(file => {
      // Check file type
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!acceptedFileTypes.includes(fileExtension)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not supported. Please upload: ${acceptedFileTypes.join(', ')}`,
          variant: "destructive",
        });
        return;
      }

      // Check file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than 50MB. Please choose a smaller file.`,
          variant: "destructive",
        });
        return;
      }

      validFiles.push(file);
    });

    // Check total file count
    if (files.length + validFiles.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `You can only upload up to ${maxFiles} files total.`,
        variant: "destructive",
      });
      return;
    }

    // Add valid files
    onFilesChange([...files, ...validFiles]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    
    if (disabled) return;
    
    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  };

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-300
          ${dragOver 
            ? 'border-[#FFBF00] bg-[#FFBF00]/10' 
            : 'border-[#FFBF00]/30 hover:border-[#FFBF00]/50 hover:bg-[#FFBF00]/5'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${isUploading ? 'pointer-events-none' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedFileTypes.join(',')}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />
        
        <div className="flex flex-col items-center gap-3">
          {isUploading ? (
            <>
              <Loader2 className="w-8 h-8 text-[#FFBF00] animate-spin" />
              <div className="text-center">
                <p className="text-black font-medium">Uploading files...</p>
                <p className="text-gray-600 text-sm">Please wait while your files are being uploaded</p>
              </div>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-[#FFBF00]" />
              <div className="text-center">
                <p className="text-black font-medium">Drop files here or click to upload</p>
                <p className="text-gray-600 text-sm">
                  Support: {acceptedFileTypes.join(', ')} • Max {maxFiles} files • Up to 50MB each
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-black">Selected Files ({files.length})</p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-3 p-3 bg-[#FFBF00]/10 rounded-lg border border-[#FFBF00]/20"
              >
                {getFileIcon(file)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-black truncate">{file.name}</p>
                  <p className="text-xs text-gray-600">{formatFileSize(file.size)}</p>
                </div>
                {!disabled && !isUploading && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="text-gray-500 hover:text-black hover:bg-[#FFBF00]/20 p-1"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
                {isUploading && (
                  <Loader2 className="w-4 h-4 text-[#FFBF00] animate-spin" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress Message */}
      {isUploading && files.length > 0 && (
        <div className="bg-[#FFBF00]/10 border border-[#FFBF00]/30 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-[#FFBF00] animate-spin" />
            <div>
              <p className="text-black font-medium">Creating your order...</p>
              <p className="text-gray-600 text-sm">
                Uploading {files.length} file{files.length > 1 ? 's' : ''} and processing your order. This may take a few moments.
              </p>
            </div>
          </div>
          
          {/* Animated Progress Bar */}
          <div className="mt-3">
            <div className="bg-[#FFBF00]/20 rounded-full h-2 overflow-hidden">
              <div className="bg-[#FFBF00] h-full rounded-full animate-pulse transition-all duration-300"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}