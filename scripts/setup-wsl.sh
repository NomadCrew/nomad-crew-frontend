#!/bin/bash

# React Native Expo WSL2 Setup Script
# This script automates the development environment setup for WSL2

set -e

echo "🚀 Starting React Native Expo WSL2 Setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if running in WSL
if ! grep -qi microsoft /proc/version; then
    print_error "This script must be run in WSL2"
    exit 1
fi

print_status "Detected WSL2 environment"

# Update system packages
print_status "Updating system packages..."
sudo apt update -y
sudo apt upgrade -y

# Install essential packages
print_status "Installing essential development packages..."
sudo apt install -y \
    build-essential \
    git \
    curl \
    wget \
    unzip \
    zip \
    python3 \
    python3-pip

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_warning "Node.js not found. Installing via nvm..."
    
    # Install nvm
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    
    # Load nvm
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    
    # Install Node.js LTS
    nvm install --lts
    nvm use --lts
else
    print_status "Node.js already installed: $(node --version)"
fi

# Install global packages
print_status "Installing global npm packages..."
npm install -g eas-cli

# Increase file watcher limit
print_status "Configuring file watcher limits..."
if ! grep -q "fs.inotify.max_user_watches" /etc/sysctl.conf; then
    echo "fs.inotify.max_user_watches=524288" | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
fi

# Get Windows username
print_warning "Please enter your Windows username (for Android SDK path):"
read -r WINDOWS_USERNAME

# Configure Android SDK environment
print_status "Configuring Android SDK environment..."
ANDROID_ENV="
# Android SDK Configuration for WSL
export ANDROID_HOME=/mnt/c/Users/$WINDOWS_USERNAME/AppData/Local/Android/Sdk
export PATH=\$PATH:\$ANDROID_HOME/emulator
export PATH=\$PATH:\$ANDROID_HOME/tools
export PATH=\$PATH:\$ANDROID_HOME/tools/bin
export PATH=\$PATH:\$ANDROID_HOME/platform-tools

# Use Windows ADB for better performance
alias adb='/mnt/c/Users/$WINDOWS_USERNAME/AppData/Local/Android/Sdk/platform-tools/adb.exe'

# WSL IP for Metro bundler
export WSL_IP=\$(hostname -I | awk '{print \$1}')
export REACT_NATIVE_PACKAGER_HOSTNAME=\$WSL_IP
"

# Add to bashrc if not already present
if ! grep -q "Android SDK Configuration for WSL" ~/.bashrc; then
    echo "$ANDROID_ENV" >> ~/.bashrc
    print_status "Added Android SDK configuration to ~/.bashrc"
else
    print_status "Android SDK configuration already exists in ~/.bashrc"
fi

# Create WSL-specific npm scripts
print_status "Creating WSL-specific configuration..."

# Create a WSL config file
cat > wsl.config.js << 'EOL'
// WSL-specific configuration for React Native Expo

module.exports = {
  // Get WSL IP address
  getWSLIP: () => {
    const { execSync } = require('child_process');
    const ip = execSync('hostname -I').toString().trim().split(' ')[0];
    return ip;
  },
  
  // Metro configuration for WSL
  metroConfig: {
    watchFolders: [process.cwd()],
    server: {
      enhanceMiddleware: (middleware) => {
        return (req, res, next) => {
          res.setHeader('Access-Control-Allow-Origin', '*');
          return middleware(req, res, next);
        };
      },
    },
  },
  
  // Environment variables for WSL
  env: {
    EXPO_DEVTOOLS_LISTEN_ADDRESS: '0.0.0.0',
  }
};
EOL

# Create helper scripts
print_status "Creating helper scripts..."

# Create start script for WSL
cat > start-wsl.sh << 'EOL'
#!/bin/bash
# Start Expo with WSL-specific configuration

export EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
export REACT_NATIVE_PACKAGER_HOSTNAME=$(hostname -I | awk '{print $1}')

echo "🚀 Starting Expo on WSL"
echo "📱 Metro bundler will be available at: $REACT_NATIVE_PACKAGER_HOSTNAME:8081"
echo ""

npx expo start --clear
EOL

chmod +x start-wsl.sh

# Create Android connection script
cat > connect-android.sh << 'EOL'
#!/bin/bash
# Connect Android device for WSL development

echo "📱 Setting up Android device connection..."

# Get WSL IP
WSL_IP=$(hostname -I | awk '{print $1}')

echo "WSL IP: $WSL_IP"
echo ""
echo "On your Android device:"
echo "1. Enable Developer Mode"
echo "2. Enable USB Debugging"
echo "3. Connect via USB or same WiFi network"
echo "4. If using Expo Go, shake device and set 'Debug server host' to:"
echo "   $WSL_IP:8081"
echo ""

# Check if adb is available
if command -v adb &> /dev/null; then
    echo "Connected devices:"
    adb devices
else
    echo "⚠️  ADB not found. Please ensure Android SDK is installed on Windows."
fi
EOL

chmod +x connect-android.sh

# Final instructions
echo ""
echo "================================="
print_status "WSL2 Setup Complete!"
echo "================================="
echo ""
echo "Next steps:"
echo "1. Restart your terminal or run: source ~/.bashrc"
echo "2. Navigate to your project directory"
echo "3. Run: ./start-wsl.sh to start Expo with WSL configuration"
echo "4. Run: ./connect-android.sh for Android device setup instructions"
echo ""
echo "For detailed instructions, see: docs/WSL_REACT_NATIVE_SETUP.md"
echo ""
print_warning "Remember to:"
echo "  - Install Android Studio on Windows (not WSL)"
echo "  - Enable Developer Mode on your Android device"
echo "  - Configure Windows Defender exclusions for better performance"