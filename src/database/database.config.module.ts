import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { DatabaseConfig } from './database.config.service';


@Module({
  imports: [NestConfigModule.forRoot({ isGlobal: true })],
  providers: [DatabaseConfig],
  exports: [DatabaseConfig],
})
export class DatabaseConfigModule {}
