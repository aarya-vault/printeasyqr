import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from './professional-loading';
import { 
  AlertCircle, 
  CheckCircle, 
  Upload, 
  X,
  Plus,
  Minus
} from 'lucide-react';

// Professional Form Field Components
interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  description?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  error,
  description,
  children
}) => {
  return (
    <div className="space-y-2">
      <Label className="text-black font-medium flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
      {error && (
        <div className="flex items-center gap-1 text-red-600 text-sm">
          <AlertCircle className="h-3 w-3" />
          {error}
        </div>
      )}
    </div>
  );
};

// Professional Input Field
interface ProfessionalInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  description?: string;
}

export const ProfessionalInput: React.FC<ProfessionalInputProps> = ({
  label,
  error,
  description,
  required,
  ...props
}) => {
  return (
    <FormField label={label} required={required} error={error} description={description}>
      <Input 
        className="input-professional"
        {...props}
      />
    </FormField>
  );
};

// Professional Textarea Field
interface ProfessionalTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  description?: string;
}

export const ProfessionalTextarea: React.FC<ProfessionalTextareaProps> = ({
  label,
  error,
  description,
  required,
  ...props
}) => {
  return (
    <FormField label={label} required={required} error={error} description={description}>
      <Textarea 
        className="input-professional resize-none"
        {...props}
      />
    </FormField>
  );
};

// Professional Select Field
interface ProfessionalSelectProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  error?: string;
  description?: string;
  required?: boolean;
}

export const ProfessionalSelect: React.FC<ProfessionalSelectProps> = ({
  label,
  value,
  onValueChange,
  options,
  placeholder,
  error,
  description,
  required
}) => {
  return (
    <FormField label={label} required={required} error={error} description={description}>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="select-professional">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  );
};

// Professional Checkbox List
interface CheckboxOption {
  value: string;
  label: string;
  description?: string;
}

interface ProfessionalCheckboxListProps {
  label: string;
  options: CheckboxOption[];
  value: string[];
  onChange: (value: string[]) => void;
  maxSelections?: number;
  error?: string;
  description?: string;
  required?: boolean;
}

export const ProfessionalCheckboxList: React.FC<ProfessionalCheckboxListProps> = ({
  label,
  options,
  value,
  onChange,
  maxSelections,
  error,
  description,
  required
}) => {
  const handleChange = (optionValue: string, checked: boolean) => {
    if (checked) {
      if (!maxSelections || value.length < maxSelections) {
        onChange([...value, optionValue]);
      }
    } else {
      onChange(value.filter(v => v !== optionValue));
    }
  };

  return (
    <FormField label={label} required={required} error={error} description={description}>
      <div className="space-y-3">
        {options.map((option) => (
          <div key={option.value} className="flex items-start space-x-3">
            <Checkbox
              id={option.value}
              checked={value.includes(option.value)}
              onCheckedChange={(checked) => handleChange(option.value, Boolean(checked))}
              disabled={maxSelections && !value.includes(option.value) && value.length >= maxSelections}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor={option.value}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {option.label}
              </Label>
              {option.description && (
                <p className="text-xs text-gray-500">
                  {option.description}
                </p>
              )}
            </div>
          </div>
        ))}
        {maxSelections && (
          <p className="text-xs text-gray-500">
            {value.length}/{maxSelections} selected
          </p>
        )}
      </div>
    </FormField>
  );
};

// Professional Multi-Input Field (for adding/removing items)
interface ProfessionalMultiInputProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  maxItems?: number;
  error?: string;
  description?: string;
  required?: boolean;
}

export const ProfessionalMultiInput: React.FC<ProfessionalMultiInputProps> = ({
  label,
  values,
  onChange,
  placeholder,
  maxItems,
  error,
  description,
  required
}) => {
  const addItem = () => {
    if (!maxItems || values.length < maxItems) {
      onChange([...values, '']);
    }
  };

  const removeItem = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, value: string) => {
    const newValues = [...values];
    newValues[index] = value;
    onChange(newValues);
  };

  return (
    <FormField label={label} required={required} error={error} description={description}>
      <div className="space-y-3">
        {values.map((value, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={value}
              onChange={(e) => updateItem(index, e.target.value)}
              placeholder={placeholder}
              className="input-professional flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removeItem(index)}
              className="px-3"
            >
              <Minus className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {(!maxItems || values.length < maxItems) && (
          <Button
            type="button"
            variant="outline"
            onClick={addItem}
            className="btn-outline w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add {label.toLowerCase()}
          </Button>
        )}
        {maxItems && (
          <p className="text-xs text-gray-500">
            {values.length}/{maxItems} items
          </p>
        )}
      </div>
    </FormField>
  );
};

// Professional File Upload
interface ProfessionalFileUploadProps {
  label: string;
  files: File[];
  onChange: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number; // in MB
  error?: string;
  description?: string;
  required?: boolean;
}

export const ProfessionalFileUpload: React.FC<ProfessionalFileUploadProps> = ({
  label,
  files,
  onChange,
  accept,
  multiple = true,
  maxFiles,
  maxSize = 50,
  error,
  description,
  required
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // Filter by size
    const validFiles = selectedFiles.filter(file => {
      if (file.size > maxSize * 1024 * 1024) {
        return false;
      }
      return true;
    });

    // Limit number of files
    const finalFiles = maxFiles 
      ? [...files, ...validFiles].slice(0, maxFiles)
      : [...files, ...validFiles];

    onChange(finalFiles);
  };

  const removeFile = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <FormField label={label} required={required} error={error} description={description}>
      <div className="space-y-4">
        {/* Upload Area */}
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-yellow-400 transition-colors">
          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-2">
            Drag and drop files here, or click to browse
          </p>
          <input
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleFileChange}
            className="hidden"
            id={`file-upload-${label}`}
          />
          <Label
            htmlFor={`file-upload-${label}`}
            className="btn-outline cursor-pointer"
          >
            Choose Files
          </Label>
          <p className="text-xs text-gray-500 mt-2">
            Max {maxSize}MB per file {maxFiles && `• Max ${maxFiles} files`}
          </p>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-black truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </FormField>
  );
};

// Professional Form Container
interface ProfessionalFormProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel?: string;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export const ProfessionalForm: React.FC<ProfessionalFormProps> = ({
  title,
  description,
  children,
  onSubmit,
  submitLabel = 'Submit',
  isLoading = false,
  disabled = false,
  className = ''
}) => {
  return (
    <Card className={`card-professional ${className}`}>
      <CardHeader>
        <CardTitle className="text-xl font-bold text-black">{title}</CardTitle>
        {description && (
          <CardDescription className="text-gray-600">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          {children}
          <div className="flex gap-3 pt-6 border-t border-gray-100">
            <Button
              type="submit"
              className="btn-primary flex-1"
              disabled={isLoading || disabled}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  Processing...
                </div>
              ) : (
                submitLabel
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};