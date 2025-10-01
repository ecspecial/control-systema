import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ObjectsRepository } from '../repositories/objects.repository';
import { CreateObjectDto } from '../dto/create-object.dto';
import { CityObject, ObjectStatus, WorkStatus } from '../entities/city-object.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ElectronicJournalService } from '../../electronic-journal/services/electronic-journal.service';
import { UpdateScheduleDto, UpdateWorkTypeScheduleDto } from '../dto/update-schedule.dto';
import * as fs from 'fs';

interface Document {
  id: string;
  type: string;  // Known types: "opening_act"
  name: string;
  path: string;
  status: string; // Known statuses: "awaiting_approval", "approved", "rejected"
  createdAt: string;
  updatedAt: string;
}

interface UserRoles {
  isControl: boolean;
  isInspector: boolean;
  isContractor: boolean;
}

@Injectable()
export class ObjectsService {
  constructor(
    private readonly objectsRepository: ObjectsRepository,
    @InjectRepository(CityObject)
    private readonly objectRepository: Repository<CityObject>,
    private readonly electronicJournalService: ElectronicJournalService,
  ) {}

  async create(createObjectDto: CreateObjectDto, userId: string): Promise<CityObject> {
    // If work schedule exists, set all work types to NOT_STARTED
    if (createObjectDto.workSchedule?.workTypes) {
      createObjectDto.workSchedule.workTypes = createObjectDto.workSchedule.workTypes.map(workType => ({
        ...workType,
        status: WorkStatus.NOT_STARTED
      }));
    }

    const object = await this.objectsRepository.create(createObjectDto, userId);
    
    // Create electronic journal for the new object
    await this.electronicJournalService.createJournal(object.id);

    return object;
  }

  async findAll(userId: string, userRole: string): Promise<CityObject[]> {
    return this.objectsRepository.findAll(userId, userRole);
  }

  async findOne(id: string): Promise<CityObject> {
    const object = await this.objectsRepository.findOne(id);
    if (!object) {
      throw new NotFoundException(`Object with ID "${id}" not found`);
    }
    return object;
  }

  async assignControl(objectId: string, controlUserId: string) {
    const object = await this.objectRepository.findOne({ where: { id: objectId } });
    if (!object) {
      throw new NotFoundException(`Object with ID "${objectId}" not found`);
    }
    if (object.status !== ObjectStatus.PLANNED) {
      throw new BadRequestException('Can only assign control to planned objects');
    }

    object.controlUserId = controlUserId;
    return this.objectRepository.save(object);
  }

  async activateWithContractor(objectId: string, contractorId: string, controlUserId: string) {
    const object = await this.objectRepository.findOne({ where: { id: objectId } });
    if (!object) {
      throw new NotFoundException(`Object with ID "${objectId}" not found`);
    }
    if (object.status !== ObjectStatus.PLANNED) {
      throw new BadRequestException('Can only activate planned objects');
    }

    object.contractorUserId = contractorId;
    object.controlUserId = controlUserId;
    object.status = ObjectStatus.ASSIGNED;
    
    return this.objectRepository.save(object);
  }

  async addDocument(objectId: string, document: Document) {
    const object = await this.objectRepository.findOne({ where: { id: objectId } });
    if (!object) {
      throw new NotFoundException(`Object with ID "${objectId}" not found`);
    }

    // Initialize documents array if it doesn't exist
    if (!object.documents) {
      object.documents = [];
    }

    // Add new document
    object.documents.push(document);

    // If the document is an opening act and object is in ASSIGNED status, 
    // update status to PENDING_ACTIVATION
    if (document.type === 'opening_act' && object.status === ObjectStatus.ASSIGNED) {
      object.status = ObjectStatus.PENDING_ACTIVATION;
    }

    // Save updated object
    await this.objectRepository.save(object);

    return object;
  }

  async updateDocumentStatus(objectId: string, documentId: string, status: string) {
    const object = await this.objectRepository.findOne({ where: { id: objectId } });
    if (!object) {
      throw new NotFoundException(`Object with ID "${objectId}" not found`);
    }

    const document = object.documents?.find(doc => doc.id === documentId);
    if (!document) {
      throw new NotFoundException(`Document with ID "${documentId}" not found`);
    }

    document.status = status;
    document.updatedAt = new Date().toISOString();

    await this.objectRepository.save(object);

    return object;
  }

