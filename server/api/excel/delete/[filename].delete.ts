import { deleteExcelFile } from '../../../utils/excel'

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
    
    const result = deleteExcelFile(filename)
    
    return {
      success: true,
      message: `File ${filename} deleted successfully`
    }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: `Delete failed: ${error.message}`
    })
  }
})
