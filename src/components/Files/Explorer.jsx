import React from 'react';
import ItemCard from './ItemCard';
import { Folder, File, FolderPlus, Upload, SearchX } from 'lucide-react';

export default function Explorer({
  folders = [],
  files = [],
  loading = false,
  viewMode = 'grid',
  activeTab = 'private',
  searchQuery = '',
  onOpenFolder,
  onPreview,
  onRename,
  onMove,
  onDelete,
  onOpenNewFolder,
  onOpenUpload
}) {
  const isShared = activeTab === 'shared';
  const hasItems = (folders && folders.length > 0) || (files && files.length > 0);

  if (loading) {
    return (
      <div className="explorer-loading">
        <div className="spinner-large"></div>
        <p>Loading vault contents...</p>
      </div>
    );
  }

  if (!hasItems) {
    return (
      <div className="explorer-empty">
        {searchQuery ? (
          <div className="empty-state">
            <SearchX size={54} className="empty-icon text-muted" />
            <h3>No matches found for "{searchQuery}"</h3>
            <p>Try refining your search keyword or clearing the filter.</p>
          </div>
        ) : isShared ? (
          <div className="empty-state">
            <Upload size={54} className="empty-icon text-primary" />
            <h3>No Shared Files Yet</h3>
            <p>Files uploaded to the Shared Uploads area are visible to all users.</p>
            <button className="btn-primary mt-3" onClick={onOpenUpload}>
              <Upload size={18} />
              <span>Upload First Shared File</span>
            </button>
          </div>
        ) : (
          <div className="empty-state">
            <Folder size={54} className="empty-icon text-primary" />
            <h3>This folder is empty</h3>
            <p>Create a new subfolder or upload your images, documents, and videos.</p>
            <div className="empty-actions">
              <button className="btn-secondary" onClick={onOpenNewFolder}>
                <FolderPlus size={18} />
                <span>New Folder</span>
              </button>
              <button className="btn-primary" onClick={onOpenUpload}>
                <Upload size={18} />
                <span>Upload File</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="explorer-container">
      {/* Folders Section */}
      {folders && folders.length > 0 && (
        <div className="explorer-section">
          <h3 className="section-heading">Folders ({folders.length})</h3>
          <div className={viewMode === 'grid' ? 'grid-container' : 'list-container'}>
            {folders.map((folder) => (
              <ItemCard
                key={`folder-${folder.id}`}
                item={folder}
                isFolder={true}
                viewMode={viewMode}
                onOpenFolder={onOpenFolder}
                onRename={onRename}
                onMove={onMove}
                onDelete={onDelete}
                isShared={isShared}
              />
            ))}
          </div>
        </div>
      )}

      {/* Files Section */}
      {files && files.length > 0 && (
        <div className="explorer-section">
          <h3 className="section-heading">Files ({files.length})</h3>
          <div className={viewMode === 'grid' ? 'grid-container' : 'list-container'}>
            {files.map((file) => (
              <ItemCard
                key={`file-${file.id}`}
                item={file}
                isFolder={false}
                viewMode={viewMode}
                onPreview={onPreview}
                onRename={onRename}
                onMove={onMove}
                onDelete={onDelete}
                isShared={isShared}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
