import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
  
  app.setGlobalPrefix('api')
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  )
  
  await app.listen(3000)
  console.log('Server is running on http://localhost:3000')
}

bootstrap()
