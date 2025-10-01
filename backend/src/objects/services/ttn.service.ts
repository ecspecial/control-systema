import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TTNEntry } from '../entities/ttn-entry.entity';
import { Document } from '../entities/city-object.entity';

@Injectable()
export class TTNService {
  constructor(
    @InjectRepository(TTNEntry)
    private readonly ttnRepository: Repository<TTNEntry>,
  ) {}

  async createTTNEntry(
    workTypeId: string,
    description: string
  ): Promise<TTNEntry> {
    const ttnEntry = this.ttnRepository.create({
      workTypeId,
      description,
      documents: []
    });
    return this.ttnRepository.save(ttnEntry);
  }

  async getTTNEntriesByWorkType(workTypeId: string): Promise<TTNEntry[]> {
    return this.ttnRepository.find({
      where: { workTypeId },
      order: { createdAt: 'DESC' }
    });
  }

  async addDocumentToTTNEntry(
    ttnEntryId: string,
    document: Document
  ): Promise<TTNEntry> {
    const ttnEntry = await this.ttnRepository.findOne({
      where: { id: ttnEntryId }
    });

    if (!ttnEntry) {
      throw new NotFoundException(`TTN entry with ID "${ttnEntryId}" not found`);
    }

    if (!ttnEntry.documents) {
      ttnEntry.documents = [];
    }

    ttnEntry.documents.push(document);
    return this.ttnRepository.save(ttnEntry);
  }

  async getTTNEntry(id: string): Promise<TTNEntry> {
    const ttnEntry = await this.ttnRepository.findOne({
      where: { id }
    });

    if (!ttnEntry) {
      throw new NotFoundException(`TTN entry with ID "${id}" not found`);
    }

    return ttnEntry;
  }
}
