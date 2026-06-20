import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { StoryEntity } from './story.entity'
import { SaveStoryDto, CreateStoryDto } from './story.dto'
import { DagValidatorService } from './dag-validator.service'

@Injectable()
export class StoryService {
  constructor(
    @InjectRepository(StoryEntity)
    private storyRepository: Repository<StoryEntity>,
    private dagValidator: DagValidatorService,
  ) {}

  async findAll() {
    const stories = await this.storyRepository.find({
      order: { updatedAt: 'DESC' },
    })
    return stories.map((s) => this.toResponse(s))
  }

  async findOne(id: string) {
    const story = await this.storyRepository.findOne({ where: { id } })
    if (!story) {
      throw new NotFoundException('故事不存在')
    }
    return this.toResponse(story)
  }

  async create(dto: CreateStoryDto) {
    const defaultNodes = [
      {
        id: 'start-node-' + Date.now(),
        type: 'start',
        x: 200,
        y: 200,
        width: 120,
        height: 60,
        data: {
          type: 'start',
          title: '开始',
        },
      },
    ]

    const story = this.storyRepository.create({
      title: dto.title,
      description: dto.description,
      nodes: defaultNodes,
      edges: [],
    })

    const saved = await this.storyRepository.save(story)
    return this.toResponse(saved)
  }

  async save(id: string, dto: SaveStoryDto) {
    const story = await this.storyRepository.findOne({ where: { id } })
    if (!story) {
      throw new NotFoundException('故事不存在')
    }

    const validation = this.dagValidator.validate(dto.nodes, dto.edges)
    if (!validation.valid) {
      const cycleError = validation.errors.find((e) => e.type === 'cycle')
      if (cycleError) {
        throw new BadRequestException({
          message: cycleError.message,
          errors: validation.errors,
        })
      }
    }

    story.title = dto.title
    story.description = dto.description || ''
    story.nodes = dto.nodes
    story.edges = dto.edges

    const saved = await this.storyRepository.save(story)
    return {
      ...this.toResponse(saved),
      validation,
    }
  }

  async delete(id: string) {
    const result = await this.storyRepository.delete(id)
    if (result.affected === 0) {
      throw new NotFoundException('故事不存在')
    }
    return { success: true }
  }

  async validateStory(id: string) {
    const story = await this.storyRepository.findOne({ where: { id } })
    if (!story) {
      throw new NotFoundException('故事不存在')
    }

    return this.dagValidator.validate(story.nodes || [], story.edges || [])
  }

  private toResponse(entity: StoryEntity) {
    return {
      id: entity.id,
      title: entity.title,
      description: entity.description,
      nodes: entity.nodes || [],
      edges: entity.edges || [],
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    }
  }
}
