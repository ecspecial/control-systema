import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ElectronicJournal, ViolationCategory, ViolationType, ViolationFixability } from './electronic-journal.entity';
import { CityObject } from '@modules/objects/entities/city-object.entity';
import { JournalStatus } from './electronic-journal.entity';
import { NotFoundException } from '@nestjs/common';
import { ViolationResponse } from './violation-response.entity';

export enum ViolationStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  FIXED = 'fixed',
  VERIFIED = 'verified',
  REJECTED = 'rejected'
}

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
}

@Entity('violations')
export class Violation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    nullable: false
  })
  category: string;

  @Column({
    type: 'enum',
    enum: ViolationFixability,
    enumName: 'violation_fixability_enum'
  })
  fixability: ViolationFixability;

  @Column({
    type: 'enum',
    enum: ViolationType,
    enumName: 'violation_type_enum'
  })
  type: ViolationType;

  @Column()
  name: string;

  @Column({ name: 'fix_deadline' })
  fixDeadline: Date;

  @Column({
    type: 'enum',
    enum: ViolationStatus,
    enumName: 'violation_status_enum',
    default: ViolationStatus.OPEN
  })
  status: ViolationStatus;

  @Column('jsonb', { 
    name: 'documents',
    nullable: true,
    default: []
  })
  documents: Array<{
    id: string;
    name: string;
    path: string;
    type: string;
    createdAt: string;
    updatedAt: string;
  }>;

  @Column('jsonb', {
    name: 'location_data',
    nullable: true
  })
  locationData: LocationData;

  @Column({
    name: 'inspector_location_verified',
    type: 'boolean',
    default: false
  })
  inspectorLocationVerified: boolean;

  @ManyToOne(() => ElectronicJournal, journal => journal.violations)
  @JoinColumn({ name: 'journal_id' })
  journal: ElectronicJournal;

  @Column({ name: 'journal_id' })
  journalId: string;

  @OneToMany(() => ViolationResponse, response => response.violation, {
    eager: true
  })
  responses: ViolationResponse[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
