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
} from '@nestjs/common';
import { Response, Request } from 'express';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  @Post()
  async createUser(@Body() userData: User): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    userData.password = hashedPassword;
    return this.usersService.createUser(userData);
  }

  @Get()
  async getAllUsers(): Promise<User[]> {
    return this.usersService.getAllUsers();
  }

  @Get(':id')
  async getUserById(@Param('id') id: number): Promise<User> {
    return this.usersService.getUserById(id);
  }

  // @Get(':phone_number')
  // async getUserByPhoneNumber(@Param('phone_number') phone_number: string): Promise<User> {
  //   return this.usersService.getUserByPhoneNumber(phone_number);
  // }

  @Put(':id')
  async updateUserDetails(
    @Param('id') id: string,
    @Body() userData: Partial<User>,
  ): Promise<void> {
    return this.usersService.updateUserDetails(id, userData);
  }

  @Delete(':id')
  async deleteUserById(@Param('id') id: string): Promise<void> {
    return this.usersService.deleteUserById(id);
  }

  //Login
  @Post('login')
  async login(
    @Body('phone_number') phone_number: string,
    @Body('password') password: string,
    @Res({ passthrough: true }) response: Response, // we use passthrough: true to pass the response to the frontend
  ) {
    const user = await this.usersService.findOne({ where: { phone_number } });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!(await bcrypt.compare(password, user.password))) {
      throw new BadRequestException('Invalid credentials');
    }

    const jwt = await this.jwtService.signAsync({ id: user.id });

    response.cookie('jwt', jwt, { httpOnly: true }); // we use httpOnly: true so the frontend cant access the jwt

    return {
      message: 'success',
    };
  }

  // Get the authenticated user
  @Get('user')
  async user(@Req() request: Request) {
    try {
      const cookie = request.cookies['jwt'];
      const data = await this.jwtService.verifyAsync(cookie);

      if (!data) {
        throw new UnauthorizedException();
      }

      const user = await this.usersService.findOne({
        where: { id: data['id'] },
      });

      const { password, ...result } = user;

      return result;
    } catch (e) {
      throw new UnauthorizedException('No JWT token found in cookie');
    }
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('jwt');

    return {
      message: 'success',
    };
  }
}
