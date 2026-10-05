import { Outlet } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';
import GymCheckinModal from '../session/GymCheckinModal';
import FloatingSessionPill from '../session/FloatingSessionPill';
import SessionCompleteModal from '../session/SessionCompleteModal';

const Layout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 transition-colors duration-200">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      {/* Show header on all screen sizes */}
      <Header />

      {/* Edge-to-edge on mobile, contained on desktop */}
      <main id="main-content" tabIndex={-1} className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 pt-4 md:pt-5 pb-32 md:pb-24">
        <Outlet />
      </main>

      {/* Gym Session Timer Components */}
      <GymCheckinModal />
      <FloatingSessionPill />
      <SessionCompleteModal />

      <BottomNav />
    </div>
  );
};

export default Layout;


