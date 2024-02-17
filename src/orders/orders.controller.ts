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
import { UpdateResult } from 'typeorm'
import { Response } from 'express'
import { EmailService } from 'src/email.service'
import { UsersService } from 'src/users/users.service'

@Controller('orders')
export class OrdersController {
    constructor(
        private ordersService: OrdersService,
        private emailService: EmailService,
        private userService: UsersService,
    ) {}

    @Post()
    async createOrder(@Body() order: Order): Promise<Order> {
        const createdOrder = await this.ordersService.createOrder(order)

        //Get the client's email
        const client = await this.userService.getUserById(
            order.client as unknown as number,
        )

        //Send the Order Created email to the client
        await this.emailService.sendOrderCreatedEmail(
            client.email,
            createdOrder,
        )
        return createdOrder
    }

    @Get()
    getAllOrders(): Promise<Order[]> {
        return this.ordersService.getAllOrders()
    }

    // TODO: Add a features that emphasizes the details that have been updated...
    @Put(':id')
    async updateOrder(
        @Param('id') id: string,
        @Body() order: Partial<Order>,
    ): Promise<UpdateResult> {
        const updatedOrder = await this.ordersService.updateOrder(id, order)

        //Get the name of the person who updated the order
        const seller = await this.userService.getUserById(
            order.seller as unknown as number,
        )

        //Get the workspace Admin's email
        const admin = await this.userService.getAllAdminUsers()

        //Send the Order Updated email to the Admin
        await this.emailService.sendOrderUpdatedEmail(
            admin[0].email, //TODO: have a single admin user, or send the email to all admin users...
            seller.first_name + ' ' + seller.last_name,
            updatedOrder,
        )
        return updatedOrder
    }

    //TODO: In the future, send the name of the user that deleted the order to the admin
    @Delete(':id')
    async deleteOrder(@Param('id') id: string): Promise<any> {
        const deletedOrder = await this.ordersService.getOrderById(id)

        //Get the workspace Admin's email
        const admin = await this.userService.getAllAdminUsers()

        //Send the Order Updated email to the Admin
        await this.emailService.sendOrderDeletedEmail(
            admin[0].email, //TODO: have a single admin user, or send the email to all admin users...
            deletedOrder,
        )

        return deletedOrder
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

    /**
     * @description Generates a PDF page that contains a list of orders that match the given filters.
     */
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
