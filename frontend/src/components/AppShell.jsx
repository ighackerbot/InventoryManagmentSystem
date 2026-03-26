import { Outlet } from 'react-router-dom';
import { GuestBanner } from './GuestBanner';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { WelcomeTutorial } from './WelcomeTutorial';

export const AppShell = () => (
  <div className="dashboard-shell">
    <GuestBanner />
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Navbar />
        <main className="page-container flex-1 pb-24 lg:pb-8">
          <Outlet />
        </main>
      </div>
    </div>
    <BottomNav />
    <WelcomeTutorial />
  </div>
);
