import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { CityObject } from '../../objects/entities/city-object.entity';
import { Violation } from './violation.entity';

export enum ViolationCategory {
  DOCUMENTATION = 'documentation',           // Документация
  PRODUCTION_CULTURE = 'production_culture', // Культура производства
  PROJECT_SOLUTIONS = 'project_solutions',   // Проектные решения
  PRODUCTION_TECHNOLOGY = 'production_technology', // Технология производства
  ASPHALT_LAYING = 'asphalt_laying'         // Технология укладки АБП
}

export enum ViolationType {
  SIMPLE = 'simple',   // Простое
  SEVERE = 'severe'    // Грубое
}

export enum ViolationFixability {
  FIXABLE = 'fixable',       // Устранимое
  NON_FIXABLE = 'non_fixable' // Неустранимое
}

export enum JournalStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived'
}

@Entity('electronic_journals')
export class ElectronicJournal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => CityObject)
  @JoinColumn({ name: 'city_object_id' })
  cityObject: CityObject;

  @Column({ name: 'city_object_id' })
  cityObjectId: string;

  @Column({
    type: 'enum',
    enum: JournalStatus,
    default: JournalStatus.ACTIVE
  })
  status: JournalStatus;

  // Add this relationship
  @OneToMany(() => Violation, violation => violation.journal)
  violations: Violation[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
