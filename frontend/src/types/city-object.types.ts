import type { UUID } from './common.types';
import type { User } from './user.types';

export const ObjectStatus = {
  PLANNED: 'planned',
  ASSIGNED: 'assigned',
  PENDING_ACTIVATION: 'pending_activation',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  PENDING_FIXES: 'pending_fixes',
  FIXING: 'fixing',
  PENDING_APPROVAL: 'pending_approval',
  COMPLETED: 'completed',
  ACCEPTED: 'accepted'
} as const;

export type ObjectStatus = typeof ObjectStatus[keyof typeof ObjectStatus];

// Add a mapping object for status display names
export const ObjectStatusDisplay: Record<ObjectStatus, string> = {
  [ObjectStatus.PLANNED]: 'Ожидает назначения контроля',
  [ObjectStatus.ASSIGNED]: 'Ожидает активации',
  [ObjectStatus.PENDING_ACTIVATION]: 'Ожидает подтверждения акта открытия',
  [ObjectStatus.ACTIVE]: 'В работе',
  [ObjectStatus.SUSPENDED]: 'Работы приостановлены',
  [ObjectStatus.PENDING_FIXES]: 'Требуют устранения замечаний',
  [ObjectStatus.FIXING]: 'Устраняются замечания',
  [ObjectStatus.PENDING_APPROVAL]: 'Ожидают проверки устранения',
  [ObjectStatus.COMPLETED]: 'Работы завершены',
  [ObjectStatus.ACCEPTED]: 'Работы приняты'
};

export interface WorkSchedule {
  startDate: string;
  endDate: string;
  workTypes: WorkType[];
  status?: string;
  updatedStartDate?: string;
  updatedEndDate?: string;
}

// Export the WorkStatus enum
export const WorkStatus = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  SUSPENDED: 'suspended',
  VIOLATION: 'violation',
  SEVERE_VIOLATION: 'severe_violation',
  VIOLATION_FIXED: 'violation_fixed',
  SEVERE_VIOLATION_FIXED: 'severe_violation_fixed',
  COMPLETED: 'completed',
  ACCEPTED: 'accepted',
  PENDING_RESCHEDULE_APPROVE: 'pending_reschedule_approve'
} as const;

export type WorkStatusType = typeof WorkStatus[keyof typeof WorkStatus];

// Update WorkStatusDisplay to include the new status
export const WorkStatusDisplay: Record<WorkStatusType, string> = {
  [WorkStatus.NOT_STARTED]: 'Не начато',
  [WorkStatus.IN_PROGRESS]: 'В работе',
  [WorkStatus.SUSPENDED]: 'Приостановлено',
  [WorkStatus.VIOLATION]: 'Обнаружено нарушение',
  [WorkStatus.SEVERE_VIOLATION]: 'Серьезное нарушение',
  [WorkStatus.VIOLATION_FIXED]: 'Нарушение исправлено',
  [WorkStatus.SEVERE_VIOLATION_FIXED]: 'Серьезное нарушение исправлено',
  [WorkStatus.COMPLETED]: 'Выполнено',
  [WorkStatus.ACCEPTED]: 'Принято',
  [WorkStatus.PENDING_RESCHEDULE_APPROVE]: 'Ожидает подтверждения изменений'
};

// Базовый объект из бэкенда
export interface CityObject {
  id: UUID;
  name: string;
  address: string;
  description: string;
  status: ObjectStatus;
  
  polygon: {
    type: string;
    coordinates: Array<[number, number]>;
  };
  workSchedule?: WorkSchedule;
  documents: ObjectDocument[];
  
  createdBy: User;
  createdById: UUID;
  
  controlUser?: User;
  controlUserId?: UUID;
  
  contractorUser?: User;
  contractorUserId?: UUID;
  
  inspectorUser?: User;
  inspectorUserId?: UUID;
  
  createdAt: string;
  updatedAt: string;
}

// Тип для отображения в карточке
export interface IConstructionObject {
  id: string;
  name: string;
  status: ObjectStatus; // Теперь это тот же enum что и в бэкенде
  coordinates: {
    lat: number;
    lng: number;
    radius: number;
  };
  workTypes: string[];
  schedule: {
    startDate: string;
    endDate: string;
    progress: number;
    hasChanges: boolean;
  };
  responsible: {
    inspector: {
      name: string;
      phone: string;
    };
    contractor: {
      name: string;
      phone: string;
    } | null;
  };
  statistics: {
    activeIssues: number;
    materialsToCheck: number;
    completedWorks: number;
    totalWorks: number;
  };
  lastVisit?: {
    date: string;
    user: string;
    role: 'inspector' | 'contractor' | 'control';
  };
  documents: {
    openingAct?: {
      url: string;
      date: string;
    };
    schedule: {
      url: string;
      lastUpdate: string;
      pendingChanges: boolean;
    };
  };
}

// Типы для работ
export interface WorkType {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  unit: string;
  amount: number;
  status: WorkStatusType;
  updatedStartDate?: string;
  updatedEndDate?: string;
}

// Update the ObjectDocument interface
export interface ObjectDocument {
  id: string;
  type: string;
  name: string;
  path: string;
  status?: string; // Add this field
  createdAt?: string;
  updatedAt?: string;
}

// Add this helper function
const isOpeningAct = (doc: ObjectDocument): boolean => {
  return doc.type === 'opening_act' && doc.status === 'awaiting_approval';
};

// Тип для создания объекта
export interface CreateObjectRequest {
  name: string;
  address: string;
  description: string;
  polygon: {
    type: string;
    coordinates: Array<[number, number]>;
  };
  workSchedule: WorkSchedule;
  documents: ObjectDocument[];
}

