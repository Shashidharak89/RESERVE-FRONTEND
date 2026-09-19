import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/Layout/Navbar';
import RightSidebar from './components/Layout/RightSidebar';
import Footer from './components/Layout/Footer';
import AuthModal from './components/Auth/AuthModal';
import CreateFolderModal from './components/Modals/CreateFolderModal';
import UploadFileModal from './components/Modals/UploadFileModal';
import RenameModal from './components/Modals/RenameModal';
import MoveModal from './components/Modals/MoveModal';
import CopyModal from './components/Modals/CopyModal';
import PreviewModal from './components/Modals/PreviewModal';
import DeleteConfirmModal from './components/Modals/DeleteConfirmModal';
import { RootRedirect, SharedUploadsView, PrivateVaultView, PublicFolderShareView } from './components/Pages/HomeView';
import { api } from './services/api';
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  // Layout & UI state
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);

  // Sorting & Clipboard state
  const [sortOrder, setSortOrder] = useState(3); // 1: Name ASC, 2: Name DESC, 3: Date DESC (default), 4: Date ASC
  const [clipboardItems, setClipboardItems] = useState(null); // array of { item, isFolder }

  // Vault data state
  const [currentFolder, setCurrentFolder] = useState(null);
  const [folderPath, setFolderPath] = useState([]);
  const [fileStats, setFileStats] = useState({ totalFiles: 0, totalSize: 0 });

  // Modals state
  const [modalType, setModalType] = useState(null);
  const [activeItem, setActiveItem] = useState(null);
  const [activeIsFolder, setActiveIsFolder] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tab/view based on current URL path
  const isPublicSharePage = location.pathname.startsWith('/share/folder/');
  const isPrivatePage = location.pathname.startsWith('/my-files') || location.pathname.startsWith('/folder/');
  const activeTab = isPrivatePage ? 'private' : isPublicSharePage ? 'public-share' : 'shared';

  useEffect(() => {
    checkAuth();
    const handleAuthChange = () => checkAuth();
    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

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

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleTabChange = (tab) => {
    if (tab === 'private') {
      if (!isAuthenticated) {
        setModalType('auth');
        return;
      }
      navigate('/my-files');
    } else {
      navigate('/shared');
    }
    setSearchQuery('');
  };

  const handleOpenFolder = (folder) => {
    if (folder.visibility === 'PUBLIC' && activeTab !== 'private') {
      navigate(`/share/folder/${folder.id}`);
    } else {
      navigate(`/folder/${folder.id}`);
    }
    setSearchQuery('');
  };

  const handleNavigateBreadcrumb = (targetFolder) => {
    if (!targetFolder) {
      if (activeTab === 'private') navigate('/my-files');
      else navigate('/shared');
    } else {
      navigate(`/folder/${targetFolder.id}`);
    }
    setSearchQuery('');
  };

  // Clipboard Copy & Paste handlers inside directories
  const handleCopyClipboard = (items) => {
    const itemArray = Array.isArray(items) ? items : [items];
    setClipboardItems(itemArray);

    // Copy direct Cloudinary or share URLs to system clipboard
    const urls = itemArray.map(ci => {
      if (ci.isFolder) {
        return `${window.location.origin}/share/folder/${ci.item.id}`;
      }
      return ci.item.cloudinaryUrl || api.getDownloadUrl(ci.item.id, ci.item.storageType === 'SHARED_UPLOADS');
    }).filter(Boolean);

    if (urls.length > 0) {
      navigator.clipboard.writeText(urls.join('\n'));
    }

    const count = itemArray.length;
    showToast(`${count} ${count === 1 ? 'URL' : 'URLs'} copied to clipboard!`);
  };

  const handleCancelCopy = () => {
    setClipboardItems(null);
    showToast('Clipboard cleared', 'info');
  };

  const handlePaste = async () => {
    if (!clipboardItems || clipboardItems.length === 0) return;
    if (!isAuthenticated) {
      setModalType('auth');
      return;
    }

    const targetParentId = currentFolder ? currentFolder.id : null;
    let count = 0;

    try {
      for (const ci of clipboardItems) {
        if (ci.isFolder) {
          await api.copyFolder(ci.item.id, targetParentId);
        } else {
          await api.copySharedFile(ci.item.id, targetParentId);
        }
        count++;
      }
      showToast(`Pasted ${count} ${count === 1 ? 'item' : 'items'} into current directory`);
      window.dispatchEvent(new CustomEvent('reload-contents'));
    } catch (err) {
      showToast(err.message || 'Paste operation failed', 'error');
    }
  };

  const handleBulkDelete = async (items) => {
    if (!items || items.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${items.length} selected item(s)?`)) return;
    let count = 0;
    try {
      for (const ci of items) {
        if (ci.isFolder) {
          await api.deleteFolder(ci.item.id);
        } else {
          await api.deleteFile(ci.item.id);
        }
        count++;
      }
      showToast(`Deleted ${count} item(s) from Cloudinary & Database`);
      window.dispatchEvent(new CustomEvent('reload-contents'));
    } catch (err) {
      showToast(err.message || 'Bulk delete failed', 'error');
    }
  };

  // Modal actions
  const handleCreateFolder = async (folderName, visibility) => {
    if (!isAuthenticated) {
      setModalType('auth');
      return;
    }
    const parentId = currentFolder ? currentFolder.id : null;
    await api.createFolder(folderName, parentId, visibility);
    showToast(`Folder "${folderName}" created as ${visibility}`);
    window.dispatchEvent(new CustomEvent('reload-contents'));
  };

  const handleUploadFileSuccess = (fileResponse, isSharedTarget) => {
    showToast(`File "${fileResponse?.originalFilename || 'File'}" uploaded successfully via WebSocket!`);
    window.dispatchEvent(new CustomEvent('reload-contents'));
  };

  const handleRename = async (item, newName, isFolder, visibility) => {
    if (isFolder) {
      await api.renameFolder(item.id, newName, visibility);
      showToast(`Folder updated successfully`);
    } else {
      await api.renameFile(item.id, newName, visibility);
      showToast(`File updated successfully`);
    }
    window.dispatchEvent(new CustomEvent('reload-contents'));
  };

  const handleMove = async (item, targetFolderId, isFolder) => {
    if (isFolder) {
      await api.moveFolder(item.id, targetFolderId);
      showToast(`Folder moved successfully`);
    } else {
      await api.moveFile(item.id, targetFolderId);
      showToast(`File moved successfully`);
    }
    window.dispatchEvent(new CustomEvent('reload-contents'));
  };

  // Copy public folder/file into private vault (recursive for folders)
  const handleCopy = async (item, isFolder) => {
    if (!isAuthenticated) {
      setModalType('auth');
      return;
    }
    try {
      const targetFolderId = currentFolder ? currentFolder.id : null;
      if (isFolder) {
        await api.copyFolder(item.id, targetFolderId);
        showToast(`Public folder "${item.name}" & all subfolders/files copied to your private vault`);
      } else {
        await api.copySharedFile(item.id, targetFolderId);
        showToast(`Copied "${item.originalFilename}" to your private vault`);
      }
      window.dispatchEvent(new CustomEvent('reload-contents'));
    } catch (err) {
      showToast(err.message || 'Copy failed', 'error');
    }
  };

  const handleDelete = async (item, isFolder) => {
    if (isFolder) {
      await api.deleteFolder(item.id);
      showToast(`Folder "${item.name}" and all contents deleted from Cloudinary & Database`);
    } else {
      await api.deleteFile(item.id);
      showToast(`File "${item.originalFilename}" deleted from Cloudinary & Database`);
    }
    window.dispatchEvent(new CustomEvent('reload-contents'));
  };

  if (authChecking) {
    return (
      <div className="app-splash">
        <div className="spinner-large"></div>
        <h2>Initializing Reserve...</h2>
      </div>
    );
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
        onOpenNewFolder={() => {
          if (!isAuthenticated) setModalType('auth');
          else setModalType('createFolder');
        }}
        onOpenAuth={() => setModalType('auth')}
        activeTab={activeTab}
        onToggleRightSidebar={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
      />

      <div className="app-main-content">
        <RightSidebar
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          fileStats={fileStats}
          isOpen={isRightSidebarOpen}
          onClose={() => setIsRightSidebarOpen(false)}
        />

        <main className="main-viewport full-width">
          <Routes>
            {/* Landing Route /: Redirects logged-in users to /my-files, unauthenticated users to /shared */}
            <Route
              path="/"
              element={<RootRedirect isAuthenticated={isAuthenticated} />}
            />

            <Route
              path="/shared"
              element={
                <SharedUploadsView
                  searchQuery={searchQuery}
                  sortOrder={sortOrder}
                  setSortOrder={setSortOrder}
                  viewMode={viewMode}
                  activeTab={activeTab}
                  clipboardItems={clipboardItems}
                  onPaste={handlePaste}
                  onCancelCopy={handleCancelCopy}
                  setFileStats={setFileStats}
                  onPreview={(item) => { setActiveItem(item); setModalType('preview'); }}
                  onCopy={handleCopy}
                  onCopyClipboard={handleCopyClipboard}
                  onShareLink={(link) => showToast('Share link copied to clipboard')}
                  onOpenUpload={() => setModalType('uploadFile')}
                  showToast={showToast}
                />
              }
            />

            <Route
              path="/my-files"
              element={
                <PrivateVaultView
                  folderId={null}
                  isAuthenticated={isAuthenticated}
                  searchQuery={searchQuery}
                  sortOrder={sortOrder}
                  setSortOrder={setSortOrder}
                  viewMode={viewMode}
                  activeTab={activeTab}
                  clipboardItems={clipboardItems}
                  onPaste={handlePaste}
                  onCancelCopy={handleCancelCopy}
                  onBulkDelete={handleBulkDelete}
                  setCurrentFolder={setCurrentFolder}
                  setFolderPath={setFolderPath}
                  folderPath={folderPath}
                  setFileStats={setFileStats}
                  onOpenFolder={handleOpenFolder}
                  onNavigateBreadcrumb={handleNavigateBreadcrumb}
                  onPreview={(item) => { setActiveItem(item); setModalType('preview'); }}
                  onRename={(item, isFolder) => { setActiveItem(item); setActiveIsFolder(isFolder); setModalType('rename'); }}
                  onMove={(item, isFolder) => { setActiveItem(item); setActiveIsFolder(isFolder); setModalType('move'); }}
                  onDelete={(item, isFolder) => { setActiveItem(item); setActiveIsFolder(isFolder); setModalType('delete'); }}
                  onCopy={handleCopy}
                  onCopyClipboard={handleCopyClipboard}
                  onShareLink={(link) => showToast('Share link copied to clipboard')}
                  onOpenNewFolder={() => setModalType('createFolder')}
                  onOpenUpload={() => setModalType('uploadFile')}
                  onOpenAuth={() => setModalType('auth')}
                  showToast={showToast}
                />
              }
            />

            <Route
              path="/folder/:folderId"
              element={
                <PrivateVaultView
                  isAuthenticated={isAuthenticated}
                  searchQuery={searchQuery}
                  sortOrder={sortOrder}
                  setSortOrder={setSortOrder}
                  viewMode={viewMode}
                  activeTab={activeTab}
                  clipboardItems={clipboardItems}
                  onPaste={handlePaste}
                  onCancelCopy={handleCancelCopy}
                  onBulkDelete={handleBulkDelete}
                  setCurrentFolder={setCurrentFolder}
                  setFolderPath={setFolderPath}
                  folderPath={folderPath}
                  setFileStats={setFileStats}
                  onOpenFolder={handleOpenFolder}
                  onNavigateBreadcrumb={handleNavigateBreadcrumb}
                  onPreview={(item) => { setActiveItem(item); setModalType('preview'); }}
                  onRename={(item, isFolder) => { setActiveItem(item); setActiveIsFolder(isFolder); setModalType('rename'); }}
                  onMove={(item, isFolder) => { setActiveItem(item); setActiveIsFolder(isFolder); setModalType('move'); }}
                  onDelete={(item, isFolder) => { setActiveItem(item); setActiveIsFolder(isFolder); setModalType('delete'); }}
                  onCopy={handleCopy}
                  onCopyClipboard={handleCopyClipboard}
                  onShareLink={(link) => showToast('Share link copied to clipboard')}
                  onOpenNewFolder={() => setModalType('createFolder')}
                  onOpenUpload={() => setModalType('uploadFile')}
                  onOpenAuth={() => setModalType('auth')}
                  showToast={showToast}
                />
              }
            />

            <Route
              path="/share/folder/:folderId"
              element={
                <PublicFolderShareView
                  searchQuery={searchQuery}
                  sortOrder={sortOrder}
                  setSortOrder={setSortOrder}
                  viewMode={viewMode}
                  clipboardItems={clipboardItems}
                  onPaste={handlePaste}
                  onCancelCopy={handleCancelCopy}
                  onOpenFolder={handleOpenFolder}
                  onNavigateBreadcrumb={handleNavigateBreadcrumb}
                  onPreview={(item) => { setActiveItem(item); setModalType('preview'); }}
                  onCopy={handleCopy}
                  onCopyClipboard={handleCopyClipboard}
                  onRename={(item, isFolder) => { setActiveItem(item); setActiveIsFolder(isFolder); setModalType('rename'); }}
                  onMove={(item, isFolder) => { setActiveItem(item); setActiveIsFolder(isFolder); setModalType('move'); }}
                  onDelete={(item, isFolder) => { setActiveItem(item); setActiveIsFolder(isFolder); setModalType('delete'); }}
                  onShareLink={(link) => showToast('Share link copied to clipboard')}
                  showToast={showToast}
                />
              }
            />
          </Routes>

          <Footer />
        </main>
      </div>

      {/* Modals */}
      {modalType === 'auth' && (
        <AuthModal onAuthSuccess={() => { setModalType(null); checkAuth(); }} />
      )}

      {modalType === 'createFolder' && (
        <CreateFolderModal
          onClose={() => setModalType(null)}
          onSubmit={handleCreateFolder}
        />
      )}

      {modalType === 'uploadFile' && (
        <UploadFileModal
          onClose={() => setModalType(null)}
          onUploadSuccess={handleUploadFileSuccess}
          currentFolder={currentFolder}
          initialShared={activeTab === 'shared'}
        />
      )}

      {modalType === 'rename' && activeItem && (
        <RenameModal
          item={activeItem}
          isFolder={activeIsFolder}
          onClose={() => setModalType(null)}
          onSubmit={handleRename}
        />
      )}

      {modalType === 'move' && activeItem && (
        <MoveModal
          item={activeItem}
          isFolder={activeIsFolder}
          currentFolder={currentFolder}
          onClose={() => setModalType(null)}
          onMove={handleMove}
        />
      )}

      {modalType === 'preview' && activeItem && (
        <PreviewModal
          file={activeItem}
          onClose={() => setModalType(null)}
          isShared={activeTab === 'shared'}
        />
      )}

      {modalType === 'delete' && activeItem && (
        <DeleteConfirmModal
          item={activeItem}
          isFolder={activeIsFolder}
          onClose={() => setModalType(null)}
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
