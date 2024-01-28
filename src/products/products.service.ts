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

  async searchForProducts(pagination: { offset: number, limit: number }, productFilters: { minPrice?: number, maxPrice?: number, search?: string }, getCount: boolean) {
    // Start building the query
    let query = this.productsRepository.createQueryBuilder('product');
  
    // Apply price filters if they are provided
    if (productFilters.minPrice !== undefined) {
      query = query.andWhere('product.price >= :minPrice', { minPrice: productFilters.minPrice });
    }
    if (productFilters.maxPrice !== undefined) {
      query = query.andWhere('product.price <= :maxPrice', { maxPrice: productFilters.maxPrice });
    }
  
    // Apply search filter if it is provided
    if (productFilters.search !== undefined) {
      query = query.andWhere('product.product_name LIKE :search', { search: `%${productFilters.search}%` });
    }
  
    // Get the count of records that match the query only if getCount is true
    let resultCount;
    if (getCount) {
      resultCount = await query.clone().getCount();
    }
  
    // Apply pagination
    query = query.skip(pagination.offset).take(pagination.limit);
  
    // Execute the query and return the results
    const products = await query.getMany();
  
    // Return both the products and the count if count is true, else return only products
    return getCount ? { products, count: resultCount } : { products };
  }
}
