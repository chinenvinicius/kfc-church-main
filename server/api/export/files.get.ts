import { getExportFiles } from '../../utils/csvUtils'

export default defineEventHandler(async (event) => {
  try {
    const files = getExportFiles()
    
    return {
      success: true,
      files,
      count: files.length
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to get export files: ${error.message}`
    })
  }
})
