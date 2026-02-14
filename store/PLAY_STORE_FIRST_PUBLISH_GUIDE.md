# Play Store First-Time Publish Guide (2026)

> A beginner-friendly, step-by-step guide for uploading your first app to Google Play. Based on current Play Console structure and [official Google documentation](https://support.google.com/googleplay/android-developer/answer/9859152).

---

## Important: Personal Account Requirement (Nov 2023+)

If your **Google Play Developer account was created after November 13, 2023** (personal account, not organization):

- You **must** run **Closed Testing** with **at least 12 testers** for **14 consecutive days** before you can publish to Production
- The Production track is **disabled** until you meet this requirement and apply for access
- **Timeline:** Expect ~2–3 weeks from start to live app (14 days testing + review)

If you have an **organization account**, you can go straight to Production.

---

## Overview: The Big Picture

```
1. Set up app content (policy stuff)     →  Policy and programs → App content
2. Set up store listing (what users see) →  Grow users → Store presence
3. Upload your app (AAB)                 →  Test and release → Testing → Closed testing
4. Run closed testing (12 testers, 14 days)  →  If personal account
5. Apply for production access          →  Dashboard → Apply for production
6. Publish to Production                →  Test and release → Production
```

---

## Step 0: Open Play Console

1. Go to **[play.google.com/console](https://play.google.com/console)**
2. Sign in with your developer account
3. Click **All apps** in the left sidebar
4. Click **Nomad Crew** (your app)

You should now see your app’s overview. The **left sidebar** is your main navigation.

---

## Step 1: Use the Dashboard (Your Checklist)

1. In the left sidebar, click **Dashboard**
2. You’ll see tasks grouped by section (App content, Store listing, Testing, etc.)
3. Completed tasks show a **green checkmark**
4. Click each incomplete task to open the right page
5. Work through tasks in order; the Dashboard shows what’s left

**Tip:** Use the Dashboard as your home base. It tells you exactly what to do next.

---

## Step 2: App Content (Policy Declarations)

**Path:** Left sidebar → **Policy and programs** → **App content**

(Or from Dashboard, click the **App content** task.)

### 2.1 Privacy policy

1. On **App content**, find **Privacy policy**
2. Click **Start** (or **Manage** if already set)
3. Enter: `https://nomadcrew.uk/privacy`
4. Click **Save**

### 2.2 Ads declaration

1. Find **Ads**
2. Click **Start**
3. Select **No** (NomadCrew has no ads)
4. Click **Save**

### 2.3 App access

1. Find **App access**
2. Click **Start**
3. Choose: **All functionality is available without special access**  
   OR provide a test account (e.g. `reviewer@nomadcrew.uk` + password)
4. Click **Save**

### 2.4 Target audience and content

1. Find **Target audience and content**
2. Click **Start**
3. Select the age group (e.g. 18+ or “All ages” if appropriate)
4. Answer the content questions
5. Click **Save**

### 2.5 Content rating

1. Find **Content rating**
2. Click **Start**
3. Complete the IARC questionnaire (short questions about app content)
4. Submit; you’ll get a rating (e.g. Everyone, Teen)
5. Click **Save**

### 2.6 Data safety

1. Find **Data safety**
2. Click **Start**
3. Declare what data you collect (see PLAY_STORE_LISTING.md for answers)
4. For NomadCrew: Location, Personal info, Device identifiers, App activity
5. For each: Collected? Shared? Purpose?
6. Click **Save**

### 2.7 COVID-19

1. Find **COVID-19 contact tracing and status apps**
2. Click **Start**
3. Select **No** (NomadCrew is not a COVID app)
4. Click **Save**

### 2.8 News app

1. Find **News and Magazine apps**
2. Click **Start**
3. Select **No**
4. Click **Save**

---

## Step 3: Store Listing (What Users See)

**Path:** Left sidebar → **Grow users** → **Store presence** → **Main store listing**

(Or from Dashboard, click the **Store listing** task.)

### 3.1 App details

| Field             | Value                                                                        | Max        |
| ----------------- | ---------------------------------------------------------------------------- | ---------- |
| App name          | NomadCrew                                                                    | 30 chars   |
| Short description | Plan group trips, share locations, and stay connected with your travel crew. | 80 chars   |
| Full description  | _(See PLAY_STORE_LISTING.md for full text)_                                  | 4000 chars |

### 3.2 Graphics

| Asset             | Size              | File                             |
| ----------------- | ----------------- | -------------------------------- |
| App icon          | 512×512 PNG       | `store/icon-512.png`             |
| Feature graphic   | 1024×500 PNG/JPEG | Create (see SCREENSHOT_GUIDE.md) |
| Phone screenshots | 1080×1920, min 2  | `store/screenshots/`             |

### 3.3 Contact

- **Email:** support@nomadcrew.uk (required)
- **Phone:** (optional)
- **Website:** https://nomadcrew.uk

### 3.4 Categorization

- **Category:** Travel & Local (or Travel)
- **Tags:** Add tags for discoverability (see PLAY_STORE_LISTING.md)

---

## Step 4: Store Settings (Contact Details)

**Path:** Left sidebar → **Grow users** → **Store presence** → **Store settings**

1. Scroll to **Contact details**
2. Add support email: `support@nomadcrew.uk`
3. Add website: `https://nomadcrew.uk`
4. Save

---

## Step 5: Upload Your App (AAB)

Before testing, you need to upload a build.

### 5.1 Get your AAB

```bash
# Build with EAS
eas build --platform android --profile production
```

Or use an existing production build from [expo.dev](https://expo.dev).

### 5.2 Upload to Closed Testing

**Path:** Left sidebar → **Test and release** → **Testing** → **Closed testing**

1. Click **Closed testing**
2. Click **Create new release** (or **Create release** if first time)
3. Upload your **AAB** (drag & drop or **Upload**)
4. Add **Release name** (e.g. "1.0.0")
5. Add **Release notes** (see PLAY_STORE_LISTING.md "What's New")
6. Click **Save**
7. Click **Review release** → **Start rollout to Closed testing**

---

## Step 6: Set Up Closed Testing (Required for Personal Accounts)

**Path:** Left sidebar → **Test and release** → **Testing** → **Closed testing**

### 6.1 Create tester list

1. In Closed testing, go to **Testers** tab
2. Click **Create email list**
3. Name it (e.g. "NomadCrew Testers")
4. Add emails of 12+ testers (friends, family, colleagues)
5. **Invite 15–20** so you have buffer (some may not join)
6. Save

### 6.2 Share opt-in link

1. Copy the **opt-in link** from the Closed testing page
2. Send it to your testers
3. They must:
   - Click the link
   - Accept the invitation
   - **Install the app from the Play Store** (not sideload)
   - Stay opted in for **14 consecutive days**

### 6.3 Wait 14 days

- All 12+ testers must be opted in for **14 days in a row**
- If someone opts out, the clock can reset
- Don’t publish app updates during this period (can reset the count)
- Keep testers engaged (ask them to use the app)

---

## Step 7: Apply for Production Access (After 14 Days)

**Path:** Left sidebar → **Dashboard**

1. Go to **Dashboard**
2. When conditions are met, you’ll see **Apply for production**
3. Click **Apply for production**
4. Answer the questions:
   - **Part 1 – Closed test:** How you recruited testers, engagement, feedback
   - **Part 2 – App:** Target audience, value, expected installs
   - **Part 3 – Readiness:** Changes you made, why the app is ready
5. Click **Apply**
6. Google will review (often within 7 days)
7. You’ll get an email when access is granted

---

## Step 8: Publish to Production

After production access is granted:

**Path:** Left sidebar → **Test and release** → **Production**

1. Click **Production**
2. Click **Create new release**
3. Use the **same AAB** from Closed testing (or a new one)
4. Add release notes
5. Click **Save** → **Review release** → **Start rollout to Production**
6. Your app goes live on the Play Store

---

## Navigation Quick Reference

| What you need                             | Where to go                                                  |
| ----------------------------------------- | ------------------------------------------------------------ |
| Overall progress                          | **Dashboard**                                                |
| Privacy, ads, content rating, data safety | **Policy and programs** → **App content**                    |
| App name, description, screenshots        | **Grow users** → **Store presence** → **Main store listing** |
| Contact email/website                     | **Grow users** → **Store presence** → **Store settings**     |
| Upload AAB, closed testing                | **Test and release** → **Testing** → **Closed testing**      |
| Apply for production                      | **Dashboard** → **Apply for production**                     |
| Publish to store                          | **Test and release** → **Production**                        |

---

## Common First-Time Mistakes

1. **Skipping closed testing** – Personal accounts must complete it
2. **Too few testers** – Invite 15–20 so you keep 12+ for 14 days
3. **Updating the app during testing** – Can reset the 14-day count
4. **Testers sideloading** – They must install from the Play Store opt-in link
5. **Missing App content items** – Finish all items under **App content** before release

---

## Timeline Summary

| Phase                        | Duration     |
| ---------------------------- | ------------ |
| App content + Store listing  | 1–2 hours    |
| Upload AAB to Closed testing | ~10 min      |
| Invite testers, they opt in  | 1–3 days     |
| 14 days closed testing       | 14 days      |
| Apply for production, review | Up to 7 days |
| Publish to Production        | Same day     |

**Total:** ~2–3 weeks for personal accounts.

---

## Need Help?

- [Play Console Help: Create and set up your app](https://support.google.com/googleplay/android-developer/answer/9859152)
- [App testing requirements (12 testers, 14 days)](https://support.google.com/googleplay/android-developer/answer/14151465)
- [Prepare your app for review](https://support.google.com/googleplay/android-developer/answer/9859455)
