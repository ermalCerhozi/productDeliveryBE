import { Injectable } from '@nestjs/common'
import * as nodemailer from 'nodemailer'
import * as fs from 'fs'
import * as path from 'path'
import { Order } from './orders/order.entity'
import * as dotenv from 'dotenv'

dotenv.config()

@Injectable()
export class EmailService {
    private transporter: nodemailer.Transporter

    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD,
            },
        })
    }

    async sendOrderCreatedEmail(order: Order): Promise<void> {
        const mailOptions = {
            from: process.env.EMAIL,
            to: order.client?.email,
            subject: 'Order Created',
            html: this.getCreateOrderEmailTemplate(order),
        }

        this.transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error)
            } else {
                console.log('Email sent: ' + info.response)
            }
        })
    }

    // TODO: Add a features that emphasizes the details that have been updated...
    async sendOrderUpdatedEmail(
        to: string,
        updatedBy: string,
        order: Order,
    ): Promise<void> {
        const mailOptions = {
            from: process.env.EMAIL,
            to: to,
            subject: 'Order Updated',
            html: this.getUpdateOrderEmailTemplate(order, updatedBy),
        }

        this.transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error)
            } else {
                console.log('Email sent: ' + info.response)
            }
        })
    }

    async sendOrderDeletedEmail(to: string, order: Order): Promise<void> {
        const mailOptions = {
            from: process.env.EMAIL,
            to: to,
            subject: 'Order Deleted',
            html: this.getDeleteOrderEmailTemplate(order),
        }

        this.transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error)
            } else {
                console.log('Email sent: ' + info.response)
            }
        })
    }

    async sendResetPasswordEmail(
        to: string,
        newPassword?: string,
    ): Promise<void> {
        const htmlContent = fs.readFileSync(
            path.join(
                __dirname,
                '../templates/resetPasswordEmailTemplate.html',
            ),
            'utf8',
        )
        const customizedHtmlContent = htmlContent.replace(
            'PLACEHOLDER_FOR_NEW_PASSWORD',
            newPassword,
        )
        const mailOptions = {
            from: 'trackease3@gmail.com',
            to: to,
            subject: 'Password Reset',
            html: customizedHtmlContent,
        }

        this.transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error)
            } else {
                console.log('Email sent: ' + info.response)
            }
        })
    }

    private getCreateOrderEmailTemplate(order: Order) {
        const orderItemsHtml = this.convertOrderToHtml(order)
        return `
            <h3>Pershendetje ${order.client?.nickname}!</h3>
            <p>Porosia juaj per daten: ${new Date(
                order.created_at,
            ).toLocaleDateString()}</p>
            <p>Eshte krijuar me sukses.</p>
            ${orderItemsHtml}
        `
    }

    private getUpdateOrderEmailTemplate(order: Order, updatedBy: string) {
        const orderItemsHtml = this.convertOrderToHtml(order)
        return `
            <h3>An order has been updated by ${updatedBy}!<h3>
            <p>This is the updated Order: ${new Date(
                order.created_at,
            ).toLocaleDateString()}</p>
            ${orderItemsHtml}
        `
    }

    private getDeleteOrderEmailTemplate(order: Order) {
        const orderItemsHtml = this.convertOrderToHtml(order)
        return `
            <h3>An order has been deleted by <unknown>!</h3>
            <p>This is the deleted Order: ${new Date(
                order.created_at,
            ).toLocaleDateString()}</p>
            ${orderItemsHtml}
        `
    }

    private convertOrderToHtml(order: any): string {
        const orderItemsHtml = order.order_items
            .map(
                (item: any) => `
                <tr>
                    <td style="border: 1px solid black; padding: 10px;">${
                        order.seller?.first_name + ' ' + order.seller?.last_name
                    }</td>
                    <td style="border: 1px solid black; padding: 10px;">${
                        item.product?.product_name
                    }</td>
                    <td style="border: 1px solid black; padding: 10px;">${
                        item.quantity
                    }</td>
                    <td style="border: 1px solid black; padding: 10px;">${
                        item.returned_quantity
                    }</td>
                    <td style="border: 1px solid black; padding: 10px;">${
                        item.product?.price
                    }</td>
                    <td style="border: 1px solid black; padding: 10px;">${
                        item.order_item_total_price
                    }</td>
                    <td style="border: 1px solid black; padding: 10px;">${new Date(
                        order.created_at,
                    ).toLocaleDateString()}</td>
                    <td style="border: 1px solid black; padding: 10px;">${new Intl.DateTimeFormat(
                        'default',
                        { hour: '2-digit', minute: '2-digit', hour12: false },
                    ).format(new Date(order.created_at))}</td>
                </tr>`,
            )
            .join('')

        return `
            <table style="border: 1px solid black; border-collapse: collapse;">
                <thead>
                    <tr>
                        <th style="border: 1px solid black; padding: 10px;">Seller</th>
                        <th style="border: 1px solid black; padding: 10px;">Product</th>
                        <th style="border: 1px solid black; padding: 10px;">Quantity</th>
                        <th style="border: 1px solid black; padding: 10px;">Return</th>
                        <th style="border: 1px solid black; padding: 10px;">Item Price</th>
                        <th style="border: 1px solid black; padding: 10px;">Order Price</th>
                        <th style="border: 1px solid black; padding: 10px;">Date</th>
                        <th style="border: 1px solid black; padding: 10px;">Time</th>
                    </tr>
                </thead>
                <tbody>
                    ${orderItemsHtml}
                    <tr>
                        <td colspan="8" style="border: 1px solid black; padding: 10px;">Total Price= ${order.total_price}</td>
                    </tr>
                </tbody>
            </table>
        `
    }
}
