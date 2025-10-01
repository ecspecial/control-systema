import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Document } from './city-object.entity';

@Entity('ttn_entries')
export class TTNEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { nullable: true })
  description: string;

  @Column()
  workTypeId: string;  // References WorkType.id from city-object.entity.ts

  @Column('jsonb', { default: [] })
  documents: Document[];  // Using Document interface from city-object.entity.ts

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
