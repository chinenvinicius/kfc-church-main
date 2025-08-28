import { readJsonFile } from '~/server/utils/jsonDb'

export default defineEventHandler(async (event) => {
  try {
    console.log('DEBUG: Members API called - CWD:', process.cwd())
    const query = getQuery(event)
    const includeInactive = query.includeInactive === 'true'
    console.log('DEBUG: includeInactive:', includeInactive)
    
    // Direct file read to test
    const members = await readJsonFile('members.json')
    const filteredMembers = includeInactive ? members : members.filter(m => m.isActive !== false)
    console.log('DEBUG: Raw members:', members.length, 'Filtered:', filteredMembers.length)
    
    return filteredMembers
  } catch (error) {
    console.error('ERROR fetching members:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch members data'
    })
  }
})