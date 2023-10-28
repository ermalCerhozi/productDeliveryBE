import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from './user.entity'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  getAllUsers(): Promise<User[]> {
    return this.usersRepository.find()
  }

  getUserById(id: number): Promise<User> {
    return this.usersRepository.findOne({ where: { id: id } })
  }

  async getUserByPhoneNumber(phone_number: string): Promise<User> {
    return this.usersRepository.findOne({
      where: { phone_number: phone_number },
    })
  }

  async deleteUserById(id: string): Promise<void> {
    this.usersRepository.delete(parseInt(id, 10))
  }

  async updateUserDetails(id: string, user: Partial<User>): Promise<void> {
    this.usersRepository.update(parseInt(id, 10), user)
  }

  async createUser(user: User): Promise<User> {
    if (await this.doesEmailExist(user.email)) {
      throw new Error('Email already exists!')
    }
    if (await this.doesNumberExist(user.phone_number)) {
      throw new Error('Phone number already exists!')
    }

    return this.usersRepository.save(user)
  }

  async doesEmailExist(email: string): Promise<boolean> {
    const user = await this.usersRepository.findOne({
      where: { email: email },
    })
    return !!user
  }

  async doesNumberExist(number: string): Promise<boolean> {
    const user = await this.usersRepository.findOne({
      where: { phone_number: number },
    })
    return !!user
  }

  async findOne(condition: any): Promise<User> {
    return this.usersRepository.findOne(condition)
  }
}
