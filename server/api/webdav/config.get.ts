import { webdavService } from '~/server/utils/webdavService'

export default defineEventHandler(async (event) => {
  try {
    const config = webdavService.getConfig()
    
    // Don't send password in response for security
    const safeConfig = {
      ...config,
      password: config.password ? '***' : ''
    }

    return {
      success: true,
      data: safeConfig
    }
  } catch (error) {
    console.error('Error fetching WebDAV config:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch WebDAV configuration'
    })
  }
})
