import React, { useState, useRef } from 'react';

export default function ImageUploader({
  value,
  onChange,
  label = 'Upload Image',
  hint = 'Supports PNG, JPG, WEBP, GIF up to 5MB',
  aspectRatio = 'auto',
  className = '',
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFile = (file) => {
    setError('');
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image file must be under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target.result;
      if (typeof result === 'string') {
        onChange(result);
      }
    };
    reader.onerror = () => {
      setError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput('');
      setShowUrlInput(false);
    }
  };

  return (
    <div className={`image-uploader-container ${className}`}>
      {label && <label className="image-uploader-label">{label}</label>}

      {value ? (
        <div className="image-preview-card">
          <div className="image-preview-wrap" style={{ aspectRatio }}>
            <img src={value} alt="Uploaded preview" className="image-preview-img" />
            <div className="image-preview-overlay">
              <button
                type="button"
                className="image-overlay-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Change image"
              >
                🔄 Replace
              </button>
              <button
                type="button"
                className="image-overlay-btn remove"
                onClick={() => onChange('')}
                title="Remove image"
              >
                ✕ Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`image-dropzone ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
          }}
        >
          <div className="image-dropzone-content">
            <span className="image-dropzone-icon">🖼️</span>
            <p className="image-dropzone-text">
              <strong>Click to upload</strong> or drag & drop
            </p>
            {hint && <span className="image-dropzone-hint">{hint}</span>}
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFile(e.target.files[0]);
          }
        }}
      />

      {error && <p className="image-uploader-error">{error}</p>}

      {!value && (
        <div className="image-uploader-alt">
          {!showUrlInput ? (
            <button
              type="button"
              className="text-link"
              style={{ fontSize: '0.8rem', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
              onClick={() => setShowUrlInput(true)}
            >
              Or paste image URL instead ↗
            </button>
          ) : (
            <form onSubmit={handleUrlSubmit} className="image-url-form" style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <input
                type="url"
                placeholder="https://example.com/illustration.png"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="ig-comment-input"
                style={{ flex: 1 }}
              />
              <button type="submit" className="cr-btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}>
                Use URL
              </button>
              <button
                type="button"
                className="cr-btn-secondary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
                onClick={() => setShowUrlInput(false)}
              >
                Cancel
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
