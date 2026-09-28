import { Home, Plus, History, BarChart3, Activity } from 'lucide-react';

// Single source of truth for app IA — keep Header + BottomNav in sync.
// label = full name (desktop + a11y), shortLabel = compact mobile tab label.
export const NAV_ITEMS = [
  { path: '/', label: 'Home', shortLabel: 'Home', icon: Home },
  { path: '/log', label: 'Log Workout', shortLabel: 'Log', icon: Plus, primary: true },
  { path: '/history', label: 'History', shortLabel: 'History', icon: History },
  { path: '/stats', label: 'Statistics', shortLabel: 'Stats', icon: BarChart3 },
  { path: '/wellness', label: 'Wellness', shortLabel: 'Wellness', icon: Activity },
];

export const isNavActive = (pathname, path) => {
  if (path === '/') return pathname === '/';
  return pathname.startsWith(path);
};
