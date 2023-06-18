import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    return this.ordersRepository.find();
  }

  getOrderById(id: string): Promise<Order> {
    return this.ordersRepository.findOne({ id: parseInt(id, 10) });
  }

  updateOrder(id: string, order: Partial<Order>): Promise<void> {
    return this.ordersRepository.update(parseInt(id, 10), order);
  }

  deleteOrder(id: string): Promise<void> {
    return this.ordersRepository.delete(parseInt(id, 10));
  }

  getOrdersByClientId(client_id: string): Promise<Order[]> {
    return this.ordersRepository.find({ client_id: parseInt(client_id, 10) });
  }

  getOrdersBySellerId(seller_id: string): Promise<Order[]> {
    return this.ordersRepository.find({ seller_id: parseInt(seller_id, 10) });
  }

  getOrdersByDate(date: Date): Promise<Order[]> {
    return this.ordersRepository.find({ order_date: date });
  }
}
