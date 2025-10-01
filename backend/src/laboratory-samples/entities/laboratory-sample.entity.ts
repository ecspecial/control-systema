import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { CityObject } from '@modules/objects/entities/city-object.entity';

export enum SampleStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

@Entity('laboratory_samples')
export class LaboratorySample {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'material_name' })
  materialName: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: SampleStatus,
    default: SampleStatus.PENDING
  })
  status: SampleStatus;

  @ManyToOne(() => CityObject)
  @JoinColumn({ name: 'object_id' })
  object: CityObject;

  @Column({ name: 'object_id' })
  objectId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
