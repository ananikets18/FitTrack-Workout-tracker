import { Home, Plus, History, BarChart3, Activity, Sparkles } from 'lucide-react';

// Single source of truth for app IA — keep Header + BottomNav in sync.
// label = full name (desktop + a11y), shortLabel = compact mobile tab label.
export const NAV_ITEMS = [
  { path: '/', label: 'Home', shortLabel: 'Home', icon: Home },
  { path: '/log', label: 'Log Workout', shortLabel: 'Log', icon: Plus, primary: true },
  { path: '/history', label: 'History', shortLabel: 'History', icon: History },
  { path: '/stats', label: 'Statistics', shortLabel: 'Stats', icon: BarChart3 },
  { path: '/recap', label: 'Recap', shortLabel: 'Recap', icon: Sparkles },
  { path: '/wellness', label: 'Wellness', shortLabel: 'Wellness', icon: Activity },
];

// Bottom nav shows max 5 slots (4 tabs + More sheet) to avoid crowding on 360px.
// Desktop header renders full NAV_ITEMS (compact pills).
export const BOTTOM_NAV_PATHS = ['/', '/history', '/log', '/stats'];
export const MORE_SHEET_PATHS = ['/recap', '/wellness'];

export const BOTTOM_NAV_ITEMS = NAV_ITEMS.filter((i) => BOTTOM_NAV_PATHS.includes(i.path));
// Preserve NAV_ITEMS order for the sheet.
export const MORE_SHEET_ITEMS = NAV_ITEMS.filter((i) => MORE_SHEET_PATHS.includes(i.path));

export const isNavActive = (pathname, path) => {
  if (path === '/') return pathname === '/';
  return pathname.startsWith(path);
};
