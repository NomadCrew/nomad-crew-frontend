# NomadCrew Trip Wallet

## What This Is

A trip wallet feature for NomadCrew that provides personal and group document/booking storage within the existing trip infrastructure. Personal wallet stores travel documents and individual bookings. Group wallet enables shared visibility of arrival/departure times, shared documents, and receipt storage — eliminating the chaos of hunting through emails, chats, and spreadsheets.

## Core Value

**One place for everything** — stop hunting through emails and group chats for that hotel confirmation, flight time, or receipt.

## Requirements

### Validated

<!-- Existing capabilities from the NomadCrew codebase -->

- ✓ Trip management with group membership — existing
- ✓ Real-time updates via Supabase channels — existing
- ✓ Authentication (Google/Apple OAuth) — existing
- ✓ Group chat per trip — existing
- ✓ Location tracking and sharing — existing
- ✓ Todo management per trip — existing
- ✓ Push notifications — existing
- ✓ Feature-based architecture with Zustand stores — existing

### Active

<!-- Trip Wallet feature scope -->

**Personal Wallet:**
- [ ] Store travel documents (passport, visa, travel insurance, vaccination records)
- [ ] Store loyalty/membership cards
- [ ] Store personal bookings (flights, hotels, reservations)
- [ ] Offline access to all personal documents

**Group Wallet:**
- [ ] Arrival/departure visibility — see when everyone lands/departs at a glance
- [ ] Shared documents — hotel confirmations, activity bookings anyone can reference
- [ ] Receipt storage — group purchases (Airbnb, activities, dinners) in one place
- [ ] Offline access to group documents

**Infrastructure:**
- [ ] Document upload (PDF, images)
- [ ] Document categorization and organization
- [ ] Privacy controls — strict separation between personal and group items
- [ ] Per-trip wallet instances (each trip has its own group wallet)

### Out of Scope

- Expense splitting/debt calculations — just store receipts, no "who owes what" math (use Splitwise for that)
- Payment processing — no in-app payments or settlements
- OCR/auto-extraction from documents — manual entry for v1
- Integration with booking platforms (Booking.com, Airbnb API) — manual upload only
- Calendar sync — documents only, not calendar integration

## Context

**Market Gap Identified:**
Research validated this pain point. Existing solutions have clear gaps:
- TripIt hides confirmation numbers from shared views, dated UX
- Splitwise handles expenses but no documents
- Wanderlog has collaborative itineraries but no document storage
- No app combines personal + group documents with trip context

**Technical Foundation:**
NomadCrew already has trip infrastructure with group membership, real-time Supabase channels, and offline-capable architecture. Trip Wallet extends this naturally.

**User Research Signals:**
- Nielsen: travelers spend 53 days across 28 websites to plan trips
- 63% cite manual document/expense management as top pain point
- "Designated planner" bears disproportionate coordination burden

## Constraints

- **Offline-first**: Documents must be accessible without internet — critical for airports, international travel, poor connectivity areas
- **Privacy-critical**: Personal wallet items must NEVER leak to group view — strict data separation at storage and API level
- **Existing stack**: Must work within React Native/Expo/Supabase architecture — no new backend infrastructure
- **Mobile-first**: Primary use case is on-the-go access — optimize for mobile UX

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Personal + Group wallet separation | Privacy is non-negotiable; users won't store sensitive docs if they might leak | — Pending |
| No expense splitting in v1 | Splitwise exists; focus on document organization first | — Pending |
| Manual upload only | Auto-import adds complexity; validate core value first | — Pending |
| Per-trip group wallets | Aligns with existing trip model; cleaner data organization | — Pending |

---
*Last updated: 2026-01-10 after initialization*
