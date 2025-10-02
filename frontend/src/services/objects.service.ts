import api from './api';
import type { CreateObjectRequest } from '../types/city-object.types';
import { filesService } from './files.service';
import { getCurrentPosition } from '../utils/geolocation';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
}

interface CreateViolationData {
  category: string;
  fixability: string;
  type: string;
  name: string;
  fixDeadlineDays: number;
  locationData: LocationData;
}

export const objectsService = {
  create: async (data: CreateObjectRequest) => {
    const response = await api.post('/objects', data);
    return response.data;
  },

  getAll: async () => {
    const response = await api.get('/objects');
    return response.data;
  },

  getOne: async (id: string) => {
    const response = await api.get(`/objects/${id}`);
    return response.data;
  },

  assignControl: async (objectId: string, controlUserId: string) => {
    const { data } = await api.post(`/objects/${objectId}/assign-control`, {
      controlUserId
    });
    return data;
  },

  activateWithContractor: async (objectId: string, contractorId: string, controlUserId: string) => {
    const { data } = await api.post(`/objects/${objectId}/activate-with-contractor`, {
      contractorId,
      controlUserId
    });
    return data;
  },

  updateSchedule: async (objectId: string, schedule: { startDate: string; endDate: string }) => {
    const { data } = await api.patch(`/objects/${objectId}/schedule`, schedule);
    return data;
  },

  updateWorkTypeSchedule: async (objectId: string, data: { workTypeId: string; startDate: string; endDate: string }) => {
    const { data: response } = await api.patch(`/objects/${objectId}/work-type-schedule`, data);
    return response;
  },

  approveSchedule: async (objectId: string, approved: boolean) => {
    const { data } = await api.patch(`/objects/${objectId}/schedule/approve`, { approved });
    return data;
  },

  approveWorkTypeSchedule: async (objectId: string, workTypeId: string, approved: boolean) => {
    const { data } = await api.patch(`/objects/${objectId}/work-type-schedule/approve`, { workTypeId, approved });
    return data;
  },

  approveOpeningAct: async (objectId: string, documentId: string, approved: boolean) => {
    const { data } = await api.patch(`/objects/${objectId}/opening-act/${documentId}/approve`, { approved });
    return data;
  },

  updateWorkTypeStatus: async (objectId: string, workTypeId: string, status: string) => {
    const { data } = await api.patch(`/objects/${objectId}/work-type/${workTypeId}/status`, { status });
    return data;
  },

  createViolation: async (objectId: string, data: CreateViolationData) => {
    const { data: response } = await api.post(`/objects/${objectId}/violations`, data);
    return response;
  },

  getViolations: async (objectId: string) => {
    const { data } = await api.get(`/objects/${objectId}/violations`);
    return data;
  },

  uploadViolationDocument: async (objectId: string, violationId: string, file: File) => {
    // First upload the file using existing files service
    const document = await filesService.uploadFile(objectId, 'violation_document', file);

    // Then attach it to the violation
    const { data } = await api.post(`/objects/${objectId}/violations/${violationId}/documents`, {
      ...document,
      originalName: file.name // Add the original name
    });
    return data;
  },

  createViolationResponse: async (
    objectId: string,
    violationId: string,
    data: { description?: string }
  ) => {
    const response = await api.post(
      `/objects/${objectId}/violations/${violationId}/responses`,
      data
    );
    return response.data;
  },

  uploadViolationResponseDocument: async (
    objectId: string,
    violationId: string,
    responseId: string,
    file: File
  ) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(
      `/objects/${objectId}/violations/${violationId}/responses/${responseId}/documents`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  updateViolationResponseStatus: async (
    objectId: string,
    violationId: string,
    responseId: string,
    data: { status: string; controllerComment?: string }
  ) => {
    const response = await api.patch(
      `/objects/${objectId}/violations/${violationId}/responses/${responseId}`,
      data
    );
    return response.data;
  },

  getLaboratorySamples: async (objectId: string) => {
    const response = await api.get(`/objects/${objectId}/laboratory-samples`);
    return response.data;
  },

  createLaboratorySample: async (objectId: string, data: { materialName: string; description: string }) => {
    const response = await api.post(`/objects/${objectId}/laboratory-samples`, data);
    return response.data;
  },

  deleteObject: async (objectId: string) => {
    const response = await api.delete(`/objects/${objectId}`);
    return response.data;
  }
};
