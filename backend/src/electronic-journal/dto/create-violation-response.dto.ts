export class CreateViolationResponseDto {
  description?: string;
  documents?: string[]; // Array of document IDs if they're uploaded separately
}

export class UpdateViolationResponseStatusDto {
  status: 'approved' | 'needs_revision';
  controllerComment?: string;
}
