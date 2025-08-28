import { promises as fs } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { webdavService } from '~/server/utils/webdavService'

export default defineEventHandler(async (event: any) => {
  try {
    const form = await readMultipartFormData(event)
    
    if (!form || form.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No file uploaded'
      })
    }

    const file = form[0]
    
    if (!file.filename || !file.data) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid file data'
      })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type || '')) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Only JPEG, PNG, and WebP images are allowed'
      })
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.data.length > maxSize) {
      throw createError({
        statusCode: 400,
        statusMessage: 'File size must be less than 5MB'
      })
    }

    // Generate unique filename
    const fileExtension = file.filename.split('.').pop()
    const uniqueFilename = `${randomUUID()}.${fileExtension}`

    let backgroundUrl = ''
    let storageType = 'local'

    // Check if WebDAV is enabled and configured
    if (webdavService.isEnabled()) {
      try {
        // Upload to WebDAV server
        await webdavService.uploadFile('', uniqueFilename, file.data)
        // Use proxy URL for displaying the image
        backgroundUrl = `/api/webdav/image/${uniqueFilename}`
        storageType = 'webdav'
      } catch (webdavError) {
        console.error('WebDAV upload failed, falling back to local storage:', webdavError)
        // Fall back to local storage if WebDAV fails
        storageType = 'local'
      }
    }

    // If WebDAV is not enabled or failed, use local storage
    if (storageType === 'local') {
      // Create uploads directory if it doesn't exist
      const uploadsDir = join(process.cwd(), 'public', 'uploads', 'backgrounds')
      try {
        await fs.access(uploadsDir)
      } catch {
        await fs.mkdir(uploadsDir, { recursive: true })
      }

      const filePath = join(uploadsDir, uniqueFilename)

      // Save file locally
      await fs.writeFile(filePath, file.data)
      backgroundUrl = `/uploads/backgrounds/${uniqueFilename}`
    }

    // Save background info to JSON
    const backgroundsFile = join(process.cwd(), 'server', 'data', 'backgrounds.json')
    let backgrounds = []

    try {
      const data = await fs.readFile(backgroundsFile, 'utf-8')
      backgrounds = JSON.parse(data)
    } catch {
      // File doesn't exist, start with empty array
    }

    const backgroundInfo = {
      id: randomUUID(),
      filename: uniqueFilename,
      originalName: file.filename,
      url: backgroundUrl,
      storageType: storageType,
      uploadedBy: 'anonymous',
      uploadedAt: new Date().toISOString(),
      isActive: backgrounds.length === 0 // First upload becomes active
    }

    backgrounds.push(backgroundInfo)
    await fs.writeFile(backgroundsFile, JSON.stringify(backgrounds, null, 2))

    return {
      success: true,
      message: 'Background image uploaded successfully',
      background: backgroundInfo
    }

  } catch (error: any) {
    console.error('Background upload error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to upload background image'
    })
  }
})
