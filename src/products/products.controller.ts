import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common'
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

  @Put('/:id')
  updateProductDetails(
    @Param('id') id: number,
    @Body() product: Partial<Product>,
  ) {
    return this.productsService.updateProductDetails(id, product)
  }

  @Delete('/:id')
  deleteProductById(@Param('id') id: number) {
    return this.productsService.deleteProductById(id)
  }

  @Get('/search')
  searchForProducts(
    @Query('productName') productName: string,
    @Query('minPrice') minPrice: number,
    @Query('maxPrice') maxPrice: number,
  ) {
    return this.productsService.searchForProducts(
      productName,
      minPrice,
      maxPrice,
    )
  }
}
