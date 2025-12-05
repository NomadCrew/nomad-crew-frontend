# Backend Team: Supabase Realtime Sync Implementation Request

## 🎯 **Context**

The frontend has implemented **Supabase Realtime** for chat, presence, reactions, and read receipts. However, we're getting **403 permission errors** because Supabase doesn't know about our trips/users/memberships from NeonDB.

**Current Architecture:**
- **NeonDB**: Primary data store (business logic, full data)
- **Supabase**: Auth + Realtime features only

**Problem:** Supabase Realtime tables have Row Level Security (RLS) enabled, but no permission data to validate against.

## 🏗️ **Proposed Solution: Minimal Data Sync**

Sync **only essential permission data** from NeonDB → Supabase (not full data duplication).

### **Tables to Sync (Minimal Data Only)**

```sql
-- Supabase tables (for permission validation only)
users: id, email, username
trips: id, name, created_by  
trip_memberships: trip_id, user_id, role, status
```

## 📋 **What We Need from Backend Team**

### **1. Current API Information**
Please provide:

```bash
# Authentication method
- How does the Go backend authenticate requests?
- JWT tokens? API keys? Session-based?
- Example Authorization header format

# Relevant API endpoints
GET /v1/users/{id}           # User basic info
GET /v1/trips/{id}           # Trip basic info  
GET /v1/trips/{id}/members   # Trip memberships
# Any other relevant endpoints for users/trips/memberships

# Data structure examples
- Sample JSON response for user data
- Sample JSON response for trip data
- Sample JSON response for membership data
```

### **2. Supabase Service Role Key**
We need the **Supabase Service Role Key** for admin operations:
- Go to Supabase Dashboard → Settings → API → Service Role Key
- Share this securely (it's for backend use only)

### **3. Implementation Request**

**Option A: We Provide Sync Utility (Recommended)**
- We create a `supabase-sync` utility package
- You integrate it into existing endpoints
- Minimal code changes on your end

**Option B: You Implement Sync Logic**
- We provide the Supabase schema and sync requirements
- You implement the sync logic in Go
- Full control over implementation

**Which option do you prefer?**

## 🔄 **Sync Strategy**

### **When to Sync to Supabase:**

```go
// User operations
CreateUser() → sync basic user data
UpdateUser() → sync if email/username changed

// Trip operations  
CreateTrip() → sync basic trip data
UpdateTrip() → sync if name/created_by changed
DeleteTrip() → remove from Supabase

// Membership operations
AddTripMember() → sync membership data
UpdateMemberRole() → sync role change
RemoveTripMember() → remove membership
```

### **What NOT to Sync:**
- Full user profiles, preferences, detailed trip data
- Only sync what's needed for permission validation

## 🚀 **Implementation Examples**

### **If We Provide Utility (Option A):**

```go
import "github.com/nomadcrew/supabase-sync"

func CreateTrip(trip *Trip) error {
    // 1. Save to NeonDB (primary)
    if err := db.Create(trip); err != nil {
        return err
    }
    
    // 2. Sync minimal data to Supabase (async)
    go supabaseSync.SyncTrip(supabaseSync.TripData{
        ID:        trip.ID,
        Name:      trip.Name,
        CreatedBy: trip.CreatedBy,
    })
    
    return nil
}
```

### **If You Implement (Option B):**

```go
func syncTripToSupabase(trip *Trip) {
    supabaseClient := createSupabaseClient()
    
    data := map[string]interface{}{
        "id":         trip.ID,
        "name":       trip.Name,
        "created_by": trip.CreatedBy,
        "created_at": trip.CreatedAt,
        "updated_at": time.Now(),
    }
    
    supabaseClient.From("trips").Upsert(data)
}
```

## 🎯 **Expected Outcome**

After implementation:
- ✅ Frontend realtime features work without permission errors
- ✅ NeonDB remains primary data store
- ✅ Supabase handles auth + realtime efficiently
- ✅ Minimal overhead (only essential data synced)

## 📞 **Next Steps**

1. **Backend Team**: Provide API info + Supabase service key
2. **Frontend Team**: Create sync utility (if Option A) or provide detailed specs (if Option B)
3. **Integration**: Add sync calls to relevant endpoints
4. **Testing**: Verify realtime features work with proper permissions

## ❓ **Questions for Backend Team**

1. Which implementation option do you prefer (A or B)?
2. What's your current authentication method?
3. Can you provide the API endpoint structure and sample responses?
4. Any concerns about the sync strategy?
5. Timeline for implementation?

---

**Contact**: Frontend team for any clarifications or technical discussions. 