import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Order } from './order.entity'
import { OrdersService } from './orders.service'
import { OrdersController } from './orders.controller'
import { OrderItem } from 'src/order-items/orderItem.entity'
import { User } from 'src/users/user.entity'
import { Product } from 'src/products/product.entity'
import { EmailService } from 'src/email.service'
import { UsersService } from 'src/users/users.service'

@Module({
    imports: [TypeOrmModule.forFeature([Order, OrderItem, Product, User])],
    providers: [OrdersService, EmailService, UsersService],
    controllers: [OrdersController],
})
export class OrdersModule {}
