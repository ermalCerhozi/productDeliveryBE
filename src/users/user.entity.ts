import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm'
import { Order } from '../orders/order.entity'

@Entity('users')
export class User {
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

    @Column({ length: 50 })
    first_name: string

    @Column({ length: 50 })
    last_name: string

    @Column({ length: 50 })
    nickname: string

    @Column({ length: 100 })
    email: string

    @Column({ length: 15 })
    phone_number: string

    @Column({
        type: 'enum',
        enum: ['Admin', 'Manager', 'Seller', 'Client'],
    })
    role: string

    @Column({ length: 64 })
    password: string

    @Column({ length: 500 })
    location: string

    @Column({ length: 500 })
    profile_picture?: string //Optional

    @OneToMany(() => Order, (order) => order.client)
    client_orders: Order[]

    @OneToMany(() => Order, (order) => order.seller)
    seller_orders: Order[]
}
