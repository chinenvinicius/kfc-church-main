#!/bin/bash

# Development startup script
echo "🚀 Starting KFC Church Attendance System in development mode..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    echo "Trying npm first (recommended)..."
    if command -v npm &> /dev/null; then
        npm install
    else
        echo "npm not found, trying pnpm..."
        pnpm install --ignore-scripts
    fi
fi

# Start the development server
echo "🔧 Starting development server on port 3500..."
if command -v npm &> /dev/null && [ -f "package-lock.json" ]; then
    npm run dev
else
    pnpm run dev
fi