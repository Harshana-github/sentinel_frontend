import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Outlet, useLocation } from 'react-router-dom';
import { selectCurrentUser } from '../features/auth/authSlice';
import { isSuperAdmin } from '../utils/roles';
import { navigationFor } from './navigation';
import Sidebar from './Sidebar';
import Footer from './Footer';
import Topbar from './Topbar';

// Shell shared by both panels. The signed-in user's role decides which navigation is shown.
export default function AppLayout() {
  const user = useSelector(selectCurrentUser);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const isAdminPanel = isSuperAdmin(user);

  // Start each page at the top, as a normal website would.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen">
      <a
        href="#main-content"
        className="absolute -top-10 left-2 z-50 rounded-md bg-white px-3 py-2 focus:top-2"
      >
        Skip to main content
      </a>
      <Sidebar
        navSections={navigationFor(user)}
        panelLabel={isAdminPanel ? 'Super Admin panel' : user?.organizationName}
        isAdminPanel={isAdminPanel}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      {isSidebarOpen && <div className="fixed inset-0 z-35 bg-slate-900/45 lg:hidden" aria-hidden="true" onClick={() => setIsSidebarOpen(false)} />}

      {/* pb-8 keeps the last content clear of the fixed footer. */}
      <div className="flex min-h-screen flex-col pb-8 lg:ml-62">
        <Topbar isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen((open) => !open)} />
        <main id="main-content" className="w-full max-w-350 flex-1 p-4 focus:outline-none sm:p-6" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
}
