# Visual Guide: Ticket and Package Counters

This document describes the UI changes made by this implementation.

## 1. My Roster - Operator View

### Before:
```
┌──────────────────────────────────────────────────────┐
│ My Roster for 12/10/2024                            │
│ ✓ Checked In: 9:00 AM (Briefing)                    │
│                                                       │
│ [Ride Cards with counters...]                        │
└──────────────────────────────────────────────────────┘
```

### After:
```
┌──────────────────────────────────────────────────────┐
│ My Roster for 12/10/2024                            │
│ ✓ Checked In: 9:00 AM (Briefing)                    │
│                                                       │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐       │
│ │ Total      │ │ Tickets    │ │ Packages   │       │
│ │ Guests     │ │            │ │            │       │
│ │    150     │ │     120    │ │     30     │       │
│ └────────────┘ └────────────┘ └────────────┘       │
│   (gray bg)     (purple bg)    (pink bg)            │
│                                                       │
│ [Ride Cards with split counters...]                  │
└──────────────────────────────────────────────────────┘
```

**Changes:**
- Three counters displayed horizontally with flex wrap
- Total Guests (gray background)
- Tickets (purple background with border)
- Packages (pink background with border)
- Numbers formatted with locale string (e.g., 1,234)

---

## 2. My Roster - Manager View

### Before:
```
┌──────────────────────────────────────────────────────┐
│ Daily Roster for 12/10/2024                         │
│                                                       │
│ Present: 25    Absent: 5                             │
│                                                       │
│ [Operator Cards...]                                   │
└──────────────────────────────────────────────────────┘
```

### After:
```
┌──────────────────────────────────────────────────────┐
│ Daily Roster for 12/10/2024                         │
│                                                       │
│ Present: 25    Absent: 5                             │
│                                                       │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐       │
│ │ Total      │ │ Tickets    │ │ Packages   │       │
│ │ Guests     │ │            │ │            │       │
│ │    450     │ │     350    │ │    100     │       │
│ └────────────┘ └────────────┘ └────────────┘       │
│   (gray bg)     (purple bg)    (pink bg)            │
│                                                       │
│ [Operator Cards...]                                   │
└──────────────────────────────────────────────────────┘
```

**Changes:**
- Three counters below Present/Absent counts
- Aggregates across ALL operators' assigned rides
- Same styling as operator view

---

## 3. Operational Report

### Before:
```
┌──────────────────────────────────────────────────────┐
│ Operational Report                                   │
│                                                       │
│ [Calendar View]                                       │
│                                                       │
│ ┌─────────────────────┐ ┌─────────────────────┐    │
│ │ Selected Range      │ │ Month Total         │    │
│ │     1,250           │ │     12,450          │    │
│ └─────────────────────┘ └─────────────────────┘    │
│                                                       │
│ [Ride Breakdown Table]                                │
└──────────────────────────────────────────────────────┘
```

### After:
```
┌──────────────────────────────────────────────────────┐
│ Operational Report                                   │
│                                                       │
│ [Calendar View]                                       │
│                                                       │
│ ┌─────────────────────┐ ┌─────────────────────┐    │
│ │ Selected Range      │ │ Month Total         │    │
│ │     1,250           │ │     12,450          │    │
│ │                     │ │                     │    │
│ │ Tickets:  1,000     │ │ Tickets:  10,200   │    │
│ │ Packages:   250     │ │ Packages:  2,250   │    │
│ └─────────────────────┘ └─────────────────────┘    │
│                                                       │
│ [Ride Breakdown Table with Tickets/Packages columns] │
└──────────────────────────────────────────────────────┘
```

**Changes:**
- Both cards now show Tickets and Packages breakdown
- Selected Range Total shows breakdown when date range is selected
- Month Total always shows breakdown
- Tickets displayed in purple
- Packages displayed in pink

---

## 4. G&R Counter View (No Changes)

### Before & After (Same):
```
┌──────────────────────────────────────────────────────┐
│ [Header with filters]                                 │
│                                                       │
│ [Grid of Ride Cards with split counters]             │
│                                                       │
│ ─────────────────────────────────────────────────────│
│                                                       │
│          Total Guests for 12/10/2024                 │
│                   1,234                               │
│                                                       │
│            [Reset Today's Counts]                     │
└──────────────────────────────────────────────────────┘
```

**No Changes:**
- Footer continues to show single total count
- "Total Guests for {date}" label unchanged
- Reset button functionality unchanged

---

## 5. Individual Ride Cards (Already existed)

```
┌──────────────────────┐
│ [Ride Image]         │
│                      │
│ Roller Coaster       │
│                      │
│ ┌──────────────────┐ │
│ │ Total Guests  45 │ │
│ └──────────────────┘ │
│                      │
│ Tickets  Packages    │
│ [-] 30 [+] [-] 15 [+]│
└──────────────────────┘
```

**Note:** The split counter (tickets/packages) on ride cards was already implemented in the previous commit. This implementation uses that existing data structure.

---

## Color Scheme

- **Total Guests**: Gray background (`bg-gray-700/50`)
- **Tickets**: Purple background (`bg-purple-900/30`) with purple border (`border-purple-500/30`)
- **Packages**: Pink background (`bg-pink-900/30`) with pink border (`border-pink-500/30`)
- **Text Colors**: 
  - Total: White (`text-white`)
  - Tickets: Purple (`text-purple-400`)
  - Packages: Pink (`text-pink-400`)

---

## Responsive Behavior

### Desktop (md and above):
- Counters display horizontally in a row
- All three counters visible side by side

### Mobile (sm and below):
- Counters wrap to multiple rows if needed
- Each counter maintains its minimum width
- Flex wrapping ensures readability on small screens

---

## Data Flow

```
Firebase Realtime Database
    ↓
dailyRideDetails[date][rideId] = { tickets: X, packages: Y }
    ↓
ridesWithCounts (computed via useMemo)
    ↓
Components calculate totals:
- DailyRoster: Sum across assigned rides
- Reports: Sum across date ranges
    ↓
Display in UI with proper formatting
```

All counters update in real-time as operators enter data through the G&R interface.
