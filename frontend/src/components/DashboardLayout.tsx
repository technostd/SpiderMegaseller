import { useNotifications } from '../contexts/NotificationContext';
import Notification from './Notification';
import Header from './Header';
import Footer from './Footer';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 relative">{children}</main>
      <Footer />

      {/* Контейнер для уведомлений */}
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
}