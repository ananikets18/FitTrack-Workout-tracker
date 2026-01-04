import { Outlet } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';

const Layout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 transition-colors">
      {/* Hide header on mobile, show on desktop */}
      <div className="hidden md:block">
        <Header />
      </div>
      
      {/* Edge-to-edge on mobile, contained on desktop */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 pt-4 md:pt-5 pb-20 md:pb-8">
        <Outlet />
      </main>
      
      <BottomNav />
    </div>
  );
};

export default Layout;
