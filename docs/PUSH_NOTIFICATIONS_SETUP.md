# Push Notifications Setup Guide

## Overview

NomadCrew uses Expo Push Notifications to deliver notifications to iOS and Android devices. The backend sends notifications via Expo's Push API, which then routes to APNs (Apple) or FCM (Google).

## Architecture

```
Backend → Expo Push API → APNs/FCM → Device
```

1. App registers push token with backend on login
2. Backend stores token in `user_push_tokens` table
3. When notification needed, backend sends to Expo Push API
4. Expo delivers to Apple/Google push services
5. Device receives notification

## Current Configuration (as of Feb 2026)

### iOS Development Build (`com.nomadcrew.app.dev`)

- **APNs Key ID**: `5WPF8KKVLB`
- **Team ID**: `27DC66D35A`
- **Key File**: `SECRET/AuthKey_5WPF8KKVLB.p8`

### iOS Production Build (`com.nomadcrew.app`)

- **APNs Key ID**: `62K64DMV38`
- **Team ID**: `27DC66D35A`
- **Key File**: `SECRET/AuthKey_62K64DMV38.p8`

### EAS Project ID

- `50d59d51-34e0-49ab-a7ee-6989ed09f8ef`

## Setting Up APNs Keys

### Creating a New APNs Key

1. Go to https://developer.apple.com/account/resources/authkeys/add
2. Click **+** to create a new key
3. Name it (e.g., `NomadCrew Push 2026`)
4. Check **Apple Push Notifications service (APNs)**
5. Click **Continue** → **Register**
6. **Download the .p8 file immediately** (you only get ONE chance!)
7. Note the Key ID shown
8. Store the .p8 file in `SECRET/AuthKey_<KEY_ID>.p8`

### Uploading to Expo

1. Run `npx eas credentials --platform ios` or use Expo dashboard
2. Select the appropriate build profile (development/production)
3. Navigate to **Push Key** section
4. Upload the .p8 file
5. Enter:
   - **Key ID**: The ID from Apple (e.g., `5WPF8KKVLB`)
   - **Team ID**: `27DC66D35A`

**Important**: No app rebuild needed - push credentials are server-side only.

## Troubleshooting

### Debugging Push Failures

1. **Check backend logs** for ticket ID:

   ```
   Push notification ticket successful {"ticketId": "..."}
   ```

2. **Query Expo receipt API**:

   ```bash
   curl -X POST https://exp.host/--/api/v2/push/getReceipts \
     -H "Content-Type: application/json" \
     -d '{"ids": ["<TICKET_ID>"]}'
   ```

3. **Interpret the response**:
   - `{"status": "ok"}` - Delivered to APNs/FCM successfully
   - `{"status": "error", ...}` - Check error details

### Common APNs Errors

| Error                      | Cause                                             | Fix                                                                |
| -------------------------- | ------------------------------------------------- | ------------------------------------------------------------------ |
| `InvalidProviderToken`     | Key ID or Team ID mismatch, or corrupted .p8 file | Verify Key ID/Team ID match exactly; try creating a new key        |
| `BadEnvironmentKeyInToken` | Environment mismatch (sandbox vs production)      | Create a new APNs key - old keys may have environment restrictions |
| `DeviceNotRegistered`      | Push token is stale/invalid                       | App needs to re-register push token                                |
| `InvalidCredentials`       | .p8 file corrupted or wrong                       | Create a new APNs key and re-upload                                |

### Key Points About APNs Keys

- **.p8 files can only be downloaded ONCE** from Apple Developer Portal
- **APNs Auth Keys should work for both sandbox and production** - Expo auto-detects
- **Old keys may have environment restrictions** - if you see `BadEnvironmentKeyInToken`, create a new key
- **Keys are server-side only** - no app rebuild needed when changing keys
- **Each build profile needs its own push key** in Expo (dev vs prod)

### iOS Foreground Notifications

By default, iOS doesn't show banner notifications when the app is in foreground. To enable:

```typescript
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});
```

### Verifying Push Token Registration

Check if a user has a valid push token:

```sql
SELECT token, device_type, is_active, last_used_at
FROM user_push_tokens
WHERE user_id = '<USER_ID>';
```

## Files Reference

| File                                                             | Purpose                                        |
| ---------------------------------------------------------------- | ---------------------------------------------- |
| `SECRET/AuthKey_*.p8`                                            | APNs authentication keys (NEVER commit to git) |
| `src/features/notifications/services/pushNotificationService.ts` | Frontend push token registration               |
| `services/push_service.go`                                       | Backend Expo Push API client                   |
| `models/notification/service/notification_service.go`            | Notification creation and push triggering      |

## Related Documentation

- [Expo Push Notifications](https://docs.expo.dev/push-notifications/overview/)
- [Apple APNs Documentation](https://developer.apple.com/documentation/usernotifications)
- [Expo Push Receipt API](https://docs.expo.dev/push-notifications/sending-notifications/#push-receipts)
