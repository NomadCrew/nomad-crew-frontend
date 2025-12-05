# Backend Integration Guide: Supabase Sync Utility

## 🎯 **Quick Start**

The sync utility is ready for immediate integration! Here's everything you need to get started.

## 📦 **1. Installation**

Add the sync utility to your Go project:

```bash
# In your backend project directory
go get github.com/nomadcrew/supabase-sync
```

## 🔧 **2. Initialize the Sync Client**

Add this to your service initialization (likely in your main.go or service setup):

```go
package main

import (
    "github.com/nomadcrew/supabase-sync"
    "go.uber.org/zap"
)

// Add to your service struct
type YourService struct {
    // ... existing fields ...
    supabaseSync *supabasesync.Client
    logger       *zap.SugaredLogger
}

// Initialize in your setup function
func NewYourService() *YourService {
    // Initialize sync client
    syncClient := supabasesync.NewClient(supabasesync.Config{
        SupabaseURL:        "https://efmqiltdajvqenndmylz.supabase.co",
        SupabaseServiceKey: os.Getenv("SUPABASE_SERVICE_KEY"), // You already have this!
        Logger:             yourLogger,
        Timeout:            15 * time.Second,
        RetryAttempts:      5,
        AsyncMode:          true, // Non-blocking operations
    })

    return &YourService{
        // ... existing fields ...
        supabaseSync: syncClient,
        logger:       yourLogger,
    }
}
```

## 🔄 **3. Integration Points**

Based on your API structure, here are the exact integration points:

### **User Onboarding** (`POST /v1/users/onboard`)

```go
func (h *UserHandler) OnboardUser(c *gin.Context) {
    // 1. Your existing logic - Create/update user in NeonDB
    profile, err := h.userService.OnboardUserFromJWTClaims(ctx, claims)
    if err != nil {
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }
    
    // 2. NEW: Sync to Supabase (async, non-blocking)
    go func() {
        if err := h.supabaseSync.SyncUser(context.Background(), supabasesync.UserData{
            ID:       profile.ID,
            Email:    profile.Email,
            Username: profile.Username,
        }); err != nil {
            h.logger.Errorf("Failed to sync user to Supabase: %v", err)
            // Note: Don't fail the request - this is just for realtime permissions
        }
    }()
    
    // 3. Your existing response
    c.JSON(200, profile)
}
```

### **Trip Creation** (`POST /v1/trips`)

```go
func (h *TripHandler) CreateTripHandler(c *gin.Context) {
    // 1. Your existing logic - Create trip in NeonDB
    createdTrip, err := h.tripModel.CreateTrip(ctx, &trip)
    if err != nil {
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }
    
    // 2. NEW: Sync trip to Supabase
    go func() {
        if err := h.supabaseSync.SyncTrip(context.Background(), supabasesync.TripData{
            ID:        createdTrip.ID,
            Name:      createdTrip.Name,
            CreatedBy: createdTrip.CreatedBy,
        }); err != nil {
            h.logger.Errorf("Failed to sync trip to Supabase: %v", err)
        }
    }()
    
    // 3. NEW: Sync creator membership
    go func() {
        if err := h.supabaseSync.SyncMembership(context.Background(), supabasesync.MembershipData{
            TripID: createdTrip.ID,
            UserID: createdTrip.CreatedBy,
            Role:   "OWNER",
            Status: "ACTIVE",
        }); err != nil {
            h.logger.Errorf("Failed to sync creator membership to Supabase: %v", err)
        }
    }()
    
    // 4. Your existing response
    c.JSON(201, createdTrip)
}
```

### **Add Trip Member** (`POST /v1/trips/{id}/members`)

```go
func (h *MemberHandler) AddMemberHandler(c *gin.Context) {
    // 1. Your existing logic - Add member in NeonDB
    membership, err := h.tripModel.AddMember(ctx, &member)
    if err != nil {
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }
    
    // 2. NEW: Sync membership to Supabase
    go func() {
        if err := h.supabaseSync.SyncMembership(context.Background(), supabasesync.MembershipData{
            TripID: membership.TripID,
            UserID: membership.UserID,
            Role:   membership.Role,
            Status: membership.Status,
        }); err != nil {
            h.logger.Errorf("Failed to sync membership to Supabase: %v", err)
        }
    }()
    
    // 3. Your existing response
    c.JSON(201, membership)
}
```

### **Update Member Role** (`PUT /v1/trips/{id}/members/{memberId}/role`)

```go
func (h *MemberHandler) UpdateMemberRoleHandler(c *gin.Context) {
    // 1. Your existing logic - Update role in NeonDB
    updatedMembership, err := h.tripModel.UpdateMemberRole(ctx, memberID, newRole)
    if err != nil {
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }
    
    // 2. NEW: Sync updated membership to Supabase
    go func() {
        if err := h.supabaseSync.SyncMembership(context.Background(), supabasesync.MembershipData{
            TripID: updatedMembership.TripID,
            UserID: updatedMembership.UserID,
            Role:   updatedMembership.Role,
            Status: updatedMembership.Status,
        }); err != nil {
            h.logger.Errorf("Failed to sync updated membership to Supabase: %v", err)
        }
    }()
    
    // 3. Your existing response
    c.JSON(200, updatedMembership)
}
```

