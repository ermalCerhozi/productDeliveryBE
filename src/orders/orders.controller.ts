import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common'
import { OrdersService } from './orders.service'
import { Order } from './order.entity'
import { DeleteResult, UpdateResult } from 'typeorm'

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  createOrder(@Body() order: Order): Promise<Order> {
    return this.ordersService.createOrder(order)
  }

  @Get()
  getAllOrders(): Promise<Order[]> {
    return this.ordersService.getAllOrders()
  }

  @Put(':id')
  updateOrder(
    @Param('id') id: string,
    @Body() order: Partial<Order>,
  ): Promise<UpdateResult> {
    return this.ordersService.updateOrder(id, order)
  }

  @Delete(':id')
  deleteOrder(@Param('id') id: string): Promise<DeleteResult> {
    return this.ordersService.deleteOrder(id)
  }

  @Get('client/:clientId')
  getOrdersByClientId(@Param('clientId') clientId: string): Promise<Order[]> {
    return this.ordersService.getOrdersByClientId(clientId)
  }

  @Get('seller/:sellerId')
  getOrdersBySellerId(@Param('sellerId') sellerId: string): Promise<Order[]> {
    return this.ordersService.getOrdersBySellerId(sellerId)
  }

  @Get('filter')
  getFilteredOrders(
    @Query()
    filters: {
      startDate?: Date
      endDate?: Date
      clientId?: number
      sellerId?: number
    },
  ): Promise<Order[]> {
    return this.ordersService.getFilteredOrders(filters)
  }

  @Get('admin/monthly-sales')
  getAdminMonthlySales(): Promise<any> {
    return this.ordersService.getAdminMonthlySales()
  }

  @Get('client/:clientId/monthly-spending')
  getClientMonthlySpending(@Param('clientId') clientId: number): Promise<any> {
    return this.ordersService.getClientMonthlySpending(clientId)
  }
}
