import api from './api';

export const ttnService = {
  getWorkTypes: async (objectId: string) => {
    const response = await api.get(`/objects/${objectId}/work-types`);
    return response.data;
  },

  createTTNEntry: async (objectId: string, workTypeId: string, data: { description: string }) => {
    const response = await api.post(`/objects/${objectId}/work-types/${workTypeId}/ttn`, data);
    return response.data;
  },

  uploadDocument: async (objectId: string, workTypeId: string, ttnEntryId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(
      `/objects/${objectId}/work-types/${workTypeId}/ttn/${ttnEntryId}/documents`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  getTTNEntries: async (objectId: string, workTypeId: string) => {
    const response = await api.get(`/objects/${objectId}/work-types/${workTypeId}/ttn`);
    return response.data;
  },

  downloadDocument: async (path: string) => {
    // Path comes in format "documents/objectId/filename"
    const parts = path.split('/');
    const objectId = parts[1];
    const filename = parts[2];
    
    if (!objectId || !filename) {
      throw new Error('Invalid file path');
    }

    const response = await api.get(`/files/download/${objectId}/${filename}`, {
      responseType: 'blob',
      headers: {
        'Accept': 'application/octet-stream',
      }
    });
    return response.data;
  }
};
