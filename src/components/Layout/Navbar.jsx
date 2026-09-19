import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FolderGit2, 
  Search, 
  Upload, 
  FolderPlus, 
  Grid, 
  List, 
  LogOut, 
  User as UserIcon,
  X,
  Menu,
  LogIn,
  Sliders
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
  onOpenAuth,
  activeTab,
  onToggleRightSidebar
}) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    api.logout();
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <div 
          className="navbar-brand" 
          onClick={() => navigate('/')} 
          style={{ cursor: 'pointer' }}
          title="Go to Home Screen"
        >
          <img src="/Reserve-logo.png" alt="Reserve Logo" className="brand-logo-img" />
          <span className="brand-name">Reserve</span>
          <span className="badge-tag">Vault</span>
        </div>
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
        {user && activeTab === 'private' && (
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

        {user ? (
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
        ) : (
          <button className="btn-secondary" onClick={onOpenAuth}>
            <LogIn size={18} />
            <span className="btn-text">Sign In / Register</span>
          </button>
        )}

        {/* Right Corner Sidebar Toggle Button */}
        <button 
          className="btn-secondary sidebar-toggle-btn" 
          onClick={onToggleRightSidebar}
          title="Open Storage Categories & Stats"
        >
          <Sliders size={18} />
          <span className="btn-text">Storage</span>
        </button>
      </div>
    </header>
  );
}
