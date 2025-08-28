import { jsonOnlyStorage } from '~/server/utils/jsonOnlyStorage'

export default defineEventHandler(async (event) => {
  try {
    const visitorId = getRouterParam(event, 'id')
    const body = await readBody(event)
    
    if (!visitorId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Visitor ID is required'
      })
    }
    
    const updatedVisitor = await jsonOnlyStorage.visitors.update(visitorId, body)
    
    if (!updatedVisitor) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Visitor not found'
      })
    }
    
    return updatedVisitor
  } catch (error) {
    console.error('Error updating visitor:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update visitor'
    })
  }
})
