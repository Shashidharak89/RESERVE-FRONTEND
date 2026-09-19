import React, { useState, useRef, useEffect } from 'react';
import {
  Folder,
  File,
  Image as ImageIcon,
  Film,
  Music,
  FileText,
  FileCode,
  FileArchive,
  MoreVertical,
  Download,
  Eye,
  Edit2,
  FolderInput,
  Trash2,
  Share2,
  Copy,
  Globe,
  Lock
} from 'lucide-react';
import { api } from '../../services/api';

export default function ItemCard({
  item,
  isFolder = false,
  viewMode = 'grid',
  onOpenFolder,
  onPreview,
  onRename,
  onMove,
  onCopy,
  onDelete,
  onShareLink,
  isShared = false
}) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getFileIcon = (file) => {
    const mime = file.mimeType || '';
    const name = (file.originalFilename || '').toLowerCase();

    if (mime.startsWith('image/')) return <ImageIcon size={28} className="icon-img" />;
    if (mime.startsWith('video/')) return <Film size={28} className="icon-video" />;
    if (mime.startsWith('audio/')) return <Music size={28} className="icon-audio" />;
    if (mime.includes('pdf')) return <FileText size={28} className="icon-pdf" />;
    if (name.endsWith('.zip') || name.endsWith('.tar') || name.endsWith('.gz') || name.endsWith('.rar')) {
      return <FileArchive size={28} className="icon-zip" />;
    }
    if (name.endsWith('.js') || name.endsWith('.html') || name.endsWith('.css') || name.endsWith('.java') || name.endsWith('.json')) {
      return <FileCode size={28} className="icon-code" />;
    }
    return <File size={28} className="icon-file" />;
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    if (!isFolder && item.id) {
      window.open(api.getDownloadUrl(item.id, isShared), '_blank');
    }
  };

  const handleCopyShareLink = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    const link = `${window.location.origin}/share/folder/${item.id}`;
    navigator.clipboard.writeText(link);
    if (onShareLink) {
      onShareLink(link);
    } else {
      alert(`Public share link copied to clipboard:\n${link}`);
    }
  };

  const canEdit = !isShared || item.isOwner === true;

  if (viewMode === 'list') {
    return (
      <div
        className={`item-row ${isFolder ? 'folder-row' : 'file-row'}`}
        onClick={() => (isFolder ? onOpenFolder(item) : onPreview && onPreview(item))}
      >
        <div className="row-main">
          {isFolder ? <Folder size={22} className="icon-folder" /> : getFileIcon(item)}
          <span className="item-name">{isFolder ? item.name : item.originalFilename}</span>
          {isFolder && (
            <span className={`visibility-badge ${item.visibility === 'PUBLIC' ? 'public' : 'private'}`}>
              {item.visibility === 'PUBLIC' ? <Globe size={12} /> : <Lock size={12} />}
              {item.visibility === 'PUBLIC' ? 'Public' : 'Private'}
            </span>
          )}
        </div>

        <div className="row-meta">
          {isShared && item.ownerName && (
            <span className="owner-badge">By {item.ownerName}</span>
          )}
          <span className="item-size">{isFolder ? '--' : formatBytes(item.fileSize)}</span>
          <span className="item-date">{formatDate(item.createdAt)}</span>
        </div>

        <div className="row-actions" ref={menuRef} onClick={(e) => e.stopPropagation()}>
          <button
            className="action-btn"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
          >
            <MoreVertical size={16} />
          </button>

          {showMenu && (
            <div className="context-menu" onClick={(e) => e.stopPropagation()}>
              {!isFolder && (
                <>
                  <button className="menu-item" onClick={(e) => { e.stopPropagation(); setShowMenu(false); onPreview && onPreview(item); }}>
                    <Eye size={15} /> Preview
                  </button>
                  <button className="menu-item" onClick={handleDownload}>
                    <Download size={15} /> Download
                  </button>
                </>
              )}
              {isFolder && (
                <>
                  <button className="menu-item" onClick={(e) => { e.stopPropagation(); setShowMenu(false); onOpenFolder(item); }}>
                    <Folder size={15} /> Open Folder
                  </button>
                  {item.visibility === 'PUBLIC' && (
                    <button className="menu-item" onClick={handleCopyShareLink}>
                      <Share2 size={15} /> Copy Share Link
                    </button>
                  )}
                </>
              )}
              {isShared && !isFolder && onCopy && (
                <button className="menu-item" onClick={(e) => { e.stopPropagation(); setShowMenu(false); onCopy(item); }}>
                  <Copy size={15} /> Copy to Vault
                </button>
              )}
              {canEdit && (
                <>
                  <div className="menu-divider"></div>
                  {onRename && (
                    <button className="menu-item" onClick={(e) => { e.stopPropagation(); setShowMenu(false); onRename(item, isFolder); }}>
                      <Edit2 size={15} /> Rename
                    </button>
                  )}
                  {onMove && (
                    <button className="menu-item" onClick={(e) => { e.stopPropagation(); setShowMenu(false); onMove(item, isFolder); }}>
                      <FolderInput size={15} /> Move
                    </button>
                  )}
                  {onDelete && (
                    <button className="menu-item text-danger" onClick={(e) => { e.stopPropagation(); setShowMenu(false); onDelete(item, isFolder); }}>
                      <Trash2 size={15} /> Delete
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div
      className={`item-card ${isFolder ? 'folder-card' : 'file-card'}`}
      onClick={() => (isFolder ? onOpenFolder(item) : onPreview && onPreview(item))}
    >
      <div className="card-top">
        <div className="card-icon-container">
          {isFolder ? <Folder size={36} className="icon-folder" /> : getFileIcon(item)}
          {isFolder && (
            <span className={`badge-pill ${item.visibility === 'PUBLIC' ? 'public' : 'private'}`} title={item.visibility}>
              {item.visibility === 'PUBLIC' ? <Globe size={11} /> : <Lock size={11} />}
            </span>
          )}
        </div>
        <div className="card-menu-wrapper" ref={menuRef} onClick={(e) => e.stopPropagation()}>
          <button
            className="card-menu-btn"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
          >
            <MoreVertical size={16} />
          </button>

          {showMenu && (
            <div className="context-menu" onClick={(e) => e.stopPropagation()}>
              {!isFolder && (
                <>
                  <button className="menu-item" onClick={(e) => { e.stopPropagation(); setShowMenu(false); onPreview && onPreview(item); }}>
                    <Eye size={15} /> Preview
                  </button>
                  <button className="menu-item" onClick={handleDownload}>
                    <Download size={15} /> Download
                  </button>
                </>
              )}
              {isFolder && (
                <>
                  <button className="menu-item" onClick={(e) => { e.stopPropagation(); setShowMenu(false); onOpenFolder(item); }}>
                    <Folder size={15} /> Open
                  </button>
                  {item.visibility === 'PUBLIC' && (
                    <button className="menu-item" onClick={handleCopyShareLink}>
                      <Share2 size={15} /> Copy Share Link
                    </button>
                  )}
                </>
              )}
              {isShared && !isFolder && onCopy && (
                <button className="menu-item" onClick={(e) => { e.stopPropagation(); setShowMenu(false); onCopy(item); }}>
                  <Copy size={15} /> Copy to Vault
                </button>
              )}
              {canEdit && (
                <>
                  <div className="menu-divider"></div>
                  {onRename && (
                    <button className="menu-item" onClick={(e) => { e.stopPropagation(); setShowMenu(false); onRename(item, isFolder); }}>
                      <Edit2 size={15} /> Rename
                    </button>
                  )}
                  {onMove && (
                    <button className="menu-item" onClick={(e) => { e.stopPropagation(); setShowMenu(false); onMove(item, isFolder); }}>
                      <FolderInput size={15} /> Move
                    </button>
                  )}
                  {onDelete && (
                    <button className="menu-item text-danger" onClick={(e) => { e.stopPropagation(); setShowMenu(false); onDelete(item, isFolder); }}>
                      <Trash2 size={15} /> Delete
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="card-body">
        <h4 className="item-title" title={isFolder ? item.name : item.originalFilename}>
          {isFolder ? item.name : item.originalFilename}
        </h4>
        <div className="card-meta">
          {isFolder ? (
            <span>Folder</span>
          ) : (
            <>
              <span>{formatBytes(item.fileSize)}</span>
              <span>•</span>
              <span>{formatDate(item.createdAt)}</span>
            </>
          )}
        </div>
        {isShared && item.ownerName && (
          <div className="card-owner">By {item.ownerName}</div>
        )}
      </div>
    </div>
  );
}
