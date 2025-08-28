import { promises as fs } from 'fs'
import { join } from 'path'
import { webdavService } from '~/server/utils/webdavService'

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

    // Find the background to delete
    const targetBackground = backgrounds.find(bg => bg.id === backgroundId)
    if (!targetBackground) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Background not found'
      })
    }

    // Delete the physical file based on storage type
    if (targetBackground.storageType === 'webdav') {
      // Delete from WebDAV server
      try {
        await webdavService.deleteFile(targetBackground.filename)
      } catch (error) {
        console.warn('Could not delete WebDAV file:', targetBackground.filename, error)
      }
    } else {
      // Delete local file
      const filePath = join(process.cwd(), 'public', 'uploads', 'backgrounds', targetBackground.filename)
      try {
        await fs.unlink(filePath)
      } catch (error) {
        console.warn('Could not delete local file:', filePath, error)
      }
    }

    // Remove from backgrounds array
    backgrounds = backgrounds.filter(bg => bg.id !== backgroundId)

    // If the deleted background was active and there are other backgrounds, make the first one active
    if (targetBackground.isActive && backgrounds.length > 0) {
      backgrounds[0].isActive = true
    }

    await fs.writeFile(backgroundsFile, JSON.stringify(backgrounds, null, 2))

    return {
      success: true,
      message: 'Background deleted successfully'
    }

  } catch (error) {
    console.error('Delete background error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete background'
    })
  }
})
