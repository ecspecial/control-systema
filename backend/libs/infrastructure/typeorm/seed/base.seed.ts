import { DataSource } from 'typeorm';

export abstract class BaseSeed {
  constructor(protected dataSource: DataSource) {}
  abstract run(): Promise<void>;
}
