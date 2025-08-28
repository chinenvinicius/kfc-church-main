# 🚀 Quick Start Guide - KFC Church Attendance System

## ⚡ 5-Minute Setup

### Prerequisites
- Docker/Podman installed
- Port 3500 available

### 1. Get the Code
```bash
git clone <repository-url>
cd kfc-church-main
```

### 2. Start the Application
```bash
# One command to rule them all!
podman-compose up --build -d
```

### 3. Access Your App
Open your browser and go to: **http://localhost:3500**

That's it! 🎉

---

## 📱 First Time Usage

### Step 1: Add Members
1. Click **"Members"** in the menu
2. Click **"Add New Member"** 
3. Fill in the form:
   - Name: `John Doe`
   - Category: `Adult` or `Child`
4. Click **"Register Member"**

### Step 2: Record Attendance
1. Click **"Attendance"** in the menu
2. Select today's date (or any Saturday)
3. Click the status buttons for each member:
   - 🟢 = Present
   - 🔴 = Absent
   - ⚪ = Other

### Step 3: View Reports
1. Click **"Reports"** in the menu
2. See attendance statistics and trends
3. Export data if needed

---

## 🛠️ Management Commands

```bash
# View what's running
podman ps

# Check logs if something's wrong
podman logs kfc-church-main

# Stop the application
podman-compose down

# Restart the application
podman-compose restart

# Update and rebuild
podman-compose down
podman-compose up --build -d
```

---

## 📱 Install as Mobile App

### On Phone/Tablet:
1. Open **http://localhost:3500** in your browser
2. Look for **"Add to Home Screen"** or install prompt
3. Tap **"Install"** or **"Add"**
4. App will appear on your home screen like a native app!

### On Desktop:
1. Look for the install icon (⬇️) in your browser's address bar
2. Click it and confirm installation
3. App will open in its own window

---

## 🆘 Quick Troubleshooting

### "Can't access localhost:3500"
```bash
# Check if container is running
podman ps

# If not running, start it
podman-compose up -d

# Check logs for errors
podman logs kfc-church-main
```

### "Database errors"
```bash
# Stop and restart with fresh build
podman-compose down
podman-compose up --build -d
```

### "Out of disk space"
```bash
# Clean up old containers and images
podman system prune -a
```

---

## 🎯 Key Features at a Glance

| Feature | What it does | Where to find it |
|---------|-------------|------------------|
| **Dashboard** | Overview & stats | Home page (/) |
| **Members** | Add/edit church members | /members |
| **Attendance** | Mark who attended | /attendance |
| **Reports** | View statistics & trends | /reports |
| **Files** | Upload/download files | /files |
| **PWA** | Install as mobile app | Browser install prompt |

---

## 📞 Need Help?

1. **Check the logs**: `podman logs kfc-church-main`
2. **Read full documentation**: See `DOCUMENTATION.md`
3. **Common issues**: Most problems are solved by restarting the container

---

## 🔄 Regular Maintenance

### Weekly:
```bash
# Backup your data
cp server/church.db server/church.db.backup
```

### Monthly:
```bash
# Update and restart
podman-compose down
podman-compose up --build -d
```

---

**🎉 You're all set! Enjoy using your Church Attendance System!**

For detailed information, see the complete `DOCUMENTATION.md` file.