  async updateSchedule(
    id: string, 
    updateScheduleDto: UpdateScheduleDto,
    isControl: boolean
  ) {
    const object = await this.objectRepository.findOne({ where: { id } });
    if (!object) {
      throw new NotFoundException(`Object with ID "${id}" not found`);
    }

    if (!object.workSchedule) {
      throw new BadRequestException('Object has no work schedule');
    }

    if (isControl) {
      // Control user can update dates directly
      object.workSchedule.startDate = updateScheduleDto.startDate || object.workSchedule.startDate;
      object.workSchedule.endDate = updateScheduleDto.endDate || object.workSchedule.endDate;
      object.workSchedule.updatedStartDate = undefined;
      object.workSchedule.updatedEndDate = undefined;
      // Keep the current status, don't set to undefined
    } else {
      // Contractor's changes need approval
      object.workSchedule.updatedStartDate = updateScheduleDto.startDate;
      object.workSchedule.updatedEndDate = updateScheduleDto.endDate;
      
      // Only store lastStatus if current status isn't already pending_reschedule_approve
      if (object.workSchedule.status !== WorkStatus.PENDING_RESCHEDULE_APPROVE) {
        object.workSchedule.lastStatus = object.workSchedule.status;
      }
      object.workSchedule.status = WorkStatus.PENDING_RESCHEDULE_APPROVE;
    }

    return this.objectRepository.save(object);
  }

  async updateWorkTypeSchedule(
    id: string,
    updateDto: UpdateWorkTypeScheduleDto,
    isControl: boolean
  ) {
    const object = await this.objectRepository.findOne({ where: { id } });
    if (!object) {
      throw new NotFoundException(`Object with ID "${id}" not found`);
    }

    if (!object.workSchedule?.workTypes) {
      throw new BadRequestException('Object has no work types');
    }

    const workType = object.workSchedule.workTypes.find(wt => wt.id === updateDto.workTypeId);
    if (!workType) {
      throw new NotFoundException(`Work type with ID "${updateDto.workTypeId}" not found`);
    }

    if (isControl) {
      // Control user can update dates directly
      workType.startDate = updateDto.startDate || workType.startDate;
      workType.endDate = updateDto.endDate || workType.endDate;
      workType.updatedStartDate = undefined;
      workType.updatedEndDate = undefined;
      // Keep the current status, don't change it
    } else {
      // Contractor's changes need approval
      workType.updatedStartDate = updateDto.startDate;
      workType.updatedEndDate = updateDto.endDate;
      
      // Only store lastStatus if current status isn't already pending_reschedule_approve
      if (workType.status !== WorkStatus.PENDING_RESCHEDULE_APPROVE) {
        workType.lastStatus = workType.status;
      }
      workType.status = WorkStatus.PENDING_RESCHEDULE_APPROVE;
    }

    return this.objectRepository.save(object);
  }

  async approveScheduleChanges(id: string, approved: boolean): Promise<CityObject> {
    const object = await this.objectRepository.findOne({ where: { id } });
    if (!object) {
      throw new NotFoundException(`Object with ID "${id}" not found`);
    }

    if (!object.workSchedule) {
      throw new BadRequestException('Object has no work schedule');
    }

    if (object.workSchedule.status !== WorkStatus.PENDING_RESCHEDULE_APPROVE) {
      throw new BadRequestException('Schedule is not pending approval');
    }

    if (approved) {
      // Apply the requested changes
      object.workSchedule.startDate = object.workSchedule.updatedStartDate!;
      object.workSchedule.endDate = object.workSchedule.updatedEndDate!;
      object.workSchedule.status = object.workSchedule.lastStatus || WorkStatus.NOT_STARTED;
    } else {
      // Reject changes, restore previous status
      object.workSchedule.status = object.workSchedule.lastStatus || WorkStatus.NOT_STARTED;
    }

    // Clear update fields
    object.workSchedule.updatedStartDate = undefined;
    object.workSchedule.updatedEndDate = undefined;
    object.workSchedule.lastStatus = undefined;

    return this.objectRepository.save(object);
  }

  async approveWorkTypeScheduleChanges(id: string, workTypeId: string, approved: boolean): Promise<CityObject> {
    const object = await this.objectRepository.findOne({ where: { id } });
    if (!object) {
      throw new NotFoundException(`Object with ID "${id}" not found`);
    }

    if (!object.workSchedule?.workTypes) {
      throw new BadRequestException('Object has no work types');
    }

    const workType = object.workSchedule.workTypes.find(wt => wt.id === workTypeId);
    if (!workType) {
      throw new NotFoundException(`Work type with ID "${workTypeId}" not found`);
    }

    if (workType.status !== WorkStatus.PENDING_RESCHEDULE_APPROVE) {
      throw new BadRequestException('Work type schedule is not pending approval');
    }

    if (approved) {
      // Apply the requested changes
      workType.startDate = workType.updatedStartDate!;
      workType.endDate = workType.updatedEndDate!;
      workType.status = workType.lastStatus || WorkStatus.NOT_STARTED;
    } else {
      // Reject changes, restore previous status
      workType.status = workType.lastStatus || WorkStatus.NOT_STARTED;
    }

    // Clear update fields
    workType.updatedStartDate = undefined;
    workType.updatedEndDate = undefined;
    workType.lastStatus = undefined;

    return this.objectRepository.save(object);
  }

