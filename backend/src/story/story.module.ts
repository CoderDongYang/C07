import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { StoryController } from './story.controller'
import { StoryService } from './story.service'
import { StoryEntity } from './story.entity'
import { DagValidatorService } from './dag-validator.service'

@Module({
  imports: [TypeOrmModule.forFeature([StoryEntity])],
  controllers: [StoryController],
  providers: [StoryService, DagValidatorService],
  exports: [StoryService, DagValidatorService],
})
export class StoryModule {}
