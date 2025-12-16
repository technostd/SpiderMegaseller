// frontend/src/components/DashboardLayout.tsx
import React, {type ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Puzzle,
  Settings,
  MessageSquare,
  BarChart3
} from 'lucide-react';
import {useNotifications} from "../contexts/NotificationContext.tsx";
import Notification from "./Notification.tsx";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { notifications, removeNotification } = useNotifications();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  const navItems = [
    {
      name: 'Дашборд',
      path: '/lk',
      icon: LayoutDashboard
    },
    {
      name: 'AI Reviews',
      path: '/lk/module/ai-reviews',
      icon: MessageSquare,
      submenu: [
        { name: 'Обзор', path: '/lk/module/ai-reviews' },
        { name: 'Модерация', path: '/lk/module/ai-reviews/moderation' },
        { name: 'Настройки', path: '/lk/module/ai-reviews/configuration' }
      ]
    },
    {
      name: 'Аналитика',
      path: '/lk/analytics',
      icon: BarChart3
    },
    {
      name: 'Интеграции',
      path: '/lk/integrations',
      icon: Puzzle
    },
    {
      name: 'Настройки',
      path: '/lk/settings',
      icon: Settings
    }
  ];

  return (
      <div className="min-h-screen bg-gray-50">
        <Header/>

        <div className="flex">
          {/* Sidebar */}
          <aside className="hidden md:block w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-64px)]">
            <nav className="p-4">
              <div className="mb-8">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Модули
                </h2>
                <ul className="space-y-1">
                  {navItems.map((item) => (
                      <li key={item.name}>
                        <Link
                            to={item.path}
                            className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                isActive(item.path)
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                          <item.icon className="w-4 h-4 mr-3"/>
                          {item.name}
                        </Link>

                        {/* Submenu для AI Reviews */}
                        {item.submenu && isActive(item.path) && (
                            <ul className="ml-7 mt-1 space-y-1">
                              {item.submenu.map((subItem) => (
                                  <li key={subItem.name}>
                                    <Link
                                        to={subItem.path}
                                        className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                                            location.pathname === subItem.path
                                                ? 'bg-blue-100 text-blue-700 font-medium'
                                                : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                    >
                                      {subItem.name}
                                    </Link>
                                  </li>
                              ))}
                            </ul>
                        )}
                      </li>
                  ))}
                </ul>
              </div>
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>

        <Footer/>
        <div className="fixed bottom-6 right-6 z-50 space-y-3 max-w-md w-full">
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