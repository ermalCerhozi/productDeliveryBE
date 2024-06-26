import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from './user.entity'
import * as bcrypt from 'bcrypt'
import { EmailService } from 'src/email.service'

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private emailService: EmailService,
    ) {}

    async getAllUsers(): Promise<User[]> {
        return this.usersRepository.find()
    }

    async getAllSellerUsers(): Promise<User[]> {
        return this.usersRepository.find({
            where: { role: 'seller' },
        })
    }

    async getAllClientUsers(): Promise<User[]> {
        return this.usersRepository.find({
            where: { role: 'client' },
        })
    }

    async getAllAdminUsers(): Promise<User[]> {
        return this.usersRepository.find({
            where: { role: 'admin' },
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

    async getUserByEmail(email: string): Promise<User> {
        return this.usersRepository.findOne({
            where: { email: email },
        })
    }

    async deleteUserById(id: string): Promise<void> {
        this.usersRepository.delete(parseInt(id, 10))
    }

    async updateUserDetails(id: number, user: Partial<User>): Promise<User> {
        await this.usersRepository.update(id, user)
        return await this.getUserById(id)
    }

    async changeUserPassword(
        id: number,
        newPass: {
            actualPassword: string
            newPassword: string
            confirmPassword: string
        },
    ): Promise<any> {
        const user = await this.getUserById(id)
        if (!user) {
            throw new Error('User not found')
        }
        if (!newPass.actualPassword || !user.password) {
            throw new Error('Password data is missing')
        }
        const isMatch = await bcrypt.compare(
            newPass.actualPassword,
            user.password,
        )
        if (!isMatch) {
            throw new Error('Current password does not match')
        }
        if (newPass.newPassword !== newPass.confirmPassword) {
            throw new Error('New password and confirm password do not match')
        }
        const hashedPassword = await bcrypt.hash(newPass.newPassword, 10)
        user.password = hashedPassword
        return this.usersRepository.save(user)
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
        query = query.orderBy('user.created_at', 'DESC')

        const users = await query.getMany()
        return getCount ? { users, count } : { users }
    }

    async searchForClients(
        pagination: { offset: number; limit: number },
        clientName: string,
    ) {
        let query = this.usersRepository.createQueryBuilder('user')

        if (clientName !== undefined) {
            const searchQuery = `%${clientName}%`.toLowerCase()
            query = query.andWhere(
                'LOWER(user.first_name) LIKE :searchQuery OR LOWER(user.last_name) LIKE :searchQuery OR LOWER(user.email) LIKE :searchQuery OR LOWER(user.phone_number) LIKE :searchQuery',
                { searchQuery },
            )
        }

        query = query.andWhere('user.role = :role', { role: 'client' })

        query = query.skip(pagination.offset).take(pagination.limit)
        query = query.orderBy('user.created_at', 'DESC')

        const clients = await query.getMany()
        return clients
    }

    async searchForSellers(
        pagination: { offset: number; limit: number },
        sellerName: string,
    ) {
        let query = this.usersRepository.createQueryBuilder('user')

        if (sellerName !== undefined) {
            const searchQuery = `%${sellerName}%`.toLowerCase()
            query = query.andWhere(
                'LOWER(user.first_name) LIKE :searchQuery OR LOWER(user.last_name) LIKE :searchQuery',
                { searchQuery },
            )
        }

        // Admin is also a seller, he can place orders
        query = query.andWhere('user.role IN (:...roles)', {
            roles: ['seller', 'admin'],
        })

        query = query.skip(pagination.offset).take(pagination.limit)
        query = query.orderBy('user.created_at', 'DESC')

        const sellers = await query.getMany()
        return sellers
    }

    async resetPassword(email: string) {
        let newPassword = ''
        const characters =
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        for (let i = 0; i < 5; i++) {
            newPassword += characters.charAt(
                Math.floor(Math.random() * characters.length),
            )
        }

        const user = await this.getUserByEmail(email)
        if (!user) {
            throw new Error('User not found')
        }
        user.password = await bcrypt.hash(newPassword, 10)
        await this.usersRepository.save(user)

        // Send email
        return this.emailService.sendResetPasswordEmail(email, newPassword)
    }
}
