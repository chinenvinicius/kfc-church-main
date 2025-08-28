import { promises as fs } from 'fs'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  try {
    const backgroundsFile = join(process.cwd(), 'server', 'data', 'backgrounds.json')
    
    try {
      const data = await fs.readFile(backgroundsFile, 'utf-8')
      const backgrounds = JSON.parse(data)
      
      return {
        success: true,
        data: backgrounds
      }
    } catch {
      // File doesn't exist, return empty array
      return {
        success: true,
        data: []
      }
    }

  } catch (error) {
    console.error('Get backgrounds error:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to get background images'
    })
  }
})
