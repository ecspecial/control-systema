import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Violation } from './violation.entity';

export enum ViolationResponseStatus {
  AWAITING_APPROVAL = 'awaiting_approval',
  APPROVED = 'approved',
  NEEDS_REVISION = 'needs_revision'
}

@Entity('violation_response')
export class ViolationResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Violation, violation => violation.responses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'violation_id' })
  violation: Violation;

  @Column({ name: 'violation_id' })
  violationId: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ViolationResponseStatus,
    default: ViolationResponseStatus.AWAITING_APPROVAL
  })
  status: ViolationResponseStatus;

  @Column({ type: 'text', nullable: true })
  controllerComment?: string;

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

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
