# KFC Church Attendance System - Documentation

## 📋 Table of Contents
- [Overview](#overview)
- [Features](#features)
- [System Requirements](#system-requirements)
- [Installation & Setup](#installation--setup)
- [Running the Application](#running-the-application)
- [User Guide](#user-guide)
- [API Documentation](#api-documentation)
- [Database Management](#database-management)
- [Troubleshooting](#troubleshooting)
- [Maintenance](#maintenance)

## 🎯 Overview

The KFC Church Attendance System is a comprehensive web application built with Nuxt.js for tracking church member attendance, managing member information, and generating detailed reports. The system features a Progressive Web App (PWA) design for mobile-friendly usage and can be installed as a native app on mobile devices.

### Technology Stack
- **Frontend**: Nuxt.js 3, Vue.js 3, Pure CSS
- **Backend**: Nuxt Server API, Node.js
- **Database**: SQLite with better-sqlite3
- **Storage**: Dual storage (SQLite + JSON backup)
- **Package Manager**: pnpm
- **Containerization**: Docker/Podman support

## ✨ Features

### 📊 Dashboard
- Overview of total members and active members
- Recent attendance statistics
- Quick action buttons for common tasks
- Real-time data updates

### 👥 Member Management
- Register new church members (adults and children)
- Edit existing member information
- Search and filter members
- Member categories (Adults/Children)
- Soft delete functionality

### ✅ Attendance Tracking
- Track attendance for specific Sabbath dates
- Visual status indicators:
  - 🟢 **Green circle with checkmark** - Present
  - 🔴 **Red circle with X** - Absent  
  - ⚪ **Grey circle with question mark** - Other reason
- Filter members by category during attendance marking
- Visitor logging with names and notes
- Real-time attendance summary

### 📈 Reports & Analytics
- Comprehensive attendance reports with date filtering
- Monthly and yearly statistics
- Sortable attendance summary tables
- Visitor tracking and statistics
- Average attendance calculations
- Export functionality (CSV, Excel)

### 📱 Progressive Web App (PWA)
- Install as native app on mobile and desktop
- Offline functionality with service worker caching
- App shortcuts for quick access
- Full-screen experience without browser UI
- Haptic feedback and native-like interactions

### 📁 File Management
- Upload and store files
- Download stored files
- File organization system
- Excel file import/export capabilities

## 💻 System Requirements

### Development Environment
- **Node.js**: v18.0.0 or higher
- **pnpm**: Latest version
- **Operating System**: Windows, macOS, or Linux

### Production Environment
- **Docker/Podman**: For containerized deployment
- **Memory**: Minimum 512MB RAM
- **Storage**: Minimum 1GB free space
- **Network**: Port 3500 available

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd kfc-church-main
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Initialize Database
```bash
pnpm migrate
```

This command migrates any existing JSON data to the SQLite database.

## 🏃‍♂️ Running the Application

### Development Mode
```bash
pnpm dev
```
- Runs on `http://localhost:3500`
- Hot reload enabled
- Development tools available

### Production Mode (Local)
```bash
# Build the application
pnpm build

# Start production server
pnpm preview
```

### Production Mode (Docker/Podman)
```bash
# Build and start container
podman-compose up --build -d

# Stop container
podman-compose down

# View logs
podman logs kfc-church-main

# Restart container
podman-compose restart
```

## 📖 User Guide

### Getting Started
1. **Access the Application**: Open `http://localhost:3500` in your browser
2. **Install as PWA** (Optional): Click the install button in your browser
3. **Navigate**: Use the menu to access different sections

### Managing Members
1. **Add New Member**:
   - Go to Members page
   - Click "Add New Member"
   - Fill in the registration form
   - Select category (Adult/Child)
   - Click "Register Member"

2. **Edit Member**:
   - Find the member in the list
   - Click the edit icon
   - Update information in the modal
   - Click "Update Member"

3. **Search Members**:
   - Use the search box to filter by name
   - Use category filter to show Adults/Children only

### Recording Attendance
1. **Select Date**:
   - Go to Attendance page
   - Choose the Sabbath date
   - System defaults to current Saturday

2. **Mark Attendance**:
   - Click status buttons for each member:
     - Green checkmark = Present
     - Red X = Absent
     - Grey question mark = Other
   - Changes are saved automatically

3. **Add Visitors**:
   - Scroll to visitor section
   - Enter visitor name and notes
   - Click "Add Visitor"

### Viewing Reports
1. **Access Reports**: Go to Reports page
2. **Filter Data**: Select date range or specific dates
3. **View Statistics**: See attendance percentages and trends
4. **Export Data**: Download reports as CSV or Excel files

### File Management
1. **Upload Files**: Go to Files page and use upload button
2. **Download Files**: Click download icon next to any file
3. **Delete Files**: Click delete icon (with confirmation)

## 🔌 API Documentation

### Members API
- `GET /api/members` - Get all active members
- `GET /api/members?includeInactive=true` - Get all members
- `POST /api/members` - Register new member
- `PUT /api/members/:id` - Update member
- `DELETE /api/members/:id` - Delete member

### Attendance API
- `GET /api/attendance` - Get all attendance records
- `GET /api/attendance?sabbathDate=YYYY-MM-DD` - Get attendance for date
- `POST /api/attendance` - Update/create attendance record
- `GET /api/attendance/stats` - Get attendance statistics

### Visitors API
- `GET /api/visitors` - Get all visitor records
- `GET /api/visitors?sabbathDate=YYYY-MM-DD` - Get visitors for date
- `POST /api/visitors` - Add new visitor

### Files API
- `GET /api/files` - Get all files
- `POST /api/files` - Upload file
- `GET /api/files/:id/download` - Download file
- `DELETE /api/files/:id` - Delete file

## 🗄️ Database Management

### Dual Storage System
The system uses both SQLite database and JSON files for redundancy:

- **Primary**: SQLite database (`server/church.db`)
- **Backup**: JSON files (`server/data/`)
- **Auto-sync**: Data is saved to both storage layers

### Database Tables
- **members**: Member information and registration data
- **attendance**: Attendance records with member and date references
- **visitors**: Visitor logs with names and notes

### Data Backup
```bash
# Manual backup
cp server/church.db server/church.db.backup

# Sync data between storage layers
curl -X POST http://localhost:3500/api/attendance/sync \
  -H "Content-Type: application/json" \
  -d '{"direction": "to-json"}'
```

## 🔧 Troubleshooting

### Common Issues

**Port 3500 not accessible**
- Check if container is running: `podman ps`
- Check logs: `podman logs kfc-church-main`
- Restart container: `podman-compose restart`

**Database errors**
- Run migration: `pnpm migrate`
- Check file permissions on `server/church.db`
- Verify SQLite installation

**Build failures**
- Clear node_modules: `rm -rf node_modules && pnpm install`
- Check Node.js version: `node --version`
- Update dependencies: `pnpm update`

**PWA not installing**
- Ensure HTTPS or localhost
- Check manifest.json is accessible
- Clear browser cache

### Log Files
- **Container logs**: `podman logs kfc-church-main`
- **Application logs**: Check browser console
- **Database logs**: SQLite error messages in terminal

## 🛠️ Maintenance

### Regular Tasks
1. **Database Backup**: Weekly backup of `server/church.db`
2. **Log Rotation**: Monitor and clear old log files
3. **Updates**: Keep dependencies updated with `pnpm update`
4. **Security**: Regular security updates for base Docker image

### Performance Optimization
- Monitor database size and optimize queries
- Clean up old attendance records if needed
- Optimize images and static assets
- Use CDN for static content in production

### Security Considerations
- Keep Node.js and dependencies updated
- Use HTTPS in production
- Regular security audits with `pnpm audit`

## 📋 Quick Reference

### Essential Commands
```bash
# Development
pnpm dev                    # Start development server
pnpm build                  # Build for production
pnpm preview               # Preview production build

# Database
pnpm migrate               # Initialize/migrate database

# Container Management
podman-compose up -d       # Start in background
podman-compose down        # Stop and remove
podman-compose restart     # Restart services
podman logs kfc-church-main # View logs
```

### Default URLs
- **Application**: `http://localhost:3500`
- **Dashboard**: `http://localhost:3500/`
- **Members**: `http://localhost:3500/members`
- **Attendance**: `http://localhost:3500/attendance`
- **Reports**: `http://localhost:3500/reports`
- **Files**: `http://localhost:3500/files`

### File Structure
```
kfc-church-main/
├── pages/                 # Application pages
├── components/           # Vue components
├── server/              # Backend API and data
│   ├── api/            # API endpoints
│   ├── data/           # JSON backup files
│   ├── church.db       # SQLite database
│   └── utils/          # Utility functions
├── assets/             # Static assets
├── public/             # Public files
├── package.json        # Dependencies
├── nuxt.config.ts      # Nuxt configuration
├── Containerfile       # Docker configuration
└── podman-compose.yml  # Container orchestration
```

## 🔐 Configuration

### Environment Variables
```bash
# Production settings
NUXT_PORT=3500                    # Server port
NUXT_HOST=0.0.0.0                # Server host
NUXT_TELEMETRY_DISABLED=1        # Disable telemetry

# Database settings (optional)
DB_PATH=./server/church.db       # Database file path
```

### Customization Options
- **Port**: Change in `nuxt.config.ts` and `Containerfile`
- **Database**: Modify path in server utilities
- **Styling**: Edit CSS files in `assets/css/`
- **PWA**: Configure in `public/manifest.json`

## 📊 Data Management

### Member Data Structure
```json
{
  "id": 1,
  "name": "John Doe",
  "category": "adult",
  "registrationDate": "2025-01-15",
  "isActive": true
}
```

### Attendance Data Structure
```json
{
  "id": 1,
  "memberId": 1,
  "sabbathDate": "2025-01-18",
  "status": "present",
  "timestamp": "2025-01-18T10:00:00Z"
}
```

### Visitor Data Structure
```json
{
  "id": 1,
  "name": "Jane Smith",
  "sabbathDate": "2025-01-18",
  "notes": "First time visitor",
  "timestamp": "2025-01-18T10:00:00Z"
}
```

## 🚀 Deployment Options

### Option 1: Local Development
Best for: Testing and development
```bash
pnpm install
pnpm migrate
pnpm dev
```

### Option 2: Local Production
Best for: Single-machine production
```bash
pnpm install
pnpm migrate
pnpm build
pnpm preview
```

### Option 3: Container Deployment
Best for: Production with isolation
```bash
podman-compose up --build -d
```

### Option 4: Server Deployment
Best for: Remote server hosting
1. Copy files to server
2. Install Node.js and pnpm
3. Run production commands
4. Configure reverse proxy (nginx/apache)
5. Set up SSL certificate

## 📱 Mobile Usage

### PWA Installation
1. **Android Chrome**:
   - Open app in Chrome
   - Tap "Add to Home Screen"
   - Confirm installation

2. **iOS Safari**:
   - Open app in Safari
   - Tap Share button
   - Select "Add to Home Screen"

3. **Desktop**:
   - Look for install icon in address bar
   - Click and confirm installation

### Mobile Features
- **Offline Access**: Core functionality works offline
- **Touch Optimized**: Large buttons for easy tapping
- **Responsive Design**: Adapts to all screen sizes
- **Haptic Feedback**: Vibration on button presses

---

## 📞 Support

For technical support or questions:
1. Check this documentation first
2. Review the troubleshooting section
3. Check application logs for error messages
4. Consult the README.md file for additional information

### Common Support Scenarios

**"I can't access the application"**
- Verify the server is running: `podman ps`
- Check the correct URL: `http://localhost:3500`
- Review firewall settings

**"Data is not saving"**
- Check database permissions
- Verify disk space availability
- Review application logs

**"PWA won't install"**
- Ensure using HTTPS or localhost
- Clear browser cache
- Check manifest.json accessibility

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Documentation**: Complete
