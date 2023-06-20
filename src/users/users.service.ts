import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  getAllUsers(): Promise<User[]> {
    return this.usersRepository.find();
  }

  getUserById(id: number): Promise<User> {
    return this.usersRepository.findOne({ where: { id: id } });
  }

  async deleteUserById(id: string): Promise<void> {
    await this.usersRepository.delete(parseInt(id, 10));
  }

  async updateUserDetails(id: string, user: Partial<User>): Promise<void> {
    await this.usersRepository.update(parseInt(id, 10), user);
  }

  async createUser(user: User): Promise<User> {
    return this.usersRepository.save(user);
  }

  // async validateUserCredentials(user: Partial<User>): Promise<boolean> {
  //   //    Check user's credentials and return boolean result.
  // }

  async changeUserRole(id: string, role: string): Promise<void> {
    await this.usersRepository.update(parseInt(id, 10), { role });
  }

  async resetUserPassword(id: string, newPassword: string): Promise<void> {
    // Encrypt the password before saving, omitted for brevity.
    await this.usersRepository.update(parseInt(id, 10), {
      password: newPassword,
    });
  }
}
