import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DeleteResult, Repository } from 'typeorm'
import { UpdateResult } from 'typeorm'
import { Order } from './order.entity'
import { OrderItem } from '../order-items/orderItem.entity'
import { Product } from '../products/product.entity'
import { getRepository } from 'typeorm'

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
    const { client, seller, order_items } = orderData

    // Create and save the order
    let order: Order = new Order()
    order.client = client
    order.seller = seller

    order = await this.ordersRepository.save(order)

    let total_price = 0 // Initialize total_price

    // Loop  through the order_items, create and save them
    for (const item of order_items) {
      const { quantity, returned_quantity, product } = item

      // Ensure the product exists
      const productEntity = await this.productsRepository.findOne({
        where: { id: product },
      })

      if (!productEntity) {
        throw new Error(`Product with ID ${product} not found`) // use product directly as an ID
      }

      // Calculate total_price
      total_price += productEntity.price * (quantity - returned_quantity)

      const orderItem = this.orderItemsRepository.create({
        order: order,
        product: productEntity,
        quantity,
        returned_quantity,
      })

      await this.orderItemsRepository.save(orderItem)
    }

    // Update the total_price of the order
    order.total_price = total_price
    await this.ordersRepository.save(order)

    // Return the newly created order
    return this.ordersRepository.findOne({
      where: { id: order.id },
      relations: ['order_items', 'order_items.product'],
    })
  }

  getAllOrders(): Promise<Order[]> {
    return this.ordersRepository.find({
      relations: ['client', 'seller', 'order_items', 'order_items.product'],
    })
  }

  getOrderById(id: string): Promise<Order> {
    return this.ordersRepository.findOne({ where: { id: parseInt(id, 10) } })
  }

  async updateOrder(id: string, order: Partial<Order>): Promise<any> {
    const { client, order_items } = order

    const updatedOrder: UpdateResult = await this.ordersRepository.update(
      parseInt(id, 10),
      {
        client,
      },
    )

    let total_price = 0 // Initialize total_price

    for (const item of order_items) {
      const { id: itemId, quantity, returned_quantity, product } = item

      // Here, ensure that product is unique for each order_item
      const productEntity = await this.productsRepository.findOne({
        where: { id: Number(product) },
      })

      if (!productEntity) {
        throw new Error(`Product with ID ${product} not found`)
      }

      // Calculate total_price
      total_price += productEntity.price * (quantity - returned_quantity)

      if (itemId) {
        // If item has an ID, it's an existing order item and needs to be updated
        await this.orderItemsRepository.update(itemId, {
          quantity,
          returned_quantity,
          product: productEntity,
        })
      } else {
        // If item does not have an ID, it's a new order item and needs to be created
        const newOrderItem = this.orderItemsRepository.create({
          order: { id: parseInt(id, 10) }, // associate with the order
          product: productEntity,
          quantity,
          returned_quantity,
        })

        await this.orderItemsRepository.save(newOrderItem)
      }
    }

    // Update the total_price of the order
    await this.ordersRepository.update(parseInt(id, 10), { total_price })

    const orderWithRelations = await this.ordersRepository.findOne({
      where: { id: parseInt(id, 10) },
      relations: ['order_items', 'order_items.product'],
    })

    return {
      updatedOrder,
      orderWithRelations,
    }
  }

  async deleteOrder(id: string): Promise<DeleteResult> {
    // first, find all OrderItem entities with the specified Order ID and delete them
    const items = await this.orderItemsRepository.find({
      where: { order: { id: parseInt(id, 10) } },
    })
    await this.orderItemsRepository.remove(items)

    // then, delete the Order
    return this.ordersRepository.delete(parseInt(id, 10))
  }

  getOrdersByClientId(client_id: string): Promise<Order[]> {
    return this.ordersRepository
      .createQueryBuilder('order')
      .innerJoinAndSelect('order.client', 'client', 'client.id = :clientId', {
        clientId: parseInt(client_id, 10),
      })
      .getMany()
  }

  getOrdersBySellerId(seller_id: string): Promise<Order[]> {
    return this.ordersRepository
      .createQueryBuilder('order')
      .innerJoinAndSelect('order.seller', 'seller', 'seller.id = :sellerId', {
        sellerId: parseInt(seller_id, 10),
      })
      .getMany()
  }

  async getFilteredOrders(
    pagination: any,
    filters: any,
    getCount: boolean,
  ): Promise<{ orders: Order[]; count?: number }> {
    const query = this.ordersRepository.createQueryBuilder('order')

    // Join the related entities
    query.leftJoinAndSelect('order.client', 'client')
    query.leftJoinAndSelect('order.seller', 'seller')
    query.leftJoinAndSelect('order.order_items', 'order_items')
    query.leftJoinAndSelect('order_items.product', 'product')

    console.log('filters', filters)

    if (filters.startDate && filters.endDate) {
      const startDate = new Date(filters.startDate).toISOString()
      const endDate = new Date(filters.endDate).toISOString()

      query.andWhere('order.created_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
    }

    if (filters.clientId) {
      query.andWhere('order.client_id = :clientId', {
        clientId: filters.clientId,
      })
    }

    if (filters.sellerId) {
      query.andWhere('order.seller_id = :sellerId', {
        sellerId: filters.sellerId,
      })
    }

    let count
    if (getCount) {
      count = await query.clone().getCount()
    }

    query.skip(pagination.offset).take(pagination.limit)

    // TODO: Order by latest
    query.orderBy('product.id', 'DESC')

    const orders = await query.getMany()
    return getCount ? { orders, count } : { orders }
  }

  async getAdminMonthlySales(): Promise<any> {
    const orderRepository = getRepository(Order)

    return orderRepository
      .createQueryBuilder('orders')
      .select('MONTH(orders.created_at)', 'month')
      .addSelect('SUM(orders.total_price)', 'monthly_sales')
      .groupBy('MONTH(orders.created_at)')
      .getRawMany()
  }

  async getClientMonthlySpending(clientId: number): Promise<any> {
    const orderRepository = getRepository(Order)

    return orderRepository
      .createQueryBuilder('orders')
      .select('MONTH(orders.created_at)', 'month')
      .addSelect('SUM(orders.total_price)', 'monthly_spending')
      .where('orders.client_id = :clientId', { clientId })
      .groupBy('MONTH(orders.created_at)')
      .getRawMany()
  }
}
