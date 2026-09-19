import React from 'react';
import { ChevronRight, Home, Globe } from 'lucide-react';

export default function Breadcrumbs({ folderPath = [], onNavigate, isPublic = false }) {
  return (
    <nav className="breadcrumbs-bar">
      <button
        className="breadcrumb-item home-item"
        onClick={() => onNavigate(null)}
      >
        {isPublic ? <Globe size={16} /> : <Home size={16} />}
        <span>{isPublic ? 'Shared Vault' : 'My Files'}</span>
      </button>

      {folderPath.map((folder, index) => {
        const isLast = index === folderPath.length - 1;
        return (
          <React.Fragment key={folder.id || index}>
            <ChevronRight size={14} className="breadcrumb-separator" />
            <button
              className={`breadcrumb-item ${isLast ? 'active' : ''}`}
              onClick={() => onNavigate(folder)}
              disabled={isLast}
            >
              <span>{folder.name}</span>
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
}
