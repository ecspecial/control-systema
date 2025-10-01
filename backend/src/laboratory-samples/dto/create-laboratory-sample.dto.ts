import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateLaboratorySampleDto {
  @IsNotEmpty()
  @IsString()
  materialName: string;

  @IsNotEmpty()
  @IsString()
  description: string;
}
