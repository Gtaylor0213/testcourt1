# CourtTime - Future TODO List

This document tracks features and improvements that need to be completed in future development cycles.

---

## High Priority

### 1. Run Booking Rules Engine Database Migration
**Status:** Pending
**Issue:** The rules engine code is complete but the database tables don't exist yet.

**Required Action:**
Run the SQL migration file against your PostgreSQL database:
```
CourtTime Player View/src/database/migrations/007_booking_rules_engine.sql
```

**Tables Created:**
- `membership_tiers` - Tier system with booking privileges
- `user_tiers` - Assigns users to tiers
- `account_strikes` - Strike tracking for no-shows/late cancellations
- `household_groups` - Address-based grouping for household rules
- `household_members` - User-to-household links
- `court_operating_config` - Per-court schedules and settings
- `court_blackouts` - Maintenance/event blocks
- `booking_rule_definitions` - Master rule catalog (26 rules pre-seeded)
- `facility_rule_configs` - Configured rules per facility
- `booking_cancellations` - Cancellation tracking
- `booking_rate_limits` - Rate limiting for API actions

**Temporary Workaround:** The rules engine gracefully skips validation when tables are missing, allowing bookings to proceed without rule enforcement.

---

## Medium Priority

### 2. Update Frontend Components with Rule Violation Display
**Status:** Pending
**Description:** Show rule violation messages in BookingWizard and QuickReservePopup when bookings fail due to rules.

**Files to update:**
- `src/components/BookingWizard.tsx`
- `src/components/QuickReservePopup.tsx`

**Features to add:**
- Display blocked booking reasons with rule codes
- Show warnings for non-blocking rule violations
- Indicate prime-time slots visually
- Show tier-based booking limits

### 3. Admin Rules Configuration UI
**Status:** Not Started
**Description:** Build admin interface to enable/configure rules per facility.

**Components needed:**
- `RulesConfiguration.tsx` - Enable/configure rules per facility
- `TierManagement.tsx` - Create/edit tiers, assign users
- `StrikeManagement.tsx` - View/revoke strikes
- `CourtScheduleConfig.tsx` - Set operating hours, prime time windows
- `BlackoutManager.tsx` - Create/edit blackout periods

### 4. User Profile - Strike History
**Status:** Not Started
**Description:** Show users their strike history and current account status.

---

## Low Priority

### 5. Household Management UI
**Status:** Not Started
**Description:** Allow facility admins to manage household groupings.

### 6. Rate Limiting Enhancement
**Status:** Not Started
**Description:** Implement Redis-based rate limiting for better performance at scale.

### 7. Email Notifications for Rule Events
**Status:** Not Started
**Description:** Send email notifications when strikes are issued, bookings are blocked, etc.

---

## Completed Items

- [x] Create database migration file (007_booking_rules_engine.sql)
- [x] Create rules engine types (src/services/rulesEngine/types.ts)
- [x] Create RuleContext builder for fetching booking context
- [x] Create RulesEngine core class
- [x] Implement Court Rule evaluators (CRT-001 to CRT-012)
- [x] Implement Account Rule evaluators (ACC-001 to ACC-011)
- [x] Implement Household Rule evaluators (HH-001 to HH-003)
- [x] Integrate rules engine into bookingService.ts
- [x] Add new API routes (tiers, strikes, court config, rules, households)
- [x] Make rules engine graceful when tables don't exist (temporary fix)
- [x] Fix notification service priority column error
- [x] Make court calendar header sticky with only calendar scrolling
- [x] Change zoom control to +/- buttons
- [x] Update Quick Reserve button to green with black text

---

## Notes

### Running the Migration

**Option A: Using psql (command line)**
```bash
psql -h your-host -d your-database -U your-user -f src/database/migrations/007_booking_rules_engine.sql
```

**Option B: Using a database GUI**
Copy the contents of `007_booking_rules_engine.sql` and run it in your database tool (pgAdmin, DBeaver, Supabase SQL editor, etc.)

**Option C: Via Render Dashboard**
If deployed on Render, use the database shell in the Render dashboard.

### Rule Codes Reference

**Account Rules (ACC-001 to ACC-011):**
- ACC-001: Max Active Reservations
- ACC-002: Max Reservations Per Week
- ACC-003: Max Hours Per Week
- ACC-004: No Overlapping Reservations
- ACC-005: Advance Booking Window
- ACC-006: Minimum Lead Time
- ACC-007: Cancellation Cooldown
- ACC-008: Late Cancellation Policy
- ACC-009: No-Show Strike System
- ACC-010: Prime-Time Per Week Limit
- ACC-011: Rate Limit Actions

**Court Rules (CRT-001 to CRT-012):**
- CRT-001: Prime-Time Schedule
- CRT-002: Prime-Time Max Duration
- CRT-003: Prime-Time Eligibility
- CRT-004: Court Operating Hours
- CRT-005: Reservation Slot Grid
- CRT-006: Blackout Blocks
- CRT-007: Buffer Time
- CRT-008: Allowed Activities
- CRT-009: Sub-Amenity Inventory
- CRT-010: Court-Specific Weekly Cap
- CRT-011: Court Release Time
- CRT-012: Court Cancellation Deadline

**Household Rules (HH-001 to HH-003):**
- HH-001: Max Members Per Address
- HH-002: Household Max Active Reservations
- HH-003: Household Prime-Time Cap
