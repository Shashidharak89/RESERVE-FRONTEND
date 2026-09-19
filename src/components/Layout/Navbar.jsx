import React, { useState } from 'react';
import { 
  FolderGit2, 
  Search, 
  Upload, 
  FolderPlus, 
  Grid, 
  List, 
  LogOut, 
  User as UserIcon,
  X
} from 'lucide-react';
import { api } from '../../services/api';

export default function Navbar({
  user,
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  onOpenUpload,
  onOpenNewFolder,
  activeTab
}) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    api.logout();
  };

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <div className="brand-logo">
          <FolderGit2 size={24} />
        </div>
        <span className="brand-name">Reserve</span>
        <span className="badge-tag">Vault</span>
      </div>

      <div className="navbar-search">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder={`Search ${activeTab === 'shared' ? 'Shared Uploads' : 'My Files'}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button className="search-clear" onClick={() => setSearchQuery('')}>
            <X size={16} />
          </button>
        )}
      </div>

      <div className="navbar-actions">
        {activeTab === 'private' && (
          <button className="btn-secondary" onClick={onOpenNewFolder}>
            <FolderPlus size={18} />
            <span className="btn-text">New Folder</span>
          </button>
        )}

        <button className="btn-primary" onClick={onOpenUpload}>
          <Upload size={18} />
          <span className="btn-text">Upload File</span>
        </button>

        <div className="view-toggle">
          <button
            className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid View"
          >
            <Grid size={18} />
          </button>
          <button
            className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="List View"
          >
            <List size={18} />
          </button>
        </div>

        <div className="user-profile-wrapper">
          <button
            className="user-profile-btn"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="user-name-label">{user?.name}</span>
          </button>

          {showUserMenu && (
            <div className="user-menu-dropdown">
              <div className="user-info-header">
                <p className="u-name">{user?.name}</p>
                <p className="u-email">{user?.email}</p>
              </div>
              <div className="menu-divider"></div>
              <button className="menu-item text-danger" onClick={handleLogout}>
                <LogOut size={16} />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
