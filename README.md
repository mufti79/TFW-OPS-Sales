<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1yXx0FlqI6tJ3MDON-_UrxBzJpJO01bHL

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Features

### Ticket and Package Counters

The application now tracks and displays separate counts for tickets and packages:

#### My Roster (Operator View)
- Displays three counters: **Total Guests**, **Tickets**, and **Packages**
- Shows aggregated counts from all rides assigned to the logged-in operator for the selected date
- Helps operators track their daily performance by ticket type

#### My Roster (Manager View)
- Displays three counters: **Total Guests**, **Tickets**, and **Packages** for all operators
- Shows aggregated counts across all operators' assigned rides for the selected date
- Displayed below Present/Absent operator counts for quick overview

#### Operational Report
- Monthly and date range totals now include **Tickets** and **Packages** breakdowns
- Both "Month Total" and "Selected Range Total" cards display ticket/package counts
- Ride breakdown table shows tickets, packages, and total guests per ride

#### G&R (Guest & Ride) Counter
- Continues to display "Total Guests Today" as a single aggregate count
- No changes to existing G&R functionality

### Data Structure

The application uses the existing `dailyRideDetails` data structure:
```typescript
Record<string, Record<string, { tickets: number; packages: number }>>
```
- Keys: date (YYYY-MM-DD) → rideId → { tickets, packages }
- Automatically tracked when operators update ride counts
- Backward compatible with existing data

### Counting Logic

- **Tickets**: Individual ticket sales counted separately
- **Packages**: Package deals counted separately
- **Total Guests**: Sum of tickets + packages (displayed in both counters and reports)

All counters update in real-time as operators enter data through the G&R interface.
