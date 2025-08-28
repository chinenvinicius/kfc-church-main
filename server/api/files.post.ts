import formidable from 'formidable'
import { join } from 'path'
import { existsSync, mkdirSync, unlinkSync } from 'fs'
import { IncomingMessage } from 'http'
import { fileStorage } from '~/server/utils/fileStorage'

export default defineEventHandler(async (event) => {
  try {
    // Ensure upload directory exists
    const uploadsDir = join(process.cwd(), 'server/uploads')
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true })
    }

    // Parse the multipart form data
    const form = formidable({
      uploadDir: uploadsDir,
      keepExtensions: true,
      maxFileSize: 50 * 1024 * 1024, // 50MB limit
      filter: ({ mimetype, originalFilename }) => {
        // Allow common file types
        const allowedTypes = [
          // Images
          'image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp', 'image/svg+xml',
          // Documents
          'application/pdf', 'text/plain', 'text/csv',
          'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          // Spreadsheets
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'text/csv', 'application/csv',
          // Archives
          'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
          // Others
          'application/json', 'application/xml', 'text/xml'
        ]
        
        const allowedExtensions = [
          '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg',
          '.pdf', '.txt', '.csv', '.doc', '.docx', '.ppt', '.pptx',
          '.xlsx', '.xls', '.zip', '.rar', '.7z', '.json', '.xml'
        ]
        
        const hasValidExtension = allowedExtensions.some(ext => 
          originalFilename?.toLowerCase().endsWith(ext)
        )
        
        return allowedTypes.includes(mimetype || '') || hasValidExtension
      }
    })

    const [fields, files] = await form.parse(event.node.req as IncomingMessage)
    
    if (!files.file || !files.file[0]) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No file uploaded'
      })
    }

    const uploadedFile = files.file[0]
    const originalName = uploadedFile.originalFilename || 'unknown'
    
    // Validate file
    if (!originalName || originalName === 'unknown') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid file name'
      })
    }

    // Store file using FileStorageManager
    const fileRecord = await fileStorage.storeFile(
      uploadedFile.filepath,
      originalName,
      uploadedFile.mimetype || 'application/octet-stream',
      uploadedFile.size || 0
    )

    // Clean up temporary file
    try {
      unlinkSync(uploadedFile.filepath)
    } catch (cleanupError) {
      console.warn('Failed to cleanup temporary file:', cleanupError)
    }

    return {
      success: true,
      message: 'File uploaded successfully',
      file: fileRecord
    }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: `Upload failed: ${error.message}`
    })
  }
})
