import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, Lock } from 'lucide-react';
import Breadcrumbs from '../Layout/Breadcrumbs';
import Explorer from '../Explorer/Explorer';
import { api } from '../../services/api';

// Redirect Component for / Landing Route
export function RootRedirect({ isAuthenticated }) {
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

// Shared Uploads View Route (/shared) with Append "View More" Pagination
export function SharedUploadsView({
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

// Private Vault View Route (/my-files or /folder/:folderId) with Append "View More" Pagination
export function PrivateVaultView({
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
          // Only rebuild path from API if folderPath is empty (direct URL access / page refresh).
          // When user navigates via UI, App.jsx handles the stack-based push.
          if (folderPath.length === 0) {
            buildFolderPath(currFolder);
          }
        } else {
          setCurrentFolder(null);
          // At root — only clear path if not already managed by App.jsx
          if (folderPath.length > 0 && !folderId) {
            setFolderPath([]);
          }
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
        onShareLink={onShareLink}
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

// Public Folder Share View Route (/share/folder/:folderId)
export function PublicFolderShareView({
  searchQuery,
  sortOrder,
  setSortOrder,
  viewMode,
  clipboardItems,
  onPaste,
  onCancelCopy,
  onOpenFolder,
  onNavigateBreadcrumb,
  folderPath = [],
  setFolderPath,
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
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getPublicFolderDetails(folderId);
      setFolderInfo(data);
      if (data && folderPath.length === 0 && setFolderPath) {
        // Fallback: rebuild path from API when directly accessing a URL (page refresh)
        const chain = [];
        let current = data;
        while (current) {
          chain.unshift({ id: current.id, name: current.name });
          current = current.parentFolder;
        }
        setFolderPath(chain);
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
        onShareLink={onShareLink}
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
