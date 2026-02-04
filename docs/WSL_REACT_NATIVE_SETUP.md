# React Native Expo Development Setup on WSL2

This guide provides a comprehensive setup for developing React Native applications with Expo on Windows Subsystem for Linux 2 (WSL2).

## Prerequisites

### Windows Requirements
- Windows 10 version 2004+ or Windows 11
- WSL2 enabled (you're already running this)
- Windows Terminal (recommended)

### WSL2 Setup Verification
```bash
# Check WSL version (run in PowerShell on Windows)
wsl --version

# Check kernel version (run in WSL)
uname -r
```

## 1. Core Development Tools

### Node.js Setup
```bash
# Install Node Version Manager (nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell configuration
source ~/.bashrc

# Install Node.js (LTS version)
nvm install --lts
nvm use --lts

# Verify installation
node --version
npm --version
```

### Essential Development Packages
```bash
# Install build essentials
sudo apt update
sudo apt install -y build-essential git curl wget

# Install Watchman (for better file watching)
sudo apt install -y watchman

# Install development utilities
sudo apt install -y unzip zip
```

## 2. Expo CLI Setup

### Install Expo Tools
```bash
# Install Expo CLI (already bundled with your project)
npm install -g eas-cli

# Verify installation
npx expo --version
eas --version
```

### Configure Expo for WSL
```bash
# Set npm registry (if behind corporate proxy)
npm config set registry https://registry.npmjs.org/

# Configure git for WSL
git config --global core.autocrlf input
git config --global core.filemode false
```

## 3. Android Development Setup

### Connect to Windows Android Studio
```bash
# Add to ~/.bashrc or ~/.zshrc
export ANDROID_HOME=/mnt/c/Users/<YOUR_WINDOWS_USERNAME>/AppData/Local/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools

# For better performance, use Windows ADB
alias adb='/mnt/c/Users/<YOUR_WINDOWS_USERNAME>/AppData/Local/Android/Sdk/platform-tools/adb.exe'

# Reload configuration
source ~/.bashrc
```

### Enable ADB over Network
```bash
# On Windows (PowerShell as Admin)
# Start ADB server
adb kill-server
adb start-server

# Enable TCP/IP mode
adb tcpip 5555

# In WSL, connect to Windows ADB
export ADB_SERVER_SOCKET=tcp:$(cat /etc/resolv.conf | grep nameserver | awk '{print $2}'):5037
```

## 4. Metro Bundler Configuration

### Optimize Metro for WSL
Create or update `metro.config.js`:
```javascript
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// WSL2 optimizations
config.resolver.nodeModulesPaths = [
  '/mnt/n/NomadCrew/nomad-crew-frontend/node_modules'
];

config.watchFolders = [
  '/mnt/n/NomadCrew/nomad-crew-frontend'
];

// Increase file watcher limits
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      return middleware(req, res, next);
    };
  },
};

// Better performance for WSL
config.resolver.assetExts = [...config.resolver.assetExts];
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

module.exports = withNativeWind(config, {
  input: './global.css',
  inlineRem: 16,
});
```

### WSL Performance Optimization
Create `.wslconfig` in Windows home directory:
```ini
[wsl2]
memory=8GB
processors=4
swap=4GB
localhostForwarding=true

[experimental]
autoMemoryReclaim=gradual
networkingMode=mirrored
dnsTunneling=true
firewall=true
autoProxy=true
```

## 5. Environment Variables

### Configure Development Environment
Create/update `.env.local`:
```bash
# WSL-specific settings
EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
REACT_NATIVE_PACKAGER_HOSTNAME=$(hostname -I | awk '{print $1}')

# Your existing env vars
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
# ... other vars
```

## 6. VS Code Integration

### Install VS Code Server
```bash
# Install VS Code Server for WSL
code .
```

### Recommended Extensions
Create `.vscode/extensions.json`:
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "dsznajder.es7-react-js-snippets",
    "msjsdiag.vscode-react-native",
    "styled-components.vscode-styled-components",
    "bradlc.vscode-tailwindcss",
    "ms-vscode-remote.remote-wsl"
  ]
}
```

### VS Code Settings for WSL
Update `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.watcherExclude": {
    "**/node_modules/**": true,
    "**/.git/**": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/ios/Pods": true,
    "**/android/.gradle": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "terminal.integrated.defaultProfile.linux": "bash"
}
```

## 7. Common Issues & Solutions

### Issue: Metro bundler not accessible from device
```bash
# Solution: Expose Metro port
npx expo start --host tunnel
# Or use your WSL IP
npx expo start --host $(hostname -I | awk '{print $1}')
```

### Issue: File watching not working
```bash
# Increase inotify watchers
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### Issue: Slow file operations
```bash
# Use project on WSL filesystem instead of /mnt
# Move project to ~/projects/nomad-crew-frontend
cd ~
mkdir -p projects
cp -r /mnt/n/NomadCrew/nomad-crew-frontend ~/projects/
cd ~/projects/nomad-crew-frontend
```

### Issue: Android device not connecting
```bash
# Forward ADB port from Windows to WSL
# In Windows PowerShell:
netsh interface portproxy add v4tov4 listenport=5037 listenaddress=0.0.0.0 connectport=5037 connectaddress=127.0.0.1
```

## 8. Development Scripts

### Add to package.json
```json
{
  "scripts": {
    "start:wsl": "EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0 expo start --clear",
    "start:tunnel": "expo start --tunnel",
    "android:wsl": "REACT_NATIVE_PACKAGER_HOSTNAME=$(hostname -I | awk '{print $1}') expo run:android",
    "clean:wsl": "watchman watch-del-all && rm -rf node_modules && npm install",
    "fix-permissions": "chmod -R 755 node_modules && chmod -R 755 android"
  }
}
```

## 9. Performance Tips

### 1. Use WSL2 filesystem
- Keep projects in WSL filesystem (`~/projects`) not Windows (`/mnt/c`)
- 10x+ performance improvement for file operations

### 2. Optimize Node.js
```bash
# Add to ~/.bashrc
export NODE_OPTIONS="--max-old-space-size=4096"
```

### 3. Use Yarn or PNPM
```bash
# Install Yarn
npm install -g yarn

# Or install PNPM
npm install -g pnpm
```

### 4. Configure Windows Defender
Add exclusions for:
- WSL2 folders
- Node.js processes
- Metro bundler

## 10. Debugging Setup

### Chrome DevTools
```bash
# Enable debugging
export REACT_NATIVE_PACKAGER_HOSTNAME=$(hostname -I | awk '{print $1}')
npx expo start --dev-client
```

### React Native Debugger
```bash
# Install on Windows and connect via WSL IP
# Set in app: Debug server host & port for device
# Use: <WSL_IP>:8081
```

## Quick Start Commands

```bash
# Start development server
npm run start:wsl

# Run on Android device
npm run android:wsl

# Clean install
npm run clean:wsl

# Build development client
eas build --platform android --profile development
```

## Troubleshooting Checklist

- [ ] WSL2 is installed and updated
- [ ] Node.js LTS is installed via nvm
- [ ] Android SDK path is correctly set
- [ ] ADB is accessible from WSL
- [ ] Metro bundler is accessible from device
- [ ] File watchers limit is increased
- [ ] Project is on WSL filesystem (optional but recommended)
- [ ] Windows Defender exclusions are set
- [ ] VS Code is using WSL remote extension

## Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native on WSL2](https://react-native-community.github.io/upgrade-helper/)
- [WSL2 Networking](https://docs.microsoft.com/en-us/windows/wsl/networking)
- [Android Studio on WSL2](https://developer.android.com/studio/install)