import { webdavService } from '~/server/utils/webdavService'

export default defineEventHandler(async (event) => {
  try {
    const result = await webdavService.testConnection()

    return {
      success: result.success,
      message: result.message,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error testing WebDAV connection:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to test WebDAV connection'
    })
  }
})
