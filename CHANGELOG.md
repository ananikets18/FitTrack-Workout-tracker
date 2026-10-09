# Changelog

All notable changes and enhancements to the FitTrack Workout Tracker.

## [1.2.0] - 2026-10-09

### Changed
- **Exercise Library Audit**: Pruned the full library from 386 to 187 entries across all 9 muscle groups, removing zero-log variants and merging singular/plural + casing duplicates
  - Chest 37 → 10, Back 58 → 16, Shoulders 34 → 10, Legs 53 → 29, Arms 50 → 25, Core 52 → 29, Forearms 62 → 29, Cardio 25 (kept), Other 15 → 14
  - Renames (code + Supabase migrations, history preserved): `Barbell Bench Press` → `Flat Bench Press` (keeps 20 kg barbell math), `Low/High Cable Crossover` → `Low/High Cable Fly`, `Lat Pulldown` → `Wide-Grip Lat Pulldown`, `Wide-Grip Lat Pulldown` → `Medium-Grip Lat Pulldown`, `RDL` → `Romanian Deadlift`, `Seated Row` → `Seated Cable Row`, `Pronation/Supination Curl` → `Forearm Pronation/Supination`, `Fat Bar Curl` → `Fat-Bar Curl`, `Step-up` → `Step-Up`
  - Deduplicated across categories: `Face Pulls` canonical in shoulders, `Box Jumps`/`Battle Ropes` canonical in cardio, `Hammer Curl` resolved via arms map
  - Templates updated: `Chest & Tricep`, `Back & Biceps`, `Shoulders & Forearms`, `Legs & Abs`
- **Muscle Mapping**: Added explicit distributions for `Flat Bench Press`, `Low/High Cable Fly`, `Decline Dumbbell Press`, `Seated Cable Row`, `Hanging Knee Raise`, `Pallof Press`, `Nordic/Lying/Seated Leg Curl`, and full forearms section; fixed `Hanging Knee Raise` (was shoulders) and `Pallof Press` (was chest) misattribution
- **Version Alignment**: `package.json` bumped 1.0.0 → 1.2.0 to match released changelog lineage

## [1.1.0] - 2026-02-13

### Added
- **Logger Utility**: Production-ready logging system with context support and environment-based filtering
- **Performance Monitoring**: Web Vitals tracking (LCP, FID, CLS) and custom performance metrics
- **Accessibility Utilities**: Comprehensive a11y helpers including focus trap, screen reader announcements, and ARIA patterns
- **Environment Template**: `.env.example` file for easier project setup
- **robots.txt**: SEO configuration file

### Enhanced
- **ESLint Configuration**: Fixed incorrect imports and added no-console rule with warnings
- **Security Headers**: Enhanced Netlify headers with Cross-Origin policies and improved CSP
- **Service Worker**: 
  - Added cache size limits to prevent storage bloat
  - Implemented separate image caching strategy
  - Added cache clearing message handler
  - Improved error logging for cache operations
- **Package.json**: Added metadata, keywords, and useful scripts (lint:fix, typecheck, analyze)
- **CSS Accessibility**: 
  - Added screen-reader-only utility classes
  - Enhanced focus-visible styles for keyboard navigation
  - Added prefers-reduced-motion support
  - Created skip-link utility for accessibility
- **Netlify Caching**: Added separate cache rules for images, fonts, and manifest

### Fixed
- Removed `console.log` statements from production code (mlInferenceService.js)
- Fixed ESLint flat config import error

### Performance
- Bundle splitting optimized in vite.config.js
- Cache-first strategy for images reduces network requests
- Performance metrics automatically tracked in development mode

### Security
- Enhanced Content Security Policy with worker-src directive
- Added Cross-Origin-Embedder-Policy for better isolation
- Improved cache control headers for static assets

## [1.0.0] - Previous

### Initial Release
- Workout tracking with 150+ exercises
- Offline-first PWA functionality
- Progressive overload tracking
- AI/ML integration for predictions
- Supabase backend integration
- Responsive design for mobile and desktop
