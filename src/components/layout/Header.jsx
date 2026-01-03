import { Link, useLocation } from 'react-router-dom';
import { Dumbbell, Home, History, BarChart3, Plus } from 'lucide-react';
import MobileMenu from './MobileMenu';

const Header = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/log', label: 'Log Workout', icon: Plus },
    { path: '/history', label: 'History', icon: History },
    { path: '/stats', label: 'Statistics', icon: BarChart3 },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Dumbbell className="w-8 h-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">FitTrack</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-1">
            {/* eslint-disable-next-line no-unused-vars */}
            {navItems.map(({ path, label, icon: NavIcon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive(path)
                    ? 'bg-primary-50 text-primary-600 font-semibold'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <NavIcon className="w-5 h-5" />
                <span>{label}</span>
              </Link>
            ))}
          </nav>

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
