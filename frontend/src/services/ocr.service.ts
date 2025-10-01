import axios from 'axios';

const OCR_API_URL = import.meta.env.VITE_OCR_API_URL || 'http://localhost:8000';

// Create separate instance for OCR service
const ocrApi = axios.create({
  baseURL: OCR_API_URL
});

export const ocrService = {
  submitOCR: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await ocrApi.post('/ocr', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  checkOCRStatus: async (taskId: string) => {
    const response = await ocrApi.get(`/ocr/${taskId}`);
    return response.data;
  }
};
