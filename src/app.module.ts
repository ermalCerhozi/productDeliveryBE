import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from './users/user.entity'
import { Product } from './products/product.entity'
import { Order } from './orders/order.entity'
import { OrderItem } from './order-items/orderItem.entity'
import { UsersModule } from './users/users.module'
import { ProductsModule } from './products/products.module'
import { OrdersModule } from './orders/orders.module'
import { OrderItemsModule } from './order-items/order-items.module'

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'mysql',
            host: 'localhost',
            port: 3306,
            username: 'root',
            password: '',
            database: 'bakerydb',
            entities: [User, Product, Order, OrderItem],
            synchronize: true,
        }),
        UsersModule,
        ProductsModule,
        OrdersModule,
        OrderItemsModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
