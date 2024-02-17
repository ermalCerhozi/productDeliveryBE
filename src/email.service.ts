import { Injectable } from '@nestjs/common'
import * as nodemailer from 'nodemailer'
import * as fs from 'fs'
import * as path from 'path'
import { Order } from './orders/order.entity'

@Injectable()
export class EmailService {
    private transporter: nodemailer.Transporter

    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'trackease3@gmail.com',
                pass: 'wpbc hnqw hidx yybq',
            },
        })
    }

    async sendOrderCreatedEmail(to: string, order: Order): Promise<void> {
        const mailOptions = {
            from: 'trackease3@gmail.com',
            to: to,
            subject: 'Order Created',
            html: this.convertOrderToHtml(order),
        }

        this.transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error)
            } else {
                console.log('Email sent: ' + info.response)
            }
        })
    }

    async sendOrderUpdatedEmail(
        to: string,
        updatedBy: string,
        order: Order,
    ): Promise<void> {
        const mailOptions = {
            from: 'trackease3@gmail.com',
            to: to,
            subject: 'Order Updated',
            text: `An order has been updated by ${updatedBy}.\n\n Order details: ${JSON.stringify(
                order,
                null,
                4,
            )}`, // Convert the order to a JSON into a readable format
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
            from: 'trackease3@gmail.com',
            to: to,
            subject: 'Order Deleted',
            text: `An order has been Deleted.\n\n Order details: ${JSON.stringify(
                order,
                null,
                4,
            )}`, // Convert the order to a JSON into a readable format
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

    // TODO: To be included here information for the seller, each items price, time of purchase
    private convertOrderToHtml(order: any): string {
        const orderItemsHtml = order.order_items
            .map(
                (item: any) => `
            <tr>
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
                <td style="border: 1px solid black; padding: 10px;">${new Date(
                    order.created_at,
                ).toLocaleDateString()}</td>
            </tr>
        `,
            )
            .join('')

        return `
            <h3>Peshendetje ${order.client?.nickname}</h3>
            <p>Porosia juaj per daten: ${new Date(
                order.created_at,
            ).toLocaleDateString()}</p>
            \n
            <table style="border: 1px solid black; border-collapse: collapse;">
                <thead>
                    <tr>
                        <th style="border: 1px solid black; padding: 10px;">Product</th>
                        <th style="border: 1px solid black; padding: 10px;">Quantity</th>
                        <th style="border: 1px solid black; padding: 10px;">Return</th>
                        <th style="border: 1px solid black; padding: 10px;">Price</th>
                        <th style="border: 1px solid black; padding: 10px;">Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${orderItemsHtml}
                    <tr>
                        <td colspan="5" style="border: 1px solid black; padding: 10px;">Total Price= ${
                            order.total_price
                        }</td>
                    </tr>
                </tbody>
            </table>
        `
    }
}
