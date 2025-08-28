import { jsonOnlyStorage } from '~/server/utils/jsonOnlyStorage'
import { v4 as uuidv4 } from 'uuid'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    
    const newVisitor = await jsonOnlyStorage.visitors.create({
      id: uuidv4(),
      ...body
    })
    
    return newVisitor
  } catch (error) {
    console.error('Error creating visitor:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create visitor'
    })
  }
})
