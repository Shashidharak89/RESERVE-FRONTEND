import React from 'react';
import { Folder, Share2, HardDrive, X } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, fileStats, isOpenMobile, onCloseMobile }) {
  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSelectTab = (tab) => {
    setActiveTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {isOpenMobile && <div className="sidebar-backdrop" onClick={onCloseMobile}></div>}
      <aside className={`sidebar ${isOpenMobile ? 'mobile-open' : ''}`}>
        <div className="sidebar-section">
          <div className="sidebar-header-mobile">
            <h3 className="section-title">STORAGE CATEGORIES</h3>
            <button className="btn-icon mobile-close-btn" onClick={onCloseMobile}>
              <X size={18} />
            </button>
          </div>
          <nav className="sidebar-nav">
            <button
              className={`nav-item ${activeTab === 'private' ? 'active' : ''}`}
              onClick={() => handleSelectTab('private')}
            >
              <Folder size={18} />
              <span>My Files</span>
            </button>

            <button
              className={`nav-item ${activeTab === 'shared' ? 'active' : ''}`}
              onClick={() => handleSelectTab('shared')}
            >
              <Share2 size={18} />
              <span>Shared Uploads</span>
              <span className="badge-shared">Public</span>
            </button>
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="storage-card">
            <div className="storage-header">
              <HardDrive size={20} className="storage-icon" />
              <div>
                <h4>Storage Usage</h4>
                <p>{fileStats ? formatBytes(fileStats.totalSize) : '0 MB'} used</p>
              </div>
            </div>

            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${Math.min(100, ((fileStats?.totalSize || 0) / (100 * 1024 * 1024)) * 100)}%`
                }}
              ></div>
            </div>

            <div className="storage-info">
              <span>{fileStats?.totalFiles || 0} Files</span>
              <span>Cloudinary Vault</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
