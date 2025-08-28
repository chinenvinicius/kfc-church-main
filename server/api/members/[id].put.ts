import { jsonOnlyStorage } from '~/server/utils/jsonOnlyStorage'

export default defineEventHandler(async (event) => {
  try {
    const id = parseInt(getRouterParam(event, 'id') || '0')
    const body = await readBody(event)
    
    const updatedMember = await jsonOnlyStorage.members.update(id, body)
    
    if (!updatedMember) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Member not found'
      })
    }
    
    return updatedMember
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    console.error('Error updating member:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update member'
    })
  }
})
