import { DataSource } from 'typeorm';
import { UsersSeed } from './seeds/users.seed';
import { ObjectsSeed } from './seeds/objects.seed';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.migrations' });

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['libs/infrastructure/typeorm/migrations/*.ts'],
});

async function main() {
  try {
    await dataSource.initialize();
    console.log('Connected to database');

    // Сначала создаем пользователей
    const usersSeed = new UsersSeed(dataSource);
    await usersSeed.run();
    console.log('Users seed completed');

    // Затем создаем объекты
    const objectsSeed = new ObjectsSeed(dataSource);
    await objectsSeed.run();
    console.log('Objects seed completed');

  } catch (error) {
    console.error('Error during database seeding:', error);
  } finally {
    await dataSource.destroy();
    console.log('Database connection closed');
  }
}

main();
