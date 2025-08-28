import { promises as fs } from 'fs'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  try {
    const backgroundsFile = join(process.cwd(), 'server', 'data', 'backgrounds.json')
    
    try {
      const data = await fs.readFile(backgroundsFile, 'utf-8')
      const backgrounds = JSON.parse(data)
      
      const activeBackground = backgrounds.find(bg => bg.isActive)
      
      return {
        success: true,
        data: activeBackground || null
      }
    } catch {
      // File doesn't exist, return null
      return {
        success: true,
        data: null
      }
    }

  } catch (error) {
    console.error('Get active background error:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to get active background'
    })
  }
})
