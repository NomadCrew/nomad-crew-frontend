# Frontend Notification API Examples

## Quick Start Examples

### 1. Creating a Trip (Triggers Notification)

```javascript
// Frontend code remains the same - just call the API
const createTrip = async (tripData) => {
  const response = await fetch('/v1/trips', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: "Europe Adventure",
      description: "Backpacking through Europe",
      startDate: "2024-06-01",
      endDate: "2024-06-15",
      destinationName: "Paris, France",
      destinationLatitude: 48.8566,
      destinationLongitude: 2.3522
    })
  });
  
  const trip = await response.json();
  
  // ✅ Notification automatically sent to creator
  // Show success message
  showToast("Trip created! You'll receive a notification with details.");
  
  return trip;
};
```

### 2. Sending a Chat Message (Triggers Notification)

```javascript
const sendMessage = async (tripId, message) => {
  const response = await fetch(`/v1/trips/${tripId}/chat/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: "Hey everyone! Just arrived in Paris!"
    })
  });
  
  const messageData = await response.json();
  
  // ✅ All trip members (except sender) automatically notified
  // Update UI
  addMessageToChat(messageData);
  showToast("Message sent to trip chat");
  
  return messageData;
};
```

### 3. Updating Trip Details (Triggers Notification)

```javascript
const updateTrip = async (tripId, updates) => {
  const response = await fetch(`/v1/trips/${tripId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: "Europe Adventure 2024",
      startDate: "2024-06-02" // Changed date
    })
  });
  
  const updatedTrip = await response.json();
  
  // ✅ All members (except updater) notified of changes
  showToast("Trip updated! All members have been notified.");
  
  return updatedTrip;
};
```

### 4. Sharing Location (Triggers Notification)

```javascript
const shareLocation = async (tripId, location) => {
  const response = await fetch(`/v1/trips/${tripId}/locations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      latitude: 48.8566,
      longitude: 2.3522,
      accuracy: 10,
      isSharingEnabled: true,
      sharingExpiresIn: 7200, // 2 hours in seconds
      privacy: "PRECISE"
    })
  });
  
  const locationData = await response.json();
  
  // ✅ All members (except sharer) notified if sharing enabled
  showToast("📍 Location shared with trip members");
  
  return locationData;
};
```

### 5. Adding a Member (Triggers Notification)

```javascript
const addMember = async (tripId, email, role = 'MEMBER') => {
  const response = await fetch(`/v1/trips/${tripId}/members`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: "newmember@example.com",
      role: role
    })
  });
  
  const result = await response.json();
  
  // ✅ Existing members notified of new member
  // ✅ New member receives welcome notification
  showToast(`${email} added to trip! They've been notified.`);
  
  return result;
};
```

### 6. Deleting a Trip (Triggers High-Priority Notification)

```javascript
const deleteTrip = async (tripId) => {
  // Confirm with user first
  const confirmed = await showConfirmDialog(
    "Delete Trip?",
    "All members will be notified that this trip has been deleted."
  );
  
  if (!confirmed) return;
  
  const response = await fetch(`/v1/trips/${tripId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (response.ok) {
    // ✅ All members (except deleter) receive HIGH priority notification
    showToast("Trip deleted. All members have been notified.");
    navigateTo('/trips');
  }
};
```

## Listening for Notifications (Supabase Realtime)

```javascript
// Set up real-time listeners for notifications
const setupNotificationListeners = (userId) => {
  // Listen for trip updates
  const tripChannel = supabase
    .channel('user-trips')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'trip_members',
      filter: `user_id=eq.${userId}`
    }, async (payload) => {
      // Fetch updated trip data
      if (payload.eventType === 'DELETE') {
        removeTripsFromUI(payload.old.trip_id);
        showNotification("A trip you were part of has been deleted");
      }
    })
    .subscribe();

  // Listen for new chat messages
  const chatChannel = supabase
    .channel('trip-chats')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'trip_messages',
      filter: `trip_id=in.(${userTripIds.join(',')})`
    }, (payload) => {
      if (payload.new.user_id !== userId) {
        showNotification(`New message in ${payload.new.trip_name}`);
        updateChatBadge(payload.new.trip_id);
      }
    })
    .subscribe();

  // Listen for location updates
  const locationChannel = supabase
    .channel('trip-locations')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'user_locations',
      filter: `trip_id=in.(${userTripIds.join(',')})`
    }, (payload) => {
      if (payload.new.user_id !== userId) {
        updateMapMarker(payload.new);
        showNotification(`${payload.new.user_name} shared their location`);
      }
    })
    .subscribe();

  return () => {
    // Cleanup function
    supabase.removeChannel(tripChannel);
    supabase.removeChannel(chatChannel);
    supabase.removeChannel(locationChannel);
  };
};
```

## UI Components for Notifications

### Notification Toast Component
```jsx
const NotificationToast = ({ notification }) => {
  const getIcon = (type) => {
    switch(type) {
      case 'TRIP_UPDATE': return '🎒';
      case 'CHAT_MESSAGE': return '💬';
      case 'LOCATION_UPDATE': return '📍';
      case 'WEATHER_ALERT': return '⛈️';
      case 'SYSTEM_ALERT': return '⚠️';
      default: return '🔔';
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'CRITICAL': return 'red';
      case 'HIGH': return 'orange';
      case 'MEDIUM': return 'blue';
      case 'LOW': return 'gray';
      default: return 'blue';
    }
  };

  return (
    <div className={`notification-toast priority-${notification.priority.toLowerCase()}`}>
      <span className="icon">{getIcon(notification.type)}</span>
      <div className="content">
        <p className="message">{notification.data.message}</p>
        <span className="time">Just now</span>
      </div>
    </div>
  );
};
```

### Action Confirmation Dialog
```jsx
const ActionConfirmationDialog = ({ action, memberCount, onConfirm, onCancel }) => {
  const getNotificationMessage = (action) => {
    switch(action) {
      case 'delete_trip':
        return `This will notify all ${memberCount} trip members that the trip has been deleted.`;
      case 'update_trip':
        return `All ${memberCount} members will be notified of these changes.`;
      case 'remove_member':
        return 'The member will be notified that they\'ve been removed from the trip.';
      default:
        return `This action will notify ${memberCount} trip members.`;
    }
  };

  return (
    <Dialog open={true} onClose={onCancel}>
      <DialogTitle>Confirm Action</DialogTitle>
      <DialogContent>
        <Alert severity="info">
          {getNotificationMessage(action)}
        </Alert>
        <p>Do you want to continue?</p>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={onConfirm} variant="contained">
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
};
```

### Notification Badge
```jsx
const NotificationBadge = ({ count }) => {
  if (count === 0) return null;
  
  return (
    <span className="notification-badge">
      {count > 99 ? '99+' : count}
    </span>
  );
};
```

## Best Practices

### 1. Optimistic UI Updates
```javascript
// Update UI immediately, then sync with server
const sendMessageOptimistic = async (tripId, message) => {
  // Add message to UI immediately
  const tempMessage = {
    id: `temp-${Date.now()}`,
    message,
    userId: currentUser.id,
    createdAt: new Date().toISOString(),
    sending: true
  };
  
  addMessageToChat(tempMessage);
  
  try {
    const response = await fetch(`/v1/trips/${tripId}/chat/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message })
    });
    
    const sentMessage = await response.json();
    
    // Replace temp message with real one
    replaceMessage(tempMessage.id, sentMessage);
    
    // ✅ Other members automatically notified
  } catch (error) {
    // Remove temp message and show error
    removeMessage(tempMessage.id);
    showError("Failed to send message");
  }
};
```

### 2. Debouncing Location Updates
```javascript
// Avoid spamming notifications with frequent location updates
const LocationSharing = ({ tripId }) => {
  const [lastUpdate, setLastUpdate] = useState(null);
  const UPDATE_INTERVAL = 60000; // 1 minute minimum between updates
  
  const shareLocation = useCallback(async (position) => {
    const now = Date.now();
    
    // Skip if updated recently
    if (lastUpdate && (now - lastUpdate) < UPDATE_INTERVAL) {
      return;
    }
    
    await fetch(`/v1/trips/${tripId}/locations`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      })
    });
    
    setLastUpdate(now);
    // ✅ Notification sent, but not too frequently
  }, [tripId, lastUpdate]);
  
  // ... rest of component
};
```

### 3. Batch Actions UI
```javascript
// When performing actions that affect multiple users
const BulkInvite = ({ tripId }) => {
  const [emails, setEmails] = useState([]);
  
  const inviteAll = async () => {
    const count = emails.length;
    
    // Show what will happen
    const confirmed = await showConfirmDialog(
      `Invite ${count} People?`,
      `This will:\n` +
      `• Add ${count} new members to the trip\n` +
      `• Send ${count} welcome notifications\n` +
      `• Notify all existing members ${count} times`
    );
    
    if (!confirmed) return;
    
    // Show progress
    showProgress(`Inviting members...`, 0, count);
    
    for (let i = 0; i < emails.length; i++) {
      await addMember(tripId, emails[i]);
      showProgress(`Inviting members...`, i + 1, count);
    }
    
    showToast(`✅ All ${count} members added and notified!`);
  };
};
```

## Error Scenarios

The backend is designed to never fail operations due to notification errors, but here's how to handle edge cases:

```javascript
// The API call succeeds even if notifications fail
const robustTripUpdate = async (tripId, updates) => {
  try {
    const response = await fetch(`/v1/trips/${tripId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });
    
    const trip = await response.json();
    
    // ✅ Trip is updated regardless of notification status
    showToast("Trip updated successfully!");
    
    // Note: You won't know if notifications failed
    // The backend logs errors but doesn't expose them
    
    return trip;
  } catch (error) {
    // This means the API call failed, not notifications
    showError("Failed to update trip");
    throw error;
  }
};
```

## Testing Without Notifications

For development/testing without notification spam:

```javascript
// Check if in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// Add visual indicators for what would trigger notifications
const DevNotificationIndicator = ({ action, recipients }) => {
  if (!isDevelopment) return null;
  
  return (
    <div className="dev-notification-indicator">
      🔔 This would notify {recipients.length} users: {action}
    </div>
  );
};