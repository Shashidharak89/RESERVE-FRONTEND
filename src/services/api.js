const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const getAuthHeaders = (isMultipart = false) => {
  const token = localStorage.getItem('reserve_token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  let data = null;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  }

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('reserve_token');
      localStorage.removeItem('reserve_user');
      window.dispatchEvent(new Event('auth-change'));
    }
    const errorMessage = (data && data.message) ? data.message : `Request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  return data ? data.data : null;
};

export const api = {
  // Auth APIs
  async register(name, email, password) {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await handleResponse(res);
    if (data && data.token) {
      localStorage.setItem('reserve_token', data.token);
      localStorage.setItem('reserve_user', JSON.stringify(data.user));
      window.dispatchEvent(new Event('auth-change'));
    }
    return data;
  },

  async login(email, password) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await handleResponse(res);
    if (data && data.token) {
      localStorage.setItem('reserve_token', data.token);
      localStorage.setItem('reserve_user', JSON.stringify(data.user));
      window.dispatchEvent(new Event('auth-change'));
    }
    return data;
  },

  async getMe() {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return await handleResponse(res);
  },

  logout() {
    localStorage.removeItem('reserve_token');
    localStorage.removeItem('reserve_user');
    window.dispatchEvent(new Event('auth-change'));
  },

  getCurrentUser() {
    const user = localStorage.getItem('reserve_user');
    return user ? JSON.parse(user) : null;
  },

  getToken() {
    return localStorage.getItem('reserve_token');
  },

  // Folder APIs
  async createFolder(name, parentId = null) {
    const res = await fetch(`${API_BASE_URL}/folders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name, parentId }),
    });
    return await handleResponse(res);
  },

  async getFolders(parentId = null) {
    const url = parentId 
      ? `${API_BASE_URL}/folders?parentId=${parentId}`
      : `${API_BASE_URL}/folders`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    return await handleResponse(res);
  },

  async getFolderDetails(folderId) {
    const res = await fetch(`${API_BASE_URL}/folders/${folderId}`, {
      headers: getAuthHeaders(),
    });
    return await handleResponse(res);
  },

  async renameFolder(folderId, name) {
    const res = await fetch(`${API_BASE_URL}/folders/${folderId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name }),
    });
    return await handleResponse(res);
  },

  async moveFolder(folderId, targetParentId) {
    const res = await fetch(`${API_BASE_URL}/folders/${folderId}/move`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ targetParentId }),
    });
    return await handleResponse(res);
  },

  async deleteFolder(folderId) {
    const res = await fetch(`${API_BASE_URL}/folders/${folderId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return await handleResponse(res);
  },

  // Private File APIs
  async uploadPrivateFile(file, folderId = null) {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) {
      formData.append('folderId', folderId);
    }

    const res = await fetch(`${API_BASE_URL}/files/upload`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData,
    });
    return await handleResponse(res);
  },

  async getPrivateFiles(folderId = null, search = '') {
    let url = `${API_BASE_URL}/files`;
    const params = new URLSearchParams();
    if (folderId) params.append('folderId', folderId);
    if (search) params.append('search', search);
    if (params.toString()) url += `?${params.toString()}`;

    const res = await fetch(url, { headers: getAuthHeaders() });
    return await handleResponse(res);
  },

  async renameFile(fileId, name) {
    const res = await fetch(`${API_BASE_URL}/files/${fileId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name }),
    });
    return await handleResponse(res);
  },

  async moveFile(fileId, targetFolderId) {
    const res = await fetch(`${API_BASE_URL}/files/${fileId}/move`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ targetFolderId }),
    });
    return await handleResponse(res);
  },

  async deleteFile(fileId) {
    const res = await fetch(`${API_BASE_URL}/files/${fileId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return await handleResponse(res);
  },

  getDownloadUrl(fileId, isShared = false) {
    const token = this.getToken();
    const endpoint = isShared ? `uploads/${fileId}/download` : `files/${fileId}/download`;
    return `${API_BASE_URL}/${endpoint}`;
  },

  async copySharedFile(fileId, targetFolderId = null) {
    const res = await fetch(`${API_BASE_URL}/files/copy/${fileId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ targetFolderId }),
    });
    return await handleResponse(res);
  },

  async uploadSharedFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE_URL}/uploads`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData,
    });
    return await handleResponse(res);
  },

  async getSharedFiles(search = '') {
    let url = `${API_BASE_URL}/uploads`;
    if (search) url += `?search=${encodeURIComponent(search)}`;

    const headers = {};
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, { headers });
    return await handleResponse(res);
  },
};
