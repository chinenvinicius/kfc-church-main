import { fileStorage } from '~/server/utils/fileStorage'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const category = query.category as string

    const files = fileStorage.getFiles(category)
    const stats = fileStorage.getStorageStats()

    return {
      success: true,
      files,
      stats
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch files: ${error.message}`
    })
  }
})
