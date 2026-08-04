import React, { useState, useRef } from 'react';
import { UploadCloud, File, AlertCircle, CheckCircle2 } from 'lucide-react';

const FileUpload = ({ label, onUpload, fileType = 'report_pdf', accept = '.pdf' }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (selectedFile) => {
    setSuccess(false);
    setError(null);
    
    // Check file extension
    const extension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.'));
    const allowed = accept.split(',').map(a => a.trim().toLowerCase());
    
    if (!allowed.includes(extension.toLowerCase())) {
      setError(`Invalid file format. Allowed extensions: ${accept}`);
      return;
    }

    setFile(selectedFile);
  };

  const handleUploadSubmit = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      await onUpload(file);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload file.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{label}</label>
      
      <div 
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current.click()}
        className={`w-full min-h-[140px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 cursor-pointer transition-all ${
          dragActive 
            ? 'border-sky-500 bg-sky-50/10' 
            : 'border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 bg-slate-50/30 dark:bg-slate-900/30'
        }`}
      >
        <input 
          ref={inputRef}
          type="file" 
          accept={accept}
          onChange={handleChange}
          className="hidden" 
        />
        
        <UploadCloud className="text-slate-400 dark:text-slate-600 mb-3" size={32} />
        
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 text-center">
          Drag & drop your file here, or <span className="text-sky-500">browse</span>
        </p>
        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">{accept} only</p>
      </div>

      {file && (
        <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-850 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <File size={20} className="text-sky-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-750 dark:text-slate-200 truncate">{file.name}</p>
              <p className="text-[10px] text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          <button
            onClick={handleUploadSubmit}
            disabled={uploading}
            className="py-1.5 px-4 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-bold transition-all disabled:bg-slate-300 dark:disabled:bg-slate-800 shrink-0"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      )}

      {error && (
        <div className="mt-3 text-xs text-rose-500 flex items-center space-x-2 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mt-3 text-xs text-emerald-500 flex items-center space-x-2 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
          <CheckCircle2 size={16} />
          <span>File uploaded successfully!</span>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
