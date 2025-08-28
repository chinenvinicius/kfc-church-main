import { join } from 'path'
import { existsSync, readFileSync } from 'fs'

export default defineEventHandler(async (event) => {
  try {
    const filename = getRouterParam(event, 'filename')
    
    if (!filename) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Filename is required'
      })
    }
    
    // Security check - only allow safe files and prevent path traversal
    if (filename.includes('..') || filename.includes('/')) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid filename'
      })
    }
    
    // Check file extension
    const allowedExtensions = ['.csv', '.xlsx']
    const hasValidExtension = allowedExtensions.some(ext => filename.endsWith(ext))
    
    if (!hasValidExtension) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid file type. Only CSV and Excel files are allowed.'
      })
    }
    
    const filepath = join(process.cwd(), 'server/exports', filename)
    
    if (!existsSync(filepath)) {
      throw createError({
        statusCode: 404,
        statusMessage: 'File not found'
      })
    }
    
    // Read file
    const fileBuffer = readFileSync(filepath)
    
    // Set headers for file download
    if (filename.endsWith('.csv')) {
      setHeader(event, 'Content-Type', 'text/csv')
    } else if (filename.endsWith('.xlsx')) {
      setHeader(event, 'Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    }
    
    setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`)
    setHeader(event, 'Content-Length', fileBuffer.length.toString())
    
    return fileBuffer
  } catch (error) {
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: `Download failed: ${error.message}`
    })
  }
})
