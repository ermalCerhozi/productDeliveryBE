import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { UpdateResult } from 'typeorm';
import { Order } from './order.entity';
import { OrderItem } from '../order-items/orderItem.entity';
import { Product } from '../products/product.entity';
import { log } from 'console';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemsRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  async createOrder(orderData: any): Promise<Order> {
    const { client, seller, order_items } = orderData;

    const order_date = new Date();

    // Create and save the order
    const order: Order = await this.ordersRepository.save({
      order_date,
      client,
      seller,
    });

    console.log('order', order);
    // Loop  through the orderitems, create and save them
    for (const item of order_items) {
      const { quantity, product } = item;

      console.log('item', item);
      // Ensure the product exists
      const productEntity = await this.productsRepository.findOne({
        where: { id: product.id },
      });
      if (!productEntity) {
        throw new Error(`Product with ID ${product} not found`);
      }
      console.log('productEntity', productEntity);
      const orderItem = this.orderItemsRepository.create({
        order: order,
        product: productEntity,
        quantity,
      });

      await this.orderItemsRepository.save(orderItem);
    }

    // Return the newly created order
    return this.ordersRepository.findOne({
      where: { id: order.id },
      relations: ['order_items', 'order_items.product'],
    });
  }

  getAllOrders(): Promise<Order[]> {
    return this.ordersRepository.find({
      relations: ['client', 'seller', 'order_items', 'order_items.product'],
    });
  }

  getOrderById(id: string): Promise<Order> {
    return this.ordersRepository.findOne({ where: { id: parseInt(id, 10) } });
  }

  async updateOrder(id: string, order: Partial<Order>): Promise<any> {
    const { order_date, client, seller, order_items } = order;

    const updatedOrder: UpdateResult = await this.ordersRepository.update(
      parseInt(id, 10),
      {
        order_date,
        client,
        seller,
      },
    );

    for (const item of order_items) {
      const { id: itemId, quantity, product } = item;

      if (itemId) {
        // If item has an ID, it's an existing order item and needs to be updated
        await this.orderItemsRepository.update(itemId, { quantity, product });
      } else {
        // If item does not have an ID, it's a new order item and needs to be created
        // Ensure the product exists
        const productEntity = await this.productsRepository.findOne({
          where: { id: product.id },
        });
        if (!productEntity) {
          throw new Error(`Product with ID ${product} not found`);
        }

        const newOrderItem = this.orderItemsRepository.create({
          order: { id: parseInt(id, 10) }, // associate with the order
          product: productEntity,
          quantity,
        });

        await this.orderItemsRepository.save(newOrderItem);
      }
    }

    return updatedOrder;
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
