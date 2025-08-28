# KFC Church Attendance System

A comprehensive church attendance tracking and member management system built with Nuxt.js, featuring member registration, Sabbath attendance tracking with visual status indicators, and detailed reporting capabilities.

## Features

### 📊 Dashboard
- Overview of total members, active members, and recent attendance
- Quick statistics and recent activity summary
- Quick action buttons for common tasks

### 📱 Progressive Web App (PWA)
- **Install as native app** on mobile and desktop devices
- **Offline functionality** with service worker caching
- **App shortcuts** for quick access to attendance and reports
- **Full-screen experience** without browser UI
- **Haptic feedback** and native-like interactions
- **Auto-updates** when online

### 👥 Member Management
- Register new church members (adults and children)
- View and manage existing member information
- Filter members by category (adults/children)
- Member statistics and registration tracking

### ✅ Attendance Tracking
- Track attendance for specific Sabbath dates (Saturdays)
- **Modern SVG icons** with visual status indicators:
  - **Green circle with checkmark** - Present
  - **Red circle with X** - Absent
  - **Grey circle with question mark** - Other reason
- **Touch-friendly controls** with haptic feedback on mobile
- **Visual feedback** with loading states and success animations
- Filter members by category during attendance marking
- Visitor logging with names and notes
- Real-time attendance summary

### 📈 Reports & Analytics
- Comprehensive attendance reports with date filtering
- Monthly and yearly statistics
- Sortable attendance summary tables
- Visitor tracking and statistics
- Average attendance calculations

## Technology Stack

- **Framework**: Nuxt.js 3
- **Styling**: Pure CSS (no frameworks)
- **Data Storage**: Dual storage (SQLite database + JSON files)
- **API**: Nuxt server API routes
- **Package Manager**: pnpm
- **Database**: SQLite with better-sqlite3

## Data Structure

The system uses **dual storage** for reliability and performance:

### Primary Storage (SQLite Database)
- `server/church.db` - SQLite database with optimized schema
- Tables: `members`, `attendance`, `visitors`
- Foreign key constraints and indexes for data integrity

### Backup Storage (JSON Files)
- `server/data/members.json` - Member information
- `server/data/attendance.json` - Attendance records
- `server/data/visitors.json` - Visitor logs

Data is automatically saved to both storage layers for redundancy.

## Setup

Install dependencies:

```bash
pnpm install
```

Initialize database (migrate existing JSON data):

```bash
pnpm migrate
```

## Development Server

Start the development server on `http://localhost:3500` (accessible from all network interfaces):

```bash
pnpm dev
```

The server will be accessible at:
- Local: `http://localhost:3500/`
- Network: `http://[your-ip]:3500/`

## Production

Build the application for production:

```bash
pnpm build
```

Preview production build:

```bash
pnpm preview
```

## API Endpoints

### Members
- `GET /api/members` - Get all active members
- `GET /api/members?includeInactive=true` - Get all members including inactive
- `POST /api/members` - Register new member

### Attendance
- `GET /api/attendance` - Get all attendance records (dual storage)
- `GET /api/attendance?sabbathDate=YYYY-MM-DD` - Get attendance for specific date
- `POST /api/attendance` - Update/create attendance record (dual storage)
- `GET /api/attendance/stats` - Get attendance statistics
- `POST /api/attendance/sync` - Sync data between storage layers

### Visitors
- `GET /api/visitors` - Get all visitor records
- `GET /api/visitors?sabbathDate=YYYY-MM-DD` - Get visitors for specific date
- `POST /api/visitors` - Add new visitor

## Dual Storage System

The system automatically saves data to both SQLite database and JSON files:

- **Database**: Primary storage for fast queries and data integrity
- **JSON Files**: Backup storage for compatibility and data portability
- **Automatic Fallback**: If database fails, system uses JSON files
- **Sync Tools**: API endpoints to synchronize data between storage layers

### Sync Operations
```bash
# Validate data consistency
curl -X POST http://localhost:3500/api/attendance/sync \
  -H "Content-Type: application/json" \
  -d '{"direction": "validate"}'

# Sync from database to JSON
curl -X POST http://localhost:3500/api/attendance/sync \
  -H "Content-Type: application/json" \
  -d '{"direction": "to-json"}'
```

## Usage

1. **Register Members**: Use the Members page to add new church members
2. **Mark Attendance**: Use the Attendance page to track who attended each Sabbath
3. **Log Visitors**: Record visitor information during attendance tracking
4. **View Reports**: Access comprehensive statistics and reports on the Reports page

## Docker Support

The project includes Docker configuration files:
- `Containerfile` - Docker image definition
- `podman-compose.yml` - Container orchestration
- `server-compose.yml` - Additional services (nginx proxy, DuckDNS)

## Contributing

This is a church attendance management system designed for simplicity and ease of use. The system focuses on core functionality without unnecessary complexity.
