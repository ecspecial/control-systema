export class CreateViolationResponseDto {
  description?: string;
  documents?: string[];
}

export class UpdateViolationResponseStatusDto {
  status: 'approved' | 'needs_revision';
  controllerComment?: string;
}
