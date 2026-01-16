import { Link, useLocation } from 'react-router-dom';
import { Home, Plus, History, BarChart3, Activity } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { lightHaptic, mediumHaptic } from '../../utils/haptics';
import { useState, useEffect } from 'react';



const BottomNav = () => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { scrollY } = useScroll();

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/health', label: 'Health', icon: Activity },
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

  // Handle scroll direction
  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = lastScrollY;

    // Show nav when at top of page
    if (latest < 50) {
      setIsVisible(true);
    }
    // Hide when scrolling down, show when scrolling up
    else if (latest > previous && latest > 100) {
      setIsVisible(false);
    } else if (latest < previous) {
      setIsVisible(true);
    }

    setLastScrollY(latest);
  });

  // Reset visibility on route change
  useEffect(() => {
    setIsVisible(true);
  }, [location.pathname]);


  return (
    <motion.nav
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-50 shadow-lifted"
      initial={{ y: 0 }}
      animate={{
        y: isVisible ? 0 : 100,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 0.8
      }}
    >
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
                  whileHover={{ scale: 1.05 }}
                  className="flex flex-col items-center justify-center -mt-6"
                >
                  <div className="bg-gradient-primary rounded-full p-4 shadow-2xl ring-4 ring-white">
                    <NavIcon className="w-6 h-6 text-white" strokeWidth={2.5} />
                  </div>
                </motion.div>
              ) : (
                <>
                  <motion.div
                    whileTap={{ scale: 0.85 }}
                    className={`flex flex-col items-center justify-center transition-colors min-h-[48px] ${active ? 'text-primary-600' : 'text-gray-500'
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
    </motion.nav>

  );
};

export default BottomNav;
