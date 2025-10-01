import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.migrations' });

const dbHost = process.env.DB_HOST || 'postgres';
const dbPort = parseInt(process.env.DB_PORT || '5432', 10);
const dbUser = process.env.DB_USERNAME || 'postgres';
const dbPassword = process.env.DB_PASSWORD || 'postgres';
const dbName = process.env.DB_DATABASE || 'cwapi_db';

console.log('DB Connection Info:', {
	host: dbHost,
	port: dbPort,
	username: dbUser,
	password: '********',
	database: dbName,
});

export default new DataSource({
	type: 'postgres',
	host: dbHost,
	port: dbPort,
	username: dbUser,
	password: dbPassword,
	database: dbName,
	entities: ['src/**/entities/*.entity.ts'],
	migrations: ['libs/infrastructure/typeorm/migrations/*.ts'],
	migrationsTableName: 'migrations_history',
	logging: true,
	synchronize: false,
});
