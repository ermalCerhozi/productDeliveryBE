import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Param,
    Body,
    Res,
} from '@nestjs/common'
import { OrdersService } from './orders.service'
import { Order } from './order.entity'
import { DeleteResult, UpdateResult } from 'typeorm'
import { Response } from 'express'

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

    @Post('/search')
    getFilteredOrders(
        @Body('filters')
            filters: {
            startDate?: Date
            endDate?: Date
            clientId?: number
            sellerId?: number
        },
        @Body('getCount') getCount: boolean,
        @Body('pagination') pagination: { offset: number; limit: number },
    ) {
        console.log('filters', filters)
        return this.ordersService.getFilteredOrders(
            filters,
            getCount,
            pagination,
        )
    }

    @Get('admin/monthly-sales')
    getAdminMonthlySales(): Promise<any> {
        return this.ordersService.getAdminMonthlySales()
    }

    @Get('client/:clientId/monthly-spending')
    getClientMonthlySpending(
        @Param('clientId') clientId: number,
    ): Promise<any> {
        return this.ordersService.getClientMonthlySpending(clientId)
    }

    @Post('/download')
    async getFilteredOrdersToDownload(
        @Body('filters')
            filters: {
            startDate?: Date
            endDate?: Date
            clientId?: number
            sellerId?: number
        },
        @Body('getCount') getCount = false,
        @Res() response: Response,
    ) {
        const orders = await this.ordersService.getFilteredOrders(
            filters,
            getCount,
        )

        const { startDate, endDate } = filters
        const pdfBuffer = await this.ordersService.generatePdf(
            orders.orders,
            endDate,
            startDate,
        )

        response.setHeader('Content-Type', 'application/pdf')
        response.setHeader(
            'Content-Disposition',
            'attachment; filename=filtered_orders.pdf',
        )
        response.end(pdfBuffer, 'binary')
    }
}
