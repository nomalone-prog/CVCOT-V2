
import React, { useState, useCallback, useRef } from 'react';

interface UploadFormProps {
  onFileUpload: (fileContent: string) => void;
}

export const UploadForm: React.FC<UploadFormProps> = ({ onFileUpload }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (file && file.type === 'text/html') {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onFileUpload(event.target.result as string);
        }
      };
      reader.onerror = () => {
        console.error("Error reading file.");
        alert("Failed to read file. Please try again.");
      };
      reader.readAsText(file);
    } else {
      alert("Please upload a valid HTML file (.html).");
      setFileName(null);
    }
  }, [onFileUpload]);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  }, [handleFile]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  }, [handleFile]);

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`
        p-8 md:p-12 border-4 border-dashed rounded-xl w-full max-w-lg
        flex flex-col items-center justify-center text-center transition-all duration-300
        ${isDragActive ? 'border-accent bg-secondary-bg shadow-lg' : 'border-gray-700 bg-secondary-bg/50'}
      `}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept=".html"
        className="hidden"
      />
      <div className="text-gray-400 text-6xl mb-4">
        📄
      </div>
      <p className="text-xl font-semibold mb-2 text-text-light">
        Drag & Drop your eBay HTML listing here
      </p>
      <p className="text-text-dark mb-4">
        Or if you prefer...
      </p>
      <button
        onClick={openFilePicker}
        className="px-6 py-3 bg-accent text-white font-semibold rounded-full hover:bg-accent-dark transition-colors shadow-lg"
      >
        Browse Files
      </button>
      {fileName && <p className="mt-4 text-text-dark text-sm">Selected: <span className="text-accent">{fileName}</span></p>}
      <p className="mt-6 text-sm text-text-dark max-w-xs">
        *How to save your eBay listing: Go to your live eBay listing page, then press Ctrl+S (Windows) or Cmd+S (Mac) and save as 'Webpage, HTML'.
      </p>
    </div>
  );
};
