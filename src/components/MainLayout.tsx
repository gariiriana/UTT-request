import { useState, ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Menu, LogOut, User } from 'lucide-react';
import { User as UserType } from '../types';
import { DataCenterAnimation } from './DataCenterAnimation';

interface MainLayoutProps {
  user: UserType;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  children: ReactNode;
}

export function MainLayout({ user, currentPage, onNavigate, onLogout, children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Animated Background - More visible like login page */}
      <div className="fixed inset-0 z-0 opacity-80">
        <DataCenterAnimation />
      </div>

      {/* Content Layer */}
      <div className="relative z-10 flex flex-1 w-full">
        <Sidebar
          userRole={user.role}
          currentPage={currentPage}
          onNavigate={onNavigate}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <header className="sticky top-0 h-16 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 lg:px-8 z-[120]">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-slate-400 hover:text-white flex-shrink-0"
              >
                <Menu size={24} />
              </button>
            </div>

            {/* User Menu */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                id="profile-menu-button"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <User size={16} className="text-white" />
                </div>
                <div className="hidden md:block text-left min-w-0">
                  <p className="text-sm text-white truncate max-w-[120px]">{user.name}</p>
                  <p className="text-xs text-blue-400 truncate">{user.role}</p>
                </div>
              </button>

              {showProfileMenu && (
                <>
                  <div
                    className="fixed inset-0 z-[100]"
                    onClick={() => setShowProfileMenu(false)}
                  />
                  <div className="fixed right-4 top-16 mt-2 w-56 sm:w-64 bg-slate-800 rounded-lg shadow-xl border border-slate-700 z-[110]">
                    <div className="p-4 border-b border-slate-700">
                      <p className="text-white break-words">{user.name}</p>
                      <p className="text-xs text-slate-400 break-all mt-1">{user.email}</p>
                      <p className="text-xs text-blue-400 mt-1">{user.role}</p>
                      {user.siteProject && (
                        <p className="text-xs text-slate-400 mt-1 break-words">Site: {user.siteProject}</p>
                      )}
                    </div>
                    <button
                      onClick={onLogout}
                      className="w-full flex items-center gap-2 px-4 py-3 text-red-400 hover:bg-slate-700 transition-colors text-sm"
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}