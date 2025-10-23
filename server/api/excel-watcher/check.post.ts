import { triggerExcelCheck } from '~/server/utils/excelWatcher'

export default defineEventHandler(async (event) => {
  try {
    const result = await triggerExcelCheck()
    
    return result
  } catch (error) {
    console.error('Failed to trigger Excel check:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to trigger Excel check'
    })
  }
})