import { syncFromGoogleSheets } from '~/server/utils/googleSheetsService'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const sabbathDate = body.sabbathDate as string | undefined
    
    const result = await syncFromGoogleSheets(sabbathDate)
    
    return {
      success: result.success,
      message: result.message,
      sabbathDate: sabbathDate || 'all',
      results: result.results
    }
  } catch (error: any) {
    console.error('Failed to sync from Google Sheets:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to sync from Google Sheets: ${error.message}`
    })
  }
})