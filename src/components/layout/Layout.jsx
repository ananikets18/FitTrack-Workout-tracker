import { Outlet } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';

const Layout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 transition-colors duration-200">
      {/* Show header on all screen sizes */}
      <Header />

      {/* Edge-to-edge on mobile, contained on desktop */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 pt-4 md:pt-5 pb-20 md:pb-8">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
};

export default Layout;