  async approveOpeningAct(objectId: string, documentId: string, approved: boolean, userId: string): Promise<CityObject> {
    const object = await this.objectRepository.findOne({ where: { id: objectId } });
    if (!object) {
      throw new NotFoundException(`Object with ID "${objectId}" not found`);
    }

    const openingActIndex = object.documents?.findIndex(doc => doc.id === documentId && doc.type === 'opening_act');
    if (openingActIndex === -1 || openingActIndex === undefined) {
      throw new NotFoundException(`Opening act document with ID "${documentId}" not found`);
    }

    const openingAct = object.documents[openingActIndex];
    if (openingAct.status !== 'awaiting_approval') {
      throw new BadRequestException('Opening act is not awaiting approval');
    }

    if (approved) {
      // Approve opening act, activate object, and assign inspector
      openingAct.status = 'approved';
      object.status = ObjectStatus.ACTIVE;
      object.inspectorUserId = userId; // Add this line to assign the inspector
    } else {
      // Reject opening act, return object to assigned state, and remove the document
      object.status = ObjectStatus.ASSIGNED;
      // Remove the opening act document
      object.documents.splice(openingActIndex, 1);

      // Also delete the physical file if needed
      try {
        // Assuming the file path is relative to some base directory
        const filePath = openingAct.path;
        // You might need to adjust this depending on how files are stored
        await fs.promises.unlink(filePath);
      } catch (error) {
        console.error('Error deleting opening act file:', error);
        // Continue even if file deletion fails - we still want to update the object
      }
    }

    return this.objectRepository.save(object);
  }

  async updateWorkTypeStatus(
    objectId: string,
    workTypeId: string,
    newStatus: typeof WorkStatus[keyof typeof WorkStatus],
    userRoles: UserRoles
  ): Promise<CityObject> {
    const object = await this.objectRepository.findOne({ where: { id: objectId } });
    if (!object) {
      throw new NotFoundException(`Object with ID "${objectId}" not found`);
    }

    if (!object.workSchedule?.workTypes) {
      throw new BadRequestException('Object has no work types');
    }

    const workType = object.workSchedule.workTypes.find(wt => wt.id === workTypeId);
    if (!workType) {
      throw new NotFoundException(`Work type with ID "${workTypeId}" not found`);
    }

    // Define allowed status transitions based on user role with proper typing
    const allowedStatusesForContractor = [
      WorkStatus.IN_PROGRESS,
      WorkStatus.COMPLETED,
      WorkStatus.VIOLATION_FIXED,
      WorkStatus.SEVERE_VIOLATION_FIXED
    ] as const;

    const allowedStatusesForControl = [
      WorkStatus.IN_PROGRESS,
      WorkStatus.ACCEPTED,
      WorkStatus.VIOLATION,
      WorkStatus.SEVERE_VIOLATION,
      WorkStatus.VIOLATION_FIXED,    
      WorkStatus.SEVERE_VIOLATION_FIXED
    ] as const;

    type ContractorAllowedStatus = typeof allowedStatusesForContractor[number];
    type ControlAllowedStatus = typeof allowedStatusesForControl[number];

    // Handle special case for approving fixed violations first
    if ((userRoles.isControl || userRoles.isInspector) && 
        ((workType.status === WorkStatus.VIOLATION_FIXED || workType.status === WorkStatus.SEVERE_VIOLATION_FIXED) ||
         (newStatus === WorkStatus.VIOLATION_FIXED || newStatus === WorkStatus.SEVERE_VIOLATION_FIXED))) {
      // When control/inspector approves fixed violation
      object.status = ObjectStatus.ACTIVE;
      workType.status = WorkStatus.IN_PROGRESS;
      return this.objectRepository.save(object);
    }

    // Then validate regular status transitions
    if (userRoles.isContractor) {
      if (!allowedStatusesForContractor.includes(newStatus as ContractorAllowedStatus)) {
        throw new BadRequestException('Contractor cannot set this status');
      }
    } else if (userRoles.isControl || userRoles.isInspector) {
      if (!allowedStatusesForControl.includes(newStatus as ControlAllowedStatus)) {
        throw new BadRequestException('Control/Inspector cannot set this status');
      }
    } else {
      throw new BadRequestException('User role not authorized to update status');
    }

    // Handle other status transitions
    if (newStatus === WorkStatus.VIOLATION || newStatus === WorkStatus.SEVERE_VIOLATION) {
      // Set object status to pending fixes when violation is reported
      object.status = ObjectStatus.PENDING_FIXES;
    } else if (
      userRoles.isContractor && 
      (newStatus === WorkStatus.VIOLATION_FIXED || newStatus === WorkStatus.SEVERE_VIOLATION_FIXED)
    ) {
      // Set object status to pending approval when contractor marks violation as fixed
      object.status = ObjectStatus.PENDING_APPROVAL;
    }

    // Update work type status
    workType.status = newStatus;

    return this.objectRepository.save(object);
  }
}
