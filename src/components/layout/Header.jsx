import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Dumbbell, Home, History, BarChart3, Plus, Moon, Sun, LogOut, User } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { lightHaptic } from '../../utils/haptics';
import toast from 'react-hot-toast';
import MobileMenu from './MobileMenu';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/log', label: 'Log Workout', icon: Plus },
    { path: '/history', label: 'History', icon: History },
    { path: '/stats', label: 'Statistics', icon: BarChart3 },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleThemeToggle = () => {
    lightHaptic();
    toggleTheme();
  };

  const handleLogout = async () => {
    try {
      lightHaptic();
      await signOut();
      toast.success('Logged out successfully');
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error('Failed to logout');
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Dumbbell className="w-8 h-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">FitTrack</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <nav className="flex space-x-1">
              {/* eslint-disable-next-line no-unused-vars */}
              {navItems.map(({ path, label, icon: NavIcon }) => (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive(path)
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <NavIcon className="w-5 h-5" />
                  <span>{label}</span>
                </Link>
              ))}
            </nav>
            
            {/* Theme Toggle Button */}
            <button
              onClick={handleThemeToggle}
              className="ml-2 p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* User Menu */}
            <div className="ml-2 flex items-center space-x-2">
              <div className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {user?.user_metadata?.name || user?.email?.split('@')[0]}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                aria-label="Logout"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          <MobileMenu>
            <div className="space-y-4">
              {/* User Info */}
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {user?.user_metadata?.name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user?.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="space-y-2">
                {/* eslint-disable-next-line no-unused-vars */}
                {navItems.map(({ path, label, icon: NavIcon }) => (
                  <Link
                    key={path}
                    to={path}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors text-lg ${
                      isActive(path)
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <NavIcon className="w-6 h-6" />
                    <span>{label}</span>
                  </Link>
                ))}
              </div>

              {/* Theme Toggle */}
              <button
                onClick={handleThemeToggle}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-lg"
              >
                {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
                <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </button>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-lg font-medium"
              >
                <LogOut className="w-6 h-6" />
                <span>Logout</span>
              </button>
            </div>
          </MobileMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
