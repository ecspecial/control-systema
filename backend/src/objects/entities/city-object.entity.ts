import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '@modules/users/entities/user.entity';

export enum ObjectStatus {
  PLANNED = 'planned',          // Создан админом, ждет назначения контроля
  ASSIGNED = 'assigned',        // Назначен контроль, ждет активации
  PENDING_ACTIVATION = 'pending_activation',  // Ожидает подтверждения акта открытия от инспектора
  ACTIVE = 'active',           // Активирован, идут работы
  SUSPENDED = 'suspended',      // Работы приостановлены из-за серьезных нарушений
  PENDING_FIXES = 'pending_fixes',  // Требуется устранение критических замечаний
  FIXING = 'fixing',           // Идет устранение замечаний
  PENDING_APPROVAL = 'pending_approval',  // Ожидает проверки устранения замечаний
  COMPLETED = 'completed',      // Все работы завершены
  ACCEPTED = 'accepted'         // Работы приняты службой контроля
}

export const WorkStatus = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  SUSPENDED: 'suspended',
  VIOLATION: 'violation',
  SEVERE_VIOLATION: 'severe_violation',
  VIOLATION_FIXED: 'violation_fixed',
  SEVERE_VIOLATION_FIXED: 'severe_violation_fixed',
  COMPLETED: 'completed',
  ACCEPTED: 'accepted',
  PENDING_RESCHEDULE_APPROVE: 'pending_reschedule_approve'
} as const;

export interface Document {
  id: string;
  type: string;  // Known types: "opening_act"
  name: string;
  path: string;
  status: string; // Known statuses: "awaiting_approval", "approved", "rejected"
  createdAt: string;
  updatedAt: string;
}

// Update WorkSchedule interface
export interface WorkSchedule {
  startDate: string;
  endDate: string;
  workTypes: WorkType[];
  status?: string;
  lastStatus?: string;
  updatedStartDate?: string;
  updatedEndDate?: string;
}

// Update WorkType interface
export interface WorkType {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  unit: string;
  amount: number;
  status: string;
  lastStatus?: string;
  updatedStartDate?: string;
  updatedEndDate?: string;
}

@Entity('city_objects')
export class CityObject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  address: string;

  @Column('text')
  description: string;

  @Column({
    type: 'jsonb',
    name: 'polygon',
    nullable: true
  })
  polygon: {
    type: string;
    coordinates: Array<[number, number]>;
  };

  @Column('jsonb', { name: 'work_schedule', nullable: true })
  workSchedule?: WorkSchedule;

  @Column('jsonb', { default: [] })
  documents: Document[];

  @Column({
    type: 'enum',
    enum: ObjectStatus,
    default: ObjectStatus.PLANNED
  })
  status: ObjectStatus;

  // Создатель объекта (Администратор)
  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;

  @Column({ name: 'created_by_id' })
  createdById: string;

  // Ответственный от службы строительного контроля
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'control_user_id' })
  controlUser: User;

  @Column({ name: 'control_user_id', nullable: true })
  controlUserId: string;

  // Ответственный подрядчик (прораб)
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'contractor_user_id' })
  contractorUser: User;

  @Column({ name: 'contractor_user_id', nullable: true })
  contractorUserId: string;

  // Инспектор контрольного органа
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'inspector_user_id' })
  inspectorUser: User;

  @Column({ name: 'inspector_user_id', nullable: true })
  inspectorUserId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
