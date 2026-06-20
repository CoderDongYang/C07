import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { StoryService } from './story.service'
import { SaveStoryDto, CreateStoryDto } from './story.dto'

@Controller('stories')
export class StoryController {
  constructor(private readonly storyService: StoryService) {}

  @Get()
  async findAll() {
    return this.storyService.findAll()
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.storyService.findOne(id)
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateStoryDto) {
    return this.storyService.create(dto)
  }

  @Put(':id')
  async save(@Param('id') id: string, @Body() dto: SaveStoryDto) {
    return this.storyService.save(id, dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    return this.storyService.delete(id)
  }

  @Get(':id/validate')
  async validate(@Param('id') id: string) {
    return this.storyService.validateStory(id)
  }
}
