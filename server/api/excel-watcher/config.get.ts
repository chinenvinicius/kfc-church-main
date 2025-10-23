import { getExcelWatcherConfig } from '~/server/utils/excelWatcher'

export default defineEventHandler(async (event) => {
  try {
    const config = getExcelWatcherConfig()
    
    return {
      success: true,
      config
    }
  } catch (error) {
    console.error('Failed to get Excel watcher config:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to get Excel watcher configuration'
    })
  }
})