import React from 'react';
import { X, Download, FileText, ExternalLink } from 'lucide-react';
import { api } from '../../services/api';

export default function PreviewModal({ item, isShared = false, onClose }) {
  if (!item) return null;

  const downloadUrl = api.getDownloadUrl(item.id, isShared);
  const mime = item.mimeType || '';
  const name = (item.originalFilename || '').toLowerCase();

  const isImage = mime.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/.test(name);
  const isVideo = mime.startsWith('video/') || /\.(mp4|webm|ogg|mkv)$/.test(name);
  const isAudio = mime.startsWith('audio/') || /\.(mp3|wav|ogg)$/.test(name);
  const isPdf = mime.includes('pdf') || name.endsWith('.pdf');

  return (
    <div className="modal-backdrop">
      <div className="modal-box modal-xl preview-modal">
        <div className="modal-header">
          <div className="modal-title">
            <FileText size={20} />
            <h3 className="preview-filename">{item.originalFilename}</h3>
          </div>
          <div className="header-actions">
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
              <img src={item.cloudinaryUrl} alt={item.originalFilename} className="preview-image" />
            </div>
          ) : isVideo ? (
            <div className="preview-media-container">
              <video src={item.cloudinaryUrl} controls className="preview-video" autoPlay />
            </div>
          ) : isAudio ? (
            <div className="preview-audio-container">
              <audio src={item.cloudinaryUrl} controls className="preview-audio" autoPlay />
            </div>
          ) : isPdf ? (
            <div className="preview-pdf-container">
              <iframe src={item.cloudinaryUrl} title={item.originalFilename} className="preview-iframe" />
            </div>
          ) : (
            <div className="preview-placeholder">
              <FileText size={64} className="placeholder-icon" />
              <h4>{item.originalFilename}</h4>
              <p>Preview not directly supported in-browser for this file type ({item.mimeType || 'Raw File'}).</p>
              <a href={item.cloudinaryUrl} target="_blank" rel="noopener noreferrer" className="btn-primary mt-3">
                <ExternalLink size={16} />
                <span>Open File via Cloudinary</span>
              </a>
            </div>
          )}
        </div>

        <div className="preview-footer">
          <div className="preview-meta">
            <span>Size: {(item.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
            <span>•</span>
            <span>Type: {item.resourceType || 'raw'}</span>
            <span>•</span>
            <span>Uploaded: {new Date(item.createdAt).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
