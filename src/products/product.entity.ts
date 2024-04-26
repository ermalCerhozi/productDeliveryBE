import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('products')
export class Product {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ length: 50 })
    product_name: string

    @Column('decimal', { precision: 8, scale: 2 })
    price: number

    @Column('text', { nullable: true })
    description: string

    @Column({ length: 255, nullable: true })
    image: string

    @Column('text', { nullable: true })
    ingredients: string
}
