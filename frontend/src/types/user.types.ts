import type { UUID } from './common.types';

export const UserRole = {
  ADMIN: 'admin',
  CONTROL: 'control',
  CONTRACTOR: 'contractor',
  INSPECTOR: 'inspector'
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

// Маппинг для отображения в карточке
export const CardUserRole = {
  [UserRole.ADMIN]: 'admin',
  [UserRole.CONTROL]: 'control',
  [UserRole.CONTRACTOR]: 'contractor',
  [UserRole.INSPECTOR]: 'inspector'
} as const;

export type CardUserRole = typeof CardUserRole[keyof typeof CardUserRole];

export interface User {
  id: UUID;
  login: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  organization?: string;
  department?: string;
  createdAt: string;
  updatedAt: string;
}
