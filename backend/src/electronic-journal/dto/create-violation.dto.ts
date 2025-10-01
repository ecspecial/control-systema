import { ViolationCategory, ViolationType, ViolationFixability } from '../entities/electronic-journal.entity';

export interface LocationDataDto {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
}

export class CreateViolationDto {
  category: string;
  fixability: ViolationFixability;
  type: ViolationType;
  name: string;
  fixDeadlineDays: number;
  locationData: LocationDataDto;
}

export class AddViolationDocumentDto {
  name: string;
  type: string;
}
