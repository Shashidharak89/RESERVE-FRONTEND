import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Upload, 
  FolderPlus, 
  Grid, 
  List, 
  LogOut, 
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const navigate = useNavigate();
  const userMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  const handleLogout = () => {
    api.logout();
  };

  // Close menus on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
  }, [activeTab]);

  return (
    <>
      <header className="navbar">
        {/* Left: Brand */}
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

        {/* Center: Search (Desktop) */}
        <div className="navbar-search desktop-only">
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

        {/* Right: Actions (Desktop) */}
        <div className="navbar-actions desktop-only">
          {user && activeTab === 'private' && (
            <button className="btn-secondary" onClick={onOpenNewFolder}>
              <FolderPlus size={18} />
              <span className="btn-text">New Folder</span>
            </button>
          )}

          <button className="btn-primary" onClick={onOpenUpload}>
            <Upload size={18} />
            <span className="btn-text">Upload</span>
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
            <div className="user-profile-wrapper" ref={userMenuRef}>
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
              <span className="btn-text">Sign In</span>
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

        {/* Mobile: Action Icons (compact) */}
        <div className="navbar-mobile-actions mobile-only">
          <button className="mobile-icon-btn" onClick={() => setMobileSearchOpen(!mobileSearchOpen)} title="Search">
            <Search size={20} />
          </button>
          <button className="mobile-icon-btn" onClick={onOpenUpload} title="Upload">
            <Upload size={20} />
          </button>
          <button className="mobile-icon-btn" onClick={onToggleRightSidebar} title="Storage">
            <Sliders size={20} />
          </button>
          <button 
            className={`hamburger-btn ${mobileMenuOpen ? 'is-open' : ''}`} 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            title="Menu"
            aria-label="Toggle Menu"
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
        </div>
      </header>

      {/* Mobile Search Dropdown */}
      {mobileSearchOpen && (
        <div className="mobile-search-bar">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder={`Search ${activeTab === 'shared' ? 'Shared Uploads' : 'My Files'}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => setSearchQuery('')}>
              <X size={16} />
            </button>
          )}
          <button className="search-close-btn" onClick={() => setMobileSearchOpen(false)}>
            <X size={18} />
          </button>
        </div>
      )}

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-menu-backdrop" onClick={() => setMobileMenuOpen(false)}></div>
      )}

      {/* Mobile Menu Dropdown */}
      <div className={`mobile-menu-panel ${mobileMenuOpen ? 'is-open' : ''}`}>
        <div className="mobile-menu-inner">
          {user && (
            <div className="mobile-user-section">
              <div className="avatar">{user.name?.charAt(0).toUpperCase() || 'U'}</div>
              <div>
                <p className="mobile-user-name">{user.name}</p>
                <p className="mobile-user-email">{user.email}</p>
              </div>
            </div>
          )}

          <div className="mobile-menu-divider"></div>

          {user && activeTab === 'private' && (
            <button className="mobile-menu-item" onClick={() => { onOpenNewFolder(); setMobileMenuOpen(false); }}>
              <FolderPlus size={18} />
              <span>New Folder</span>
            </button>
          )}

          <div className="mobile-menu-item-group">
            <span className="mobile-menu-label">View Mode</span>
            <div className="view-toggle">
              <button
                className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <Grid size={16} />
                <span>Grid</span>
              </button>
              <button
                className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <List size={16} />
                <span>List</span>
              </button>
            </div>
          </div>

          <div className="mobile-menu-divider"></div>

          {user ? (
            <button className="mobile-menu-item text-danger" onClick={() => { handleLogout(); setMobileMenuOpen(false); }}>
              <LogOut size={18} />
              <span>Log Out</span>
            </button>
          ) : (
            <button className="mobile-menu-item" onClick={() => { onOpenAuth(); setMobileMenuOpen(false); }}>
              <LogIn size={18} />
              <span>Sign In / Register</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
