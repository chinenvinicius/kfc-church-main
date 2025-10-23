#!/bin/bash
# Dynamic WSL port forwarding setup

# Get the current WSL IP
WSL_IP=$(hostname -I | awk '{print $1}')
echo "Detected WSL IP: $WSL_IP"

# Check if port forwarding already exists
EXISTING=$(netsh interface portproxy show v4tov4 | grep "3500" || echo "")
if [ -n "$EXISTING" ]; then
    echo "Port forwarding already exists. Deleting old entry..."
    netsh interface portproxy delete v4tov4 listenport=3500 listenaddress=127.0.0.1
fi

# Set up new port forwarding
echo "Setting up port forwarding: Windows localhost:3500 -> WSL $WSL_IP:3500"
netsh interface portproxy add v4tov4 listenport=3500 listenaddress=127.0.0.1 connectport=3500 connectaddress=$WSL_IP

echo "Port forwarding setup complete!"
echo "You can now access your app at: http://localhost:3500"
