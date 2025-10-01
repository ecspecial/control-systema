import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ElectronicJournal } from '../entities/electronic-journal.entity';
import { Violation } from '../entities/violation.entity';
import { ViolationResponse, ViolationResponseStatus } from '../entities/violation-response.entity';
import { CreateViolationResponseDto, UpdateViolationResponseStatusDto } from '../dto/create-violation-response.dto';
import { ViolationStatus } from '../entities/violation.entity';

@Injectable()
export class ElectronicJournalService {
  constructor(
    @InjectRepository(ElectronicJournal)
    private readonly journalRepository: Repository<ElectronicJournal>,
    @InjectRepository(Violation)
    private readonly violationRepository: Repository<Violation>,
    @InjectRepository(ViolationResponse)
    private readonly violationResponseRepository: Repository<ViolationResponse>,
  ) {}

  async createJournal(cityObjectId: string): Promise<ElectronicJournal> {
    const journal = this.journalRepository.create({
      cityObjectId
    });
    return this.journalRepository.save(journal);
  }

  async addViolation(journalId: string, violationData: Partial<Violation>): Promise<Violation> {
    const violation = this.violationRepository.create({
      ...violationData,
      journalId
    });
    return this.violationRepository.save(violation);
  }

  async getJournalWithViolations(cityObjectId: string): Promise<ElectronicJournal> {
    const journal = await this.journalRepository.findOne({
      where: { cityObjectId },
      relations: {
        violations: true
      }
    });

    if (!journal) {
      throw new NotFoundException(`Journal for object ${cityObjectId} not found`);
    }

    return journal;
  }

  async addDocumentToViolation(
    violationId: string, 
    document: { 
      id: string;
      name: string;
      path: string;
      type: string;
      createdAt: string;
      updatedAt: string;
    }
  ): Promise<Violation> {
    const violation = await this.violationRepository.findOne({
      where: { id: violationId }
    });

    if (!violation) {
      throw new NotFoundException(`Violation with ID "${violationId}" not found`);
    }

    if (!violation.documents) {
      violation.documents = [];
    }

    violation.documents.push(document);
    return this.violationRepository.save(violation);
  }

  async createViolationResponse(
    objectId: string,
    violationId: string,
    createResponseDto: CreateViolationResponseDto
  ): Promise<ViolationResponse> {
    // Get the journal for this object
    const journal = await this.journalRepository.findOne({
      where: { cityObjectId: objectId }
    });

    if (!journal) {
      throw new NotFoundException(`Journal for object ${objectId} not found`);
    }

    // Check if violation exists and belongs to this journal
    const violation = await this.violationRepository.findOne({
      where: { id: violationId, journalId: journal.id }
    });

    if (!violation) {
      throw new NotFoundException(`Violation with ID "${violationId}" not found for object ${objectId}`);
    }

    // Create new response
    const response = this.violationResponseRepository.create({
      violationId,
      description: createResponseDto.description,
      status: ViolationResponseStatus.AWAITING_APPROVAL
    });

    return this.violationResponseRepository.save(response);
  }

  async getViolationResponses(
    objectId: string,
    violationId: string
  ): Promise<ViolationResponse[]> {
    // Get the journal for this object
    const journal = await this.journalRepository.findOne({
      where: { cityObjectId: objectId }
    });

    if (!journal) {
      throw new NotFoundException(`Journal for object ${objectId} not found`);
    }

    // Check if violation exists and belongs to this journal
    const violation = await this.violationRepository.findOne({
      where: { id: violationId, journalId: journal.id }
    });

    if (!violation) {
      throw new NotFoundException(`Violation with ID "${violationId}" not found for object ${objectId}`);
    }

    // Get all responses for this violation
    return this.violationResponseRepository.find({
      where: { violationId },
      order: { createdAt: 'DESC' }
    });
  }

  async updateViolationResponseStatus(
    objectId: string,
    violationId: string,
    responseId: string,
    updateStatusDto: UpdateViolationResponseStatusDto
  ): Promise<ViolationResponse> {
    // Get the journal for this object
    const journal = await this.journalRepository.findOne({
      where: { cityObjectId: objectId }
    });

    if (!journal) {
      throw new NotFoundException(`Journal for object ${objectId} not found`);
    }

    // Check if violation exists and belongs to this journal
    const violation = await this.violationRepository.findOne({
      where: { id: violationId, journalId: journal.id }
    });

    if (!violation) {
      throw new NotFoundException(`Violation with ID "${violationId}" not found for object ${objectId}`);
    }

    // Check if response exists and belongs to this violation
    const response = await this.violationResponseRepository.findOne({
      where: { id: responseId, violationId }
    });

    if (!response) {
      throw new NotFoundException(`Response with ID "${responseId}" not found`);
    }

    // Update response status and comment
    response.status = updateStatusDto.status as ViolationResponseStatus;
    if (updateStatusDto.controllerComment) {
      response.controllerComment = updateStatusDto.controllerComment;
    }

    // If response is approved, update violation status
    if (updateStatusDto.status === ViolationResponseStatus.APPROVED) {
      violation.status = ViolationStatus.FIXED;
      await this.violationRepository.save(violation);
    }

    return this.violationResponseRepository.save(response);
  }

  async addDocumentToViolationResponse(
    objectId: string,
    violationId: string,
    responseId: string,
    document: {
      id: string;
      name: string;
      path: string;
      type: string;
      createdAt: string;
      updatedAt: string;
    }
  ): Promise<ViolationResponse> {
    // Get the journal for this object
    const journal = await this.journalRepository.findOne({
      where: { cityObjectId: objectId }
    });

    if (!journal) {
      throw new NotFoundException(`Journal for object ${objectId} not found`);
    }

    // Check if violation exists and belongs to this journal
    const violation = await this.violationRepository.findOne({
      where: { id: violationId, journalId: journal.id }
    });

    if (!violation) {
      throw new NotFoundException(`Violation with ID "${violationId}" not found for object ${objectId}`);
    }

    // Check if response exists and belongs to this violation
    const response = await this.violationResponseRepository.findOne({
      where: { id: responseId, violationId }
    });

    if (!response) {
      throw new NotFoundException(`Response with ID "${responseId}" not found`);
    }

    if (!response.documents) {
      response.documents = [];
    }

    response.documents.push(document);
    return this.violationResponseRepository.save(response);
  }

  async getViolations(objectId: string): Promise<Violation[]> {
    const journal = await this.journalRepository.findOne({
      where: { cityObjectId: objectId }
    });

    if (!journal) {
      throw new NotFoundException(`Journal for object ${objectId} not found`);
    }

    return this.violationRepository.find({
      where: { journalId: journal.id },
      relations: ['responses'], // Use array syntax instead of object
      order: {
        createdAt: 'DESC'
      }
    });
  }
}