// Sync functionality disabled in JSON-only mode
export default defineEventHandler(async (event) => {
  return {
    success: false,
    message: 'Sync functionality is disabled in JSON-only mode. The application is running without database support.',
    note: 'All data is stored in JSON files only.'
  }
})