### **Remove Member** (`DELETE /v1/trips/{id}/members/{memberId}`)

```go
func (h *MemberHandler) RemoveMemberHandler(c *gin.Context) {
    // 1. Your existing logic - Remove member from NeonDB
    err := h.tripModel.RemoveMember(ctx, tripID, memberID)
    if err != nil {
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }
    
    // 2. NEW: Remove membership from Supabase
    go func() {
        if err := h.supabaseSync.DeleteMembership(context.Background(), tripID, memberID); err != nil {
            h.logger.Errorf("Failed to delete membership from Supabase: %v", err)
        }
    }()
    
    // 3. Your existing response
    c.JSON(204, nil)
}
```

### **Delete Trip** (if you have this endpoint)

```go
func (h *TripHandler) DeleteTripHandler(c *gin.Context) {
    // 1. Your existing logic - Delete trip from NeonDB
    err := h.tripModel.DeleteTrip(ctx, tripID)
    if err != nil {
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }
    
    // 2. NEW: Delete trip from Supabase (also removes memberships)
    go func() {
        if err := h.supabaseSync.DeleteTrip(context.Background(), tripID); err != nil {
            h.logger.Errorf("Failed to delete trip from Supabase: %v", err)
        }
    }()
    
    // 3. Your existing response
    c.JSON(204, nil)
}
```

## 🔧 **4. Dependency Injection**

If you're using dependency injection, add the sync client to your handler constructors:

```go
// Update your handler constructors
func NewUserHandler(userService *UserService, supabaseSync *supabasesync.Client, logger *zap.SugaredLogger) *UserHandler {
    return &UserHandler{
        userService:  userService,
        supabaseSync: supabaseSync,
        logger:       logger,
    }
}

func NewTripHandler(tripModel *TripModel, supabaseSync *supabasesync.Client, logger *zap.SugaredLogger) *TripHandler {
    return &TripHandler{
        tripModel:    tripModel,
        supabaseSync: supabaseSync,
        logger:       logger,
    }
}
```

## 🧪 **5. Testing the Integration**

### **Test User Sync**

```bash
# 1. Create a user via your API
curl -X POST https://api.nomadcrew.uk/v1/users/onboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "username": "testuser"}'

# 2. Check if user appears in Supabase (we can verify this)
```

### **Test Trip Creation**

```bash
# 1. Create a trip via your API
curl -X POST https://api.nomadcrew.uk/v1/trips \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Trip", "description": "Testing sync"}'

# 2. Check if trip and membership appear in Supabase
```

## 📊 **6. Monitoring & Logging**

The sync utility will log all operations. You'll see logs like:

```
INFO  Syncing user to Supabase: 123e4567-e89b-12d3-a456-426614174000
INFO  Syncing trip to Supabase: 456e7890-e89b-12d3-a456-426614174001
INFO  Syncing membership to Supabase: trip=456e7890-e89b-12d3-a456-426614174001, user=123e4567-e89b-12d3-a456-426614174000
WARN  Sync attempt 2 failed: rate limited
INFO  Sync succeeded after 1 retries
ERROR Failed to sync user to Supabase: unauthorized: invalid service key
```

## 🚨 **7. Error Handling**

The sync utility handles errors gracefully:

- **Network issues**: Automatic retry with exponential backoff
- **Rate limiting**: Automatic retry
- **Invalid service key**: Logs error, doesn't retry
- **Supabase downtime**: Retries up to 5 times

**Important**: Sync failures won't affect your main API responses. The sync happens asynchronously.

## 🔒 **8. Security Notes**

- ✅ **Service Key**: Already configured in your environment
- ✅ **HTTPS**: All requests use secure transport
- ✅ **Minimal Data**: Only syncs essential permission data
- ✅ **No Sensitive Data**: Passwords, tokens, etc. are never synced

## 🎯 **9. Expected Results**

After integration, when users access realtime features:

**Before Integration:**
```
User tries to access trip → Supabase checks permissions → EMPTY → 403 Forbidden
```

**After Integration:**
```
User tries to access trip → Supabase checks permissions → FOUND → ✅ Access Granted
```

## 📞 **10. Support & Next Steps**

1. **Integration**: Add the sync calls to your endpoints (should take ~30 minutes)
2. **Testing**: Test with a few API calls to verify sync works
3. **Verification**: We'll verify on the frontend that realtime features work
4. **Production**: Deploy and monitor

## 🚀 **Ready to Go!**

The sync utility is production-ready with:
- ✅ Automatic retries and error handling
- ✅ Async operations (non-blocking)
- ✅ Comprehensive logging
- ✅ Minimal performance impact
- ✅ Drop-in integration with your existing code

**Estimated Integration Time**: 30-60 minutes

**Questions?** The frontend team is ready to help with any integration issues or testing! 