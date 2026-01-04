import { Link, useLocation } from 'react-router-dom';
import { Dumbbell, Home, History, BarChart3, Plus, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { lightHaptic } from '../../utils/haptics';
import MobileMenu from './MobileMenu';

const Header = () => {
  const location = useLocation();
  const { isDarkMode, toggleTheme } = useTheme();

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
          </div>

          {/* Mobile Menu */}
          <MobileMenu>
            <div className="space-y-2">
              {/* eslint-disable-next-line no-unused-vars */}
              {navItems.map(({ path, label, icon: NavIcon }) => (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors text-lg ${
                    isActive(path)
                      ? 'bg-primary-50 text-primary-600 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <NavIcon className="w-6 h-6" />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </MobileMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
