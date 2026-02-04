# Play Store Screenshot Guide - NomadCrew

## Requirements

| Type       | Min | Max | Dimensions          | Format  |
| ---------- | --- | --- | ------------------- | ------- |
| Phone      | 2   | 8   | 1080x1920 (or 16:9) | PNG/JPG |
| 7" Tablet  | 0   | 8   | 1200x1920           | PNG/JPG |
| 10" Tablet | 0   | 8   | 1800x2560           | PNG/JPG |

## Recommended Screenshots (in order)

### 1. **Hero/Welcome** (Login screen)

- Show the beautiful login screen with NomadCrew branding
- Displays: App logo, tagline, sign-in options
- Caption: "Plan adventures together"

### 2. **Trip Dashboard**

- Show the main trips list with 2-3 trips
- Displays: Active trips, trip cards with dates/destinations
- Caption: "Organize all your trips"

### 3. **Trip Detail**

- Show a trip detail screen with members, dates, destination
- Displays: Trip info, member avatars, action buttons
- Caption: "Keep everyone in the loop"

### 4. **Location Sharing / Map**

- Show the map with member locations
- Displays: Map with pins, member list sidebar
- Caption: "Know where your crew is"

### 5. **Chat**

- Show the group chat for a trip
- Displays: Messages, typing indicators
- Caption: "Chat with your travel crew"

### 6. **To-Do List**

- Show the shared to-do list
- Displays: Tasks, checkboxes, assignees
- Caption: "Share tasks and get things done"

### 7. **Location Privacy Settings**

- Show the privacy selector (Precise/Approximate/Hidden)
- Displays: Privacy options, Ghost Mode toggle
- Caption: "You control your privacy"

### 8. **Invitation Flow**

- Show the invitation preview/accept screen
- Displays: Trip preview, Accept/Decline buttons
- Caption: "Join trips with one tap"

---

## How to Capture Screenshots

### Option A: Android Emulator (Recommended)

```bash
# Start emulator
emu-start

# Install dev build
eas-install

# Start Metro
fe-start

# Take screenshot (from Android Studio or)
adb exec-out screencap -p > screenshot.png
```

### Option B: Physical Device

1. Connect Android device via USB
2. Enable USB debugging
3. Install dev build via `eas-install`
4. Use device screenshot (Power + Volume Down)
5. Transfer via USB or `adb pull`

### Option C: Maestro (Automated)

```bash
# Run specific flow and capture
maestro test .maestro/flows/smoke-test.yaml --format junit
```

---

## Screenshot Checklist

- [ ] Screenshot 1: Login/Welcome screen
- [ ] Screenshot 2: Trips list (with sample trips)
- [ ] Screenshot 3: Trip detail view
- [ ] Screenshot 4: Map with locations
- [ ] Screenshot 5: Chat screen
- [ ] Screenshot 6: To-do list
- [ ] Screenshot 7: Privacy settings
- [ ] Screenshot 8: Invitation screen

---

## Post-Processing Tips

1. **Consistent status bar**: Use demo mode or edit out time/battery

   ```bash
   adb shell settings put global sysui_demo_allowed 1
   adb shell am broadcast -a com.android.systemui.demo -e command enter
   adb shell am broadcast -a com.android.systemui.demo -e command clock -e hhmm 1200
   adb shell am broadcast -a com.android.systemui.demo -e command battery -e level 100
   ```

2. **Frame in device mockup** (optional): Use tools like:
   - https://mockuphone.com
   - https://deviceframes.com
   - Figma device frames

3. **Add captions**: Overlay text on screenshots describing the feature

---

## Feature Graphic (1024x500)

Create a banner showing:

- NomadCrew logo
- Tagline: "Your crew. Your adventure."
- Background: Travel imagery or app screenshots collage
- Key features: Icons for location, chat, planning

Tools to create:

- Canva (free templates)
- Figma
- Adobe Express
