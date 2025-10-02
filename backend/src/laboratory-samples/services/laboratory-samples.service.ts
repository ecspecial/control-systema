import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LaboratorySample, SampleStatus } from '../entities/laboratory-sample.entity';
import { CreateLaboratorySampleDto } from '../dto/create-laboratory-sample.dto';

@Injectable()
export class LaboratorySamplesService {
  constructor(
    @InjectRepository(LaboratorySample)
    private readonly sampleRepository: Repository<LaboratorySample>,
  ) {}

  async create(objectId: string, createDto: CreateLaboratorySampleDto): Promise<LaboratorySample> {
    try {
      const sample = this.sampleRepository.create({
        materialName: createDto.materialName,
        description: createDto.description,
        objectId,
        status: SampleStatus.PENDING
      });
      return await this.sampleRepository.save(sample);
    } catch (error) {
      if (error.code === '23503') {
        throw new BadRequestException(`Object with ID "${objectId}" not found`);
      }
      throw error;
    }
  }

  async findByObject(objectId: string): Promise<LaboratorySample[]> {
    return this.sampleRepository.find({
      where: { objectId },
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: string): Promise<LaboratorySample> {
    const sample = await this.sampleRepository.findOne({
      where: { id }
    });

    if (!sample) {
      throw new NotFoundException(`Laboratory sample with ID "${id}" not found`);
    }

    return sample;
  }
}
