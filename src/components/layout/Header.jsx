import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Dumbbell, Home, History, BarChart3, Plus, LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { lightHaptic } from '../../utils/haptics';
import toast from 'react-hot-toast';
import MobileMenu from './MobileMenu';


const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
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
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Dumbbell className="w-8 h-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">FitTrack</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <nav className="flex space-x-1">
              {/* eslint-disable-next-line no-unused-vars */}
              {navItems.map(({ path, label, icon: NavIcon }) => (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${isActive(path)
                    ? 'bg-primary-50 text-primary-600 font-semibold'
                    : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  <NavIcon className="w-5 h-5" />
                  <span>{label}</span>
                </Link>
              ))}
            </nav>

            {/* User Menu */}
            <div className="ml-2 flex items-center space-x-2">
              <div className="px-3 py-1 rounded-lg bg-gray-100 flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-600">
                  {user?.user_metadata?.name || user?.email?.split('@')[0]}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                aria-label="Logout"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mobile: Logout Button (Right Side) */}
          <div className="md:hidden">
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors active:scale-95"
              aria-label="Logout"
              title="Logout"
            >
              <LogOut className="w-6 h-6" />
            </button>
          </div>

          {/* Mobile Menu - Hidden, keeping for future use if needed */}
          <div className="hidden">
            <MobileMenu>
              <div className="space-y-4">
                {/* User Info */}
                <div className="px-4 py-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <User className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {user?.user_metadata?.name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500">
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
                      className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors text-lg ${isActive(path)
                        ? 'bg-primary-50 text-primary-600 font-semibold'
                        : 'text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                      <NavIcon className="w-6 h-6" />
                      <span>{label}</span>
                    </Link>
                  ))}
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-lg font-medium"
                >
                  <LogOut className="w-6 h-6" />
                  <span>Logout</span>
                </button>
              </div>
            </MobileMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
