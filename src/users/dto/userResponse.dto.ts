import { User } from "../user.entity"

export class UserResponseDTO {
  id: number
  created_at: Date
  updated_at: Date
  first_name: string
  last_name: string
  nickname: string
  email: string
  phone_number: string
  role: string
  client_orders: any[]
  seller_orders: any[]

  constructor(user: User) {
    this.id = user.id
    this.created_at = user.created_at
    this.updated_at = user.updated_at
    this.first_name = user.first_name
    this.last_name = user.last_name
    this.nickname = user.nickname
    this.email = user.email
    this.phone_number = user.phone_number
    this.role = user.role
    this.client_orders = user.client_orders
    this.seller_orders = user.seller_orders
  }
}
