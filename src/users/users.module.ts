import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from './user.entity'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'
import { JwtModule } from '@nestjs/jwt'
import { EmailService } from 'src/email.service'

@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
        JwtModule.register({
            secret: 'secret', //TODO: usually should be stored in .env file and not like this. EX: process.env.JWT_SECRET
            signOptions: { expiresIn: '7d' }, // token will expire in 7 days
        }),
    ],
    controllers: [UsersController],
    providers: [UsersService, EmailService],
})
export class UsersModule {}
