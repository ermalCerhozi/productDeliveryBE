import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    Param,
    BadRequestException,
    Res,
    Patch,
} from '@nestjs/common'
import { Response } from 'express'
import { UsersService } from './users.service'
import { User } from './user.entity'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { UserResponseDTO } from './dto/userResponse.dto'

@Controller('users')
export class UsersController {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) {}

    @Post()
    async createUser(@Body() userData: User): Promise<UserResponseDTO> {
        const hashedPassword = await bcrypt.hash(userData.password, 10)
        userData.password = hashedPassword
        const createdUser = await this.usersService.createUser(userData)

        return new UserResponseDTO(createdUser)
    }

    @Get()
    async getAllUsers(): Promise<UserResponseDTO[]> {
        const users = await this.usersService.getAllUsers()
        return users.map((user) => new UserResponseDTO(user))
    }

    @Get('/seller')
    async getAllSellerUsers(): Promise<UserResponseDTO[]> {
        const users = await this.usersService.getAllSellerUsers()
        return users.map((user) => new UserResponseDTO(user))
    }

    @Get('/client')
    async getAllClientUsers(): Promise<UserResponseDTO[]> {
        const users = await this.usersService.getAllClientUsers()
        return users.map((user) => new UserResponseDTO(user))
    }

    @Get('getUser:id')
    async getUserById(@Param('id') id: number): Promise<UserResponseDTO> {
        const user = await this.usersService.getUserById(id)
        return new UserResponseDTO(user)
    }

    @Patch(':id')
    async updateUserDetails(
        @Param('id') id: number,
        @Body() userData: Partial<User>,
    ): Promise<User> {
        const updatedUser: User = await this.usersService.updateUserDetails(
            id,
            userData,
        )
        return updatedUser
    }

    /**
     * @description Changes users password
     * @param id
     * @param newPass
     */
    @Patch(':id/password')
    changeUserPassword(
        @Param('id') id: number,
        @Body()
        newPass: {
            actualPassword: string
            newPassword: string
            confirmPassword: string
        },
    ): Promise<any> {
        return this.usersService.changeUserPassword(id, newPass)
    }

    @Delete(':id')
    async deleteUserById(@Param('id') id: string): Promise<void> {
        this.usersService.deleteUserById(id)
    }

    @Post('/search')
    searchForUsers(
        @Body('pagination') pagination: { offset: number; limit: number },
        @Body('filters') userFilters: { queryString: string },
        @Body('searchOptions') searchOptions: { title: boolean; all: boolean },
        @Body('getCount') getCount: boolean,
    ) {
        return this.usersService.searchForUsers(
            pagination,
            userFilters,
            searchOptions,
            getCount,
        )
    }

    @Post('/clients/search')
    searchForClients(
        @Body('pagination') pagination: { offset: number; limit: number },
        @Body('clientName') clientName: string,
    ) {
        return this.usersService.searchForClients(pagination, clientName)
    }

    @Post('/sellers/search')
    searchForSellers(
        @Body('pagination') pagination: { offset: number; limit: number },
        @Body('sellerName') sellerName: string,
    ) {
        return this.usersService.searchForSellers(pagination, sellerName)
    }

    //TOD0: JWT and Cookie expiration usage of refresh token
    @Post('/login')
    async login(
        @Body('phone_number') phone_number: string,
        @Body('password') password: string,
        @Res({ passthrough: true }) response: Response, // we use passthrough: true to pass the response to the frontend
    ) {
        const user = await this.usersService.findOne({
            where: { phone_number },
        })

        if (!user) {
            throw new BadRequestException('User not found')
        }

        // if (!(await bcrypt.compare(password, user.password))) {
        //     throw new BadRequestException('Invalid credentials')
        // }

        const jwt = await this.jwtService.signAsync(
            { id: user.id },
            { expiresIn: '1h' },
        ) // JWT expires in 1 hour

        response.cookie('jwt', jwt, { httpOnly: true, maxAge: 3600000 }) // Cookie expires in 1 hour (3600000 milliseconds)

        return new UserResponseDTO(user)
    }

    @Post('logout')
    async logout(@Res({ passthrough: true }) response: Response) {
        response.clearCookie('jwt')

        return {
            message: 'SUCCESS: Logged out',
        }
    }

    /**
     * @description Generates a new random password for a user who has forgotten their password,
     * and then sends this new password to the user's email address.
     * @param email
     */
    @Post('resetPassword')
    async resetPassword(@Body('email') email: string) {
        return this.usersService.resetPassword(email)
    }
}
