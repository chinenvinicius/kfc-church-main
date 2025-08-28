import { createTestExcelFile, exportAttendanceToExcelSimple, exportAttendanceSummarySimple } from '../../utils/excelSimple'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { action, sabbathDate, format } = body
    
    let result
    
    switch (action) {
      case 'test':
        result = await createTestExcelFile()
        break
        
      case 'export':
        if (format === 'summary') {
          result = await exportAttendanceSummarySimple(sabbathDate)
        } else {
          result = await exportAttendanceToExcelSimple({ sabbathDate, format })
        }
        break
        
      default:
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid action. Use: test or export'
        })
    }
    
    return {
      success: true,
      message: 'Excel operation completed successfully',
      ...result
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Excel operation failed: ${error.message}`
    })
  }
})
