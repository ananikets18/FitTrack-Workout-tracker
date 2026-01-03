# FitTrack - Workout Tracker

A modern, responsive workout tracking application built with React, featuring offline support, data import/export, and comprehensive fitness metrics.

## 🚀 Features

- **Workout Logging** - Log exercises with sets, reps, and weight
- **Exercise Autocomplete** - 150+ pre-loaded exercises with smart search
- **Data Import/Export** - Backup and restore via JSON or Excel
- **Progressive Overload** - Track strength improvements over time
- **Rest Timer** - Smart timer with quick presets (30s, 60s, 90s, 2m, 3m)
- **Offline Support** - PWA with service worker caching
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

### Build Optimization
```bash
npm run build
```

### Environment Variables
Create `.env.production`:
```env
VITE_APP_NAME=FitTrack
VITE_APP_VERSION=1.0.0
```

### Deploy to Vercel/Netlify
1. Connect your Git repository
2. Build command: `npm run build`
3. Output directory: `dist`
4. Node version: 18+

### Important Notes
- ⚠️ Add app icons: `/public/icon-192.png` and `/public/icon-512.png`
- ⚠️ Configure HTTPS for production (required for PWA)
- ⚠️ Test service worker in production environment

## 📱 PWA Installation

1. Open app in Chrome/Edge
2. Click install icon in address bar
3. App works offline after first load

## 🧪 Testing

```bash
# Run linter
npm run lint

# Run tests (when added)
npm test
```

## 📊 Tech Stack

- **Frontend**: React 19, React Router 7
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **State**: Context API + useReducer
- **Storage**: localStorage
- **Build**: Vite 7
- **Icons**: Lucide React

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue first.
