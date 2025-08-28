import { webdavService } from '~/server/utils/webdavService'

export default defineEventHandler(async (event) => {
  try {
    // Get the file path from the URL
    const path = getRouterParam(event, 'path')
    if (!path) {
      throw createError({
        statusCode: 400,
        statusMessage: 'File path is required'
      })
    }

    // Check if WebDAV is enabled
    if (!webdavService.isEnabled()) {
      throw createError({
        statusCode: 404,
        statusMessage: 'WebDAV is not enabled'
      })
    }

    const config = webdavService.getConfig()
    const client = webdavService.getWebDAVClient()

    // Construct the full WebDAV path
    const fullPath = `${config.basePath}/${path}`

    // Check if file exists
    const exists = await client.exists(fullPath)
    if (!exists) {
      throw createError({
        statusCode: 404,
        statusMessage: 'File not found'
      })
    }

    // Get file contents
    const fileBuffer = await client.getFileContents(fullPath)
    
    // Determine content type based on file extension
    const extension = path.toLowerCase().split('.').pop()
    let contentType = 'application/octet-stream'
    
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg'
        break
      case 'png':
        contentType = 'image/png'
        break
      case 'webp':
        contentType = 'image/webp'
        break
      case 'gif':
        contentType = 'image/gif'
        break
    }

    // Set appropriate headers
    setHeader(event, 'Content-Type', contentType)
    setHeader(event, 'Cache-Control', 'public, max-age=3600') // Cache for 1 hour
    setHeader(event, 'Content-Length', fileBuffer.length.toString())

    // Return the file buffer
    return fileBuffer

  } catch (error) {
    console.error('Error serving WebDAV image:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load image from WebDAV server'
    })
  }
})
