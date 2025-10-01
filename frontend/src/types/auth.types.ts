import type { UUID } from './common.types';
import type { UserRole } from './user.types';

export interface LoginRequest {
  login: string;
  password: string;
}

export interface UserProfile {
  id: UUID;
  firstName: string;
  lastName: string;
  middleName?: string;
  role: UserRole;
}

export interface AuthResponse {
  accessToken: string;
  user: UserProfile;
}
