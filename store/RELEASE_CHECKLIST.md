# NomadCrew v0.1.0 - Play Store Release Checklist

## Build Status

- [x] Version bumped to 0.1.0
- [x] Git tag v0.1.0 created
- [x] GitHub release published
- [x] EAS production build submitted
- [ ] Build completed (check: https://expo.dev/accounts/nomad-crew/projects/nomad-crew-frontend/builds/baedb13c-221f-4dca-a3b7-5433f36a6d44)

---

## Play Store Console Setup

### App Creation

- [ ] Create app in Play Console
- [ ] Set app name: "NomadCrew"
- [ ] Select category: Travel & Local
- [ ] Set default language: English (US)

### Store Listing

- [ ] Short description (see PLAY_STORE_LISTING.md)
- [ ] Full description (see PLAY_STORE_LISTING.md)
- [ ] App icon (512x512) - resize from assets/images/icon.png
- [ ] Feature graphic (1024x500) - need to create
- [ ] Phone screenshots (min 2) - see SCREENSHOT_GUIDE.md

### App Content

- [ ] Privacy policy URL: https://nomadcrew.uk/privacy
- [ ] App access: "All functionality available without restrictions" OR provide test account
- [ ] Ads declaration: No ads
- [ ] Content rating questionnaire
- [ ] Target audience: 18+ (or complete form)
- [ ] News app: No
- [ ] COVID-19: No
- [ ] Data safety form

### Data Safety Form Answers

```
Location:
- Collected: Yes
- Shared: No (only with trip members user invites)
- Required: Yes (core functionality)
- Purpose: App functionality

Personal info (Name, Email):
- Collected: Yes
- Shared: No
- Required: Yes (account creation)
- Purpose: Account management

Device identifiers:
- Collected: Yes
- Shared: No
- Required: No
- Purpose: Push notifications

App activity:
- Collected: Yes
- Shared: No
- Required: No
- Purpose: Analytics
```

### Release

- [ ] Upload AAB from EAS build
- [ ] Set up internal testing track first (recommended)
- [ ] Complete all required sections
- [ ] Submit for review

---

## Assets To Create

| Asset           | Size      | Status      | File                                 |
| --------------- | --------- | ----------- | ------------------------------------ |
| App icon        | 512x512   | [ ] Resize  | store/icon-512.png                   |
| Feature graphic | 1024x500  | [ ] Create  | store/feature-graphic.png            |
| Screenshot 1    | 1080x1920 | [ ] Capture | store/screenshots/01-login.png       |
| Screenshot 2    | 1080x1920 | [ ] Capture | store/screenshots/02-trips.png       |
| Screenshot 3    | 1080x1920 | [ ] Capture | store/screenshots/03-trip-detail.png |
| Screenshot 4    | 1080x1920 | [ ] Capture | store/screenshots/04-map.png         |

---

## Test Account

Create a reviewer test account:

- [ ] Create account: reviewer@nomadcrew.uk
- [ ] Create sample trip with multiple members
- [ ] Add sample chat messages
- [ ] Add sample to-do items

---

## Post-Submission

- [ ] Monitor review status (typically 1-7 days)
- [ ] Respond to any review feedback
- [ ] Plan internal testing rollout
- [ ] Plan production rollout percentage

---

## Quick Links

- EAS Build: https://expo.dev/accounts/nomad-crew/projects/nomad-crew-frontend/builds/baedb13c-221f-4dca-a3b7-5433f36a6d44
- GitHub Release: https://github.com/NomadCrew/nomad-crew-frontend/releases/tag/v0.1.0
- Play Console: https://play.google.com/console
- Privacy Policy: https://nomadcrew.uk/privacy
