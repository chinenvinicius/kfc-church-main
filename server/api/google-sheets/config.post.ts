import { updateGoogleSheetsConfig, testGoogleSheetsConnection } from '~/server/utils/googleSheetsService'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    
    // Validate required fields
    if (body.client_email && typeof body.client_email !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'client_email must be a string'
      })
    }
    
    if (body.private_key && typeof body.private_key !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'private_key must be a string'
      })
    }
    
    if (body.spreadsheet_id && typeof body.spreadsheet_id !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'spreadsheet_id must be a string'
      })
    }
    
    if (body.enabled !== undefined && typeof body.enabled !== 'boolean') {
      throw createError({
        statusCode: 400,
        statusMessage: 'enabled must be a boolean'
      })
    }
    
    // Update configuration
    const config = updateGoogleSheetsConfig(body)
    
    // Test connection if all required fields are provided
    let connectionTest = null
    if (config.client_email && config.private_key && config.spreadsheet_id) {
      connectionTest = await testGoogleSheetsConnection()
    }
    
    return {
      success: true,
      message: 'Google Sheets configuration updated successfully',
      data: {
        ...config,
        private_key: config.private_key ? '***CONFIGURED***' : '',
        configured: !!(config.client_email && config.private_key && config.spreadsheet_id)
      },
      connectionTest
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    console.error('Failed to update Google Sheets config:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to update Google Sheets configuration: ${error.message}`
    })
  }
})