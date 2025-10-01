import { cfg } from '@infra/config';
import { DataSource } from 'typeorm';
import { entities } from './entities';

const appDataSource = new DataSource({
  type: 'postgres',
  entities,
  migrations: ['libs/infrastructure/typeorm/migrations/*.js'],  // Keep .js for app running
  migrationsTableName: 'migrations_history',
  logging: true,
  synchronize: false,
  ...cfg.database,
});

export default appDataSource;
