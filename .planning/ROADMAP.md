# Roadmap: NomadCrew Trip Wallet

## Overview

Build a trip wallet feature that gives users "one place for everything" — personal travel documents and bookings in a private wallet, plus group-shared documents, receipts, and arrival/departure visibility per trip. The journey starts with foundational data models and storage, builds personal wallet capabilities, extends to group wallet features, adds the arrival timeline view, and culminates with offline-first reliability and privacy hardening.

## Domain Expertise

None — using existing React Native/Expo/Supabase patterns from the codebase.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Database schema, storage bucket, core data models
- [ ] **Phase 2: Document Upload System** - File upload mechanism, storage service, document CRUD
- [ ] **Phase 3: Personal Wallet - Travel Docs** - Passport, visa, insurance, vaccination records
- [ ] **Phase 4: Personal Wallet - Bookings & Cards** - Flights, hotels, reservations, loyalty cards
- [ ] **Phase 5: Group Wallet Core** - Trip-associated wallet, permissions, base structure
- [ ] **Phase 6: Group Wallet - Shared Documents** - Hotel confirmations, activity bookings
- [ ] **Phase 7: Group Wallet - Receipts** - Receipt upload, categorization, display
- [ ] **Phase 8: Arrival/Departure Timeline** - Visual timeline of everyone's travel times
- [ ] **Phase 9: Offline Sync System** - Local caching, background sync, conflict resolution
- [ ] **Phase 10: Privacy & Polish** - Strict separation enforcement, final UX, testing

## Phase Details

### Phase 1: Foundation
**Goal**: Establish database schema, Supabase Storage bucket, and core TypeScript data models for wallet documents
**Depends on**: Nothing (first phase)
**Research**: Unlikely (Supabase already in stack, extending existing patterns)
**Plans**: TBD

Plans:
- [ ] 01-01: Database schema and migrations
- [ ] 01-02: Supabase Storage bucket setup
- [ ] 01-03: Core TypeScript types and Zustand store skeleton

### Phase 2: Document Upload System
**Goal**: Generic document upload mechanism supporting PDF and images with storage service integration
**Depends on**: Phase 1
**Research**: Likely (Supabase Storage API, expo-image-picker, file handling patterns)
**Research topics**: Supabase Storage upload API, expo-document-picker vs expo-image-picker, file size limits, thumbnail generation
**Plans**: TBD

Plans:
- [ ] 02-01: Document picker integration (PDF, images)
- [ ] 02-02: Supabase Storage upload service
- [ ] 02-03: Document list/detail components

### Phase 3: Personal Wallet - Travel Docs
**Goal**: Personal travel document storage — passport, visa, travel insurance, vaccination records
**Depends on**: Phase 2
**Research**: Unlikely (building on Phase 2 infrastructure)
**Plans**: TBD

Plans:
- [ ] 03-01: Travel document types and forms
- [ ] 03-02: Personal wallet screen and navigation
- [ ] 03-03: Document viewer with secure display

### Phase 4: Personal Wallet - Bookings & Cards
**Goal**: Store personal flight bookings, hotel reservations, and loyalty/membership cards
**Depends on**: Phase 3
**Research**: Unlikely (extending Phase 3 patterns)
**Plans**: TBD

Plans:
- [ ] 04-01: Booking document types (flight, hotel, reservation)
- [ ] 04-02: Loyalty card storage
- [ ] 04-03: Personal wallet organization and filtering

### Phase 5: Group Wallet Core
**Goal**: Trip-associated group wallet with proper permissions and relationship to existing trip model
**Depends on**: Phase 4
**Research**: Likely (permission model design, RLS policies for group access)
**Research topics**: Supabase RLS for group-scoped data, trip membership integration patterns
**Plans**: TBD

Plans:
- [ ] 05-01: Group wallet database schema and RLS
- [ ] 05-02: Group wallet Zustand store
- [ ] 05-03: Group wallet base UI and navigation

### Phase 6: Group Wallet - Shared Documents
**Goal**: Share hotel confirmations and activity bookings so anyone in the trip can reference them
**Depends on**: Phase 5
**Research**: Unlikely (reusing document patterns from personal wallet)
**Plans**: TBD

Plans:
- [ ] 06-01: Shared document upload and display
- [ ] 06-02: Document sharing from personal to group
- [ ] 06-03: Real-time updates for group documents

### Phase 7: Group Wallet - Receipts
**Goal**: Receipt storage for group purchases — Airbnb, activities, dinners — with categorization
**Depends on**: Phase 6
**Research**: Unlikely (similar to shared documents)
**Plans**: TBD

Plans:
- [ ] 07-01: Receipt document type and categories
- [ ] 07-02: Receipt capture UI (camera, gallery)
- [ ] 07-03: Receipt list with filtering and totals

### Phase 8: Arrival/Departure Timeline
**Goal**: Visual timeline showing when everyone arrives and departs — the coordination killer feature
**Depends on**: Phase 4 (needs booking data)
**Research**: Likely (timeline visualization, date/time handling across timezones)
**Research topics**: React Native timeline components, timezone handling with date-fns-tz, FlashList for timeline rendering
**Plans**: TBD

Plans:
- [ ] 08-01: Arrival/departure data model and extraction
- [ ] 08-02: Timeline visualization component
- [ ] 08-03: Group timeline aggregation view

### Phase 9: Offline Sync System
**Goal**: Documents accessible without internet — critical for airports and international travel
**Depends on**: Phases 1-8 (needs complete feature set to sync)
**Research**: Likely (offline-first patterns in React Native, background sync)
**Research topics**: expo-file-system for local storage, WatermelonDB vs custom sync, background fetch patterns
**Plans**: TBD

Plans:
- [ ] 09-01: Local document caching strategy
- [ ] 09-02: Background sync implementation
- [ ] 09-03: Conflict resolution and offline indicators

### Phase 10: Privacy & Polish
**Goal**: Ensure strict personal/group separation, final UX polish, comprehensive testing
**Depends on**: Phase 9
**Research**: Unlikely (verification and refinement work)
**Plans**: TBD

Plans:
- [ ] 10-01: Privacy audit and enforcement
- [ ] 10-02: UX polish and edge cases
- [ ] 10-03: Integration testing and documentation

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/3 | Not started | - |
| 2. Document Upload System | 0/3 | Not started | - |
| 3. Personal Wallet - Travel Docs | 0/3 | Not started | - |
| 4. Personal Wallet - Bookings & Cards | 0/3 | Not started | - |
| 5. Group Wallet Core | 0/3 | Not started | - |
| 6. Group Wallet - Shared Documents | 0/3 | Not started | - |
| 7. Group Wallet - Receipts | 0/3 | Not started | - |
| 8. Arrival/Departure Timeline | 0/3 | Not started | - |
| 9. Offline Sync System | 0/3 | Not started | - |
| 10. Privacy & Polish | 0/3 | Not started | - |
