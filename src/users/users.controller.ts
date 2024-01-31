import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    BadRequestException,
    Res,
    Req,
    UnauthorizedException,
} from '@nestjs/common'
import { Response, Request } from 'express'
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

    @Put(':id')
    async updateUserDetails(
        @Param('id') id: string,
        @Body() userData: Partial<User>,
    ): Promise<void> {
        this.usersService.updateUserDetails(id, userData)
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
        console.log('searchForUsers')
        return this.usersService.searchForUsers(
            pagination,
            userFilters,
            searchOptions,
            getCount,
        )
    }

    //Login
    @Post('login')
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

        if (!(await bcrypt.compare(password, user.password))) {
            throw new BadRequestException('Invalid credentials')
        }

        const jwt = await this.jwtService.signAsync({ id: user.id })

        response.cookie('jwt', jwt, { httpOnly: true }) // we use httpOnly: true so the frontend cant access the jwt

        return new UserResponseDTO(user)
    }

    // Get the authenticated user
    @Get('loggedInUser')
    async user(@Req() request: Request) {
        try {
            const cookie = request.cookies['jwt']
            const data = await this.jwtService.verifyAsync(cookie)

            const user = await this.usersService.findOne({
                where: { id: data['id'] },
            })

            if (!user) {
                throw new UnauthorizedException('User not found')
            }

            return new UserResponseDTO(user)
        } catch (e) {
            throw new UnauthorizedException('No JWT token found in cookie')
        }
    }

    @Post('logout')
    async logout(@Res({ passthrough: true }) response: Response) {
        response.clearCookie('jwt')

        return {
            message: 'SUCCESS: Logged out',
        }
    }
}
