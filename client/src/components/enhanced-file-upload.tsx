import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, FileText, Image, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileWithProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  id: string;
}

interface UploadProgressInfo {
  totalFiles: number;
  completedFiles: number;
  currentFileIndex: number;
  currentFileName: string;
  overallProgress: number;
  bytesUploaded: number;
  totalBytes: number;
  uploadSpeed: number;
  estimatedTimeRemaining: number;
}

interface EnhancedFileUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  isUploading?: boolean;
  disabled?: boolean;
  maxFiles?: number;
  maxFileSize?: number; // Max file size in bytes
  maxTotalSize?: number; // Max total size for all files in bytes
  acceptedFileTypes?: string[];
  uploadProgress?: UploadProgressInfo;
  onUploadProgress?: (progress: UploadProgressInfo) => void;
}

export function EnhancedFileUpload({
  files,
  onFilesChange,
  isUploading = false,
  disabled = false,
  maxFiles = Infinity, // Unlimited files
  maxFileSize = 300 * 1024 * 1024, // 300MB per file
  maxTotalSize = 1024 * 1024 * 1024, // 1GB total per order
  acceptedFileTypes = ['*'], // Accept ALL file types including .zip, .csv, .xlsx, etc.
  uploadProgress,
  onUploadProgress
}: EnhancedFileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
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

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatSpeed = (bytesPerSecond: number) => {
    return `${formatFileSize(bytesPerSecond)}/s`;
  };

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles = Array.from(selectedFiles);
    const validFiles: File[] = [];
    const rejectedFiles: Array<{file: File, reason: string}> = [];

    // 🚨 CRITICAL LOGGING: Track file selection attempt
    console.log(`🔍 [FILE-SELECT] Attempting to select ${newFiles.length} files:`, newFiles.map(f => f.name));

    // Calculate current total size
    const currentTotalSize = files.reduce((sum, file) => sum + file.size, 0);

    // Validate each file
    newFiles.forEach(file => {
      // Check file size - individual file limit (300MB)
      if (file.size > maxFileSize) {
        const reason = `File too large: ${formatFileSize(file.size)} > ${formatFileSize(maxFileSize)}`;
        console.error(`❌ [FILE-REJECT] ${file.name}: ${reason}`);
        rejectedFiles.push({file, reason});
        toast({
          title: "File too large",
          description: `${file.name} is ${formatFileSize(file.size)}. Maximum file size is ${formatFileSize(maxFileSize)}.`,
          variant: "destructive",
        });
        return;
      }

      // Check file type - handle wildcard case
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      // If acceptedFileTypes contains '*', accept all files
      if (!acceptedFileTypes.includes('*') && !acceptedFileTypes.includes(fileExtension)) {
        const reason = `Invalid file type: ${fileExtension} not in [${acceptedFileTypes.join(', ')}]`;
        console.error(`❌ [FILE-REJECT] ${file.name}: ${reason}`);
        rejectedFiles.push({file, reason});
        toast({
          title: "Invalid file type",
          description: `${file.name} is not supported. Please upload: ${acceptedFileTypes.join(', ')}`,
          variant: "destructive",
        });
        return;
      }
      
      console.log(`✅ [FILE-ACCEPT] ${file.name}: ${formatFileSize(file.size)}`);
      validFiles.push(file);
    });

    // 🚨 CRITICAL VALIDATION: Prevent silent file drops
    if (rejectedFiles.length > 0) {
      console.error(`❌ [CRITICAL-DROP] ${rejectedFiles.length}/${newFiles.length} files rejected:`);
      rejectedFiles.forEach(({file, reason}) => {
        console.error(`   - ${file.name}: ${reason}`);
      });
      
      // 🛡️ FAIL-SAFE: If ANY file is rejected, show comprehensive error and STOP
      toast({
        title: `${rejectedFiles.length} file${rejectedFiles.length > 1 ? 's' : ''} rejected`,
        description: `Please fix the issues and try again. Only valid files will be uploaded to prevent data loss.`,
        variant: "destructive",
      });
      
      // 🚨 PRODUCTION FIX: Still add valid files but warn about rejected ones
      console.warn(`⚠️ [PARTIAL-ADD] Adding ${validFiles.length} valid files, ${rejectedFiles.length} rejected`);
    }

    // Check total size limit (1GB for all files combined)
    const newTotalSize = currentTotalSize + validFiles.reduce((sum, file) => sum + file.size, 0);
    if (newTotalSize > maxTotalSize) {
      const remainingSpace = maxTotalSize - currentTotalSize;
      console.error(`❌ [SIZE-LIMIT] Total size ${formatFileSize(newTotalSize)} > limit ${formatFileSize(maxTotalSize)}`);
      toast({
        title: "Total file size limit exceeded",
        description: `Adding these files would exceed the ${formatFileSize(maxTotalSize)} total limit. You have ${formatFileSize(remainingSpace)} remaining.`,
        variant: "destructive",
      });
      return;
    }

    // Add valid files
    console.log(`✅ [FILE-SUCCESS] Adding ${validFiles.length} files (${rejectedFiles.length} rejected)`);
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
          accept={acceptedFileTypes[0] === '*' ? undefined : acceptedFileTypes.join(',')}
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
                  {acceptedFileTypes[0] === '*' ? 'All file types supported • Unlimited file size' : `Support: ${acceptedFileTypes.join(', ')} • Unlimited file size`}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* File List - Only show when NOT uploading */}
      {files.length > 0 && !isUploading && (
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
                {!disabled && (
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
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unified Upload Progress Display */}
      {isUploading && files.length > 0 && (
        <div className="bg-[#FFBF00]/10 border border-[#FFBF00]/30 rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-[#FFBF00] animate-spin" />
            <div className="flex-1">
              {uploadProgress ? (
                <>
                  <p className="text-black font-semibold">Uploading {uploadProgress.totalFiles} file{uploadProgress.totalFiles > 1 ? 's' : ''}...</p>
                  <p className="text-gray-600 text-sm">
                    Processing: {uploadProgress.currentFileName}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-black font-semibold">Creating your order...</p>
                  <p className="text-gray-600 text-sm">
                    Processing {files.length} file{files.length > 1 ? 's' : ''} and creating your order.
                  </p>
                </>
              )}
            </div>
            {uploadProgress && (
              <div className="text-right text-sm">
                <div className="text-black font-semibold">Speed: {formatSpeed(uploadProgress.uploadSpeed)}</div>
                <div className="text-gray-500">ETA: {uploadProgress.estimatedTimeRemaining > 0 ? formatTime(uploadProgress.estimatedTimeRemaining) : 'Completing...'}</div>
              </div>
            )}
          </div>
          
          {/* Progress Bar - Only show when actually uploading */}
          {uploadProgress && (
            <div className="space-y-2">
              <div className="bg-[#FFBF00]/20 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-[#FFBF00] h-full rounded-full transition-all duration-300 ease-out"
                  style={{ 
                    width: `${uploadProgress.overallProgress}%` 
                  }}
                />
              </div>
              
              <div className="flex justify-between text-xs text-gray-600">
                <span>{Math.round(uploadProgress.overallProgress)}% complete</span>
                <span>{uploadProgress.estimatedTimeRemaining > 0 ? `${formatTime(uploadProgress.estimatedTimeRemaining)} remaining` : 'Almost done...'}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}