import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Order } from './order.entity';

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  createOrder(@Body() order: Order): Promise<Order> {
    return this.ordersService.createOrder(order);
  }

  @Get()
  getAllOrders(): Promise<Order[]> {
    return this.ordersService.getAllOrders();
  }

  @Get(':id')
  getOrderById(@Param('id') id: string): Promise<Order> {
    return this.ordersService.getOrderById(id);
  }

  @Put(':id')
  updateOrder(
    @Param('id') id: string,
    @Body() order: Partial<Order>,
  ): Promise<void> {
    return this.ordersService.updateOrder(id, order);
  }

  @Delete(':id')
  deleteOrder(@Param('id') id: string): Promise<void> {
    return this.ordersService.deleteOrder(id);
  }

  @Get('client/:clientId')
  getOrdersByClientId(@Param('clientId') clientId: string): Promise<Order[]> {
    return this.ordersService.getOrdersByClientId(clientId);
  }

  @Get('seller/:sellerId')
  getOrdersBySellerId(@Param('sellerId') sellerId: string): Promise<Order[]> {
    return this.ordersService.getOrdersBySellerId(sellerId);
  }

  @Get('date/:date')
  getOrdersByDate(@Param('date') dateString: string): Promise<Order[]> {
    const date = new Date(dateString);
    return this.ordersService.getOrdersByDate(date);
  }
}
