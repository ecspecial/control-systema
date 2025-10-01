import { WorkStatus } from '../entities/city-object.entity';

export class UpdateWorkStatusDto {
  status: typeof WorkStatus[keyof typeof WorkStatus];
}
