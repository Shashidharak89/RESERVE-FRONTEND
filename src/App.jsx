import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import Navbar from './components/Layout/Navbar';
import Sidebar from './components/Layout/Sidebar';
import Breadcrumbs from './components/Layout/Breadcrumbs';
import Footer from './components/Layout/Footer';
import Explorer from './components/Files/Explorer';
import AuthModal from './components/Auth/AuthModal';
import CreateFolderModal from './components/Modals/CreateFolderModal';
import UploadFileModal from './components/Modals/UploadFileModal';
import RenameModal from './components/Modals/RenameModal';
import MoveModal from './components/Modals/MoveModal';
import CopyModal from './components/Modals/CopyModal';
import PreviewModal from './components/Modals/PreviewModal';
import DeleteConfirmModal from './components/Modals/DeleteConfirmModal';
import { api } from './services/api';
import { Upload, Share2, ShieldCheck, Sparkles, Folder, Globe, Lock } from 'lucide-react';
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  // Layout & UI state
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />

      <div className="app-main-content">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          fileStats={fileStats}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        <main className="main-viewport">
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

      {modalType === 'copy' && activeItem && (
        <CopyModal
          item={activeItem}
          onClose={() => { setModalType(null); setActiveItem(null); }}
          onSubmit={(item, targetFolderId) => handleCopy(item, false)}
        />
      )}

      {modalType === 'preview' && activeItem && (
        <PreviewModal
          item={activeItem}
          isShared={activeTab === 'shared' || !activeItem.folderId}
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

// Redirect Component for / Landing Route
function RootRedirect({ isAuthenticated }) {
  const navigate = useNavigate();
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/my-files', { replace: true });
    } else {
      navigate('/shared', { replace: true });
    }
  }, [isAuthenticated, navigate]);
  return (
    <div className="explorer-loading">
      <div className="spinner-large"></div>
    </div>
  );
}

