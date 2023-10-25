import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm'
import { User } from '../users/user.entity'
import { OrderItem } from '../order-items/orderItem.entity'

@Entity('orders')
export class Order {
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at: Date

  @PrimaryGeneratedColumn()
  id: number

  @ManyToOne(() => User, (user) => user.client_orders)
  @JoinColumn({ name: 'client_id' })
  client: User

  @ManyToOne(() => User, (user) => user.seller_orders)
  @JoinColumn({ name: 'seller_id' })
  seller: User

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order)
  order_items: OrderItem[]

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0.0 })
  total_price: number
}
