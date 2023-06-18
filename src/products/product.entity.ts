import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  product_name: string;

  @Column('decimal', { precision: 8, scale: 2 })
  price: number;
}
