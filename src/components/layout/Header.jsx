import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Dumbbell, LogOut, User, Moon, Sun, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import useOnlineStatus from '../../hooks/useOnlineStatus';
import { lightHaptic } from '../../utils/haptics';
import toast from 'react-hot-toast';
import { NAV_ITEMS, isNavActive } from '../../constants/navigation';


const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isOnline = useOnlineStatus();

  const navItems = NAV_ITEMS;

  const isActive = (path) => isNavActive(location.pathname, path);

  const handleLogout = async () => {
    try {
      lightHaptic();
      await signOut();
      localStorage.clear();
      toast.success('Logged out successfully');
      navigate('/login', { replace: true });
    } catch (error) {
      localStorage.clear();
      navigate('/login', { replace: true });

      if (import.meta.env.MODE !== 'production') {
        console.error('Logout error:', error);
      }
    }
  };

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-40 transition-colors duration-200 border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <Dumbbell className="w-9 h-9 text-primary-600" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">FitTrack</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            <nav className="flex space-x-1" aria-label="Primary">
              {/* eslint-disable-next-line no-unused-vars */}
              {navItems.map(({ path, label, icon: NavIcon }) => (
                <Link
                  key={path}
                  to={path}
                  aria-current={isActive(path) ? 'page' : undefined}
                  className={`flex items-center space-x-2 px-5 py-3 rounded-2xl transition-all duration-200 min-h-[48px] ${isActive(path)
                    ? 'bg-primary-100 text-primary-700 font-semibold shadow-soft dark:bg-primary-900/50 dark:text-primary-300'
                    : 'text-gray-600 hover:bg-gray-100 hover:shadow-none dark:text-gray-300 dark:hover:bg-gray-800'
                    }`}
                >
                  <NavIcon className="w-5 h-5" aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              ))}
            </nav>

            {/* User Menu */}
            <div className="ml-2 flex items-center space-x-2">
              {/* Online/Offline Connection Status Badge */}
              <div
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-2xl text-xs font-medium transition-all ${
                  isOnline
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 animate-pulse'
                }`}
                title={isOnline ? 'Online (Cloud Sync Active)' : 'Offline (Local PWA Storage)'}
              >
                {isOnline ? (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-amber-500" />
                    <span>Offline</span>
                  </>
                )}
              </div>

              <button
                onClick={toggleTheme}
                className="p-3 rounded-2xl text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle Theme"
                title="Toggle Theme"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <div className="px-4 py-1.5 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center space-x-2 transition-colors">
                <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {user?.user_metadata?.name || user?.email?.split('@')[0]}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-3 rounded-2xl text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"
                aria-label="Logout"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mobile: Actions (Right Side) */}
          <div className="flex md:hidden items-center space-x-1">
            <div
              className={`min-h-[44px] min-w-[44px] p-2 rounded-xl text-xs flex items-center justify-center space-x-1 ${
                isOnline
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
              }`}
              title={isOnline ? 'Online' : 'Offline'}
              role="status"
            >
              {isOnline ? <Wifi className="w-4 h-4" aria-hidden="true" /> : <WifiOff className="w-4 h-4" aria-hidden="true" />}
              <span className="sr-only">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
            <button
              onClick={toggleTheme}
              className="min-h-[44px] min-w-[44px] p-3 rounded-2xl text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors flex items-center justify-center"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" aria-hidden="true" /> : <Moon className="w-5 h-5" aria-hidden="true" />}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center min-h-[44px] min-w-[44px] p-3 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 transition-all duration-150 active:scale-95"
              aria-label="Logout"
              title="Logout"
            >
              <LogOut className="w-5 h-5" strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
