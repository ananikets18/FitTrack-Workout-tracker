import { Link, useLocation } from 'react-router-dom';
import { Home, Plus, History, BarChart3 } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

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

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-50">
      <div className="flex items-center justify-around px-2 h-16">
        {/* eslint-disable-next-line no-unused-vars */}
        {navItems.map(({ path, label, icon: NavIcon, primary }) => {
          const active = isActive(path);

          return (
            <Link
              key={path}
              to={path}
              className="relative flex flex-col items-center justify-center flex-1 h-full"
            >
              {primary ? (
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="flex flex-col items-center justify-center"
                >
                  <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-full p-2.5 shadow-lg shadow-blue-500/30 mb-1">
                    <NavIcon className="w-5 h-5 text-white" strokeWidth={2.5} />
                  </div>
                  <span className="text-xs font-semibold text-blue-600">Log</span>
                </motion.div>
              ) : (
                <>
                  <motion.div
                    whileTap={{ scale: 0.85 }}
                    className={`flex flex-col items-center justify-center transition-colors ${active ? 'text-primary-600' : 'text-gray-500'
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
