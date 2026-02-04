# Frontend Notification Integration Guide

## Overview
The backend now automatically sends notifications for various events in the NomadCrew application. This guide explains what notifications are sent and when, so the frontend team can provide appropriate user feedback and handle real-time updates.

## Important Note
**The backend handles all notification sending automatically**. The frontend does NOT need to make any API calls to send notifications. Your role is to:
1. Trigger the actions that cause notifications (e.g., creating a trip, sending a message)
2. Listen for and display incoming notifications to users
3. Provide UI feedback when actions will trigger notifications

## Notification Events

### 1. Trip Notifications

#### Trip Created
- **When**: User creates a new trip
- **Who gets notified**: The trip creator
- **Notification content**:
  ```json
  {
    "type": "TRIP_UPDATE",
    "priority": "MEDIUM",
    "data": {
      "tripId": "trip-123",
      "tripName": "Europe Adventure",
      "message": "A new trip has been created",
      "updateType": "trip_created",
      "updatedBy": "System",
      "changesMade": "Trip 'Europe Adventure' was created"
    }
  }
  ```

#### Trip Updated
- **When**: Trip details are modified (name, dates, destination, status)
- **Who gets notified**: All trip members EXCEPT the person who made the update
- **Notification content**:
  ```json
  {
    "type": "TRIP_UPDATE",
    "priority": "MEDIUM",
    "data": {
      "tripId": "trip-123",
      "tripName": "Europe Adventure",
      "message": "Trip 'Europe Adventure' has been updated",
      "updateType": "trip_updated",
      "updatedBy": "John Doe",
      "changesMade": "Updated name, dates"
    }
  }
  ```

#### Trip Deleted
- **When**: Trip is deleted
- **Who gets notified**: All trip members EXCEPT the person who deleted it
- **Priority**: HIGH (important notification)
- **Notification content**:
  ```json
  {
    "type": "TRIP_UPDATE",
    "priority": "HIGH",
    "data": {
      "tripId": "trip-123",
      "tripName": "Europe Adventure",
      "message": "Trip 'Europe Adventure' has been deleted",
      "updateType": "trip_deleted",
      "updatedBy": "Jane Smith",
      "changesMade": "Trip has been removed"
    }
  }
  ```

### 2. Member Notifications

#### Member Added
- **When**: New member joins a trip
- **Who gets notified**: 
  - Existing members get: "John Doe has joined the trip"
  - New member gets: "You've been added to trip 'Europe Adventure'"
- **Notification content** (for existing members):
  ```json
  {
    "type": "TRIP_UPDATE",
    "priority": "MEDIUM",
    "data": {
      "tripId": "trip-123",
      "tripName": "Europe Adventure",
      "message": "John Doe has joined the trip",
      "updateType": "member_added",
      "updatedBy": "System",
      "changesMade": "John Doe was added as Member"
    }
  }
  ```

### 3. Chat Notifications

#### New Message
- **When**: Someone posts a message in trip chat
- **Who gets notified**: All trip members EXCEPT the sender
- **Notification content**:
  ```json
  {
    "type": "CHAT_MESSAGE",
    "priority": "MEDIUM",
    "data": {
      "tripId": "trip-123",
      "chatId": "trip-123",
      "senderId": "user-456",
      "senderName": "Alice Johnson",
      "message": "Hey everyone! Just arrived in Paris. The weather is amazing!",
      "messagePreview": "Hey everyone! Just arrived in Paris. The weather is amazing!"
    }
  }
  ```
  - Note: `messagePreview` is truncated to 100 characters if the message is longer

### 4. Location Notifications

#### Location Shared
- **When**: A trip member shares their location (only if sharing is enabled)
- **Who gets notified**: All trip members EXCEPT the person sharing
- **Notification content**:
  ```json
  {
    "type": "LOCATION_UPDATE",
    "priority": "LOW",
    "data": {
      "tripId": "trip-123",
      "sharedById": "user-789",
      "sharedByName": "Bob Wilson",
      "location": {
        "lat": 48.8566,
        "lng": 2.3522,
        "name": "48.8566, 2.3522"
      }
    }
  }
  ```

