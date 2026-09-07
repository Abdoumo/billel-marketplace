import { useState, useRef } from "react";
import { Upload, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: Date;
}

interface DocumentUploadProps {
  label: string;
  description?: string;
  onUpload: (file: File) => void;
  acceptedTypes?: string[];
  maxSize?: number; // in MB
  uploadedDocument?: UploadedDocument;
  isLoading?: boolean;
  error?: string;
  required?: boolean;
}

export const DocumentUpload = ({
  label,
  description,
  onUpload,
  acceptedTypes = ["image/jpeg", "image/png", "application/pdf"],
  maxSize = 5,
  uploadedDocument,
  isLoading = false,
  error,
  required = true,
}: DocumentUploadProps) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (!acceptedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type. Accepted types: ${acceptedTypes.join(", ")}`,
      };
    }

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      return {
        valid: false,
        error: `File size exceeds ${maxSize}MB limit`,
      };
    }

    return { valid: true };
  };

  const handleFile = (file: File) => {
    const validation = validateFile(file);
    if (validation.valid) {
      onUpload(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  return (
    <div className="space-y-3">
      {/* Label */}
      <label className="block text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Description */}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      {/* Upload Area */}
      {!uploadedDocument ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all ${
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          } ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleChange}
            accept={acceptedTypes.join(",")}
            className="hidden"
            disabled={isLoading}
          />

          <div className="space-y-3">
            <div className="flex justify-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="h-6 w-6 text-primary" />
              </div>
            </div>

            <div>
              <p className="font-medium text-sm">
                {isLoading ? "Uploading..." : "Drag and drop your file here"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                or{" "}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-primary hover:underline font-medium"
                  disabled={isLoading}
                >
                  browse
                </button>
              </p>
            </div>

            <p className="text-xs text-muted-foreground">
              Max file size: {maxSize}MB
            </p>
          </div>
        </div>
      ) : (
        <div className="border border-border rounded-lg p-4 bg-card space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm break-words truncate">
                {uploadedDocument.name}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatFileSize(uploadedDocument.size)} • Uploaded{" "}
                {uploadedDocument.uploadedAt.toLocaleDateString()}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                // In a real app, this would delete the file
                // For now, we'll just show the option
              }}
              className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 dark:text-red-200">{error}</p>
        </div>
      )}
    </div>
  );
};
