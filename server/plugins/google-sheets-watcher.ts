import { startAutoImportWatcher } from '~/server/utils/googleSheetsService'

export default defineNitroPlugin((nitroApp) => {
  console.log('🚀 Google Sheets Watcher Plugin: Starting...')
  
  // Start the auto-import watcher when the server starts
  startAutoImportWatcher()
  
  console.log('✅ Google Sheets Watcher Plugin: Started')
})