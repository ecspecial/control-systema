import api from './api';
import { v4 as uuidv4 } from 'uuid'; // Add this import

// Known document types (add more as needed)
export type DocumentType = 'opening_act' | 'violation_document' | string;

export const filesService = {
  uploadFile: async (objectId: string, type: string, file: File, documentName?: string) => {
    const formData = new FormData();
    
    // Generate UUID-based filename while preserving extension
    const fileExtension = file.name.split('.').pop() || '';
    const uuidFilename = `${uuidv4()}.${fileExtension}`;
    
    // Create a new File object with the UUID filename
    const renamedFile = new File([file], uuidFilename, { type: file.type });
    
    formData.append('file', renamedFile);
    formData.append('originalName', file.name); // Store original name
    if (documentName) {
      formData.append('documentName', documentName);
    }

    const { data } = await api.post(`/files/upload/${objectId}/${type}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  downloadFile: async (objectId: string, fileId: string, originalName?: string) => {
    // Extract just the filename if a full path is provided
    const filename = fileId.split('/').pop() || fileId;
    
    const response = await api.get(`/files/download/${objectId}/${filename}`, {
      responseType: 'blob'
    });
    
    // Create a URL for the blob
    const url = window.URL.createObjectURL(new Blob([response.data]));
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = url;
    
    // Use original name for download if available, fallback to fileId
    const downloadName = originalName || filename;
    link.setAttribute('download', downloadName);
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL
    window.URL.revokeObjectURL(url);
  }
};
