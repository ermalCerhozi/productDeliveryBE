import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DeleteResult, Repository, UpdateResult, getRepository } from 'typeorm'
import { Order } from './order.entity'
import { OrderItem } from '../order-items/orderItem.entity'
import { Product } from '../products/product.entity'
import * as pdfMake from 'pdfmake/build/pdfmake'
import * as pdfFonts from 'pdfmake/build/vfs_fonts'
import { constrainedMemory } from 'process'

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

        let orderTotalPrice = 0 // Initialize total_price

        // Loop  through the order_items, create and save them
        for (const item of order_items) {
            const { quantity, returned_quantity, product } = item
            let orderItemTotalPrice = 0

            // Ensure the product exists
            const productEntity = await this.productsRepository.findOne({
                where: { id: product },
            })

            if (!productEntity) {
                throw new Error(`Product with ID ${product} not found`) // use product directly as an ID
            }

            orderItemTotalPrice +=
                productEntity.price * (quantity - returned_quantity)
            orderTotalPrice += orderItemTotalPrice

            const orderItem = this.orderItemsRepository.create({
                order: order,
                product: productEntity,
                quantity,
                returned_quantity,
                order_item_total_price: orderItemTotalPrice,
            })

            await this.orderItemsRepository.save(orderItem)
        }

        // Update the total_price of the order
        order.total_price = orderTotalPrice
        await this.ordersRepository.save(order)

        // Return the newly created order
        return this.ordersRepository.findOne({
            where: { id: order.id },
            relations: [
                'client',
                'seller',
                'order_items',
                'order_items.product',
            ],
        })
    }

    getAllOrders(): Promise<Order[]> {
        return this.ordersRepository.find({
            relations: [
                'client',
                'seller',
                'order_items',
                'order_items.product',
            ],
        })
    }

    getOrderById(id: string): Promise<Order> {
        return this.ordersRepository.findOne({
            where: { id: parseInt(id, 10) },
        })
    }

    async updateOrder(id: string, order: Partial<Order>): Promise<any> {
        const { order_items } = order

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

        return await this.ordersRepository.findOne({
            where: { id: parseInt(id, 10) },
            relations: [
                'client',
                'seller',
                'order_items',
                'order_items.product',
            ],
        })
    }

    async deleteOrder(id: string): Promise<Order> {
        const orderToBeDeleted = await this.ordersRepository.findOne({
            where: { id: parseInt(id, 10) },
            relations: [
                'client',
                'seller',
                'order_items',
                'order_items.product',
            ],
        })

        if (!orderToBeDeleted) {
            throw new Error(`Order with ID ${id} not found`)
        }

        // Delete order items and the order
        await this.orderItemsRepository.remove(orderToBeDeleted.order_items)
        await this.ordersRepository.delete(parseInt(id, 10))

        // return the deleted order
        return orderToBeDeleted
    }

    getOrdersByClientId(client_id: string): Promise<Order[]> {
        return this.ordersRepository
            .createQueryBuilder('order')
            .innerJoinAndSelect(
                'order.client',
                'client',
                'client.id = :clientId',
                {
                    clientId: parseInt(client_id, 10),
                },
            )
            .getMany()
    }

    getOrdersBySellerId(seller_id: string): Promise<Order[]> {
        return this.ordersRepository
            .createQueryBuilder('order')
            .innerJoinAndSelect(
                'order.seller',
                'seller',
                'seller.id = :sellerId',
                {
                    sellerId: parseInt(seller_id, 10),
                },
            )
            .getMany()
    }

    async getFilteredOrders(
        filters: any,
        getCount: boolean,
        pagination?: any,
    ): Promise<{ orders: Order[]; count?: number }> {
        const query = this.ordersRepository.createQueryBuilder('order')

        // Join the related entities
        query.leftJoinAndSelect('order.client', 'client')
        query.leftJoinAndSelect('order.seller', 'seller')
        query.leftJoinAndSelect('order.order_items', 'order_items')
        query.leftJoinAndSelect('order_items.product', 'product')

        if (filters.date) {
            if (filters.date === 'last-24h') {
                query.andWhere('order.created_at > NOW() - INTERVAL 1 DAY')
            } else if (filters.date === 'last-48h') {
                query.andWhere('order.created_at > NOW() - INTERVAL 2 DAY')
            } else if (filters.date === 'last-72h') {
                query.andWhere('order.created_at > NOW() - INTERVAL 3 DAY')
            } else if (filters.date === 'last-7days') {
                query.andWhere('order.created_at > NOW() - INTERVAL 7 DAY')
            } else if (filters.date === 'last-30days') {
                query.andWhere('order.created_at > NOW() - INTERVAL 30 DAY')
            } else if (filters.date === 'last-12months') {
                query.andWhere('order.created_at > NOW() - INTERVAL 1 YEAR')
            }
        }

        if (filters.clientIds && filters.clientIds.length > 0) {
            query.andWhere('order.client_id IN (:...clientIds)', {
                clientIds: filters.clientIds,
            })
        }

        if (filters.sellerIds && filters.sellerIds.length > 0) {
            query.andWhere('order.seller_id IN (:...sellerIds)', {
                sellerIds: filters.sellerIds,
            })
        }

        let count
        if (getCount) {
            count = await query.clone().getCount()
        }

        if (pagination) {
            query.skip(pagination.offset).take(pagination.limit)
        }

        query.orderBy('order.created_at', 'DESC')

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

    async generatePdf(orders: Order[], endDate: Date, startDate: Date) {
        pdfMake.vfs = pdfFonts.pdfMake.vfs

        let total_price = 0

        const data = orders.map((order, index) => {
            const itemDetails = order.order_items.map((item) => ({
                order_item: `${item.quantity} ${item.product?.product_name}`,
                order_return: `${item.returned_quantity}`,
            }))

            const order_items = itemDetails
                .map((item) => item.order_item)
                .join('\n')
            const order_returns = itemDetails
                .map((item) => item.order_return)
                .join('\n')

            total_price += Number(order.total_price) // Calculate the total_price

            const date = new Date(order.created_at)
            const order_date = date.toLocaleDateString('en-GB')
            const order_time = `${date.getHours()}:${date.getMinutes()}`

            return [
                index + 1 || '',
                order.seller.first_name + ' ' + order.seller.last_name || '',
                order.client.first_name + ' ' + order.client.last_name || '',
                order_items || '',
                order_returns || '',
                order_date || '',
                order_time || '',
                Math.round(order.total_price).toLocaleString() + ' ' + 'Lekë' ||
                    '',
            ]
        })

        // Insert column titles
        data.unshift([
            '#',
            'Seller',
            'Client',
            'Order',
            'Re.',
            'Date',
            'Time',
            'Price',
        ])

        // Insert a row with the total price
        data.push([
            '',
            '',
            '',
            '',
            '',
            '',
            'Total',
            Math.round(total_price).toLocaleString() + ' ' + 'Lekë' || '',
        ])

        const startDateObj = new Date(startDate)
        const endDateObj = new Date(endDate)
        const dateRange =
            startDate && endDate
                ? `${startDateObj.toLocaleDateString(
                      'en-GB',
                  )} to ${endDateObj.toLocaleDateString('en-GB')}`
                : 'No date range provided'

        const documentDefinition = {
            content: [
                {
                    text: `Orders from: ${dateRange}`,
                    style: 'header',
                },
                {
                    layout: 'lightHorizontalLines',
                    table: {
                        headerRows: 1,
                        widths: [15, 45, '*', 100, 25, 65, 35, '*'],
                        body: data,
                    },
                },
                {
                    text: 'If you want to see your orders in real time or you want to view product pricing you can visit:',
                    style: 'body',
                    absolutePosition: { x: 40, y: 750 }, // Adjust y value according to your page size
                },
                {
                    text: 'https://asdfasdf',
                    style: 'link',
                    link: 'https://asdfasdf',
                    absolutePosition: { x: 40, y: 770 }, // Adjust y value according to your page size
                },
            ],
            styles: {
                header: {
                    fontSize: 18,
                    bold: true,
                    margin: [0, 0, 0, 10],
                },
                body: {
                    fontSize: 12,
                    bold: false,
                    margin: [0, 0, 0, 5],
                },
                link: {
                    fontSize: 12,
                    color: 'blue',
                    decoration: 'underline',
                    margin: [0, 0, 0, 5],
                },
            },
        }

        const pdfDoc = pdfMake.createPdf(documentDefinition)
        return new Promise((resolve) => {
            pdfDoc.getBuffer((buffer) => {
                resolve(buffer)
            })
        })
    }
}
