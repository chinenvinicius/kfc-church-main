import { exportAttendanceToCSV, exportAttendanceStats } from '../../utils/csvUtils'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    
    const options = {
      sabbathDate: body.sabbathDate,
      format: body.format || 'detailed' // 'detailed' or 'summary'
    }
    
    let result
    
    if (body.type === 'stats') {
      result = await exportAttendanceStats(options.sabbathDate)
    } else {
      result = await exportAttendanceToCSV(options)
    }
    
    return {
      success: true,
      message: 'CSV file exported successfully',
      ...result
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `CSV export failed: ${error.message}`
    })
  }
})
