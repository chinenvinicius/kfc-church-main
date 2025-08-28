import { promises as fs } from 'fs'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { backgroundId } = body

    if (!backgroundId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Background ID is required'
      })
    }

    const backgroundsFile = join(process.cwd(), 'server', 'data', 'backgrounds.json')
    
    let backgrounds = []
    try {
      const data = await fs.readFile(backgroundsFile, 'utf-8')
      backgrounds = JSON.parse(data)
    } catch {
      throw createError({
        statusCode: 404,
        statusMessage: 'No backgrounds found'
      })
    }

    // Find the background to activate
    const targetBackground = backgrounds.find(bg => bg.id === backgroundId)
    if (!targetBackground) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Background not found'
      })
    }

    // Set all backgrounds to inactive, then activate the target
    backgrounds = backgrounds.map(bg => ({
      ...bg,
      isActive: bg.id === backgroundId
    }))

    await fs.writeFile(backgroundsFile, JSON.stringify(backgrounds, null, 2))

    return {
      success: true,
      message: 'Background set as active',
      activeBackground: targetBackground
    }

  } catch (error) {
    console.error('Set active background error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to set active background'
    })
  }
})
