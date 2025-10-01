import { IsString, IsNotEmpty, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class PolygonDto {
  @IsString()
  type: string;

  @IsArray()
  coordinates: Array<[number, number]>;
}

class WorkTypeDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  startDate: string;

  @IsString()
  @IsNotEmpty()
  endDate: string;
}

class WorkScheduleDto {
  @IsString()
  @IsNotEmpty()
  startDate: string;

  @IsString()
  @IsNotEmpty()
  endDate: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkTypeDto)
  workTypes: WorkTypeDto[];
}

export class CreateObjectDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @ValidateNested()
  @Type(() => PolygonDto)
  polygon: PolygonDto;

  @ValidateNested()
  @Type(() => WorkScheduleDto)
  workSchedule: WorkScheduleDto;

  @IsArray()
  documents: any[]; // TODO: Добавить валидацию для документов
}
