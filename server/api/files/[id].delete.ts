import { fileStorage } from '~/server/utils/fileStorage'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'File ID is required'
      })
    }

    const success = fileStorage.deleteFile(id)
    
    if (!success) {
      throw createError({
        statusCode: 404,
        statusMessage: 'File not found'
      })
    }

    return {
      success: true,
      message: 'File deleted successfully'
    }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to delete file: ${error.message}`
    })
  }
})
