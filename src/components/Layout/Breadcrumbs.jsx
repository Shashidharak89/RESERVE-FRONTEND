import React, { useState } from 'react';
import { ChevronRight, Home, Globe, FolderOpen, Share2, Check } from 'lucide-react';

export default function Breadcrumbs({ folderPath = [], onNavigate, isPublic = false, onShareLink }) {
  const [copied, setCopied] = useState(false);
  const hasPath = folderPath.length > 0;
  const currentFolder = hasPath ? folderPath[folderPath.length - 1] : null;

  const handleCopyPublicFolderLink = () => {
    if (currentFolder && currentFolder.id) {
      const link = `${window.location.origin}/share/folder/${currentFolder.id}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      if (onShareLink) {
        onShareLink(`Public link for "${currentFolder.name}" copied to clipboard! Anyone can access it without logging in.`);
      }
    }
  };

  return (
    <div className="breadcrumbs-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
      <nav className="breadcrumbs-bar" aria-label="Folder navigation">
        {/* Root / Home button */}
        <button
          className={`breadcrumb-chip ${!hasPath ? 'breadcrumb-chip-active' : ''}`}
          onClick={() => onNavigate(null)}
          title={isPublic ? 'Go to Shared Vault' : 'Go to My Files root'}
        >
          {isPublic ? <Globe size={15} /> : <Home size={15} />}
          <span>{isPublic ? 'Shared Vault' : 'My Files'}</span>
        </button>

        {/* Folder chain */}
        {folderPath.map((folder, index) => {
          const isLast = index === folderPath.length - 1;
          return (
            <React.Fragment key={folder.id || index}>
              <ChevronRight size={16} className="breadcrumb-chevron" />
              <button
                className={`breadcrumb-chip ${isLast ? 'breadcrumb-chip-active' : ''}`}
                onClick={() => !isLast && onNavigate(folder)}
                disabled={isLast}
                title={isLast ? `Current folder: ${folder.name}` : `Go to ${folder.name}`}
              >
                <FolderOpen size={14} className="breadcrumb-folder-icon" />
                <span className="breadcrumb-label">{folder.name}</span>
              </button>
            </React.Fragment>
          );
        })}
      </nav>

      {hasPath && (isPublic || (currentFolder && currentFolder.visibility === 'PUBLIC')) && (
        <button
          className="btn-secondary btn-sm"
          onClick={handleCopyPublicFolderLink}
          title="Copy public link to share this directory"
          style={{ height: '34px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          {copied ? <Check size={14} className="text-success" /> : <Share2 size={14} />}
          <span>{copied ? 'Public Link Copied!' : 'Copy Public Link'}</span>
        </button>
      )}
    </div>
  );
}
