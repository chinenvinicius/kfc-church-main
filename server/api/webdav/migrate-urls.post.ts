import { promises as fs } from 'fs'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  try {
    const backgroundsFile = join(process.cwd(), 'server', 'data', 'backgrounds.json')
    
    let backgrounds = []
    try {
      const data = await fs.readFile(backgroundsFile, 'utf-8')
      backgrounds = JSON.parse(data)
    } catch {
      return {
        success: true,
        message: 'No backgrounds file found',
        updated: 0
      }
    }

    let updatedCount = 0

    // Update WebDAV URLs to use proxy
    backgrounds = backgrounds.map(background => {
      if (background.storageType === 'webdav' && background.url.startsWith('http')) {
        // Extract filename from the WebDAV URL
        const filename = background.filename
        // Update to use proxy URL
        background.url = `/api/webdav/image/${filename}`
        updatedCount++
      }
      return background
    })

    // Save updated backgrounds
    await fs.writeFile(backgroundsFile, JSON.stringify(backgrounds, null, 2))

    return {
      success: true,
      message: `Updated ${updatedCount} WebDAV image URLs to use proxy`,
      updated: updatedCount
    }

  } catch (error) {
    console.error('Error migrating WebDAV URLs:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to migrate WebDAV URLs'
    })
  }
})
