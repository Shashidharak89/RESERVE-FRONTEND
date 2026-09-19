import React, { useState } from 'react';
import { X, FolderPlus, Lock, Globe } from 'lucide-react';

export default function CreateFolderModal({ onClose, onSubmit }) {
  const [folderName, setFolderName] = useState('');
  const [visibility, setVisibility] = useState('PRIVATE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    setLoading(true);
    setError('');

    try {
      await onSubmit(folderName.trim(), visibility);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create folder');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-box">
        <div className="modal-header">
          <div className="modal-title">
            <FolderPlus size={20} />
            <h3>Create New Folder</h3>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group mb-3">
              <label>Folder Name</label>
              <input
                type="text"
                placeholder="e.g. Documents, Projects, College"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div className="form-group">
              <label>Folder Visibility</label>
              <div className="destination-options mt-1">
                <button
                  type="button"
                  className={`dest-option ${visibility === 'PRIVATE' ? 'active' : ''}`}
                  onClick={() => setVisibility('PRIVATE')}
                >
                  <Lock size={18} />
                  <div>
                    <strong>Private (Default)</strong>
                    <p>Only you can see this folder</p>
                  </div>
                </button>

                <button
                  type="button"
                  className={`dest-option ${visibility === 'PUBLIC' ? 'active' : ''}`}
                  onClick={() => setVisibility('PUBLIC')}
                >
                  <Globe size={18} />
                  <div>
                    <strong>Public / Shareable</strong>
                    <p>Anyone with link can view</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading || !folderName.trim()}>
              {loading ? <span className="spinner"></span> : 'Create Folder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
