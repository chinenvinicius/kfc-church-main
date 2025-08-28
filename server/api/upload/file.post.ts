import formidable from 'formidable'
import { join } from 'path'
import { existsSync, mkdirSync, copyFileSync, unlinkSync } from 'fs'
import { IncomingMessage } from 'http'

export default defineEventHandler(async (event) => {
  try {
    // Ensure upload directories exist
    const uploadsDir = join(process.cwd(), 'server/uploads')
    const exportsDir = join(process.cwd(), 'server/exports')
    
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true })
    }
    if (!existsSync(exportsDir)) {
      mkdirSync(exportsDir, { recursive: true })
    }

    // Parse the multipart form data
    const form = formidable({
      uploadDir: uploadsDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
      filter: ({ mimetype, originalFilename }) => {
        // Allow Excel and CSV files
        const allowedTypes = [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
          'application/vnd.ms-excel', // .xls
          'text/csv', // .csv
          'application/csv'
        ]
        
        const allowedExtensions = ['.xlsx', '.xls', '.csv']
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
    const fileExtension = originalName.toLowerCase().split('.').pop()
    
    // Validate file extension
    if (!['xlsx', 'xls', 'csv'].includes(fileExtension || '')) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid file type. Only Excel (.xlsx, .xls) and CSV (.csv) files are allowed.'
      })
    }

    // Generate safe filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const safeFilename = `upload_${timestamp}_${originalName.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const finalPath = join(exportsDir, safeFilename)
    
    // Move file to final location
    copyFileSync(uploadedFile.filepath, finalPath)
    
    // Clean up temporary file
    try {
      unlinkSync(uploadedFile.filepath)
    } catch (cleanupError) {
      console.warn('Failed to cleanup temporary file:', cleanupError)
    }

    return {
      success: true,
      message: 'File uploaded successfully',
      filename: safeFilename,
      originalName: originalName,
      size: uploadedFile.size,
      type: fileExtension?.toUpperCase(),
      path: finalPath
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
