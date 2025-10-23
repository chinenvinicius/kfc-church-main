import { syncAttendanceToGoogleSheets } from '~/server/utils/googleSheetsService'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const sabbathDate = body.sabbathDate as string | undefined
    
    const result = await syncAttendanceToGoogleSheets(sabbathDate)
    
    return {
      success: result.success,
      message: result.message,
      sabbathDate: sabbathDate || 'all'
    }
  } catch (error: any) {
    console.error('Failed to sync to Google Sheets:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to sync to Google Sheets: ${error.message}`
    })
  }
})