import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common'
import { Product } from './product.entity'
import { ProductsService } from './products.service'

@Controller('products')
export class ProductsController {
    constructor(private productsService: ProductsService) {}

    @Post()
    createProduct(@Body() product: Product) {
        return this.productsService.createProduct(product)
    }

    @Get()
    getAllProducts() {
        return this.productsService.getAllProducts()
    }

    @Get('/:id')
    getProductById(@Param('id') id: number) {
        return this.productsService.getProductById(id)
    }

    @Get('price/:id')
    getProductPriceById(@Param('id') id: number) {
        return this.productsService.getProductPriceById(id)
    }

    @Put('/:id')
    async updateProductDetails(
        @Param('id') id: number,
        @Body() product: Partial<Product>,
    ) {
        return await this.productsService.updateProductDetails(id, product)
    }

    @Delete('/:id')
    deleteProductById(@Param('id') id: number) {
        return this.productsService.deleteProductById(id)
    }

    // Used in the search bar
    @Post('/search')
    searchForProducts(
        @Body('pagination') pagination: { offset: number; limit: number },
        @Body('filters')
        productFilters: {
            minPrice: number
            maxPrice: number
            queryString: string
        },
        @Body('searchOptions') searchOptions: { title: boolean; all: boolean },
        @Body('getCount') getCount: boolean,
    ) {
        return this.productsService.searchForProducts(
            pagination,
            productFilters,
            searchOptions,
            getCount,
        )
    }

    // Used in the dropdown to create Order
    @Post('/paginated/search')
    searchForProductsPaginated(
        @Body('pagination') pagination: { offset: number; limit: number },
        @Body('productName') productName: string,
    ) {
        return this.productsService.searchForProductsPaginated(
            pagination,
            productName,
        )
    }
}
