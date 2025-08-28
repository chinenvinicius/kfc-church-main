import { jsonOnlyStorage } from '~/server/utils/jsonOnlyStorage'

export default defineEventHandler(async (event) => {
  try {
    const visitorId = getRouterParam(event, 'id')
    
    if (!visitorId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Visitor ID is required'
      })
    }
    
    const result = await jsonOnlyStorage.visitors.delete(visitorId)
    
    if (result.changes === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Visitor not found'
      })
    }
    
    return { message: 'Visitor deleted successfully' }
  } catch (error) {
    console.error('Error deleting visitor:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete visitor'
    })
  }
})
