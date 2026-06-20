import axios from 'axios'
import type {
  Story,
  SaveStoryDto,
  ValidationResult,
} from '../types'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

export const storyApi = {
  async list(): Promise<Story[]> {
    const response = await api.get('/stories')
    return response.data
  },

  async get(id: string): Promise<Story> {
    const response = await api.get(`/stories/${id}`)
    return response.data
  },

  async create(title: string, description?: string): Promise<Story> {
    const response = await api.post('/stories', { title, description })
    return response.data
  },

  async save(id: string, data: SaveStoryDto): Promise<Story & { validation: ValidationResult }> {
    const response = await api.put(`/stories/${id}`, data)
    return response.data
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/stories/${id}`)
  },

  async validate(id: string): Promise<ValidationResult> {
    const response = await api.get(`/stories/${id}/validate`)
    return response.data
  },
}

export default api