### 5. Weather Alerts (Future)
- **When**: Severe weather detected for trip destination
- **Priority**: CRITICAL
- **Data**: Weather alert details

### 6. System Alerts (Future)
- **When**: Payment issues, account actions needed
- **Priority**: CRITICAL
- **Data**: Alert message and action URL

## Frontend Implementation Recommendations

### 1. Real-time Updates
When you receive notifications via WebSocket/Supabase Realtime:
- Update the UI to reflect changes (e.g., refresh trip list on trip_deleted)
- Show in-app notification toasts/banners
- Update notification badge counts
- Play notification sounds (based on user preferences)

### 2. UI Feedback
When users perform actions that trigger notifications:
- Show loading states with messages like "Creating trip and notifying members..."
- Confirm actions that affect others: "This will notify all 5 trip members. Continue?"
- For deletions: "All members will be notified that this trip was deleted."

### 3. Notification Center
Consider implementing:
- A notification history/center where users can see past notifications
- Filters by notification type
- Mark as read functionality
- Click handlers to navigate to relevant content (trip, chat, etc.)

### 4. User Preferences (Future)
The notification system will eventually support:
- Channel preferences (push, email, SMS)
- Notification type preferences (which events to get notified about)
- Quiet hours
- Frequency limits

### 5. Example UI States

#### After Creating a Trip
```
✓ Trip created successfully!
  Notification sent to you with trip details.
```

#### After Sending a Chat Message
```
✓ Message sent to trip chat
  3 members will be notified
```

#### After Updating Trip Details
```
✓ Trip updated successfully!
  All members have been notified of the changes.
```

#### After Sharing Location
```
📍 Location shared with trip members
  Active for the next 2 hours
```

## Error Handling

The backend is designed to never fail an operation due to notification errors. This means:
- If notifications fail to send, the main action (create trip, send message) still succeeds
- The frontend should not show notification-specific errors
- Focus on the success of the primary action

## Testing Notifications

### With Notifications Enabled
1. Ensure `NOTIFICATION_API_KEY` is set in backend environment
2. Actions will trigger real notifications through the AWS facade
3. Check logs for notification IDs and delivery status

### With Notifications Disabled
1. Remove `NOTIFICATION_API_KEY` or set `NOTIFICATION_ENABLED=false`
2. All operations work normally without sending notifications
3. Useful for development/testing without spam

## WebSocket/Realtime Events

Notifications are sent through the notification service, but you should also listen for Supabase Realtime events for immediate UI updates:

```javascript
// Listen for trip updates
supabase
  .channel('trip-updates')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'trips',
    filter: `id=eq.${tripId}`
  }, (payload) => {
    // Update UI based on change
    // Show notification if user didn't initiate the change
  })
  .subscribe()

// Listen for new messages
supabase
  .channel('trip-chat')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `trip_id=eq.${tripId}`
  }, (payload) => {
    // Add message to chat
    // Show notification if message is from another user
  })
  .subscribe()
```

## API Endpoints (No Changes Needed)

The existing API endpoints now automatically trigger notifications:

- `POST /v1/trips` - Creates trip → Sends notification
- `PUT /v1/trips/:id` - Updates trip → Sends notification
- `DELETE /v1/trips/:id` - Deletes trip → Sends notification
- `POST /v1/trips/:id/members` - Adds member → Sends notification
- `POST /v1/trips/:id/chat/messages` - Sends message → Sends notification
- `POST /v1/trips/:id/locations` - Shares location → Sends notification
- `PUT /v1/trips/:id/locations` - Updates location → Sends notification

## Questions?

For questions about:
- Notification content/format → Check with backend team
- Delivery channels (push/email) → Handled by notification facade
- User preferences → Coming in future iteration
- Real-time updates → Use Supabase Realtime subscriptions