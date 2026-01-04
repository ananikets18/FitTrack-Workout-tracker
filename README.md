# FitTrack - Workout Tracker

A modern, production-ready workout tracking application built with React, featuring offline support, data import/export, and comprehensive fitness metrics.

## 🚀 Features

- **Workout Logging** - Log exercises with sets, reps, and weight
- **Exercise Autocomplete** - 150+ pre-loaded exercises with smart search
- **Data Import/Export** - Backup and restore via JSON or Excel
- **Progressive Overload** - Track strength improvements over time
- **Rest Timer** - Smart timer with quick presets (30s, 60s, 90s, 2m, 3m)
- **Offline Support** - PWA with service worker caching
- **Data Validation** - Input sanitization and XSS protection
- **Error Handling** - Comprehensive error boundaries and logging
- **Accessibility** - ARIA labels and keyboard navigation
- **Loading States** - Smooth UX with skeleton screens
- **Unsaved Changes Warning** - Prevent accidental data loss
- **Professional Metrics** - Volume in tons, streaks, PRs

## 📋 Prerequisites

- Node.js 18+ and npm
- Modern browser with localStorage support

## 🛠️ Installation

```bash
# Clone repository
git clone <your-repo-url>
cd Workout-tracker

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🏗️ Production Deployment

### Step 1: Generate PWA Icons

```bash
# Open the icon generator in your browser
# Method 1: Use the browser-based generator
open public/generate-icons.html

# Method 2: Create icons manually (see public/ICONS-README.md)
```

Download the generated icons and place them as:
- `public/icon-192.png`
- `public/icon-512.png`

### Step 2: Configure Environment

Create `.env.production`:
```env
VITE_APP_NAME=FitTrack
VITE_APP_VERSION=1.0.0
VITE_ENABLE_PWA=true
VITE_ENABLE_ANALYTICS=true
# VITE_GA_ID=G-XXXXXXXXXX  # Add your Google Analytics ID
```

### Step 3: Build

```bash
npm run build
```

This creates an optimized production build in `dist/` with:
- ✅ Minified code
- ✅ Code splitting
- ✅ Tree shaking
- ✅ Asset optimization
- ✅ Console logs removed

### Step 4: Deploy

#### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Or connect your Git repository at [vercel.com](https://vercel.com):
- Build command: `npm run build`
- Output directory: `dist`
- Node version: 18+

#### Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

Or drag & drop `dist` folder to [netlify.com](https://netlify.com)

#### Other Platforms
- **GitHub Pages**: Use `gh-pages` package
- **Firebase Hosting**: Use `firebase deploy`
- **Custom Server**: Serve `dist` with nginx/apache

### Step 5: Post-Deployment Checklist

- [ ] Test PWA installation
- [ ] Verify service worker caching
- [ ] Check HTTPS is enabled
- [ ] Test on mobile devices
- [ ] Validate with [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [ ] Check security headers at [SecurityHeaders.com](https://securityheaders.com)
- [ ] Test offline functionality
- [ ] Verify analytics tracking (if enabled)

## 🔒 Security Features

- ✅ Input validation and sanitization
- ✅ XSS protection
- ✅ Content Security Policy (CSP)
- ✅ Security headers configured
- ✅ HTTPS enforcement
- ✅ No sensitive data exposure

See `SECURITY-HEADERS.md` for configuration details.

## ♿ Accessibility

- ✅ ARIA labels on all interactive elements
- ✅ Keyboard navigation support
- ✅ Focus management in modals
- ✅ Screen reader compatible
- ✅ Semantic HTML
- ✅ Color contrast compliance

## 📱 PWA Features

- ✅ Installable on mobile and desktop
- ✅ Works offline after first load
- ✅ App-like experience
- ✅ Fast loading with caching
- ✅ Background updates
- ✅ Push notifications ready (future)

To install:
1. Open app in Chrome/Edge/Safari
2. Click install icon in address bar
3. Add to home screen

## 🧪 Testing

```bash
# Run linter
npm run lint

# Type checking (if TypeScript added)
npm run type-check

# Build and preview
npm run build && npm run preview
```

## 📊 Tech Stack

- **Frontend**: React 19, React Router 7
- **Styling**: Tailwind CSS 3
- **Animations**: Framer Motion 12
- **State**: Context API + useReducer
- **Storage**: localStorage with versioning
- **Build**: Vite 7
- **Icons**: Lucide React
- **Data Export**: xlsx

## 🗂️ Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── common/      # Buttons, Inputs, Cards, Modals
│   ├── layout/      # Header, Navigation, Layout
│   └── workout/     # Workout-specific components
├── context/         # React Context (state management)
├── pages/           # Route pages
├── utils/           # Utilities & helpers
│   ├── validation.js    # Input validation & sanitization
│   ├── errorHandler.js  # Global error handling
│   ├── storage.js       # localStorage wrapper
│   ├── migration.js     # Data versioning
│   └── polyfills.js     # Browser compatibility
├── data/            # Static data (exercises)
└── config/          # App configuration
```

## 🐛 Troubleshooting

### PWA Not Installing
- Ensure HTTPS is enabled
- Check icons exist: `/icon-192.png` and `/icon-512.png`
- Verify manifest.json is accessible
- Check browser console for errors

### Service Worker Issues
- Clear browser cache
- Unregister old service workers in DevTools
- Rebuild with `npm run build`
- Check service worker scope

### Data Not Persisting
- Check localStorage is enabled in browser
- Verify quota not exceeded
- Check browser privacy settings
- Try incognito mode to test

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf dist .vite
npm run build
```

### Performance Issues
- Enable production mode
- Check network throttling in DevTools
- Verify code splitting is working
- Use Lighthouse for performance audit

## 📈 Performance Metrics

Target metrics (Lighthouse):
- Performance: 90+
- Accessibility: 100
- Best Practices: 100
- SEO: 100
- PWA: ✓

## 🔄 Version History

- **1.0.0** - Production release with security fixes
  - Input validation & sanitization
  - Error handling & logging
  - Accessibility improvements
  - Code splitting & optimization
  - SEO enhancements

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 👨‍💻 Author

Built with ❤️ for fitness enthusiasts

## 🙏 Acknowledgments

- Exercise database curated from common fitness resources
- Icons by Lucide
- UI inspiration from modern fitness apps

---

**Need Help?** Open an issue or check the troubleshooting section above.
