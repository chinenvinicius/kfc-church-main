import { jsonOnlyStorage } from '~/server/utils/jsonOnlyStorage'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const newMember = await jsonOnlyStorage.members.create({
      ...body,
      registrationDate: new Date().toISOString().split('T')[0],
    })
    return newMember
  } catch (error) {
    console.error('Error creating member:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create member'
    })
  }
})
