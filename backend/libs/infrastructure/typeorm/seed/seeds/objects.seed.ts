import { DataSource } from 'typeorm';
import { CityObject, ObjectStatus } from '../../../../../src/objects/entities/city-object.entity';
import { objectsSeedData } from '../data/objects.seed';
import { BaseSeed } from '../base.seed';
import { User, UserRole } from '../../../../../src/users/entities/user.entity';
import { ElectronicJournalService } from '../../../../../src/electronic-journal/services/electronic-journal.service';
import { ObjectsService } from '../../../../../src/objects/services/objects.service';
import { ObjectsRepository } from '../../../../../src/objects/repositories/objects.repository';
import { ElectronicJournal } from '../../../../../src/electronic-journal/entities/electronic-journal.entity';
import { Violation } from '../../../../../src/electronic-journal/entities/violation.entity';
import { ViolationResponse } from '../../../../../src/electronic-journal/entities/violation-response.entity';

export class ObjectsSeed extends BaseSeed {
  async run(): Promise<void> {
    const objectRepository = this.dataSource.getRepository(CityObject);
    const userRepository = this.dataSource.getRepository(User);
    const journalRepository = this.dataSource.getRepository(ElectronicJournal);
    const violationRepository = this.dataSource.getRepository(Violation);
    const violationResponseRepository = this.dataSource.getRepository(ViolationResponse);

    // Get required users
    const admin = await userRepository.findOne({ where: { role: UserRole.ADMIN } });
    const control = await userRepository.findOne({ where: { role: UserRole.CONSTRUCTION_CONTROL } });
    const contractor = await userRepository.findOne({ where: { role: UserRole.CONTRACTOR } });
    const inspector = await userRepository.findOne({ where: { role: UserRole.INSPECTOR } });

    if (!admin || !control || !contractor || !inspector) {
      console.log('Required users not found. Make sure to run users seed first.');
      return;
    }

    // Create service instances
    const objectsRepository = new ObjectsRepository(objectRepository);
    const electronicJournalService = new ElectronicJournalService(
      journalRepository,
      violationRepository,
      violationResponseRepository
    );
    const objectsService = new ObjectsService(
      objectsRepository,
      objectRepository,
      electronicJournalService
    );

    // Create objects using the service
    for (const objectData of objectsSeedData) {
      const createObjectDto = {
        name: objectData.name,
        address: objectData.address,
        description: objectData.description,
        polygon: {
          type: 'Polygon',
          coordinates: objectData.polygon.coordinates.map(coord => 
            [coord[0], coord[1]] as [number, number]
          )
        },
        workSchedule: objectData.work_schedule,
        documents: objectData.documents,
        status: objectData.status as ObjectStatus
      };

      try {
        // Create object using service (this will also create the electronic journal)
        const object = await objectsService.create(createObjectDto, admin.id);

        // Update additional fields if needed based on status
        if (objectData.status !== ObjectStatus.PLANNED) {
          await objectsService.assignControl(object.id, control.id);
        }

        if ([
          ObjectStatus.ACTIVE,
          ObjectStatus.SUSPENDED,
          ObjectStatus.PENDING_FIXES
        ].includes(object.status as ObjectStatus)) {
          await objectsService.activateWithContractor(object.id, contractor.id, control.id);
          // Set inspector if needed
          await objectRepository.update(object.id, { inspectorUserId: inspector.id });
        }
      } catch (error) {
        console.error(`Error creating object ${objectData.name}:`, error);
        throw error;
      }
    }

    console.log('Objects seed completed');
  }
}