// Sub-component for Shared Uploads Route (/shared) with Append "View More" Pagination
function SharedUploadsView({
  searchQuery,
  sortOrder,
  setSortOrder,
  viewMode,
  activeTab,
  clipboardItems,
  onPaste,
  onCancelCopy,
  setFileStats,
  onPreview,
  onCopy,
  onCopyClipboard,
  onShareLink,
  onOpenUpload,
  showToast
}) {
  const [files, setFiles] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadData = async (isAppend = false, targetPage = 1) => {
    if (isAppend) setLoadingMore(true);
    else setLoading(true);

    try {
      const data = await api.getSharedFiles(searchQuery, sortOrder, targetPage, limit);
      const newFiles = data || [];

      if (isAppend) {
        setFiles(prev => [...prev, ...newFiles]);
      } else {
        setFiles(newFiles);
      }

      setHasMore(newFiles.length === limit);

      const allFiles = isAppend ? [...files, ...newFiles] : newFiles;
      const totalSize = allFiles.reduce((acc, curr) => acc + (curr.fileSize || 0), 0);
      setFileStats({ totalFiles: allFiles.length, totalSize });
    } catch (err) {
      showToast(err.message || 'Failed to load public uploads', 'error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    loadData(false, 1);
    const handleReload = () => { setPage(1); loadData(false, 1); };
    window.addEventListener('reload-contents', handleReload);
    return () => window.removeEventListener('reload-contents', handleReload);
  }, [searchQuery, sortOrder]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadData(true, nextPage);
  };

  return (
    <>
      <div className="home-hero-banner">
        <div className="hero-content">
          <h2>Public Uploads & Shared Vault</h2>
          <p>Upload files instantly to Cloudinary. Accessible to everyone, copyable to your private folders.</p>
        </div>
        <button className="btn-primary hero-upload-btn" onClick={onOpenUpload}>
          <Upload size={18} />
          <span>Upload to Public Vault</span>
        </button>
      </div>

      <Explorer
        folders={[]}
        files={files}
        loading={loading}
        loadingMore={loadingMore}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        viewMode={viewMode}
        activeTab={activeTab}
        searchQuery={searchQuery}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        clipboardItems={clipboardItems}
        onPaste={onPaste}
        onCancelCopy={onCancelCopy}
        onPreview={onPreview}
        onCopy={onCopy}
        onCopyClipboard={onCopyClipboard}
        onShareLink={onShareLink}
        onOpenUpload={onOpenUpload}
      />
    </>
  );
}

// Sub-component for Private Vault Route (/my-files or /folder/:folderId) with Append "View More" Pagination
function PrivateVaultView({
  isAuthenticated,
  searchQuery,
  sortOrder,
  setSortOrder,
  viewMode,
  activeTab,
  clipboardItems,
  onPaste,
  onCancelCopy,
  onBulkDelete,
  setCurrentFolder,
  setFolderPath,
  folderPath,
  setFileStats,
  onOpenFolder,
  onNavigateBreadcrumb,
  onPreview,
  onRename,
  onMove,
  onDelete,
  onCopy,
  onCopyClipboard,
  onShareLink,
  onOpenNewFolder,
  onOpenUpload,
  onOpenAuth,
  showToast
}) {
  const { folderId } = useParams();
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadData = async (isAppend = false, targetPage = 1) => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    if (isAppend) setLoadingMore(true);
    else setLoading(true);

    try {
      const parsedFolderId = folderId ? Number(folderId) : null;
      let currFolder = null;

      if (!isAppend) {
        if (parsedFolderId) {
          currFolder = await api.getFolderDetails(parsedFolderId);
          setCurrentFolder(currFolder);
          buildFolderPath(currFolder);
        } else {
          setCurrentFolder(null);
          setFolderPath([]);
        }
      }

      const [foldersData, filesData] = await Promise.all([
        searchQuery ? [] : api.getFolders(parsedFolderId, searchQuery, sortOrder, targetPage, limit),
        api.getPrivateFiles(parsedFolderId, searchQuery, sortOrder, targetPage, limit)
      ]);

      const newFolders = foldersData || [];
      const newFiles = filesData || [];

      if (isAppend) {
        setFolders(prev => [...prev, ...newFolders]);
        setFiles(prev => [...prev, ...newFiles]);
      } else {
        setFolders(newFolders);
        setFiles(newFiles);
      }

      setHasMore(newFolders.length === limit || newFiles.length === limit);

      const allFiles = isAppend ? [...files, ...newFiles] : newFiles;
      const allFolders = isAppend ? [...folders, ...newFolders] : newFolders;
      const totalSize = allFiles.reduce((acc, curr) => acc + (curr.fileSize || 0), 0);

      setFileStats({
        totalFiles: allFiles.length + allFolders.length,
        totalSize
      });
    } catch (err) {
      showToast(err.message || 'Failed to load folder contents', 'error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const buildFolderPath = (folder) => {
    if (!folder) {
      setFolderPath([]);
      return;
    }
    const chain = [];
    let current = folder;
    while (current) {
      chain.unshift({ id: current.id, name: current.name });
      current = current.parentFolder;
    }
    setFolderPath(chain);
  };

  useEffect(() => {
    setPage(1);
    loadData(false, 1);
    const handleReload = () => { setPage(1); loadData(false, 1); };
    window.addEventListener('reload-contents', handleReload);
    return () => window.removeEventListener('reload-contents', handleReload);
  }, [folderId, isAuthenticated, searchQuery, sortOrder]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadData(true, nextPage);
  };

  if (!isAuthenticated) {
    return (
      <div className="explorer-empty">
        <div className="empty-state">
          <Lock size={54} className="empty-icon text-muted" />
          <h3>Authentication Required</h3>
          <p>Please log in or create an account to access your private vault.</p>
          <button className="btn-primary mt-3" onClick={onOpenAuth}>
            Sign In / Register
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Breadcrumbs
        folderPath={folderPath}
        onNavigate={onNavigateBreadcrumb}
        isPublic={false}
      />
      <Explorer
        folders={folders}
        files={files}
        loading={loading}
        loadingMore={loadingMore}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        viewMode={viewMode}
        activeTab={activeTab}
        searchQuery={searchQuery}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        clipboardItems={clipboardItems}
        onPaste={onPaste}
        onCancelCopy={onCancelCopy}
        onBulkDelete={onBulkDelete}
        onOpenFolder={onOpenFolder}
        onPreview={onPreview}
        onRename={onRename}
        onMove={onMove}
        onDelete={onDelete}
        onCopy={onCopy}
        onCopyClipboard={onCopyClipboard}
        onShareLink={onShareLink}
        onOpenNewFolder={onOpenNewFolder}
        onOpenUpload={onOpenUpload}
      />
    </>
  );
}

// Sub-component for Public Folder Share Route (/share/folder/:folderId)
function PublicFolderShareView({
  searchQuery,
  sortOrder,
  setSortOrder,
  viewMode,
  clipboardItems,
  onPaste,
  onCancelCopy,
  onOpenFolder,
  onNavigateBreadcrumb,
  onPreview,
  onCopy,
  onCopyClipboard,
  onRename,
  onMove,
  onDelete,
  onShareLink,
  showToast
}) {
  const { folderId } = useParams();
  const [folderInfo, setFolderInfo] = useState(null);
  const [folderPath, setFolderPath] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getPublicFolderDetails(folderId);
      setFolderInfo(data);
      if (data) {
        setFolderPath([{ id: data.id, name: data.name }]);
      }
    } catch (err) {
      showToast(err.message || 'Folder not found or is private', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('reload-contents', loadData);
    return () => window.removeEventListener('reload-contents', loadData);
  }, [folderId]);

  if (loading) {
    return (
      <div className="explorer-loading">
        <div className="spinner-large"></div>
        <p>Loading shared folder...</p>
      </div>
    );
  }

  if (!folderInfo) {
    return (
      <div className="explorer-empty">
        <div className="empty-state">
          <Lock size={54} className="empty-icon text-muted" />
          <h3>Folder Unavailable</h3>
          <p>This folder does not exist or has been set to Private by its owner.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Breadcrumbs
        folderPath={folderPath}
        onNavigate={onNavigateBreadcrumb}
        isPublic={true}
      />

      <Explorer
        folders={folderInfo.subFolders || []}
        files={folderInfo.files || []}
        loading={false}
        viewMode={viewMode}
        activeTab="shared"
        searchQuery={searchQuery}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        clipboardItems={clipboardItems}
        onPaste={onPaste}
        onCancelCopy={onCancelCopy}
        onOpenFolder={onOpenFolder}
        onPreview={onPreview}
        onCopy={onCopy}
        onCopyClipboard={onCopyClipboard}
        onRename={folderInfo.isOwner ? onRename : null}
        onMove={folderInfo.isOwner ? onMove : null}
        onDelete={folderInfo.isOwner ? onDelete : null}
        onShareLink={onShareLink}
      />
    </>
  );
}
