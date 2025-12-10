# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **Ticket and Package Counters** across Operator Panel and Operational Report
  - My Roster (Operator View): Added three counters showing Total Guests, Tickets, and Packages for assigned rides
  - My Roster (Manager View): Added three counters showing aggregated Total Guests, Tickets, and Packages across all operators
  - Operational Report: Added Tickets and Packages breakdown to Monthly and Date Range totals
  - All counters use existing `dailyRideDetails` data structure for backward compatibility

### Fixed
- Fixed pre-existing unterminated string literal in `constants.ts` (LOGO_BASE64)
- Fixed typo in variable naming (safegaurd → safeguard) in Reports component
- Improved responsive grid layout in Operational Report (changed from lg:grid-cols-3 to md:grid-cols-2)
- Extracted magic number (366) to named constant `MAX_DATE_RANGE_DAYS` for better maintainability

### Changed
- Updated `.gitignore` to exclude `package-lock.json`
- Enhanced README with documentation for new ticket and package counter features

### Technical Details
- No breaking changes
- No database migrations required
- No new environment variables needed
- All builds successful with no security vulnerabilities (CodeQL scan passed)
- Ready for deployment to all environments including Vercel

## Notes
- G&R (Guest & Ride) counter view remains unchanged, continuing to show "Total Guests Today"
- Counting logic maintains consistency: Total = Tickets + Packages
- UI styling matches existing design system with purple theme for tickets and pink theme for packages
