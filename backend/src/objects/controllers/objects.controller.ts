import { Controller, Get, Post, Body, Param, UseGuards, Req, Patch, ForbiddenException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ObjectsService } from '../services/objects.service';
import { CreateObjectDto } from '../dto/create-object.dto';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import type { TokenPayload } from '@shared/modules/jwt/interfaces/token.interface';
import { UpdateScheduleDto } from '../dto/update-schedule.dto';
import { UpdateWorkTypeScheduleDto } from '../dto/update-schedule.dto';
import { UserRole } from '@modules/users/entities/user.entity';
import { WorkStatus } from '../entities/city-object.entity';
import { UpdateWorkStatusDto } from '../dto/update-work-status.dto';
import { ElectronicJournalService } from '../../electronic-journal/services/electronic-journal.service';
import { CreateViolationDto } from '../../electronic-journal/dto/create-violation.dto';
import { ViolationFixability, ViolationType } from '@modules/electronic-journal/entities/electronic-journal.entity';
import { NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

export class ApproveScheduleDto {
  approved: boolean;
}

export class ApproveWorkTypeScheduleDto {
  workTypeId: string;
  approved: boolean;
}

@Controller('objects')
@UseGuards(JwtAuthGuard)
export class ObjectsController {
  constructor(
    private readonly objectsService: ObjectsService,
    private readonly electronicJournalService: ElectronicJournalService
  ) {}

  @Post()
  async create(
    @Body() createObjectDto: CreateObjectDto,
    @Req() request: Request & { user: TokenPayload }
  ) {
    return this.objectsService.create(createObjectDto, request.user.id);
  }

  @Get()
  async findAll(@Req() request: Request & { user: TokenPayload }) {
    return this.objectsService.findAll(request.user.id, request.user.role);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.objectsService.findOne(id);
  }

  @Post(':id/assign-control')
  async assignControl(
    @Param('id') id: string,
    @Body('controlUserId') controlUserId: string,
  ) {
    return this.objectsService.assignControl(id, controlUserId);
  }

  @Post(':id/activate-with-contractor')
  async activateWithContractor(
    @Param('id') id: string,
    @Body() data: { contractorId: string; controlUserId: string },
  ) {
    return this.objectsService.activateWithContractor(id, data.contractorId, data.controlUserId);
  }

  @Patch(':id/schedule')
  async updateSchedule(
    @Param('id') id: string,
    @Body() updateScheduleDto: UpdateScheduleDto,
    @Req() request: Request & { user: TokenPayload }
  ) {
    const isControl = request.user.role === UserRole.CONSTRUCTION_CONTROL;
    return this.objectsService.updateSchedule(id, updateScheduleDto, isControl);
  }

  @Patch(':id/work-type-schedule')
  async updateWorkTypeSchedule(
    @Param('id') id: string,
    @Body() updateWorkTypeScheduleDto: UpdateWorkTypeScheduleDto,
    @Req() request: Request & { user: TokenPayload }
  ) {
    const isControl = request.user.role === UserRole.CONSTRUCTION_CONTROL;
    return this.objectsService.updateWorkTypeSchedule(id, updateWorkTypeScheduleDto, isControl);
  }

  @Patch(':id/schedule/approve')
  async approveScheduleChanges(
    @Param('id') id: string,
    @Body() approveDto: ApproveScheduleDto,
    @Req() request: Request & { user: TokenPayload }
  ) {
    if (request.user.role !== UserRole.CONSTRUCTION_CONTROL) {
      throw new ForbiddenException('Only control users can approve schedule changes');
    }
    return this.objectsService.approveScheduleChanges(id, approveDto.approved);
  }

  @Patch(':id/work-type-schedule/approve')
  async approveWorkTypeScheduleChanges(
    @Param('id') id: string,
    @Body() approveDto: ApproveWorkTypeScheduleDto,
    @Req() request: Request & { user: TokenPayload }
  ) {
    if (request.user.role !== UserRole.CONSTRUCTION_CONTROL) {
      throw new ForbiddenException('Only control users can approve schedule changes');
    }
    return this.objectsService.approveWorkTypeScheduleChanges(id, approveDto.workTypeId, approveDto.approved);
  }

  @Patch(':id/opening-act/:documentId/approve')
  async approveOpeningAct(
    @Param('id') id: string,
    @Param('documentId') documentId: string,
    @Body() { approved }: { approved: boolean },
    @Req() req // Add this to get the user from the request
  ) {
    return this.objectsService.approveOpeningAct(id, documentId, approved, req.user.id);
  }

  @Patch(':id/work-type/:workTypeId/status')
  async updateWorkTypeStatus(
    @Param('id') id: string,
    @Param('workTypeId') workTypeId: string,
    @Body() updateStatusDto: UpdateWorkStatusDto,
    @Req() request: Request & { user: TokenPayload }
  ) {
    const isControl = request.user.role === UserRole.CONSTRUCTION_CONTROL;
    const isInspector = request.user.role === UserRole.INSPECTOR;
    const isContractor = request.user.role === UserRole.CONTRACTOR;

    return this.objectsService.updateWorkTypeStatus(
      id, 
      workTypeId, 
      updateStatusDto.status,
      { isControl, isInspector, isContractor }
    );
  }

  @Post(':id/violations')
  async createViolation(
    @Param('id') id: string,
    @Body() createViolationDto: CreateViolationDto,
    @Req() request: Request & { user: TokenPayload }
  ) {
    if (request.user.role !== UserRole.CONSTRUCTION_CONTROL && 
        request.user.role !== UserRole.INSPECTOR) {
      throw new ForbiddenException('Only control and inspector users can create violations');
    }

    // Get the journal for this object
    const journal = await this.electronicJournalService.getJournalWithViolations(id);
    
    // Add the violation
    return this.electronicJournalService.addViolation(journal.id, {
      ...createViolationDto,
      fixDeadline: new Date(Date.now() + createViolationDto.fixDeadlineDays * 24 * 60 * 60 * 1000)
    });
  }

  // Remove the custom file upload endpoint and use the existing files controller instead
  @Post(':id/violations/:violationId/documents')
  async addViolationDocument(
    @Param('id') id: string,
    @Param('violationId') violationId: string,
    @Body() document: { id: string; name: string; path: string; type: string },
    @Req() request: Request & { user: TokenPayload }
  ) {
    if (request.user.role !== UserRole.CONSTRUCTION_CONTROL && 
        request.user.role !== UserRole.INSPECTOR) {
      throw new ForbiddenException('Only control and inspector users can add documents');
    }

    // Get the journal to verify the violation belongs to this object
    const journal = await this.electronicJournalService.getJournalWithViolations(id);
    const violation = journal.violations.find(v => v.id === violationId);
    
    if (!violation) {
      throw new NotFoundException(`Violation not found in object ${id}`);
    }

    return this.electronicJournalService.addDocumentToViolation(violationId, {
      ...document,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  @Get(':id/violations')
  async getViolations(
    @Param('id') id: string,
    @Req() request: Request & { user: TokenPayload }
  ) {
    const journal = await this.electronicJournalService.getJournalWithViolations(id);
    return journal.violations;
  }
}
