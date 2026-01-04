import { Link, useLocation } from 'react-router-dom';
import { Home, Plus, History, BarChart3 } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { lightHaptic, mediumHaptic } from '../../utils/haptics';

const BottomNav = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/log', label: 'Log', icon: Plus, primary: true },
    { path: '/history', label: 'History', icon: History },
    { path: '/stats', label: 'Stats', icon: BarChart3 },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleNavClick = (isPrimary = false) => {
    if (isPrimary) {
      mediumHaptic();
    } else {
      lightHaptic();
    }
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 pb-safe z-50 shadow-lifted transition-colors">
      <div className="flex items-center justify-around px-2 h-16">
        {/* eslint-disable-next-line no-unused-vars */}
        {navItems.map(({ path, label, icon: NavIcon, primary }) => {
          const active = isActive(path);

          return (
            <Link
              key={path}
              to={path}
              onClick={() => handleNavClick(primary)}
              className="relative flex flex-col items-center justify-center flex-1 h-full min-w-[64px]"
            >
              {primary ? (
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="flex flex-col items-center justify-center"
                >
                  <div className="bg-gradient-primary rounded-full p-3 shadow-lifted mb-1">
                    <NavIcon className="w-5 h-5 text-white" strokeWidth={2.5} />
                  </div>
                  <span className="text-xs font-semibold text-blue-600">Log</span>
                </motion.div>
              ) : (
                <>
                  <motion.div
                    whileTap={{ scale: 0.85 }}
                    className={`flex flex-col items-center justify-center transition-colors min-h-[48px] ${active ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'
                      }`}
                  >
                    <NavIcon className="w-6 h-6 mb-1" strokeWidth={active ? 2.5 : 2} />
                    <span className={`text-xs font-medium ${active ? 'font-semibold' : ''}`}>
                      {label}
                    </span>
                  </motion.div>
                  {active && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -top-0.5 w-12 h-1 bg-primary-600 rounded-full"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
