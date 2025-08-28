import { jsonOnlyStorage } from '~/server/utils/jsonOnlyStorage'

export default defineEventHandler(async (event) => {
  try {
    const id = parseInt(getRouterParam(event, 'id') || '0')
    
    const result = await jsonOnlyStorage.members.delete(id)
    
    if (result.changes === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Member not found'
      })
    }
    
    return { success: true }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    console.error('Error deleting member:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete member'
    })
  }
})
