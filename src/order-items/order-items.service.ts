import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { OrderItem } from './orderItem.entity'

@Injectable()
export class OrderItemsService {
  constructor(
    @InjectRepository(OrderItem)
    private orderItemsRepository: Repository<OrderItem>,
  ) {}

  createOrderItem(orderItem: OrderItem): Promise<OrderItem> {
    return this.orderItemsRepository.save(orderItem)
  }

  getAllOrderItems(): Promise<OrderItem[]> {
    return this.orderItemsRepository.find()
  }

  getOrderItemById(id: number): Promise<OrderItem> {
    return this.orderItemsRepository.findOne({ where: { id: id } })
  }

  async updateOrderItem(
    id: string,
    orderItem: Partial<OrderItem>,
  ): Promise<void> {
    await this.orderItemsRepository.update(id, orderItem)
  }

  async deleteOrderItem(id: string): Promise<void> {
    await this.orderItemsRepository.delete(id)
  }

  getOrderItemsByOrderId(orderId: string): Promise<OrderItem[]> {
    return this.orderItemsRepository
      .createQueryBuilder('order_item')
      .innerJoinAndSelect('order_item.order', 'order', 'order.id = :orderId', {
        orderId: parseInt(orderId, 10),
      })
      .getMany()
  }

  getOrderItemsByProductId(productId: string): Promise<OrderItem[]> {
    return this.orderItemsRepository
      .createQueryBuilder('order_item')
      .innerJoinAndSelect(
        'order_item.product',
        'product',
        'product.id = :productId',
        {
          productId: parseInt(productId, 10),
        },
      )
      .getMany()
  }

  async updateOrderItemQuantity(id: string, quantity: number): Promise<void> {
    await this.orderItemsRepository.update(id, { quantity })
  }
}
