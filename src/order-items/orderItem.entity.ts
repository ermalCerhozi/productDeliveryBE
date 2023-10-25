import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm'
import { Order } from '../orders/order.entity'
import { Product } from '../products/product.entity'

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product

  @Column('int')
  quantity: number

  @Column('int')
  returned_quantity: number
}
