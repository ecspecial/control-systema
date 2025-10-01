import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  UseGuards, 
  Req, 
  UnauthorizedException,
  ValidationPipe,
  UsePipes,
  ParseUUIDPipe
} from '@nestjs/common';
import { LaboratorySamplesService } from '../services/laboratory-samples.service';
import { CreateLaboratorySampleDto } from '../dto/create-laboratory-sample.dto';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';

@Controller('objects/:objectId/laboratory-samples')
export class LaboratorySamplesController {
  constructor(private readonly samplesService: LaboratorySamplesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(
    @Req() req,
    @Param('objectId', ParseUUIDPipe) objectId: string,
    @Body() createDto: CreateLaboratorySampleDto
  ) {
    if (req.user.role.toLowerCase() !== 'inspector') {
      throw new UnauthorizedException('Only inspectors can create laboratory sample requests');
    }
    return this.samplesService.create(objectId, createDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findByObject(@Param('objectId', ParseUUIDPipe) objectId: string) {
    return this.samplesService.findByObject(objectId);
  }
}
