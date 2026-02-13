# Changelog

All notable changes and enhancements to the FitTrack Workout Tracker.

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
