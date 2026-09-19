import React, { useState, useEffect } from 'react';
import { X, FolderInput, Folder, ChevronRight, Home } from 'lucide-react';
import { api } from '../../services/api';

export default function MoveModal({ item, isFolder, onClose, onSubmit }) {
  const [folders, setFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState(null); // null means root
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    setLoading(true);
    try {
      // Get all folders belonging to user
      const res = await api.getFolders();
      // Filter out self and children if moving a folder
      const validFolders = (res || []).filter((f) => !isFolder || f.id !== item.id);
      setFolders(validFolders);
    } catch (err) {
      setError('Failed to load folders');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await onSubmit(item, selectedFolderId, isFolder);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to move item');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-box">
        <div className="modal-header">
          <div className="modal-title">
            <FolderInput size={20} />
            <h3>Move "{isFolder ? item.name : item.originalFilename}"</h3>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <label className="section-label">Select Destination Folder:</label>
            <div className="folder-tree-list">
              <button
                type="button"
                className={`tree-item ${selectedFolderId === null ? 'selected' : ''}`}
                onClick={() => setSelectedFolderId(null)}
              >
                <Home size={18} />
                <span>My Files (Root)</span>
              </button>

              {loading ? (
                <div className="p-3 text-center"><span className="spinner"></span></div>
              ) : (
                folders.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`tree-item ${selectedFolderId === f.id ? 'selected' : ''}`}
                    onClick={() => setSelectedFolderId(f.id)}
                  >
                    <Folder size={18} />
                    <span>{f.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? <span className="spinner"></span> : 'Move Here'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
