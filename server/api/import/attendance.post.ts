import { join } from 'path'
import { existsSync } from 'fs'
import { importAttendanceFromCSV } from '../../utils/csvUtils'
import { ImportAttendanceOptions } from '../../utils/types'
import { syncAttendanceToGoogleSheets } from '../../utils/googleSheetsService'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    
    if (!body.filename) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Filename is required'
      })
    }
    
    // Security check - prevent path traversal
    if (body.filename.includes('..') || body.filename.includes('/')) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid filename'
      })
    }
    
    const filepath = join(process.cwd(), 'server/exports', body.filename)
    
    if (!existsSync(filepath)) {
      throw createError({
        statusCode: 404,
        statusMessage: 'File not found'
      })
    }
    
    const options: ImportAttendanceOptions = {
      overwrite: body.overwrite || false,
      validateMembers: body.validateMembers !== false // Default to true
    }
    
    let result
    const fileExtension = body.filename.toLowerCase().split('.').pop()
    
    if (fileExtension === 'csv') {
      // Import CSV file
      result = await importAttendanceFromCSV(filepath, options)
    } else if (['xlsx', 'xls'].includes(fileExtension || '')) {
      // Import Excel file
      const { importAttendanceFromExcel } = await import('../../utils/excel')
      result = await importAttendanceFromExcel(filepath, {
        sheetName: body.sheetName,
        ...options
      })
    } else {
      throw createError({
        statusCode: 400,
        statusMessage: 'Unsupported file type. Only CSV, XLS, and XLSX files are supported.'
      })
    }
    
    // Sync to Google Sheets if enabled and import was successful (non-blocking)
    if (result.success && body.syncToGoogleSheets !== false) {
      // Run sync in background without waiting
      syncAttendanceToGoogleSheets().catch(error => {
        console.error('Background Google Sheets sync failed:', error)
      })
    }
    
    return {
      success: true,
      message: `${fileExtension?.toUpperCase()} file imported successfully`,
      fileType: fileExtension?.toUpperCase(),
      ...result
    }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: `Import failed: ${error.message}`
    })
  }
})
