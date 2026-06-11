import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AppRoutes from './routes/AppRoutes.jsx';
import Navbar from './components/layout/Navbar.jsx';
import Sidebar from './components/layout/Sidebar.jsx';
import Loader from './components/common/Loader.jsx';
import { useAuthStore } from './store/auth.store.js';
import { useUiStore } from './store/ui.store.js';
import { useSocketStore } from './store/socket.store.js';
import { useNotificationStore } from './store/notification.store.js';
import { toast } from 'react-hot-toast';

function App() {
  const { isAuthenticated, hydrated, user } = useAuthStore();
  const { sidebarOpen } = useUiStore();
  const { connect, disconnect, on } = useSocketStore();
  const { setUnreadCount, fetchUnreadCount, increment } = useNotificationStore();

  useEffect(() => {
    useAuthStore.getState().hydrate();
  }, []);

  // Connect/disconnect socket based on auth state
  useEffect(() => {
    if (isAuthenticated && hydrated) {
      const socket = connect();
      fetchUnreadCount();

      // Real-time unread count updates
      const offCount = on('notification:unread_count', ({ count }) => {
        setUnreadCount(count);
      });

      // Real-time notification toast
      const offNew = on('notification:new', ({ notification }) => {
        if (notification) {
          toast(notification.title, {
            icon: '🔔',
            duration: 4000,
          });
          increment();
        }
      });

      // Order status events for buyers
      const orderEvents = [
        'order:accepted', 'order:rejected', 'order:out_for_delivery',
        'order:delivered', 'order:completed',
      ];
      const orderCleanups = orderEvents.map((event) =>
        on(event, ({ message }) => {
          toast(message || event.replace('order:', '').replace(/_/g, ' '), { icon: '📦' });
        })
      );

      // Order events for farmers
      const offNew2 = on('order:new', () => {
        toast('You have a new order!', { icon: '🛒' });
      });

      return () => {
        offCount();
        offNew();
        offNew2();
        orderCleanups.forEach((fn) => fn());
        disconnect();
      };
    }
  }, [isAuthenticated, hydrated]);

  if (!hydrated) {
    return <Loader fullPage />;
  }

  return (
    <BrowserRouter>
      <div className={`app-container ${isAuthenticated ? 'authenticated' : 'public'}`}>
        {isAuthenticated && <Navbar />}
        <div className="app-body">
          {isAuthenticated && <Sidebar />}
          <main className={`page-container ${isAuthenticated && sidebarOpen ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
            <AppRoutes />
          </main>
        </div>
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'glass-card toast-custom',
          style: {
            background: 'rgba(17, 26, 22, 0.95)',
            color: '#E8F5E9',
            border: '1px solid rgba(82, 183, 136, 0.25)',
            backdropFilter: 'blur(16px)',
            borderRadius: '12px',
            fontSize: '14px',
            padding: '12px 16px',
          },
        }}
      />
    </BrowserRouter>
  );
}

export default App;
