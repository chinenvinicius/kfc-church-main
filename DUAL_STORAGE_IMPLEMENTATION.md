# Dual Storage Implementation for Church Attendance System

## Overview

The church attendance system now supports **dual storage** - storing attendance data in both JSON files and SQLite database simultaneously. This provides redundancy, better performance, and data integrity.

## Architecture

### Storage Layers
1. **Primary Storage**: SQLite Database (`server/church.db`)
2. **Backup Storage**: JSON Files (`server/data/attendance.json`)

### Key Components

#### 1. Database Layer (`server/utils/database.ts`)
- SQLite database with proper schema and foreign key constraints
- Optimized with indexes for better query performance
- CRUD operations for attendance, members, and visitors
- Automatic table creation and initialization

#### 2. JSON Layer (`server/utils/jsonDb.ts`)
- File-based operations for reading/writing JSON data
- Error handling and fallback mechanisms
- Maintains compatibility with existing JSON structure

#### 3. Sync Layer (`server/utils/sync.ts`)
- Dual save operations (save to both database and JSON)
- Dual load operations (load from database first, fallback to JSON)
- Data consistency validation
- Bidirectional synchronization utilities

## Database Schema

### Attendance Table
```sql
CREATE TABLE attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  memberId INTEGER NOT NULL,
  sabbathDate TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'other')),
  notes TEXT DEFAULT '',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (memberId) REFERENCES members (id),
  UNIQUE(memberId, sabbathDate)
);
```

### Members Table
```sql
CREATE TABLE members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  category TEXT NOT NULL,
  registrationDate TEXT NOT NULL,
  isActive BOOLEAN DEFAULT 1,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Visitors Table
```sql
CREATE TABLE visitors (
  id TEXT PRIMARY KEY,
  visitorName TEXT NOT NULL,
  sabbathDate TEXT NOT NULL,
  notes TEXT DEFAULT '',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### Core Attendance Endpoints
- `GET /api/attendance` - Load attendance data (database first, JSON fallback)
- `POST /api/attendance` - Save attendance data (dual storage)
- `GET /api/attendance/stats` - Get attendance statistics

### Management Endpoints
- `POST /api/attendance/sync` - Sync data between storage layers
- `GET /api/attendance/stats` - Get detailed statistics

### Sync Operations
```bash
# Sync from database to JSON
curl -X POST http://localhost:3500/api/attendance/sync \
  -H "Content-Type: application/json" \
  -d '{"direction": "to-json"}'

# Sync from JSON to database
curl -X POST http://localhost:3500/api/attendance/sync \
  -H "Content-Type: application/json" \
  -d '{"direction": "to-database"}'

# Validate consistency
curl -X POST http://localhost:3500/api/attendance/sync \
  -H "Content-Type: application/json" \
  -d '{"direction": "validate"}'
```

## Migration and Setup

### Initial Migration
```bash
# Install dependencies
pnpm install

# Run migration to populate database from existing JSON data
pnpm migrate
# or
node server/utils/migrate.cjs
```

### Dependencies Added
- `better-sqlite3`: SQLite database driver
- `uuid`: For generating unique visitor IDs
- `@types/better-sqlite3`: TypeScript definitions
- `@types/uuid`: TypeScript definitions

## Usage Examples

### Creating Attendance Record
```javascript
// API call creates record in both database and JSON
const response = await fetch('/api/attendance', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    memberId: 5,
    sabbathDate: '2025-06-07',
    status: 'present',
    notes: 'Regular attendance'
  })
});

// Response includes success status for both storage layers
{
  "success": true,
  "data": { /* attendance record */ },
  "sources": {
    "database": true,
    "json": true
  }
}
```

### Loading Attendance Data
```javascript
// API automatically tries database first, falls back to JSON
const response = await fetch('/api/attendance?sabbathDate=2025-06-07');
const result = await response.json();

// Response indicates which storage was used
{
  "data": [ /* attendance records */ ],
  "source": "database", // or "json"
  "count": 45
}
```

## Error Handling and Fallbacks

### Write Operations
1. Attempt to save to database
2. Attempt to save to JSON file
3. Return success if at least one succeeds
4. Include error details if any storage fails

### Read Operations
1. Try to load from database
2. If database fails, fallback to JSON file
3. Return data with source indicator

### Consistency Validation
- Compare records between database and JSON
- Identify missing records in either storage
- Report data mismatches
- Provide counts and statistics

## Benefits

1. **Redundancy**: Data is stored in two places, reducing risk of data loss
2. **Performance**: Database queries are faster for complex operations
3. **Compatibility**: Maintains existing JSON file structure
4. **Flexibility**: Can operate with either storage if one fails
5. **Migration Path**: Smooth transition from JSON-only to dual storage

## Monitoring and Maintenance

### Regular Tasks
- Run consistency validation periodically
- Monitor database file size and performance
- Backup both database and JSON files
- Check for and resolve data inconsistencies

### Troubleshooting
- Use sync endpoints to resolve inconsistencies
- Check server logs for storage operation errors
- Validate database integrity with SQLite tools
- Compare record counts between storage layers

## Future Enhancements

1. **Automatic Sync**: Background process to keep storages in sync
2. **Conflict Resolution**: Handle concurrent updates gracefully
3. **Performance Monitoring**: Track query performance and optimization
4. **Data Archiving**: Move old records to archive tables
5. **Backup Automation**: Scheduled backups of both storage layers
