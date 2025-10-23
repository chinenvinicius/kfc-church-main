import { getGoogleSheetsConfig } from '~/server/utils/googleSheetsService'

export default defineEventHandler(async (event) => {
  try {
    const config = getGoogleSheetsConfig()
    
    if (!config) {
      return {
        success: true,
        data: {
          client_email: '',
          private_key: '',
          spreadsheet_id: '',
          enabled: false,
          configured: false
        }
      }
    }
    
    // Don't expose the full private key in the response
    const safeConfig = {
      ...config,
      private_key: config.private_key ? '***CONFIGURED***' : '',
      configured: !!(config.client_email && config.private_key && config.spreadsheet_id)
    }
    
    return {
      success: true,
      data: safeConfig
    }
  } catch (error) {
    console.error('Failed to get Google Sheets config:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to get Google Sheets configuration'
    })
  }
})