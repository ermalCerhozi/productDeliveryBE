import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { OrderItemsService } from './order-items.service';
import { OrderItem } from './orderItem.entity';

@Controller('order-items')
export class OrderItemsController {
  constructor(private readonly orderItemsService: OrderItemsService) {}

  @Post()
  createOrderItem(@Body() orderItem: OrderItem) {
    return this.orderItemsService.createOrderItem(orderItem);
  }

  @Get()
  getAllOrderItems() {
    return this.orderItemsService.getAllOrderItems();
  }

  @Get(':id')
  getOrderItemById(@Param('id') id: string) {
    return this.orderItemsService.getOrderItemById(id);
  }

  @Patch(':id')
  updateOrderItem(
    @Param('id') id: string,
    @Body() orderItem: Partial<OrderItem>,
  ) {
    return this.orderItemsService.updateOrderItem(id, orderItem);
  }

  @Delete(':id')
  deleteOrderItem(@Param('id') id: string) {
    return this.orderItemsService.deleteOrderItem(id);
  }

  @Get('order/:orderId')
  getOrderItemsByOrderId(@Param('orderId') orderId: string) {
    return this.orderItemsService.getOrderItemsByOrderId(orderId);
  }

  @Get('product/:productId')
  getOrderItemsByProductId(@Param('productId') productId: string) {
    return this.orderItemsService.getOrderItemsByProductId(productId);
  }

  @Patch(':id/quantity/:quantity')
  updateOrderItemQuantity(
    @Param('id') id: string,
    @Param('quantity') quantity: number,
  ) {
    return this.orderItemsService.updateOrderItemQuantity(id, quantity);
  }
}
