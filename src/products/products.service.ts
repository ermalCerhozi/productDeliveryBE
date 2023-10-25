import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Like, Between } from 'typeorm'
import { Product } from './product.entity'

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  getAllProducts(): Promise<Product[]> {
    return this.productsRepository.find()
  }

  getProductById(id: number): Promise<Product> {
    return this.productsRepository.findOne({ where: { id: id } })
  }

  async deleteProductById(id: number): Promise<void> {
    await this.productsRepository.delete(id)
  }

  async updateProductDetails(
    id: number,
    product: Partial<Product>,
  ): Promise<void> {
    await this.productsRepository.update(id, product)
  }

  async createProduct(product: Product): Promise<Product> {
    return this.productsRepository.save(product)
  }

  searchForProducts(
    productName: string,
    minPrice: number,
    maxPrice: number,
  ): Promise<Product[]> {
    return this.productsRepository.find({
      where: [
        {
          product_name: Like(`%${productName}%`),
          price: Between(minPrice, maxPrice),
        },
      ],
    })
  }
}
