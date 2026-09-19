import React from 'react';
import { Folder, Share2, HardDrive, X, Sliders, Database, Layers } from 'lucide-react';

export default function RightSidebar({ activeTab, setActiveTab, fileStats, isOpen, onClose }) {
  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSelectTab = (tab) => {
    setActiveTab(tab);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && <div className="right-sidebar-backdrop" onClick={onClose}></div>}

      {/* Slide-over Right Sidebar Drawer */}
      <aside className={`right-sidebar ${isOpen ? 'is-open' : ''}`}>
        <div className="right-sidebar-header">
          <div className="right-sidebar-title">
            <Sliders size={20} className="title-icon" />
            <h3>STORAGE & CATEGORIES</h3>
          </div>
          <button className="btn-icon drawer-close-btn" onClick={onClose} title="Close Sidebar">
            <X size={18} />
          </button>
        </div>

        <div className="right-sidebar-body">
          {/* Navigation Categories */}
          <div className="sidebar-section">
            <h4 className="sidebar-section-title">
              <Layers size={15} /> Categories
            </h4>
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

          {/* Storage Usage Card */}
          <div className="sidebar-section mt-4">
            <h4 className="sidebar-section-title">
              <Database size={15} /> Storage Stats
            </h4>
            <div className="storage-card">
              <div className="storage-header">
                <HardDrive size={22} className="storage-icon" />
                <div>
                  <h4>Storage Usage</h4>
                  <p>{fileStats ? formatBytes(fileStats.totalSize) : '0 MB'} used</p>
                </div>
              </div>

              <div className="progress-bar mb-2">
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
        </div>
      </aside>
    </>
  );
}
