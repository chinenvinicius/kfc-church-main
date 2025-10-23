import { triggerExcelCheck, getExcelWatcherConfig, updateExcelWatcherConfig } from '~/server/utils/excelWatcher'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const action = body.action
    
    let result
    
    switch (action) {
      case 'enable':
        result = updateExcelWatcherConfig({
          enabled: true,
          autoImport: true,
          watchInterval: 30
        })
        break
        
      case 'disable':
        result = updateExcelWatcherConfig({
          enabled: false,
          autoImport: false
        })
        break
        
      case 'check':
        result = await triggerExcelCheck()
        break
        
      case 'status':
        result = getExcelWatcherConfig()
        break
        
      default:
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid action. Use: enable, disable, check, or status'
        })
    }
    
    return {
      success: true,
      action,
      result,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('Excel watcher test failed:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Excel watcher test failed: ${error.message}`
    })
  }
})