import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CityObject } from '../entities/city-object.entity';
import { CreateObjectDto } from '../dto/create-object.dto';
import { ObjectStatus, WorkStatus } from '../entities/city-object.entity';

@Injectable()
export class ObjectsRepository {
  constructor(
    @InjectRepository(CityObject)
    private readonly repository: Repository<CityObject>,
  ) {}

  async create(createObjectDto: CreateObjectDto, userId: string): Promise<CityObject> {
    const object = this.repository.create({
      ...createObjectDto,
      status: ObjectStatus.PLANNED,
      createdById: userId,
      workSchedule: createObjectDto.workSchedule
    });

    return this.repository.save(object);
  }

  async findAll(userId: string, userRole: string): Promise<CityObject[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('object')
      .leftJoinAndSelect('object.createdBy', 'createdBy')
      .leftJoinAndSelect('object.controlUser', 'controlUser')
      .leftJoinAndSelect('object.contractorUser', 'contractorUser')
      .leftJoinAndSelect('object.inspectorUser', 'inspectorUser');

    // For control users: show their objects + objects awaiting assignment
    if (userRole === 'control') {
      queryBuilder.where('(object.controlUserId = :userId OR object.status = :plannedStatus)', {
        userId,
        plannedStatus: ObjectStatus.PLANNED
      });
    }
    // For contractors: show only their assigned objects
    else if (userRole === 'contractor') {
      queryBuilder.where('object.contractorUserId = :userId', { userId });
    }
    // For inspectors: show their assigned objects (if we implement this role later)
    // else if (userRole === 'inspector') {
    //   queryBuilder.where('object.inspectorUserId = :userId', { userId });
    // }
    // For admin: show all objects (no filter)

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<CityObject | null> {
    return this.repository.findOne({
      where: { id },
      relations: {
        createdBy: true,
        controlUser: true,
        contractorUser: true,
        inspectorUser: true
      }
    });
  }
}
