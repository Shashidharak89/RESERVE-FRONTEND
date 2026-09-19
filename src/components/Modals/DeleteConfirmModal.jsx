import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

export default function DeleteConfirmModal({ item, isFolder, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setLoading(true);
    setError('');

    try {
      await onConfirm(item, isFolder);
      onClose();
    } catch (err) {
      setError(err.message || 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-box modal-danger">
        <div className="modal-header">
          <div className="modal-title text-danger">
            <AlertTriangle size={20} />
            <h3>Delete {isFolder ? 'Folder' : 'File'}</h3>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <div className="modal-body">
          <p>
            Are you sure you want to delete <strong>"{isFolder ? item.name : item.originalFilename}"</strong>?
          </p>
          {isFolder && (
            <p className="warning-note">
              Deleting this folder will permanently delete all subfolders and files inside it from Cloudinary and database!
            </p>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="button" className="btn-danger" onClick={handleDelete} disabled={loading}>
            {loading ? <span className="spinner"></span> : 'Delete Permanently'}
          </button>
        </div>
      </div>
    </div>
  );
}
