# Supabase Realtime Implementation

## 📡 Overview

This document details the complete implementation of Supabase Realtime for trips-related features in the NomadCrew frontend. All real-time functionality (chat, location, presence, reactions, read receipts) has been migrated from WebSockets to Supabase Realtime.

## 🏗️ Architecture

### Connection Details
- **Supabase URL:** `https://efmqiltdajvqenndmylz.supabase.co`
- **Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmbXFpbHRkYWp2cWVubmRteWx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyMzYxMTQsImV4cCI6MjA1MDgxMjExNH0.f2EbHa9Lwv-euLbj5bFiFixCHhnUREARg51qa469T_o`

### Data Flow
- **Supabase Realtime**: Used for subscriptions (live updates) only
- **Go Backend REST API**: Used for all CRUD operations (writes)
- **Never** write directly to Supabase tables from frontend

## 🧩 Implemented Features

### 1. Chat Messages (`useChatMessages`)
- **Table:** `supabase_chat_messages`
- **Location:** `src/features/trips/hooks/useChatMessages.ts`
- **REST Endpoints:**
  - `GET /trips/{id}/chat/messages` - Fetch messages
  - `POST /trips/{id}/chat/messages` - Send message
  - `PUT /trips/{id}/chat/messages/{messageId}` - Update message
  - `DELETE /trips/{id}/chat/messages/{messageId}` - Delete message

**Usage Example:**
```typescript
import { useChatMessages } from '@/src/features/trips/hooks/useChatMessages';

