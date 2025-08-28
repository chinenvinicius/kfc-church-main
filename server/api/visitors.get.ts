import { jsonOnlyStorage } from '~/server/utils/jsonOnlyStorage'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const sabbathDate = query.sabbathDate as string | undefined

    const visitors = await jsonOnlyStorage.visitors.getAll(sabbathDate)

    return visitors
  } catch (error) {
    console.error('Error fetching visitors:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch visitors data'
    })
  }
})
