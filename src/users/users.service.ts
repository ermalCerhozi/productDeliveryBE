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

  async getUserByPhoneNumber(phone_number: string): Promise<User> {
    return this.usersRepository.findOne({
      where: { phone_number: phone_number },
    });
  }

  async findOne(condition: any): Promise<User> {
    return this.usersRepository.findOne(condition);
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
}
