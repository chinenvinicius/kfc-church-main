import { webdavService } from '~/server/utils/webdavService'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    console.log('WebDAV config update request:', {
      enabled: body.enabled,
      serverUrl: body.serverUrl,
      username: body.username,
      email: body.email,
      storageQuota: body.storageQuota,
      basePath: body.basePath,
      hasPassword: !!body.password
    })

    // Validate required fields only if WebDAV is being enabled
    if (body.enabled) {
      if (!body.serverUrl || !body.username || !body.password) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Server URL, username, and password are required when enabling WebDAV'
        })
      }
      // Validate server URL format only if WebDAV is being enabled
      try {
        new URL(body.serverUrl)
      } catch {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid server URL format'
        })
      }
    }


    const configUpdate: any = {
      enabled: body.enabled ?? false,
      // Only update these fields if they are provided and WebDAV is enabled
      serverUrl: body.enabled ? (body.serverUrl?.trim() || '') : undefined,
      username: body.enabled ? (body.username?.trim() || '') : undefined,
      password: body.enabled ? body.password : undefined,
      email: body.enabled ? (body.email?.trim() || '') : undefined,
      storageQuota: body.enabled ? (body.storageQuota?.trim() || '') : undefined,
      basePath: body.enabled ? (body.basePath?.trim() || '/backgrounds') : undefined
    }

    const updatedConfig = await webdavService.updateConfig(configUpdate)
    
    // Don't send password in response
    const safeConfig = {
      ...updatedConfig,
      password: updatedConfig.password ? '***' : ''
    }

    return {
      success: true,
      message: 'WebDAV configuration updated successfully',
      data: safeConfig
    }
  } catch (error) {
    console.error('Error updating WebDAV config:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update WebDAV configuration'
    })
  }
})
