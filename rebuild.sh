#!/bin/bash

echo "🔧 Cleaning and rebuilding KFC Church Attendance System..."

# Stop any running containers
echo "📦 Stopping containers..."
podman-compose down

# Clean up build artifacts
echo "🧹 Cleaning build artifacts..."
rm -rf .nuxt
rm -rf .output
rm -rf dist
rm -rf node_modules/.cache

# Clear pnpm cache
echo "🗑️ Clearing pnpm cache..."
pnpm store prune

# Reinstall dependencies
echo "📦 Reinstalling dependencies..."
pnpm install --frozen-lockfile

# Build the project
echo "🏗️ Building project..."
pnpm run build

# Restart containers
echo "🚀 Starting containers..."
podman-compose up -d

echo "✅ Rebuild complete! The application should be available shortly."
echo "🌐 Check http://localhost:3500 in a few moments."
