#!/bin/bash

# Android Device Connection Helper for WSL2
# This script helps connect Android devices to React Native Expo on WSL2

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "📱 Android Device Connection Helper for WSL2"
echo "==========================================="
echo ""

# Get WSL IP
WSL_IP=$(hostname -I | awk '{print $1}')
echo -e "${GREEN}WSL IP Address:${NC} $WSL_IP"
echo ""

# Check if running in development
if [ -f ".env.local" ]; then
    source .env.local
fi

# Display connection methods
echo -e "${YELLOW}Method 1: USB Connection (Recommended)${NC}"
echo "1. Connect your Android device via USB"
echo "2. Enable Developer Options on your device"
echo "3. Enable USB Debugging"
echo "4. On Windows, run: adb tcpip 5555"
echo "5. Find device IP: adb shell ip addr show wlan0"
echo "6. Connect: adb connect <device-ip>:5555"
echo ""

echo -e "${YELLOW}Method 2: WiFi Connection${NC}"
echo "1. Ensure device is on same network as your PC"
echo "2. On device: Settings > About > Tap 'Build number' 7 times"
echo "3. Enable: Settings > Developer options > Wireless debugging"
echo "4. Note the IP address and port shown"
echo "5. On Windows: adb connect <ip>:<port>"
echo ""

echo -e "${YELLOW}Method 3: Expo Go App${NC}"
echo "1. Install Expo Go from Play Store"
echo "2. Start your app: npm run start:wsl"
echo "3. Scan QR code with Expo Go"
echo "4. If connection fails, shake device and:"
echo "   - Go to 'Settings'"
echo "   - Set 'Debug server host & port' to:"
echo -e "   ${GREEN}$WSL_IP:8081${NC}"
echo ""

echo -e "${YELLOW}Method 4: Development Build${NC}"
echo "1. Build development client: eas build --platform android --profile development"
echo "2. Install the APK on your device"
echo "3. Start Metro: npm run start:wsl"
echo "4. Your app should connect automatically"
echo ""

# Check ADB status
echo "Checking ADB connection..."
if command -v adb &> /dev/null; then
    ADB_DEVICES=$(adb devices 2>/dev/null | grep -v "List of devices" | grep -v "^$" || echo "")
    if [ -n "$ADB_DEVICES" ]; then
        echo -e "${GREEN}✓ Connected devices:${NC}"
        adb devices
    else
        echo -e "${RED}✗ No devices connected${NC}"
        echo "  Follow one of the methods above to connect your device"
    fi
else
    echo -e "${RED}✗ ADB not found${NC}"
    echo "  Please ensure Android SDK is installed on Windows"
    echo "  and available in PATH"
fi

echo ""
echo "Troubleshooting:"
echo "- Firewall: Ensure port 8081 is allowed"
echo "- Use 'ipconfig' on Windows to verify network"
echo "- Try 'adb kill-server' then 'adb start-server'"
echo "- Restart Metro bundler if connection drops"