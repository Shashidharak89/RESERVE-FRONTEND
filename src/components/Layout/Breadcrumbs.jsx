import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumbs({ folderPath, onNavigate }) {
  return (
    <nav className="breadcrumbs-bar">
      <button
        className="breadcrumb-item home-item"
        onClick={() => onNavigate(null)}
      >
        <Home size={16} />
        <span>My Files</span>
      </button>

      {folderPath.map((folder, index) => {
        const isLast = index === folderPath.length - 1;
        return (
          <React.Fragment key={folder.id}>
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
