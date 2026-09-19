import { api } from './api';

export function uploadFileViaWebSocket(file, { isShared = false, folderId = null, onProgress, onComplete, onError }) {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsHost = import.meta.env.VITE_WS_URL || `${wsProtocol}//${window.location.hostname}:8080/ws/upload`;
  const socket = new WebSocket(wsHost);

  const uploadId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const token = api.getToken();
  const chunkSize = 128 * 1024; // 128 KB chunk size for smooth progress updates
  const totalChunks = Math.ceil(file.size / chunkSize);

  socket.onopen = () => {
    // Send INIT_UPLOAD message
    const initMessage = {
      type: 'INIT_UPLOAD',
      uploadId,
      filename: file.name,
      totalSize: file.size,
      mimeType: file.type || 'application/octet-stream',
      isShared,
      folderId: folderId ? Number(folderId) : null,
      token: token || null
    };
    socket.send(JSON.stringify(initMessage));
  };

  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);

      if (message.type === 'INIT_ACK') {
        // Start sending chunks sequentially
        sendChunks(0);
      } else if (message.type === 'PROGRESS') {
        if (onProgress) {
          onProgress({
            percentage: message.percentage,
            bytesUploaded: message.bytesUploaded,
            totalBytes: message.totalBytes,
            chunkIndex: message.chunkIndex,
            totalChunks: message.totalChunks,
            status: message.status
          });
        }
      } else if (message.type === 'COMPLETE') {
        if (onProgress) {
          onProgress({
            percentage: 100,
            bytesUploaded: file.size,
            totalBytes: file.size,
            chunkIndex: totalChunks - 1,
            totalChunks,
            status: 'COMPLETED'
          });
        }
        if (onComplete) {
          onComplete(message.data);
        }
        socket.close();
      } else if (message.type === 'ERROR') {
        if (onError) {
          onError(message.message || 'WebSocket upload failed');
        }
        socket.close();
      }
    } catch (err) {
      if (onError) onError('Failed to parse WebSocket server response');
    }
  };

  socket.onerror = (err) => {
    if (onError) onError('WebSocket connection error. Please check server status.');
  };

  const sendChunks = async (currentChunk) => {
    if (currentChunk >= totalChunks) return;

    const start = currentChunk * chunkSize;
    const end = Math.min(file.size, start + chunkSize);
    const chunkBlob = file.slice(start, end);

    const reader = new FileReader();
    reader.onload = (e) => {
      if (socket.readyState !== WebSocket.OPEN) return;

      const arrayBuffer = e.target.result;
      const base64Data = arrayBufferToBase64(arrayBuffer);

      const chunkMessage = {
        type: 'UPLOAD_CHUNK',
        uploadId,
        chunkIndex: currentChunk,
        totalChunks,
        data: base64Data
      };

      socket.send(JSON.stringify(chunkMessage));

      // Schedule next chunk
      if (currentChunk + 1 < totalChunks) {
        setTimeout(() => sendChunks(currentChunk + 1), 10);
      }
    };

    reader.readAsArrayBuffer(chunkBlob);
  };

  function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  // Return cancel function
  return () => {
    if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
      socket.close();
    }
  };
}
