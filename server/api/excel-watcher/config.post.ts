import { updateExcelWatcherConfig } from '~/server/utils/excelWatcher'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    
    // Validate input
    if (typeof body !== 'object') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid request body'
      })
    }

    // Update configuration
    const newConfig = updateExcelWatcherConfig(body)
    
    return {
      success: true,
      config: newConfig,
      message: 'Excel watcher configuration updated successfully'
    }
  } catch (error) {
    console.error('Failed to update Excel watcher config:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update Excel watcher configuration'
    })
  }
})