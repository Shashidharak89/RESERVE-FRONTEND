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

  // Sorting & Pagination state
  const [sortOrder, setSortOrder] = useState(3); // 1: Name ASC, 2: Name DESC, 3: Date DESC (default), 4: Date ASC
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Vault data state
  const [currentFolder, setCurrentFolder] = useState(null);
  const [folderPath, setFolderPath] = useState([]);
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
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
    setPage(1);
  };

  const handleOpenFolder = (folder) => {
    if (folder.visibility === 'PUBLIC' && activeTab !== 'private') {
      navigate(`/share/folder/${folder.id}`);
    } else {
      navigate(`/folder/${folder.id}`);
    }
    setSearchQuery('');
    setPage(1);
  };

  const handleNavigateBreadcrumb = (targetFolder) => {
    if (!targetFolder) {
      if (activeTab === 'private') navigate('/my-files');
      else navigate('/shared');
    } else {
      navigate(`/folder/${targetFolder.id}`);
    }
    setSearchQuery('');
    setPage(1);
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

  const handleUploadFile = async (file, isSharedTarget) => {
    if (isSharedTarget) {
      await api.uploadSharedFile(file);
      showToast(`File "${file.name}" uploaded to Shared Uploads area`);
    } else {
      if (!isAuthenticated) {
        setModalType('auth');
        return;
      }
      const folderId = currentFolder ? currentFolder.id : null;
      await api.uploadPrivateFile(file, folderId);
      showToast(`File "${file.name}" uploaded to Private Vault`);
    }
    window.dispatchEvent(new CustomEvent('reload-contents'));
  };

  const handleRename = async (item, newName, isFolder, visibility) => {
    if (isFolder) {
      await api.renameFolder(item.id, newName, visibility);
      showToast(`Folder updated successfully`);
    } else {
      await api.renameFile(item.id, newName);
      showToast(`File renamed to "${newName}"`);
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

  const handleCopy = async (item, targetFolderId) => {
    if (!isAuthenticated) {
      setModalType('auth');
      return;
    }
    await api.copySharedFile(item.id, targetFolderId);
    showToast(`Copied "${item.originalFilename}" to your private vault`);
    window.dispatchEvent(new CustomEvent('reload-contents'));
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
            <Route
              path="/"
              element={
                <SharedUploadsView
                  searchQuery={searchQuery}
                  sortOrder={sortOrder}
                  setSortOrder={setSortOrder}
                  page={page}
                  setPage={setPage}
                  limit={limit}
                  setLimit={setLimit}
                  viewMode={viewMode}
                  activeTab={activeTab}
                  setFileStats={setFileStats}
                  onPreview={(item) => { setActiveItem(item); setModalType('preview'); }}
                  onCopy={(item) => {
                    if (!isAuthenticated) setModalType('auth');
                    else { setActiveItem(item); setModalType('copy'); }
                  }}
                  onShareLink={(link) => showToast('Share link copied to clipboard')}
                  onOpenUpload={() => setModalType('uploadFile')}
                  showToast={showToast}
                />
              }
            />

            <Route
              path="/shared"
              element={
                <SharedUploadsView
                  searchQuery={searchQuery}
                  sortOrder={sortOrder}
                  setSortOrder={setSortOrder}
                  page={page}
                  setPage={setPage}
                  limit={limit}
                  setLimit={setLimit}
                  viewMode={viewMode}
                  activeTab={activeTab}
                  setFileStats={setFileStats}
                  onPreview={(item) => { setActiveItem(item); setModalType('preview'); }}
                  onCopy={(item) => {
                    if (!isAuthenticated) setModalType('auth');
                    else { setActiveItem(item); setModalType('copy'); }
                  }}
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
                  page={page}
                  setPage={setPage}
                  limit={limit}
                  setLimit={setLimit}
                  viewMode={viewMode}
                  activeTab={activeTab}
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
                  page={page}
                  setPage={setPage}
                  limit={limit}
                  setLimit={setLimit}
                  viewMode={viewMode}
                  activeTab={activeTab}
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
                  page={page}
                  setPage={setPage}
                  limit={limit}
                  setLimit={setLimit}
                  viewMode={viewMode}
                  onOpenFolder={handleOpenFolder}
                  onPreview={(item) => { setActiveItem(item); setModalType('preview'); }}
                  onCopy={(item) => {
                    if (!isAuthenticated) setModalType('auth');
                    else { setActiveItem(item); setModalType('copy'); }
                  }}
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
          onUploadSuccess={(fileResponse, isSharedTarget) => {
            showToast(`File "${fileResponse?.originalFilename || 'File'}" uploaded successfully via WebSocket!`);
            window.dispatchEvent(new CustomEvent('reload-contents'));
          }}
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
          onSubmit={handleCopy}
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

// Sub-component for Shared Uploads Route (/ or /shared)
function SharedUploadsView({
  searchQuery,
  sortOrder,
  setSortOrder,
  page,
  setPage,
  limit,
  setLimit,
  viewMode,
  activeTab,
  setFileStats,
  onPreview,
  onCopy,
  onShareLink,
  onOpenUpload,
  showToast
}) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getSharedFiles(searchQuery, sortOrder, page, limit);
      setFiles(data || []);
      const totalSize = (data || []).reduce((acc, curr) => acc + (curr.fileSize || 0), 0);
      setFileStats({ totalFiles: (data || []).length, totalSize });
    } catch (err) {
      showToast(err.message || 'Failed to load public uploads', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('reload-contents', loadData);
    return () => window.removeEventListener('reload-contents', loadData);
  }, [searchQuery, sortOrder, page, limit]);

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
        viewMode={viewMode}
        activeTab={activeTab}
        searchQuery={searchQuery}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        page={page}
        setPage={setPage}
        limit={limit}
        setLimit={setLimit}
        onPreview={onPreview}
        onCopy={onCopy}
        onShareLink={onShareLink}
        onOpenUpload={onOpenUpload}
      />
    </>
  );
}

// Sub-component for Private Vault Route (/my-files or /folder/:folderId)
function PrivateVaultView({
  isAuthenticated,
  searchQuery,
  sortOrder,
  setSortOrder,
  page,
  setPage,
  limit,
  setLimit,
  viewMode,
  activeTab,
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
  onShareLink,
  onOpenNewFolder,
  onOpenUpload,
  onOpenAuth,
  showToast
}) {
  const { folderId } = useParams();
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const parsedFolderId = folderId ? LongOrNumber(folderId) : null;
      let currFolder = null;
      if (parsedFolderId) {
        currFolder = await api.getFolderDetails(parsedFolderId);
        setCurrentFolder(currFolder);
      } else {
        setCurrentFolder(null);
        setFolderPath([]);
      }

      const [foldersData, filesData] = await Promise.all([
        searchQuery ? [] : api.getFolders(parsedFolderId, searchQuery, sortOrder, page, limit),
        api.getPrivateFiles(parsedFolderId, searchQuery, sortOrder, page, limit)
      ]);

      setFolders(foldersData || []);
      setFiles(filesData || []);

      const totalSize = (filesData || []).reduce((acc, curr) => acc + (curr.fileSize || 0), 0);
      setFileStats({
        totalFiles: (filesData || []).length + (foldersData || []).length,
        totalSize
      });
    } catch (err) {
      showToast(err.message || 'Failed to load folder contents', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('reload-contents', loadData);
    return () => window.removeEventListener('reload-contents', loadData);
  }, [folderId, isAuthenticated, searchQuery, sortOrder, page, limit]);

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
      />
      <Explorer
        folders={folders}
        files={files}
        loading={loading}
        viewMode={viewMode}
        activeTab={activeTab}
        searchQuery={searchQuery}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        page={page}
        setPage={setPage}
        limit={limit}
        setLimit={setLimit}
        onOpenFolder={onOpenFolder}
        onPreview={onPreview}
        onRename={onRename}
        onMove={onMove}
        onDelete={onDelete}
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
  page,
  setPage,
  limit,
  setLimit,
  viewMode,
  onOpenFolder,
  onPreview,
  onCopy,
  onRename,
  onMove,
  onDelete,
  onShareLink,
  showToast
}) {
  const { folderId } = useParams();
  const [folderInfo, setFolderInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getPublicFolderDetails(folderId);
      setFolderInfo(data);
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
      <div className="home-hero-banner">
        <div className="hero-content">
          <div className="d-flex align-items-center gap-2">
            <Globe size={24} className="text-success" />
            <h2>Public Folder: {folderInfo.name}</h2>
          </div>
          <p>Shared folder accessible to anyone with this link.</p>
        </div>
      </div>

      <Explorer
        folders={folderInfo.subFolders || []}
        files={folderInfo.files || []}
        loading={false}
        viewMode={viewMode}
        activeTab="shared"
        searchQuery={searchQuery}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        page={page}
        setPage={setPage}
        limit={limit}
        setLimit={setLimit}
        onOpenFolder={onOpenFolder}
        onPreview={onPreview}
        onCopy={onCopy}
        onRename={folderInfo.isOwner ? onRename : null}
        onMove={folderInfo.isOwner ? onMove : null}
        onDelete={folderInfo.isOwner ? onDelete : null}
        onShareLink={onShareLink}
      />
    </>
  );
}

function LongOrNumber(val) {
  return Number(val);
}
