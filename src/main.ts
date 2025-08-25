import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // For security headers
  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    }),
  );

  // Rate Limiting (limit requests to prevent Brute Force)
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, 
      max: 100, 
      message: 'Too many requests, please try again later.',
    }),
  );

  // CORS Configuration
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:4000'],
    methods: ['GET', 'POST','PATCH', 'DELETE'],
    credentials: true,
  });

  //Validation Pipe 
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, 
      forbidNonWhitelisted: true, 
      transform: true, 
    }),
  );

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Auth System API')
    .setDescription('API documentation for authentication system with OTP, JWT, Roles & Sessions')
    .setVersion('1.0')
    .addBearerAuth() 
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Keep auth token after refresh
    },
  });

  const port = process.env.APP_PORT || 4000;
  await app.listen(port);

  console.log(`Server running on http://localhost:${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/api/docs`);
}

bootstrap();
