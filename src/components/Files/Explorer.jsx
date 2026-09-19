import React, { useState } from 'react';
import ItemCard from './ItemCard';
import { 
  Folder, 
  File, 
  FolderPlus, 
  Upload, 
  SearchX, 
  ArrowUpDown, 
  ClipboardPaste, 
  ChevronDown,
  Copy,
  Trash2,
  XCircle,
  CheckSquare,
  X
} from 'lucide-react';

export default function Explorer({
  folders = [],
  files = [],
  loading = false,
  loadingMore = false,
  hasMore = false,
  onLoadMore,
  viewMode = 'grid',
  activeTab = 'private',
  searchQuery = '',
  sortOrder = 3,
  setSortOrder,
  clipboardItems = null,
  onPaste,
  onCancelCopy,
  onOpenFolder,
  onPreview,
  onRename,
  onMove,
  onDelete,
  onCopy,
  onCopyClipboard,
  onShareLink,
  onOpenNewFolder,
  onOpenUpload,
  onBulkDelete
}) {
  const isShared = activeTab === 'shared';
  const hasItems = (folders && folders.length > 0) || (files && files.length > 0);

  // Multi-select state: array of keys `${isFolder ? 'folder' : 'file'}-${item.id}`
  const [selectedKeys, setSelectedKeys] = useState([]);

  const totalVisibleItems = folders.length + files.length;
  const isAllSelected = totalVisibleItems > 0 && selectedKeys.length === totalVisibleItems;

  const handleToggleSelect = (item, isFolder) => {
    const key = `${isFolder ? 'folder' : 'file'}-${item.id}`;
    setSelectedKeys(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedKeys([]);
    } else {
      const folderKeys = folders.map(f => `folder-${f.id}`);
      const fileKeys = files.map(f => `file-${f.id}`);
      setSelectedKeys([...folderKeys, ...fileKeys]);
    }
  };

  const handleClearSelection = () => {
    setSelectedKeys([]);
  };

  const getSelectedObjects = () => {
    const selectedFolders = folders
      .filter(f => selectedKeys.includes(`folder-${f.id}`))
      .map(f => ({ item: f, isFolder: true }));
    const selectedFiles = files
      .filter(f => selectedKeys.includes(`file-${f.id}`))
      .map(f => ({ item: f, isFolder: false }));
    return [...selectedFolders, ...selectedFiles];
  };

  const handleBulkCopyAction = () => {
    const itemsToCopy = getSelectedObjects();
    if (itemsToCopy.length === 0) return;
    if (onCopyClipboard) {
      onCopyClipboard(itemsToCopy);
    }
    setSelectedKeys([]);
  };

  const handleBulkDeleteAction = () => {
    const itemsToDelete = getSelectedObjects();
    if (itemsToDelete.length === 0) return;
    if (onBulkDelete) {
      onBulkDelete(itemsToDelete);
    }
    setSelectedKeys([]);
  };

  if (loading) {
    return (
      <div className="explorer-loading">
        <div className="spinner-large"></div>
        <p>Loading vault contents...</p>
      </div>
    );
  }

  return (
    <div className="explorer-container">
      {/* Controls Bar */}
      <div className="explorer-toolbar">
        <div className="toolbar-info">
          {hasItems && (
            <label className="select-all-label" title="Select All Items">
              <input
                type="checkbox"
                className="item-checkbox"
                checked={isAllSelected}
                onChange={handleSelectAll}
              />
              <span className="items-count">
                {folders.length + files.length} items
              </span>
            </label>
          )}

          {/* Paste & Cancel Copy buttons */}
          {clipboardItems && clipboardItems.length > 0 && (
            <div className="clipboard-actions-group">
              {onPaste && (
                <button className="btn-primary paste-btn" onClick={onPaste}>
                  <ClipboardPaste size={16} />
                  <span>Paste ({clipboardItems.length} {clipboardItems.length === 1 ? 'item' : 'items'})</span>
                </button>
              )}
              {onCancelCopy && (
                <button 
                  className="btn-secondary cancel-copy-btn" 
                  onClick={onCancelCopy}
                  title="Cancel copied items"
                >
                  <XCircle size={16} />
                  <span>Cancel Copy</span>
                </button>
              )}
            </div>
          )}
        </div>

        <div className="toolbar-actions">
          <div className="sort-selector">
            <ArrowUpDown size={15} className="sort-icon" />
            <select
              value={sortOrder}
              onChange={(e) => {
                if (setSortOrder) setSortOrder(Number(e.target.value));
              }}
              className="sort-dropdown"
            >
              <option value={3}>Date (Latest First)</option>
              <option value={4}>Date (Oldest First)</option>
              <option value={1}>Name (A - Z)</option>
              <option value={2}>Name (Z - A)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Floating / Sticky Multi-Selection Action Bar */}
      {selectedKeys.length > 0 && (
        <div className="multi-select-bar">
          <div className="multi-select-info">
            <CheckSquare size={18} />
            <span><strong>{selectedKeys.length}</strong> {selectedKeys.length === 1 ? 'item' : 'items'} selected</span>
          </div>
          <div className="multi-select-actions">
            <button className="btn-secondary" onClick={handleBulkCopyAction}>
              <Copy size={16} />
              <span>Copy Selected ({selectedKeys.length})</span>
            </button>
            {!isShared && onBulkDelete && (
              <button className="btn-danger" onClick={handleBulkDeleteAction}>
                <Trash2 size={16} />
                <span>Delete Selected ({selectedKeys.length})</span>
              </button>
            )}
            <button className="btn-icon-text" onClick={handleClearSelection}>
              <X size={16} />
              <span>Clear</span>
            </button>
          </div>
        </div>
      )}

      {!hasItems ? (
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
      ) : (
        <>
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
                    isSelected={selectedKeys.includes(`folder-${folder.id}`)}
                    onToggleSelect={handleToggleSelect}
                    onOpenFolder={onOpenFolder}
                    onRename={onRename}
                    onMove={onMove}
                    onDelete={onDelete}
                    onCopy={onCopy}
                    onCopyClipboard={(item, isFolder) => onCopyClipboard && onCopyClipboard([{ item, isFolder }])}
                    onShareLink={onShareLink}
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
                    isSelected={selectedKeys.includes(`file-${file.id}`)}
                    onToggleSelect={handleToggleSelect}
                    onPreview={onPreview}
                    onRename={onRename}
                    onMove={onMove}
                    onDelete={onDelete}
                    onCopy={onCopy}
                    onCopyClipboard={(item, isFolder) => onCopyClipboard && onCopyClipboard([{ item, isFolder }])}
                    onShareLink={onShareLink}
                    isShared={isShared}
                  />
                ))}
              </div>
            </div>
          )}

          {/* View More Append Button */}
          {hasMore && onLoadMore && (
            <div className="load-more-container">
              <button
                className="btn-secondary load-more-btn"
                onClick={onLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <span className="spinner"></span> Loading more...
                  </>
                ) : (
                  <>
                    <span>View More</span>
                    <ChevronDown size={18} />
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

