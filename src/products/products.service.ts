import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
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

    async getProductPricesByIds(
        ids: number[],
    ): Promise<{ [key: string]: number }> {
        const result: { [key: string]: number } = {}

        const uniqueIds = Array.from(new Set(ids))
        const validIds = uniqueIds.filter((id) => id !== null)

        for (const id of validIds) {
            const product = await this.productsRepository
                .createQueryBuilder('product')
                .select(['product.product_name', 'product.price'])
                .whereInIds(id)
                .getOne()

            if (product) {
                result[product.product_name] = product.price
            }
        }

        console.log('result', result)
        return result
    }

    async deleteProductById(id: number): Promise<void> {
        await this.productsRepository.delete(id)
    }

    async updateProductDetails(
        id: number,
        product: Partial<Product>,
    ): Promise<Product> {
        await this.productsRepository.update(id, product)
        return this.productsRepository.findOne({ where: { id: id } })
    }
    async createProduct(product: Product): Promise<Product> {
        return this.productsRepository.save(product)
    }

    async searchForProducts(
        pagination: { offset: number; limit: number },
        productFilters: {
            minPrice?: number
            maxPrice?: number
            queryString?: string
        },
        searchOptions: { title: boolean; all: boolean },
        getCount: boolean,
    ) {
        // Start building the query
        let query = this.productsRepository.createQueryBuilder('product')

        if (productFilters.minPrice !== undefined) {
            query = query.andWhere('product.price >= :minPrice', {
                minPrice: productFilters.minPrice,
            })
        }
        if (productFilters.maxPrice !== undefined) {
            query = query.andWhere('product.price <= :maxPrice', {
                maxPrice: productFilters.maxPrice,
            })
        }

        if (productFilters.queryString !== undefined) {
            const searchQuery = `%${productFilters.queryString}%`.toLowerCase()
            if (searchOptions.all) {
                query = query.andWhere(
                    '(LOWER(product.product_name) LIKE :search OR LOWER(product.ingredients) LIKE :search OR LOWER(product.description) LIKE :search)',
                    { search: searchQuery },
                )
            } else {
                query = query.andWhere(
                    'LOWER(product.product_name) LIKE :search',
                    {
                        search: searchQuery,
                    },
                )
            }
        }

        let count
        if (getCount) {
            count = await query.clone().getCount()
        }

        query = query.skip(pagination.offset).take(pagination.limit)

        // TODO: Order by latest
        // query = query.orderBy('product.id', 'DESC')

        const products = await query.getMany()
        return getCount ? { products, count } : { products }
    }

    async searchForProductsPaginated(
        pagination: { offset: number; limit: number },
        productName: string,
    ) {
        let query = this.productsRepository.createQueryBuilder('product')

        if (productName) {
            query = query.andWhere(
                'LOWER(product.product_name) LIKE :productName',
                {
                    productName: `%${productName}%`.toLowerCase(),
                },
            )
        }

        query = query.skip(pagination.offset).take(pagination.limit)
        const products = await query.getMany()
        return products
    }
}
