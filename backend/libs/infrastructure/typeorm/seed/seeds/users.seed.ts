import { DataSource } from 'typeorm';
import { User } from '@modules/users/entities/user.entity';
import { usersSeedData } from '../data/users.seed';
import { BaseSeed } from '../base.seed';
import * as bcrypt from 'bcrypt';

export class UsersSeed extends BaseSeed {
  constructor(dataSource: DataSource) {
    super(dataSource);
  }

  async run() {
    const userRepository = this.dataSource.getRepository(User);

    for (const userData of usersSeedData) {
      // Hash the password before saving
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = userRepository.create({
        ...userData,
        password: hashedPassword,
      });
      
      await userRepository.save(user);
    }
  }
}
