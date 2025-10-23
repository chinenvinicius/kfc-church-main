import { testGoogleSheetsConnection, getGoogleSheetsWorksheets } from '~/server/utils/googleSheetsService'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const action = body.action || 'connection'
    
    if (action === 'connection') {
      const result = await testGoogleSheetsConnection()
      return {
        success: result.success,
        message: result.message
      }
    } else if (action === 'worksheets') {
      const result = await getGoogleSheetsWorksheets()
      return {
        success: result.success,
        message: result.message,
        sheets: result.sheets
      }
    } else {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid action. Must be "connection" or "worksheets"'
      })
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    console.error('Failed to test Google Sheets:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to test Google Sheets: ${error.message}`
    })
  }
})