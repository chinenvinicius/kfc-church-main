import { exportAttendanceToExcel } from '../../utils/excel'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    
    const options = {
      sabbathDate: body.sabbathDate,
      includeMembers: body.includeMembers || false,
      format: body.format || 'detailed' // 'detailed' or 'summary'
    }
    
    const result = await exportAttendanceToExcel(options)
    
    return {
      success: true,
      message: 'Excel file exported successfully',
      ...result
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Excel export failed: ${error.message}`
    })
  }
})
