import React, { useState, useEffect } from 'react';
import { X, Upload, File, Share2, Lock, CheckCircle2, Zap } from 'lucide-react';
import { uploadFileViaWebSocket } from '../../services/websocketUpload';
import { api } from '../../services/api';

export default function UploadFileModal({ onClose, onUploadSuccess, currentFolder, initialShared = false }) {
  const token = api.getToken();
  const isLoggedIn = !!token;

  // If user is not logged in, force public shared storage mode
  const [file, setFile] = useState(null);
  const [isShared, setIsShared] = useState(!isLoggedIn ? true : initialShared);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // WebSocket progress state
  const [progress, setProgress] = useState(0);
  const [bytesUploaded, setBytesUploaded] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [cancelUploadFn, setCancelUploadFn] = useState(null);

  useEffect(() => {
    return () => {
      if (cancelUploadFn) cancelUploadFn();
    };
  }, [cancelUploadFn]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const formatMB = (bytes) => {
    if (!bytes) return '0 MB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError('');
    setProgress(0);
    setBytesUploaded(0);
    setTotalBytes(file.size);
    setStatusText('Connecting WebSocket endpoint...');

    const cancelFn = uploadFileViaWebSocket(file, {
      isShared,
      folderId: currentFolder ? currentFolder.id : null,
      onProgress: (p) => {
        setProgress(p.percentage);
        setBytesUploaded(p.bytesUploaded);
        setTotalBytes(p.totalBytes);

        if (p.percentage < 100) {
          setStatusText(`Uploading chunk ${p.chunkIndex + 1} of ${p.totalChunks} over WebSocket...`);
        } else {
          setStatusText('Finalizing Cloudinary & database processing...');
        }
      },
      onComplete: (fileResponse) => {
        setProgress(100);
        setStatusText('Upload Complete!');
        setTimeout(() => {
          if (onUploadSuccess) onUploadSuccess(fileResponse, isShared);
          onClose();
        }, 500);
      },
      onError: (errMessage) => {
        setError(errMessage);
        setUploading(false);
        setStatusText('');
      }
    });

    setCancelUploadFn(() => cancelFn);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-box modal-lg">
        <div className="modal-header">
          <div className="modal-title">
            <Zap size={20} className="text-warning" />
            <h3>WebSocket File Upload</h3>
          </div>
          <button className="modal-close" onClick={onClose} disabled={uploading}>
            <X size={18} />
          </button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="destination-selector">
              <label className="section-label">Storage Destination</label>
              <div className="destination-options">
                <button
                  type="button"
                  className={`dest-option ${!isShared ? 'active' : ''}`}
                  onClick={() => {
                    if (isLoggedIn) setIsShared(false);
                  }}
                  disabled={uploading || !isLoggedIn}
                  style={{ opacity: !isLoggedIn ? 0.5 : 1 }}
                >
                  <Lock size={18} />
                  <div>
                    <strong>Private Vault {!isLoggedIn && '(Log in required)'}</strong>
                    <p>{!isLoggedIn ? 'Sign in to save files to your private folders' : (currentFolder ? `Uploading to: ${currentFolder.name}` : 'Uploading to My Files root')}</p>
                  </div>
                </button>

                <button
                  type="button"
                  className={`dest-option ${isShared ? 'active' : ''}`}
                  onClick={() => setIsShared(true)}
                  disabled={uploading}
                >
                  <Share2 size={18} />
                  <div>
                    <strong>Public Shared Area</strong>
                    <p>Visible to all users (No login required)</p>
                  </div>
                </button>
              </div>
            </div>

            {!uploading ? (
              <div
                className={`dropzone ${dragActive ? 'drag-active' : ''} ${file ? 'has-file' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  id="file-upload-input"
                  className="file-input-hidden"
                  onChange={handleFileChange}
                />

                {!file ? (
                  <label htmlFor="file-upload-input" className="dropzone-label">
                    <div className="dropzone-icon">
                      <Upload size={32} />
                    </div>
                    <p className="drop-title">Drag & drop your file here, or click to browse</p>
                    <p className="drop-sub">Chunked WebSocket Upload with Live Progress Bar</p>
                  </label>
                ) : (
                  <div className="selected-file-info">
                    <CheckCircle2 size={32} className="text-success" />
                    <div>
                      <h4 className="file-name">{file.name}</h4>
                      <p className="file-meta">
                        {formatMB(file.size)} • {file.type || 'Unknown file format'}
                      </p>
                    </div>
                    <button type="button" className="btn-icon" onClick={() => setFile(null)}>
                      <X size={18} />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Real-time WebSocket Progress Bar Display */
              <div className="ws-progress-container">
                <div className="ws-progress-header">
                  <div className="ws-file-meta">
                    <File size={24} className="text-primary" />
                    <div>
                      <h4 className="ws-file-name">{file?.name}</h4>
                      <p className="ws-status-text">{statusText}</p>
                    </div>
                  </div>
                  <div className="ws-percentage-badge">
                    {progress}%
                  </div>
                </div>

                <div className="ws-progress-track">
                  <div
                    className="ws-progress-fill"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>

                <div className="ws-progress-footer">
                  <span>{formatMB(bytesUploaded)} / {formatMB(totalBytes)}</span>
                  <span className="ws-socket-badge">WebSocket Stream</span>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                if (cancelUploadFn) cancelUploadFn();
                onClose();
              }}
            >
              {uploading ? 'Cancel Upload' : 'Close'}
            </button>

            {!uploading && (
              <button type="submit" className="btn-primary" disabled={!file}>
                <Zap size={16} />
                <span>Start WebSocket Upload</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
