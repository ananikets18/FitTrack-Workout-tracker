import { Link, useLocation } from 'react-router-dom';

import { motion, AnimatePresence, useMotionValueEvent, useScroll } from 'framer-motion';
import { MoreHorizontal, X } from 'lucide-react';
import { lightHaptic, mediumHaptic } from '../../utils/haptics';
import { useState } from 'react';
import { BOTTOM_NAV_ITEMS, MORE_SHEET_ITEMS, isNavActive } from '../../constants/navigation';



const BottomNav = () => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const { scrollY } = useScroll();

  const navItems = BOTTOM_NAV_ITEMS;

  const isActive = (path) => isNavActive(location.pathname, path);
  const isMoreActive = MORE_SHEET_ITEMS.some((i) => isActive(i.path));

  const handleNavClick = (isPrimary = false) => {
    setIsVisible(true);
    setIsMoreOpen(false);

    if (isPrimary) {
      mediumHaptic();
    } else {
      lightHaptic();
    }
  };

  // Handle scroll direction (pause hiding while sheet is open)
  useMotionValueEvent(scrollY, "change", (latest) => {
    if (isMoreOpen) return;
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

  return (
    <>
      <motion.nav
        aria-label="Primary"
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pb-safe z-40 shadow-lifted transition-colors"
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
          {navItems.map(({ path, label, shortLabel, icon: NavIcon, primary }) => {
            const active = isActive(path);

            return (
              <Link
                key={path}
                to={path}
                onClick={() => handleNavClick(primary)}
                aria-label={label}
                aria-current={active ? 'page' : undefined}
                title={label}
                className="relative flex flex-col items-center justify-center flex-1 h-full min-w-[64px]"
              >
                {primary ? (
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ scale: 1.05 }}
                    className="flex flex-col items-center justify-center min-h-[48px]"
                  >
                    <div className="bg-gradient-primary rounded-full p-3 shadow-soft">
                      <NavIcon className="w-6 h-6 text-white" strokeWidth={2.5} aria-hidden="true" />
                    </div>
                    <span className="sr-only">{label}</span>
                  </motion.div>
                ) : (
                  <>
                    <motion.div
                      whileTap={{ scale: 0.85 }}
                      className={`flex flex-col items-center justify-center transition-colors min-h-[48px] ${active ? 'text-primary-600 dark:text-primary-300' : 'text-gray-500 dark:text-gray-400'
                        }`}
                    >
                      <NavIcon className="w-6 h-6 mb-1" strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
                      <span className={`text-[13px] font-medium ${active ? 'font-semibold' : ''}`}>
                        {shortLabel || label}
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
          {/* More overflow slot */}
          <button
            onClick={() => {
              lightHaptic();
              setIsVisible(true);
              setIsMoreOpen((o) => !o);
            }}
            aria-label="More"
            aria-expanded={isMoreOpen}
            className="relative flex flex-col items-center justify-center flex-1 h-full min-w-[64px]"
          >
            <motion.div
              whileTap={{ scale: 0.85 }}
              className={`flex flex-col items-center justify-center transition-colors min-h-[48px] ${isMoreActive || isMoreOpen ? 'text-primary-600 dark:text-primary-300' : 'text-gray-500 dark:text-gray-400'
                }`}
            >
              <MoreHorizontal className="w-6 h-6 mb-1" strokeWidth={isMoreActive ? 2.5 : 2} aria-hidden="true" />
              <span className={`text-[13px] font-medium ${isMoreActive ? 'font-semibold' : ''}`}>
                More
              </span>
            </motion.div>
            {isMoreActive && !isMoreOpen && (
              <motion.div
                layoutId="activeTab"
                className="absolute -top-0.5 w-12 h-1 bg-primary-600 rounded-full"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        </div>
      </motion.nav>

      {/* More bottom sheet */}
      <AnimatePresence>
        {isMoreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMoreOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/40 z-40"
              aria-hidden="true"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 35 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 rounded-t-3xl border-t border-gray-200 dark:border-gray-800 shadow-lifted pb-safe"
              role="dialog"
              aria-label="More navigation"
            >
              <div className="flex items-center justify-between px-5 pt-4 pb-2">
                <p className="font-bold text-gray-900 dark:text-white">More</p>
                <button
                  onClick={() => setIsMoreOpen(false)}
                  aria-label="Close more menu"
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
              <div className="px-3 pb-4 space-y-1">
                {/* eslint-disable-next-line no-unused-vars */}
                {MORE_SHEET_ITEMS.map(({ path, label, icon: ItemIcon }) => {
                  const active = isActive(path);
                  return (
                    <Link
                      key={path}
                      to={path}
                      onClick={() => handleNavClick(false)}
                      aria-current={active ? 'page' : undefined}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-colors min-h-[56px] ${active
                        ? 'bg-primary-100 text-primary-700 font-semibold dark:bg-primary-900/50 dark:text-primary-300'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                    >
                      <ItemIcon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                      <span>{label}</span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default BottomNav;
