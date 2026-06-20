import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

class StoryOptionDto {
  @IsString()
  id: string

  @IsString()
  text: string
}

class NodeDataDto {
  @IsString()
  type: string

  @IsOptional()
  @IsString()
  title?: string

  @IsOptional()
  @IsString()
  narration?: string

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StoryOptionDto)
  options?: StoryOptionDto[]

  @IsOptional()
  @IsString()
  endingText?: string
}

class StoryNodeDto {
  @IsString()
  id: string

  @IsString()
  type: string

  x: number
  y: number
  width: number
  height: number

  @ValidateNested()
  @Type(() => NodeDataDto)
  data: NodeDataDto
}

class StoryEdgeDto {
  @IsString()
  id: string

  @IsString()
  source: string

  @IsString()
  target: string

  @IsOptional()
  @IsString()
  sourcePort?: string

  @IsOptional()
  @IsString()
  targetPort?: string

  @IsOptional()
  @IsString()
  label?: string
}

export class SaveStoryDto {
  @IsString()
  title: string

  @IsOptional()
  @IsString()
  description?: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StoryNodeDto)
  nodes: StoryNodeDto[]

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StoryEdgeDto)
  edges: StoryEdgeDto[]
}

export class CreateStoryDto {
  @IsString()
  title: string

  @IsOptional()
  @IsString()
  description?: string
}
