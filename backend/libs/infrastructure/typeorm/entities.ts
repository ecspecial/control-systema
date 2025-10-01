import { CityObject } from '../../../src/objects/entities/city-object.entity';
import { User } from '../../../src/users/entities/user.entity';
import { ElectronicJournal } from '../../../src/electronic-journal/entities/electronic-journal.entity';
import { Violation } from '../../../src/electronic-journal/entities/violation.entity';
import { ViolationResponse } from '../../../src/electronic-journal/entities/violation-response.entity';
import { LaboratorySample } from '../../../src/laboratory-samples/entities/laboratory-sample.entity';
import { TTNEntry } from '@modules/objects/entities/ttn-entry.entity';

export const entities = [
  CityObject,
  User,
  ElectronicJournal,
  Violation,
  ViolationResponse,
  LaboratorySample,
  TTNEntry
];
