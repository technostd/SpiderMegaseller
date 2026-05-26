// frontend/src/components/DashboardLayout.tsx
import React, { type ReactNode, useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Puzzle,
  Settings,
  BarChart3,
  Pencil,
  X
} from 'lucide-react';
import { useNotifications } from "../contexts/NotificationContext.tsx";
import Notification from "./Notification.tsx";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { notifications, removeNotification } = useNotifications();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  const navItems = [
    { name: 'Профиль', path: '/lk', icon: LayoutDashboard },
    { name: 'Настройки', path: '/lk/module/ai-reviews/configuration', icon: Settings },
    { name: 'Модерация', path: '/lk/module/ai-reviews/moderation', icon: Pencil },
    { name: 'Аналитика', path: '/lk/module/ai-reviews/ozon-analytics', icon: BarChart3 },
    { name: 'Интеграции', path: '/lk/integrations', icon: Puzzle },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header onMenuToggle={() => setIsSidebarOpen(true)} />

      <div className="flex flex-1 pt-16">
        {/* Sidebar - sticky на десктопе */}
        <aside className={`
          fixed md:sticky md:top-16 z-50 w-72 md:w-64 bg-white border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          h-[calc(100vh-64px)] md:h-[calc(100vh-4rem)]
          overflow-y-auto
        `}>
          <div className="p-4">
            <div className="md:hidden flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Меню</h2>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
              МОДУЛИ
            </h2>

            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive(item.path)
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Основная область */}
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            {children}
          </main>

          <Footer />
        </div>
      </div>

      {/* Notifications */}
      <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 space-y-3 max-w-md w-[calc(100%-2rem)] md:w-auto">
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            id={notification.id}
            message={notification.message}
            type={notification.type}
            duration={notification.duration}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default DashboardLayout;