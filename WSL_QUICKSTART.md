# WSL2 React Native Expo Quick Start Guide

## 🚀 Initial Setup (One-time)

1. **Run the setup script:**
   ```bash
   npm run setup:wsl
   ```

2. **Copy WSL config to Windows (for performance):**
   ```bash
   # In PowerShell (as Admin)
   Copy-Item \\wsl$\Ubuntu\mnt\n\NomadCrew\nomad-crew-frontend\.wslconfig.example $HOME\.wslconfig
   # Then restart WSL: wsl --shutdown
   ```

3. **Configure Android Studio (on Windows):**
   - Install Android Studio on Windows (not WSL)
   - Install Android SDK Platform-Tools
   - Add to Windows PATH: `%LOCALAPPDATA%\Android\Sdk\platform-tools`

## 📱 Daily Development Workflow

### Start Development Server
```bash
# Navigate to project
cd /mnt/n/NomadCrew/nomad-crew-frontend

# Start with WSL configuration
npm run start:wsl

# Or use tunnel (slower but works everywhere)
npm run start:tunnel
```

### Connect Android Device
```bash
# Run the connection helper
./scripts/android-connect.sh

# Or manually check devices
adb devices
```

### Common Commands
```bash
# Clean install (when things go wrong)
npm run clean:wsl

# Fix permission issues
npm run fix-permissions

# Run on Android with WSL config
npm run android:wsl

# Run linting
npm run lint

# Run tests
npm test
```

## 🔧 Troubleshooting

### Metro Can't Be Reached
```bash
# Get your WSL IP
hostname -I

# Start with explicit host
npx expo start --host $(hostname -I | awk '{print $1}')
```

### Android Device Not Connecting
1. Check Windows firewall (allow port 8081)
2. Verify ADB connection: `adb devices`
3. In Expo Go: Shake → Settings → Debug server: `<WSL_IP>:8081`

### Slow Performance
- Move project to WSL filesystem: `~/projects/`
- Exclude from Windows Defender
- Increase Node memory: `export NODE_OPTIONS="--max-old-space-size=4096"`

### Permission Errors
```bash
# Fix node_modules permissions
npm run fix-permissions

# Reset everything
npm run clean:wsl
```

## 📋 Environment Check
```bash
# Verify setup
node --version          # Should be v18+
npm --version           # Should be v9+
adb --version          # Should show Android Debug Bridge
echo $ANDROID_HOME     # Should point to Windows Android SDK
hostname -I            # Your WSL IP address
```

## 🏃‍♂️ Quick Tips

1. **Always use WSL scripts:** `npm run start:wsl` instead of `npm start`
2. **Keep project on Windows drive** for easier access from Windows tools
3. **Use development builds** instead of Expo Go for better performance
4. **VS Code:** Open with `code .` for WSL integration
5. **Terminal:** Use Windows Terminal for better experience

## 📚 Resources

- [Full Setup Guide](./docs/WSL_REACT_NATIVE_SETUP.md)
- [Expo Documentation](https://docs.expo.dev/)
- [WSL2 Documentation](https://docs.microsoft.com/en-us/windows/wsl/)
- [React Native Community](https://reactnative.dev/)