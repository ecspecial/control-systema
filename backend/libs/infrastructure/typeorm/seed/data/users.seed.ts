import { UserRole } from '@modules/users/entities/user.entity';

export const usersSeedData = [
  // Admin (1)
  {
    login: 'admin',
    password: 'password123',
    email: 'admin@city.test',
    firstName: 'Главный',
    middleName: 'Админович',
    lastName: 'Администратор',
    phone: '+7 (999) 999-99-99',
    role: UserRole.ADMIN,
    department: 'Администрация',
    isActive: true
  },

  // Control Users (3)
  {
    login: 'control1',
    password: 'password123',
    email: 'control1@city.test',
    firstName: 'Иван',
    middleName: 'Сергеевич',
    lastName: 'Петров',
    phone: '+7 (999) 123-45-67',
    role: UserRole.CONSTRUCTION_CONTROL,
    department: 'Отдел контроля №1',
    isActive: true
  },
  {
    login: 'control2',
    password: 'password123',
    email: 'control2@city.test',
    firstName: 'Сергей',
    middleName: 'Петрович',
    lastName: 'Васильев',
    phone: '+7 (999) 234-56-78',
    role: UserRole.CONSTRUCTION_CONTROL,
    department: 'Отдел контроля №2',
    isActive: true
  },
  {
    login: 'control3',
    password: 'password123',
    email: 'control3@city.test',
    firstName: 'Михаил',
    middleName: 'Андреевич',
    lastName: 'Соколов',
    phone: '+7 (999) 345-67-89',
    role: UserRole.CONSTRUCTION_CONTROL,
    department: 'Отдел контроля №3',
    isActive: true
  },

  // Contractors (3)
  {
    login: 'contractor1',
    password: 'password123',
    email: 'contractor1@city.test',
    firstName: 'Петр',
    middleName: 'Олегович',
    lastName: 'Сидоров',
    phone: '+7 (999) 765-43-21',
    role: UserRole.CONTRACTOR,
    organization: 'ООО "СтройГород"',
    isActive: true
  },
  {
    login: 'contractor2',
    password: 'password123',
    email: 'contractor2@city.test',
    firstName: 'Олег',
    middleName: 'Дмитриевич',
    lastName: 'Морозов',
    phone: '+7 (999) 876-54-32',
    role: UserRole.CONTRACTOR,
    organization: 'АО "ГородСтрой"',
    isActive: true
  },
  {
    login: 'contractor3',
    password: 'password123',
    email: 'contractor3@city.test',
    firstName: 'Дмитрий',
    middleName: 'Александрович',
    lastName: 'Волков',
    phone: '+7 (999) 987-65-43',
    role: UserRole.CONTRACTOR,
    organization: 'ЗАО "МегаСтрой"',
    isActive: true
  },

  // Inspectors (3)
  {
    login: 'inspector1',
    password: 'password123',
    email: 'inspector1@city.test',
    firstName: 'Алексей',
    middleName: 'Иванович',
    lastName: 'Иванов',
    phone: '+7 (999) 111-22-33',
    role: UserRole.INSPECTOR,
    department: 'Инспекция по контролю №1',
    isActive: true
  },
  {
    login: 'inspector2',
    password: 'password123',
    email: 'inspector2@city.test',
    firstName: 'Владимир',
    middleName: 'Алексеевич',
    lastName: 'Смирнов',
    phone: '+7 (999) 222-33-44',
    role: UserRole.INSPECTOR,
    department: 'Инспекция по контролю №2',
    isActive: true
  },
  {
    login: 'inspector3',
    password: 'password123',
    email: 'inspector3@city.test',
    firstName: 'Андрей',
    middleName: 'Владимирович',
    lastName: 'Кузнецов',
    phone: '+7 (999) 333-44-55',
    role: UserRole.INSPECTOR,
    department: 'Инспекция по контролю №3',
    isActive: true
  }
];
