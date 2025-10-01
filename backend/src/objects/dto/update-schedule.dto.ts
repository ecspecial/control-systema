export class UpdateScheduleDto {
  startDate?: string;
  endDate?: string;
}

export class UpdateWorkTypeScheduleDto {
  workTypeId: string;
  startDate?: string;
  endDate?: string;
}

export class ApproveScheduleDto {
  approved: boolean;
}

export class ApproveWorkTypeScheduleDto {
  workTypeId: string;
  approved: boolean;
}
