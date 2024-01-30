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

    async getAllUsers(): Promise<User[]> {
        return this.usersRepository.find()
    }

    async getAllClientUsers(): Promise<User[]> {
        return this.usersRepository.find({
            where: { role: 'client' },
        })
    }

    async getUserById(id: number): Promise<User> {
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

    async searchForUsers(
        pagination: { offset: number; limit: number },
        userFilters: {
            queryString?: string
        },
        searchOptions: { title: boolean; all: boolean },
        getCount: boolean,
    ) {
        let query = this.usersRepository.createQueryBuilder('user')

        if (userFilters.queryString !== undefined) {
            const searchQuery = `%${userFilters.queryString}%`.toLowerCase()
            if (searchOptions.all) {
                query = query.andWhere(
                    'LOWER(user.first_name) LIKE :searchQuery OR LOWER(user.last_name) LIKE :searchQuery OR LOWER(user.email) LIKE :searchQuery OR LOWER(user.phone_number) LIKE :searchQuery',
                    { searchQuery },
                )
            } else if (searchOptions.title) {
                query = query.andWhere(
                    'LOWER(user.first_name) LIKE :searchQuery',
                    {
                        searchQuery,
                    },
                )
            }
        }

        let count
        if (getCount) {
            count = await query.clone().getCount()
        }

        query = query.skip(pagination.offset).take(pagination.limit)

        // TODO: Order by latest
        query = query.orderBy('user.id', 'DESC')

        const users = await query.getMany()
        return getCount ? { users, count } : { users }
    }
}
