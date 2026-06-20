import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { StoryModule } from './story/story.module'

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'password',
      database: 'story_editor',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
      charset: 'utf8mb4',
    }),
    StoryModule,
  ],
})
export class AppModule {}
