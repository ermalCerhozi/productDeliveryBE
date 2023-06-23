import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { UpdateResult } from 'typeorm';
import { Order } from './order.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
  ) {}

  createOrder(order: Order): Promise<Order> {
    return this.ordersRepository.save(order);
  }

  getAllOrders(): Promise<Order[]> {
    return this.ordersRepository.find({
      relations: ['client', 'seller', 'order_items', 'order_items.product'],
    });
  }

  getOrderById(id: string): Promise<Order> {
    return this.ordersRepository.findOne({ where: { id: parseInt(id, 10) } });
  }

  updateOrder(id: string, order: Partial<Order>): Promise<UpdateResult> {
    return this.ordersRepository.update(parseInt(id, 10), order);
  }

  deleteOrder(id: string): Promise<DeleteResult> {
    return this.ordersRepository.delete(parseInt(id, 10));
  }

  getOrdersByClientId(client_id: string): Promise<Order[]> {
    return this.ordersRepository
      .createQueryBuilder('order')
      .innerJoinAndSelect('order.client', 'client', 'client.id = :clientId', {
        clientId: parseInt(client_id, 10),
      })
      .getMany();
  }

  getOrdersBySellerId(seller_id: string): Promise<Order[]> {
    return this.ordersRepository
      .createQueryBuilder('order')
      .innerJoinAndSelect('order.seller', 'seller', 'seller.id = :sellerId', {
        sellerId: parseInt(seller_id, 10),
      })
      .getMany();
  }

  getOrdersByDate(date: Date): Promise<Order[]> {
    return this.ordersRepository
      .createQueryBuilder('order')
      .where('order.order_date = :date', { date })
      .getMany();
  }

  getDetailedOrderInformation(orderId: string): Promise<Order> {
    return this.ordersRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.client', 'client')
      .leftJoinAndSelect('order.seller', 'seller')
      .leftJoinAndSelect('order.order_items', 'order_items')
      .leftJoinAndSelect('order_items.product', 'product')
      .where('order.id = :orderId', { orderId: parseInt(orderId, 10) })
      .getOne();
  }
}
