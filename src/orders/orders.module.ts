import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Order } from './order.entity'
import { OrdersService } from './orders.service'
import { OrdersController } from './orders.controller'
import { OrderItem } from 'src/order-items/orderItem.entity'
import { Product } from 'src/products/product.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, Product])],
  providers: [OrdersService],
  controllers: [OrdersController],
})
export class OrdersModule {}
