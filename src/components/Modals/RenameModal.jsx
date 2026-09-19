import React, { useState } from 'react';
import { X, Edit2, Lock, Globe } from 'lucide-react';

export default function RenameModal({ item, isFolder, onClose, onSubmit }) {
  const [name, setName] = useState(isFolder ? item.name : item.originalFilename);
  const [visibility, setVisibility] = useState(item.visibility || 'PRIVATE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError('');

    try {
      await onSubmit(item, name.trim(), isFolder, visibility);
      onClose();
    } catch (err) {
      setError(err.message || 'Edit failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-box">
        <div className="modal-header">
          <div className="modal-title">
            <Edit2 size={20} />
            <h3>Edit {isFolder ? 'Folder' : 'File'}</h3>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group mb-3">
              <label>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
              />
            </div>

            {isFolder && (
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
                      <strong>Private</strong>
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
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading || !name.trim()}>
              {loading ? <span className="spinner"></span> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
