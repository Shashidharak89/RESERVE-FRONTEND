import React, { useState } from 'react';
import { X, Upload, File, Share2, Lock, CheckCircle2 } from 'lucide-react';

export default function UploadFileModal({ onClose, onUpload, currentFolder, initialShared = false }) {
  const [file, setFile] = useState(null);
  const [isShared, setIsShared] = useState(initialShared);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      await onUpload(file, isShared);
      onClose();
    } catch (err) {
      setError(err.message || 'File upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-box modal-lg">
        <div className="modal-header">
          <div className="modal-title">
            <Upload size={20} />
            <h3>Upload File to Cloudinary</h3>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="destination-selector">
              <label className="section-label">Storage Location</label>
              <div className="destination-options">
                <button
                  type="button"
                  className={`dest-option ${!isShared ? 'active' : ''}`}
                  onClick={() => setIsShared(false)}
                >
                  <Lock size={18} />
                  <div>
                    <strong>Private Storage</strong>
                    <p>{currentFolder ? `Uploading to: ${currentFolder.name}` : 'Uploading to My Files root'}</p>
                  </div>
                </button>

                <button
                  type="button"
                  className={`dest-option ${isShared ? 'active' : ''}`}
                  onClick={() => setIsShared(true)}
                >
                  <Share2 size={18} />
                  <div>
                    <strong>Shared Uploads Area</strong>
                    <p>Visible to all registered users</p>
                  </div>
                </button>
              </div>
            </div>

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
                  <p className="drop-title">Drag & drop your file here, or browse</p>
                  <p className="drop-sub">Supports Images, PDFs, Documents, ZIPs, Videos & Raw files</p>
                </label>
              ) : (
                <div className="selected-file-info">
                  <CheckCircle2 size={32} className="text-success" />
                  <div>
                    <h4 className="file-name">{file.name}</h4>
                    <p className="file-meta">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type || 'Unknown type'}
                    </p>
                  </div>
                  <button type="button" className="btn-icon" onClick={() => setFile(null)}>
                    <X size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading || !file}>
              {loading ? (
                <>
                  <span className="spinner"></span> Uploading...
                </>
              ) : (
                'Start Upload'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
