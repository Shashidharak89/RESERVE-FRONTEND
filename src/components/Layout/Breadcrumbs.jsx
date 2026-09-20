import React from 'react';
import { ChevronRight, Home, Globe, FolderOpen } from 'lucide-react';

export default function Breadcrumbs({ folderPath = [], onNavigate, isPublic = false }) {
  // Don't render if at root (no nesting to show)
  const hasPath = folderPath.length > 0;

  return (
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
  );
}
