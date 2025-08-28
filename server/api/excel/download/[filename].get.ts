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
    
    // Security check - only allow .xlsx files and prevent path traversal
    if (!filename.endsWith('.xlsx') || filename.includes('..') || filename.includes('/')) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid filename'
      })
    }
    
    const filepath = join(process.cwd(), 'server/excel', filename)
    
    if (!existsSync(filepath)) {
      throw createError({
        statusCode: 404,
        statusMessage: 'File not found'
      })
    }
    
    // Read file
    const fileBuffer = readFileSync(filepath)
    
    // Set headers for file download
    setHeader(event, 'Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
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
