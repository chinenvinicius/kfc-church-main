# Podman Development Guide

## 🔧 Development Setup (Code Changes Reflect)

### Updated Configuration:
- ✅ **Volume mounting**: Your entire project is now mounted into the container
- ✅ **Hot reloading**: Code changes will automatically reflect
- ✅ **Data persistence**: Your JSON data is properly mounted
- ✅ **Development mode**: Container runs `pnpm run dev` instead of production build

### Start Development with Podman:
```bash
# Stop any running containers
podman-compose down

# Rebuild and start with new volume mounts
podman-compose up --build

# Or run in background
podman-compose up --build -d
```

### What's Changed:
1. **Volume Mounts Added**:
   - `.:/app` - Mounts your entire project for live code changes
   - `/app/node_modules` - Excludes node_modules to avoid conflicts
   - `./server/data:/app/server/data` - Mounts data directory

2. **Development Mode**: Container now runs `pnpm run dev` for hot reloading

3. **Production Option**: Use `Containerfile.prod` for production builds

## 🚀 Usage Options

### Option 1: Development with pnpm (Fastest)
```bash
pnpm run dev
# Visit: http://localhost:3500
```

### Option 2: Development with Podman (Docker-like environment)
```bash
podman-compose up --build
# Visit: http://localhost:3500
# Code changes will now reflect automatically!
```

### Option 3: Production with Podman
```bash
# Use the production Containerfile
podman build -f Containerfile.prod -t kfc-church-prod .
podman run -p 3500:3500 -v ./server/data:/app/server/data kfc-church-prod
```

## 🔄 Development Workflow

1. **Make code changes** in your editor
2. **Save the file**
3. **Changes automatically reflect** in the browser (both pnpm and Podman)
4. **Data persists** between container restarts

## 🐛 Troubleshooting

### If changes don't reflect:
```bash
# Restart the container
podman-compose restart

# Or rebuild if needed
podman-compose down
podman-compose up --build
```

### Check container logs:
```bash
podman-compose logs -f
```

### Verify volume mounts:
```bash
podman-compose exec nodejs-app-service ls -la /app
```

## ✅ Benefits
- 🔄 **Live reloading** in Podman
- 💾 **Data persistence** 
- 🚀 **Fast development** cycle
- 🐳 **Production-ready** containers
- 🔧 **Easy debugging** with logs