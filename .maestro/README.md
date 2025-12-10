# Maestro E2E Testing

This directory contains Maestro end-to-end tests for the NomadCrew mobile application.

## What is Maestro?

Maestro is a simple and effective mobile UI testing framework. It's designed to be:

- Easy to write and understand (YAML-based)
- Fast and reliable
- Works with iOS and Android
- No code changes required in your app

## Installation

### Install Maestro CLI

**macOS/Linux:**

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

**Windows:**

```bash
# Install via PowerShell
iwr https://get.maestro.mobile.dev | iex
```

### Verify Installation

```bash
maestro --version
```

## Prerequisites

Before running tests, ensure:

1. **iOS Simulator** (for iOS testing):

   ```bash
   # List available simulators
   xcrun simctl list

   # Start a simulator (if not already running)
   open -a Simulator
   ```

2. **Android Emulator** (for Android testing):

   ```bash
   # List available emulators
   emulator -list-avds

   # Start an emulator
   emulator -avd <emulator-name>
   ```

3. **App Installed**:
   The app should be installed on the simulator/emulator before running tests.

   ```bash
   # Build and install for iOS
   npm run ios

   # Build and install for Android
   npm run android
   ```

## Running Tests

### Run All Tests

```bash
npm run test:e2e
```

Or directly with Maestro:

```bash
maestro test .maestro/flows/
```

### Run Smoke Test Only

```bash
npm run test:e2e:smoke
```

Or directly:

```bash
maestro test .maestro/flows/smoke-test.yaml
```

### Run Tests on Specific Device

```bash
# iOS
maestro test --device "iPhone 15 Pro" .maestro/flows/

# Android
maestro test --device "emulator-5554" .maestro/flows/
```

### Interactive Mode (Step Through Tests)

```bash
maestro studio .maestro/flows/smoke-test.yaml
```

This opens an interactive UI where you can:

- Step through each test command
- See what Maestro is doing in real-time
- Debug failing tests

## Test Structure

### Configuration (`config.yaml`)

Contains global configuration like the app bundle ID.

```yaml
appId: com.nomadcrew.app
```

### Test Flows (`flows/`)

Test flows are written in YAML and define user interactions:

```yaml
appId: com.nomadcrew.app
---
# Test steps
- launchApp
- tapOn: 'Login'
- inputText: 'user@example.com'
- assertVisible: 'Welcome'
```

## Common Maestro Commands

### Navigation

- `launchApp` - Launch the app
- `tapOn: "Button Text"` - Tap on element with text
- `tapOn: { id: "element-id" }` - Tap on element by ID
- `swipe` - Swipe in a direction
- `scroll` - Scroll view

### Input

- `inputText: "text"` - Type text
- `eraseText` - Clear text field

### Assertions

- `assertVisible: "text"` - Assert text is visible
- `assertVisible: { id: "element-id" }` - Assert element is visible
- `assertNotVisible: "text"` - Assert text is not visible

### Waiting

- `waitForAnimationToEnd` - Wait for animations
- `waitForElement: "text"` - Wait for element to appear

### Screenshots

- `takeScreenshot: "name"` - Take screenshot

### Advanced

- `repeat` - Repeat commands
- `runFlow: other-flow.yaml` - Run another flow
- `conditional` - Conditional logic

## Writing New Tests

1. Create a new YAML file in `flows/`:

   ```bash
   touch .maestro/flows/my-test.yaml
   ```

2. Define your test:

   ```yaml
   appId: com.nomadcrew.app
   ---
   # My Test
   - launchApp
   - tapOn: 'Feature Button'
   - assertVisible: 'Expected Result'
   ```

3. Run your test:
   ```bash
   maestro test .maestro/flows/my-test.yaml
   ```

## Debugging Tips

### Test Failing?

1. **Use Maestro Studio**:

   ```bash
   maestro studio .maestro/flows/failing-test.yaml
   ```

   Step through interactively to see where it fails.

2. **Add Screenshots**:

   ```yaml
   - takeScreenshot: 'before-action'
   - tapOn: 'Button'
   - takeScreenshot: 'after-action'
   ```

3. **Check Element Hierarchy**:

   ```bash
   maestro hierarchy
   ```

   Shows all elements on screen with their IDs and text.

4. **Add Delays**:
   ```yaml
   - waitForAnimationToEnd
   - wait: 2000 # Wait 2 seconds
   ```

### Common Issues

**Issue: App not found**

- Ensure app is installed on simulator/emulator
- Check `appId` in config.yaml matches your app's bundle ID

**Issue: Element not found**

- Use `maestro hierarchy` to inspect elements
- Try using ID instead of text
- Add `waitForElement` before tapping

**Issue: Flaky tests**

- Add `waitForAnimationToEnd` after navigation
- Use explicit waits: `waitForElement`
- Increase timeouts if needed

## Best Practices

1. **Keep Tests Independent**: Each test should be able to run standalone
2. **Use Descriptive Names**: Name flows based on what they test
3. **Add Comments**: Use `#` to explain complex test steps
4. **Take Screenshots**: Capture key moments for debugging
5. **Wait for UI**: Always wait for animations/elements before assertions
6. **Organize Flows**: Group related tests in subdirectories
7. **Reuse Common Flows**: Extract common actions into separate flows

## Resources

- [Maestro Documentation](https://maestro.mobile.dev)
- [Maestro GitHub](https://github.com/mobile-dev-inc/maestro)
- [Maestro Cloud](https://cloud.mobile.dev) - Run tests in the cloud

## Current Test Coverage

### Smoke Tests

- `smoke-test.yaml` - Verifies app launches and displays content

### Future Tests (To Be Added)

- Authentication flows (login, signup, logout)
- Trip creation and management
- Chat functionality
- Profile management
- Location and map features
- Expense tracking

## Support

For issues or questions:

1. Check [Maestro Documentation](https://maestro.mobile.dev)
2. Review this README
3. Ask the team in #development channel
