import React, { useState } from 'react';
import { X, Download, FileText, ExternalLink, Copy, Check } from 'lucide-react';
import { api } from '../../services/api';

export default function PreviewModal({ item, file, isShared = false, onClose }) {
  const [copied, setCopied] = useState(false);
  const targetItem = item || file;
  if (!targetItem) return null;

  const downloadUrl = api.getDownloadUrl(targetItem.id, isShared);
  const fileUrl = targetItem.cloudinaryUrl || downloadUrl;
  const mime = targetItem.mimeType || '';
  const name = (targetItem.originalFilename || '').toLowerCase();

  const isImage = mime.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/.test(name);
  const isVideo = mime.startsWith('video/') || /\.(mp4|webm|ogg|mkv)$/.test(name);
  const isAudio = mime.startsWith('audio/') || /\.(mp3|wav|ogg)$/.test(name);
  const isPdf = mime.includes('pdf') || name.endsWith('.pdf');
  const isText = mime.startsWith('text/') || /\.(txt|json|js|html|css|md|py|java|cpp|c|sh|xml|csv)$/.test(name);

  const handleCopyCloudinaryUrl = () => {
    if (fileUrl) {
      navigator.clipboard.writeText(fileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box modal-xl preview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <FileText size={20} />
            <h3 className="preview-filename">{targetItem.originalFilename}</h3>
          </div>
          <div className="header-actions">
            <button className="btn-secondary btn-sm" onClick={handleCopyCloudinaryUrl} title="Copy Cloudinary URL">
              {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
              <span>{copied ? 'Copied!' : 'Copy Cloudinary URL'}</span>
            </button>
            <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm">
              <Download size={16} />
              <span>Download</span>
            </a>
            <button className="modal-close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="preview-body">
          {isImage ? (
            <div className="preview-media-container">
              <img src={fileUrl} alt={targetItem.originalFilename} className="preview-image" />
            </div>
          ) : isVideo ? (
            <div className="preview-media-container">
              <video src={fileUrl} controls className="preview-video" autoPlay />
            </div>
          ) : isAudio ? (
            <div className="preview-audio-container">
              <audio src={fileUrl} controls className="preview-audio" autoPlay />
            </div>
          ) : isPdf || isText ? (
            <div className="preview-pdf-container">
              <iframe src={fileUrl} title={targetItem.originalFilename} className="preview-iframe" />
            </div>
          ) : (
            <div className="preview-placeholder">
              <FileText size={64} className="placeholder-icon" />
              <h4>{targetItem.originalFilename}</h4>
              <p>Preview not directly supported in-browser for this file type ({targetItem.mimeType || 'Raw File'}).</p>
              <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="btn-primary mt-3">
                <ExternalLink size={16} />
                <span>Open File via Cloudinary</span>
              </a>
            </div>
          )}
        </div>

        <div className="preview-footer">
          <div className="preview-meta">
            <span>Size: {targetItem.fileSize ? (targetItem.fileSize / (1024 * 1024)).toFixed(2) + ' MB' : 'Unknown'}</span>
            <span>•</span>
            <span>Type: {targetItem.resourceType || targetItem.mimeType || 'raw'}</span>
            <span>•</span>
            <span>Uploaded: {targetItem.createdAt ? new Date(targetItem.createdAt).toLocaleString() : 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
