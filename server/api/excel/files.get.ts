import { getExcelFiles } from '../../utils/excel'

export default defineEventHandler(async (event) => {
  try {
    const files = getExcelFiles()
    
    return {
      success: true,
      files,
      count: files.length
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to get Excel files: ${error.message}`
    })
  }
})
