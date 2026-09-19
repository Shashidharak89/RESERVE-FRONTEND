import React, { useState, useEffect } from 'react';
import Navbar from './components/Layout/Navbar';
import Sidebar from './components/Layout/Sidebar';
import Breadcrumbs from './components/Layout/Breadcrumbs';
import Explorer from './components/Files/Explorer';
import AuthModal from './components/Auth/AuthModal';
import CreateFolderModal from './components/Modals/CreateFolderModal';
import UploadFileModal from './components/Modals/UploadFileModal';
import RenameModal from './components/Modals/RenameModal';
import MoveModal from './components/Modals/MoveModal';
import PreviewModal from './components/Modals/PreviewModal';
import DeleteConfirmModal from './components/Modals/DeleteConfirmModal';
import { api } from './services/api';
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  // Explorer state
  const [activeTab, setActiveTab] = useState('private'); // 'private' | 'shared'
  const [currentFolder, setCurrentFolder] = useState(null); // null means root
  const [folderPath, setFolderPath] = useState([]);
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [fileStats, setFileStats] = useState({ totalFiles: 0, totalSize: 0 });

  // Modals state
  const [modalType, setModalType] = useState(null); // 'createFolder'|'uploadFile'|'rename'|'move'|'preview'|'delete'
  const [activeItem, setActiveItem] = useState(null);
  const [activeIsFolder, setActiveIsFolder] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    checkAuth();
    const handleAuthChange = () => checkAuth();
    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadContents();
    }
  }, [isAuthenticated, activeTab, currentFolder, searchQuery]);

  const checkAuth = async () => {
    const token = api.getToken();
    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      setAuthChecking(false);
      return;
    }

    try {
      const userData = await api.getMe();
      setUser(userData);
      setIsAuthenticated(true);
    } catch (err) {
      api.logout();
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setAuthChecking(false);
    }
  };

  const loadContents = async () => {
    setLoading(true);
    try {
      if (activeTab === 'private') {
        const folderId = currentFolder ? currentFolder.id : null;
        const [foldersData, filesData] = await Promise.all([
          searchQuery ? [] : api.getFolders(folderId),
          api.getPrivateFiles(folderId, searchQuery)
        ]);
        setFolders(foldersData || []);
        setFiles(filesData || []);

        // Calculate stats
        const totalSize = (filesData || []).reduce((acc, curr) => acc + (curr.fileSize || 0), 0);
        setFileStats({
          totalFiles: (filesData || []).length + (foldersData || []).length,
          totalSize
        });
      } else {
        // Shared Uploads area
        const sharedFiles = await api.getSharedFiles(searchQuery);
        setFolders([]);
        setFiles(sharedFiles || []);

        const totalSize = (sharedFiles || []).reduce((acc, curr) => acc + (curr.fileSize || 0), 0);
        setFileStats({
          totalFiles: (sharedFiles || []).length,
          totalSize
        });
      }
    } catch (err) {
      showToast(err.message || 'Failed to load vault contents', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Folder navigation
  const handleOpenFolder = (folder) => {
    setCurrentFolder(folder);
    setFolderPath((prev) => [...prev, folder]);
    setSearchQuery('');
  };

  const handleNavigateBreadcrumb = (targetFolder) => {
    if (!targetFolder) {
      setCurrentFolder(null);
      setFolderPath([]);
    } else {
      const targetIndex = folderPath.findIndex((f) => f.id === targetFolder.id);
      if (targetIndex !== -1) {
        setCurrentFolder(targetFolder);
        setFolderPath(folderPath.slice(0, targetIndex + 1));
      }
    }
    setSearchQuery('');
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentFolder(null);
    setFolderPath([]);
    setSearchQuery('');
  };

  // Modal Handlers
  const handleCreateFolder = async (folderName) => {
    const parentId = currentFolder ? currentFolder.id : null;
    await api.createFolder(folderName, parentId);
    showToast(`Folder "${folderName}" created`);
    loadContents();
  };

  const handleUploadFile = async (file, isSharedTarget) => {
    if (isSharedTarget) {
      await api.uploadSharedFile(file);
      showToast(`File "${file.name}" uploaded to Shared Uploads area`);
    } else {
      const folderId = currentFolder ? currentFolder.id : null;
      await api.uploadPrivateFile(file, folderId);
      showToast(`File "${file.name}" uploaded to Private Vault`);
    }
    loadContents();
  };

  const handleRename = async (item, newName, isFolder) => {
    if (isFolder) {
      await api.renameFolder(item.id, newName);
      showToast(`Folder renamed to "${newName}"`);
    } else {
      await api.renameFile(item.id, newName);
      showToast(`File renamed to "${newName}"`);
    }
    loadContents();
  };

  const handleMove = async (item, targetFolderId, isFolder) => {
    if (isFolder) {
      await api.moveFolder(item.id, targetFolderId);
      showToast(`Folder moved successfully`);
    } else {
      await api.moveFile(item.id, targetFolderId);
      showToast(`File moved successfully`);
    }
    loadContents();
  };

  const handleDelete = async (item, isFolder) => {
    if (isFolder) {
      await api.deleteFolder(item.id);
      showToast(`Folder "${item.name}" deleted`);
    } else {
      await api.deleteFile(item.id);
      showToast(`File "${item.originalFilename}" deleted`);
    }
    loadContents();
  };

  if (authChecking) {
    return (
      <div className="app-splash">
        <div className="spinner-large"></div>
        <h2>Initializing Reserve...</h2>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthModal onAuthSuccess={() => checkAuth()} />;
  }

  return (
    <div className="app-layout">
      <Navbar
        user={user}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onOpenUpload={() => setModalType('uploadFile')}
        onOpenNewFolder={() => setModalType('createFolder')}
        activeTab={activeTab}
      />

      <div className="app-main-content">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          fileStats={fileStats}
        />

        <main className="main-viewport">
          {activeTab === 'private' && (
            <Breadcrumbs
              folderPath={folderPath}
              onNavigate={handleNavigateBreadcrumb}
            />
          )}

          {activeTab === 'shared' && (
            <div className="shared-header-banner">
              <h2>Shared Uploads Area</h2>
              <p>Files uploaded here are publicly accessible to all registered users of Reserve.</p>
            </div>
          )}

          <Explorer
            folders={folders}
            files={files}
            loading={loading}
            viewMode={viewMode}
            activeTab={activeTab}
            searchQuery={searchQuery}
            onOpenFolder={handleOpenFolder}
            onPreview={(item) => {
              setActiveItem(item);
              setModalType('preview');
            }}
            onRename={(item, isFolder) => {
              setActiveItem(item);
              setActiveIsFolder(isFolder);
              setModalType('rename');
            }}
            onMove={(item, isFolder) => {
              setActiveItem(item);
              setActiveIsFolder(isFolder);
              setModalType('move');
            }}
            onDelete={(item, isFolder) => {
              setActiveItem(item);
              setActiveIsFolder(isFolder);
              setModalType('delete');
            }}
            onOpenNewFolder={() => setModalType('createFolder')}
            onOpenUpload={() => setModalType('uploadFile')}
          />
        </main>
      </div>

      {/* Modals */}
      {modalType === 'createFolder' && (
        <CreateFolderModal
          onClose={() => setModalType(null)}
          onSubmit={handleCreateFolder}
        />
      )}

      {modalType === 'uploadFile' && (
        <UploadFileModal
          onClose={() => setModalType(null)}
          onUpload={handleUploadFile}
          currentFolder={currentFolder}
          initialShared={activeTab === 'shared'}
        />
      )}

      {modalType === 'rename' && activeItem && (
        <RenameModal
          item={activeItem}
          isFolder={activeIsFolder}
          onClose={() => { setModalType(null); setActiveItem(null); }}
          onSubmit={handleRename}
        />
      )}

      {modalType === 'move' && activeItem && (
        <MoveModal
          item={activeItem}
          isFolder={activeIsFolder}
          onClose={() => { setModalType(null); setActiveItem(null); }}
          onSubmit={handleMove}
        />
      )}

      {modalType === 'preview' && activeItem && (
        <PreviewModal
          item={activeItem}
          isShared={activeTab === 'shared'}
          onClose={() => { setModalType(null); setActiveItem(null); }}
        />
      )}

      {modalType === 'delete' && activeItem && (
        <DeleteConfirmModal
          item={activeItem}
          isFolder={activeIsFolder}
          onClose={() => { setModalType(null); setActiveItem(null); }}
          onConfirm={handleDelete}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`toast-notification ${toastMessage.type}`}>
          <span>{toastMessage.message}</span>
        </div>
      )}
    </div>
  );
}
