import { createReadStream, existsSync } from 'fs'
import { fileStorage } from '~/server/utils/fileStorage'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'File ID is required'
      })
    }

    const fileRecord = fileStorage.getFile(id)
    
    if (!fileRecord) {
      throw createError({
        statusCode: 404,
        statusMessage: 'File not found'
      })
    }

    if (!existsSync(fileRecord.path)) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Physical file not found'
      })
    }

    // Set appropriate headers
    setHeader(event, 'Content-Type', fileRecord.mimeType)
    setHeader(event, 'Content-Disposition', `attachment; filename="${fileRecord.originalName}"`)
    setHeader(event, 'Content-Length', fileRecord.size.toString())

    // Stream the file
    return sendStream(event, createReadStream(fileRecord.path))
  } catch (error) {
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to download file: ${error.message}`
    })
  }
})
