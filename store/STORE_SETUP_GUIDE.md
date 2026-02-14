# Store Setup Guide — Play Store & App Store

Step-by-step guide for completing store listings.

**First-time Play Store publisher?** → Start with **PLAY_STORE_FIRST_PUBLISH_GUIDE.md** — a beginner-friendly, navigation-focused guide for 2026.

Use this file alongside **RELEASE_CHECKLIST.md**, **PLAY_STORE_LISTING.md**, and **SCREENSHOT_GUIDE.md**.

---

## Where to Go

| Store          | Console                                                        |
| -------------- | -------------------------------------------------------------- |
| **Play Store** | [play.google.com/console](https://play.google.com/console)     |
| **App Store**  | [appstoreconnect.apple.com](https://appstoreconnect.apple.com) |

---

## Part 1: Play Store

### 1.1 App creation (if not done)

- [ ] Open **Play Console** → All apps → **Create app**
- [ ] App name: **NomadCrew**
- [ ] Default language: **English (United States)**
- [ ] App or game: **App**
- [ ] Free or paid: **Free**
- [ ] Create

### 1.2 Store listing

**Main store listing** → Store listing

| Field                        | Value                                                                        | Source                               |
| ---------------------------- | ---------------------------------------------------------------------------- | ------------------------------------ |
| Short description (80 chars) | Plan group trips, share locations, and stay connected with your travel crew. | PLAY_STORE_LISTING.md                |
| Full description             | _(Full text in PLAY_STORE_LISTING.md)_                                       | PLAY_STORE_LISTING.md                |
| App icon                     | 512×512 PNG                                                                  | Resize from `assets/images/icon.png` |
| Feature graphic              | 1024×500 PNG                                                                 | Create per SCREENSHOT_GUIDE.md       |
| Screenshots                  | Min 2, max 8                                                                 | 1080×1920, see SCREENSHOT_GUIDE.md   |

### 1.3 App content

**Policy** → **App content**

| Section             | Action                 | Notes                                                                      |
| ------------------- | ---------------------- | -------------------------------------------------------------------------- |
| **Privacy policy**  | Add URL                | `https://nomadcrew.uk/privacy`                                             |
| **App access**      | Select                 | "All functionality available without restrictions" OR provide test account |
| **Ads**             | Declare                | "No, my app does not contain ads"                                          |
| **Content rating**  | Complete questionnaire | Start → Answer questions → Submit                                          |
| **Target audience** | Complete               | Age groups (e.g. 18+)                                                      |
| **News app**        | No                     |                                                                            |
| **COVID-19**        | No                     |                                                                            |
| **Data safety**     | Complete form          | See Data Safety section below                                              |

### 1.4 Data safety form

**Data safety** → **Start** → Fill:

**Data collected:**

| Data type                   | Collected | Shared                      | Purpose            |
| --------------------------- | --------- | --------------------------- | ------------------ |
| Location                    | Yes       | No (only with trip members) | App functionality  |
| Personal info (name, email) | Yes       | No                          | Account management |
| Device identifiers          | Yes       | No                          | Push notifications |
| App activity                | Yes       | No                          | Analytics          |

**Security practices:** Data encrypted in transit (HTTPS), encrypted at rest.

### 1.5 Release

**Release** → **Production** (or **Internal testing** first)

- [ ] Upload AAB from EAS build
- [ ] Add release notes (see PLAY_STORE_LISTING.md "What's New")
- [ ] Review and submit

---

## Part 2: App Store (iOS)

### 2.1 App information

**App Store Connect** → [apps.apple.com](https://appstoreconnect.apple.com) → Your apps → **NomadCrew** (or create)

| Field              | Value                                           |
| ------------------ | ----------------------------------------------- |
| Name               | NomadCrew                                       |
| Subtitle           | Plan group trips with your crew                 |
| Privacy Policy URL | https://nomadcrew.uk/privacy                    |
| Category           | Travel (Primary), Social Networking (Secondary) |

### 2.2 Version information

| Field         | Value                                                    |
| ------------- | -------------------------------------------------------- |
| What's New    | Same as Play Store release notes                         |
| Description   | Same as Play Store full description                      |
| Keywords      | group travel, trip planner, location sharing, travel app |
| Support URL   | https://nomadcrew.uk                                     |
| Marketing URL | https://nomadcrew.uk                                     |

### 2.3 Screenshots

| Device      | Size      | Min |
| ----------- | --------- | --- |
| 6.7" iPhone | 1290×2796 | 3   |
| 6.5" iPhone | 1284×2778 | 3   |
| 5.5" iPhone | 1242×2208 | 3   |

### 2.4 App privacy

**App Privacy** → **Get started**

- Data collected: Location, Contact info, Identifiers, Usage data
- Same as Data Safety (see above)

### 2.5 Age rating

Complete questionnaire → Typically **4+** or **12+** depending on content.

---

## Part 3: Assets to create

| Asset           | Size      | Action                          |
| --------------- | --------- | ------------------------------- |
| App icon        | 512×512   | Resize `assets/images/icon.png` |
| Feature graphic | 1024×500  | Create banner (Canva, Figma)    |
| Screenshots     | 1080×1920 | Capture from device/emulator    |

---

## Quick copy-paste

### Short description (Play Store)

```
Plan group trips, share locations, and stay connected with your travel crew.
```

### Release notes (first release)

```
🎉 First Release!

• Create and manage group trips
• Invite friends via shareable links
• Real-time location sharing with privacy controls
• Group chat for each trip
• Shared to-do lists
• Push notifications
• Sign in with Google or Apple
```

### Test account (for reviewers)

```
Email: reviewer@nomadcrew.uk
Password: [Create and document]
```

Create a sample trip with members, chat, and to-dos so reviewers can see full functionality.

---

## Checklist summary

- [ ] Play Store: App created
- [ ] Play Store: Store listing
- [ ] Play Store: App content (privacy, ads, content rating, data safety)
- [ ] Play Store: First AAB uploaded
- [ ] App Store: App created
- [ ] App Store: Version info
- [ ] App Store: Screenshots
- [ ] App Store: App privacy
- [ ] Test account created