function ChatComponent({ tripId }: { tripId: string }) {
  const {
    messages,
    isLoading,
    isConnected,
    sendMessage,
    updateMessage,
    deleteMessage,
    error
  } = useChatMessages({ tripId });

  const handleSendMessage = async (content: string) => {
    try {
      await sendMessage(content);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  if (error) {
    return <SupabaseRealtimeErrorScreen error={error} />;
  }

  return (
    <View>
      {messages.map(message => (
        <MessageItem key={message.id} message={message} />
      ))}
    </View>
  );
}
```

### 2. Location Sharing (`useLocations`)
- **Table:** `locations`
- **Location:** `src/features/trips/hooks/useLocations.ts`
- **REST Endpoints:**
  - `PUT /locations` - Update user location
  - `GET /locations/trips/{tripId}` - Get trip member locations

**Privacy Features:**
- Respects `is_sharing_enabled` flag
- Supports privacy levels: `hidden`, `approximate`, `precise`
- `getVisibleLocations()` filters based on privacy settings

**Usage Example:**
```typescript
import { useLocations } from '@/src/features/trips/hooks/useLocations';

function LocationComponent({ tripId }: { tripId: string }) {
  const {
    locations,
    updateLocation,
    getVisibleLocations,
    getLocationByUserId,
    isConnected
  } = useLocations({ tripId });

  const visibleLocations = getVisibleLocations();

  const handleLocationUpdate = async (lat: number, lng: number) => {
    try {
      await updateLocation({
        latitude: lat,
        longitude: lng,
        accuracy: 10,
        timestamp: Date.now()
      });
    } catch (err) {
      console.error('Failed to update location:', err);
    }
  };

  return (
    <MapView>
      {visibleLocations.map(location => (
        <Marker
          key={location.user_id}
          coordinate={{
            latitude: location.latitude,
            longitude: location.longitude
          }}
          title={location.user_name}
        />
      ))}
    </MapView>
  );
}
```

### 3. User Presence (`usePresence`)
- **Table:** `supabase_user_presence`
- **Location:** `src/features/trips/hooks/usePresence.ts`
- **Features:**
  - Online/offline status
  - Typing indicators
  - Last seen timestamps

**Usage Example:**
```typescript
import { usePresence } from '@/src/features/trips/hooks/usePresence';

function PresenceComponent({ tripId }: { tripId: string }) {
  const {
    getOnlineUsers,
    getTypingUsers,
    isUserOnline,
    isUserTyping
  } = usePresence({ tripId });

  const onlineUsers = getOnlineUsers();
  const typingUsers = getTypingUsers();

  return (
    <View>
      <Text>Online: {onlineUsers.length}</Text>
      {typingUsers.length > 0 && (
        <Text>{typingUsers.map(u => u.user_name).join(', ')} is typing...</Text>
      )}
    </View>
  );
}
```

### 4. Chat Reactions (`useReactions`)
- **Table:** `supabase_chat_reactions`
- **Location:** `src/features/trips/hooks/useReactions.ts`
- **REST Endpoints:**
  - `GET /trips/{id}/chat/messages/{messageId}/reactions` - List reactions
  - `POST /trips/{id}/chat/messages/{messageId}/reactions` - Add reaction
  - `DELETE /trips/{id}/chat/messages/{messageId}/reactions/{reactionType}` - Remove reaction

**Usage Example:**
```typescript
import { useReactions } from '@/src/features/trips/hooks/useReactions';

function MessageReactions({ tripId, messageId, userId }: Props) {
  const {
    getReactionCounts,
    hasUserReacted,
    addReaction,
    removeReaction
  } = useReactions({ tripId });

  const reactionCounts = getReactionCounts(messageId);

  const handleReactionPress = async (emoji: string) => {
    try {
      if (hasUserReacted(messageId, emoji, userId)) {
        await removeReaction(messageId, emoji);
      } else {
        await addReaction(messageId, emoji);
      }
    } catch (err) {
      console.error('Failed to toggle reaction:', err);
    }
  };

  return (
    <View>
      {Object.entries(reactionCounts).map(([emoji, count]) => (
        <TouchableOpacity
          key={emoji}
          onPress={() => handleReactionPress(emoji)}
        >
          <Text>{emoji} {count}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
```

### 5. Read Receipts (`useReadReceipts`)
- **Table:** `supabase_chat_read_receipts`
- **Location:** `src/features/trips/hooks/useReadReceipts.ts`
- **REST Endpoints:**
  - `PUT /trips/{id}/chat/last-read` - Update last read message

**Usage Example:**
```typescript
import { useReadReceipts } from '@/src/features/trips/hooks/useReadReceipts';

function ReadReceiptComponent({ tripId, userId, messages }: Props) {
  const {
    updateLastRead,
    getUnreadCount,
    hasUserRead
  } = useReadReceipts({ tripId });

  const unreadCount = getUnreadCount(userId, messages);

  const markAsRead = async (messageId: string) => {
    try {
      await updateLastRead(messageId);
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  return (
    <View>
      <Text>Unread: {unreadCount}</Text>
    </View>
  );
}
```

## 🛡️ Feature Flag Handling

### Feature Flag Detection (`useSupabaseRealtimeFeatureFlag`)
- **Location:** `src/features/trips/hooks/useSupabaseRealtimeFeatureFlag.ts`
- **Purpose:** Detect if Supabase Realtime is enabled backend-side
- **Method:** Lightweight API call to detect 503 errors or "not enabled" messages

**Usage Example:**
```typescript
import { useSupabaseRealtimeFeatureFlag } from '@/src/features/trips/hooks/useSupabaseRealtimeFeatureFlag';
import { SupabaseRealtimeErrorScreen } from '@/src/features/trips/components/SupabaseRealtimeErrorScreen';

function TripScreen({ tripId }: { tripId: string }) {
  const { isEnabled, isLoading, error, checkFeatureFlag } = useSupabaseRealtimeFeatureFlag();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isEnabled === false) {
    return (
      <SupabaseRealtimeErrorScreen
        error={error}
        onRetry={checkFeatureFlag}
        showFallbackOption={true}
        onFallback={() => {
          // Navigate to non-realtime version or show limited features
        }}
      />
    );
  }

  // Render normal trip screen with realtime features
  return <TripScreenWithRealtime tripId={tripId} />;
}
```

## 🚨 Error Handling

### Error Screen Component
- **Location:** `src/features/trips/components/SupabaseRealtimeErrorScreen.tsx`
- **Features:**
  - Different messages for feature disabled vs connection errors
  - Retry functionality
  - Fallback option for graceful degradation

### Error Types
- **503 Service Unavailable:** Feature flag disabled
- **Connection errors:** Network or Supabase issues
- **Authentication errors:** Token issues

## 📱 Offline & Reconnection Strategy

### Implemented Features
- **Local caching:** Messages and locations cached in component state
- **Connection status:** All hooks provide `isConnected` status
- **Automatic reconnection:** Hooks auto-reconnect on mount and trip change
- **Graceful cleanup:** Proper channel cleanup on unmount

### Recommended Enhancements (Future)
- **AsyncStorage caching:** Persist data across app restarts
- **Message queueing:** Queue unsent messages when offline
- **Exponential backoff:** Implement retry logic with backoff
- **Background/foreground handling:** Reconnect when app returns to foreground

## 🔧 Configuration

### Environment Variables
```bash
EXPO_PUBLIC_SUPABASE_URL=https://efmqiltdajvqenndmylz.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Supabase Client Setup
- **Location:** `src/features/auth/service.ts`
- **Configuration:** Auto-refresh tokens, persistent sessions, AsyncStorage

## 📊 Performance Considerations

### Rate Limiting
- **Client-side:** Implement debouncing for typing indicators and location updates
- **Server-side:** Backend handles rate limiting

### Memory Management
- **Channel cleanup:** All hooks properly clean up Supabase channels
- **Component unmounting:** `isMountedRef` prevents state updates after unmount
- **Subscription management:** Single channel per hook, proper unsubscribe

## 🧪 Testing Strategy

### Manual Testing Checklist
- [ ] Multiple users in same trip see real-time updates
- [ ] Privacy controls work for location sharing
- [ ] Presence and typing indicators update with low latency
- [ ] Offline/online transitions work smoothly
- [ ] App background/foreground reconnection works
- [ ] Feature flag detection works correctly
- [ ] Error screens display appropriately

### Test Scenarios
1. **Multi-user chat:** Send messages from different devices
2. **Location privacy:** Test different privacy levels
3. **Network interruption:** Disconnect/reconnect network
4. **App lifecycle:** Background/foreground app
5. **Feature flag:** Test with backend feature disabled

## 📚 File Structure

```
src/features/trips/
├── hooks/
│   ├── useChatMessages.ts                    # Chat messages hook
│   ├── useLocations.ts                       # Location sharing hook
│   ├── usePresence.ts                        # User presence hook
│   ├── useReactions.ts                       # Chat reactions hook
│   ├── useReadReceipts.ts                    # Read receipts hook
│   └── useSupabaseRealtimeFeatureFlag.ts     # Feature flag detection
├── components/
│   └── SupabaseRealtimeErrorScreen.tsx       # Error screen component
└── types.ts                                  # All Supabase Realtime types
```

## 🔄 Migration Status

### ✅ Completed
- [x] Type definitions for all Supabase tables
- [x] Chat messages hook with full CRUD + realtime
- [x] Location sharing hook with privacy controls
- [x] User presence hook with online/typing status
- [x] Chat reactions hook with emoji support
- [x] Read receipts hook with unread counting
- [x] Feature flag detection hook
- [x] Error screen component
- [x] Comprehensive documentation

### 🔄 Next Steps
- [ ] Integrate hooks into existing chat components
- [ ] Implement offline caching with AsyncStorage
- [ ] Add message queueing for offline scenarios
- [ ] Implement exponential backoff for reconnection
- [ ] Add app lifecycle handling for background/foreground
- [ ] Performance testing and optimization
- [ ] Integration testing with backend

## 🚀 Usage Guidelines

### Best Practices
1. **Always check `isConnected`** before showing real-time status
2. **Handle errors gracefully** with the error screen component
3. **Respect privacy settings** for location features
4. **Clean up subscriptions** properly (hooks handle this automatically)
5. **Use feature flag detection** before enabling real-time features
6. **Implement fallback UI** for when real-time is unavailable

### Common Patterns
```typescript
// Pattern 1: Basic hook usage with error handling
const { data, isLoading, error, isConnected } = useHook({ tripId });

if (error) {
  return <SupabaseRealtimeErrorScreen error={error} />;
}

// Pattern 2: Feature flag check before using realtime
const { isEnabled } = useSupabaseRealtimeFeatureFlag();

if (isEnabled === false) {
  return <FallbackComponent />;
}

// Pattern 3: Connection status indicator
<ConnectionIndicator isConnected={isConnected} />
```

---

**Last Updated:** December 2024  
**Version:** 1.0.0  
**Status:** Implementation Complete 