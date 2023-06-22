import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

//TODO: Restrict which origins are allowed by passing an options object to enableCors().
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // this enables CORS
  await app.listen(3000);
}
bootstrap();
