import React, { useState, useRef } from 'react';
import { authApi } from '../services/api';

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
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
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

    const publicKey = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY;
    const urlEndpoint = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT?.replace(/\/+$/, '');
    if (!publicKey || !urlEndpoint) {
      setError('Image uploads are not configured.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      const auth = await authApi.getImageKitUploadAuth();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name);
      formData.append('publicKey', publicKey);
      formData.append('token', auth.token);
      formData.append('expire', String(auth.expire));
      formData.append('signature', auth.signature);

      const result = await new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open('POST', 'https://upload.imagekit.io/api/v1/files/upload');
        request.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            setUploadProgress(Math.round((event.loaded / event.total) * 100));
          }
        });
        request.addEventListener('load', () => {
          let response;
          try {
            response = JSON.parse(request.responseText || '{}');
          } catch {
            reject(new Error('ImageKit returned an unreadable response.'));
            return;
          }
          if (request.status >= 200 && request.status < 300) {
            resolve(response);
          } else {
            reject(new Error(response.message || response.help || 'Image upload failed.'));
          }
        });
        request.addEventListener('error', () => reject(new Error('Could not reach ImageKit.')));
        request.addEventListener('timeout', () => reject(new Error('ImageKit upload timed out.')));
        request.timeout = 120000;
        request.send(formData);
      });

      if (typeof result.url !== 'string' || !result.url.startsWith(`${urlEndpoint}/`)) {
        throw new Error('ImageKit returned a URL outside the configured endpoint.');
      }
      onChange(result.url);
    } catch (uploadError) {
      setError(uploadError.message || 'Image upload failed.');
    } finally {
      setUploading(false);
    }
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
      void handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    if (urlInput.trim()) {
      const urlEndpoint = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT?.replace(/\/+$/, '');
      if (!urlEndpoint || !urlInput.trim().startsWith(`${urlEndpoint}/`)) {
        setError('Use an image URL from the configured ImageKit endpoint.');
        return;
      }
      onChange(urlInput.trim());
      setError('');
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
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                title="Change image"
              >
                🔄 Replace
              </button>
              <button
                type="button"
                className="image-overlay-btn remove"
                disabled={uploading}
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
          onClick={() => !uploading && fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (!uploading && (e.key === 'Enter' || e.key === ' ')) fileInputRef.current?.click();
          }}
          aria-disabled={uploading}
        >
          <div className="image-dropzone-content">
            <span className="image-dropzone-icon">🖼️</span>
            <p className="image-dropzone-text">
              <strong>{uploading ? `Uploading ${uploadProgress}%` : 'Click to upload'}</strong>
              {!uploading && ' or drag & drop'}
            </p>
            {uploading ? (
              <progress value={uploadProgress} max="100" aria-label="Image upload progress" />
            ) : hint && <span className="image-dropzone-hint">{hint}</span>}
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        disabled={uploading}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            void handleFile(e.target.files[0]);
          }
          e.target.value = '';
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
