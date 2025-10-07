import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner@2.0.3';

export interface Notification {
  id: string;
  type: 'reservation_confirmed' | 'reservation_cancelled' | 'reservation_reminder' | 'court_change' | 'payment_received' | 'facility_announcement' | 'weather_alert';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high';
  relatedReservation?: {
    facility: string;
    court: string;
    date: string;
    time: string;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  removeNotification: (id: string) => void;
  showToast: (type: Notification['type'], title: string, message: string, reservation?: Notification['relatedReservation']) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

// Sample notification data
const sampleNotifications: Omit<Notification, 'id'>[] = [
  {
    type: 'reservation_confirmed',
    title: 'Court Reservation Confirmed',
    message: 'Your tennis court booking at Downtown Tennis Center has been confirmed.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    read: false,
    priority: 'high',
    relatedReservation: {
      facility: 'Downtown Tennis Center',
      court: 'Tennis Court 2',
      date: 'Today',
      time: '2:00 PM - 3:00 PM'
    }
  },
  {
    type: 'reservation_reminder',
    title: 'Court Session Starting Soon',
    message: 'Your tennis session at Downtown Tennis Center starts in 1 hour.',
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    read: false,
    priority: 'high',
    relatedReservation: {
      facility: 'Downtown Tennis Center',
      court: 'Tennis Court 2',
      date: 'Today',
      time: '2:00 PM - 3:00 PM'
    }
  },
  {
    type: 'reservation_cancelled',
    title: 'Reservation Cancelled',
    message: 'Your pickleball court booking has been cancelled due to court maintenance.',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    read: true,
    priority: 'medium',
    relatedReservation: {
      facility: 'Sunrise Valley HOA',
      court: 'Pickleball Court 1',
      date: 'Dec 27',
      time: '9:00 AM - 10:00 AM'
    }
  },
  {
    type: 'court_change',
    title: 'Court Assignment Changed',
    message: 'Your reservation has been moved to Center Court due to scheduling conflicts.',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    read: false,
    priority: 'medium',
    relatedReservation: {
      facility: 'Riverside Tennis Club',
      court: 'Center Court',
      date: 'Tomorrow',
      time: '7:00 PM - 8:30 PM'
    }
  },
  {
    type: 'payment_received',
    title: 'Payment Processed',
    message: 'Payment of $45.00 has been processed for your court reservation.',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    read: true,
    priority: 'low',
    relatedReservation: {
      facility: 'Downtown Tennis Center',
      court: 'Tennis Court 2',
      date: 'Today',
      time: '2:00 PM - 3:00 PM'
    }
  },
  {
    type: 'facility_announcement',
    title: 'New Court Available',
    message: 'Riverside Tennis Club has added a new premium court with LED lighting.',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    read: false,
    priority: 'low'
  },
  {
    type: 'weather_alert',
    title: 'Weather Advisory',
    message: 'Rain expected tomorrow evening. Indoor courts available for booking.',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    read: true,
    priority: 'medium'
  },
  {
    type: 'reservation_confirmed',
    title: 'Pickleball Court Booked',
    message: 'Your morning pickleball session at Sunrise Valley HOA is confirmed.',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    read: true,
    priority: 'high',
    relatedReservation: {
      facility: 'Sunrise Valley HOA',
      court: 'Pickleball Court 1',
      date: 'Dec 28',
      time: '10:00 AM - 11:00 AM'
    }
  },
  {
    type: 'reservation_reminder',
    title: 'Don\'t Forget Your Match',
    message: 'You have a tennis match tomorrow evening at Riverside Tennis Club.',
    timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000), // 18 hours ago
    read: true,
    priority: 'medium',
    relatedReservation: {
      facility: 'Riverside Tennis Club',
      court: 'Center Court',
      date: 'Tomorrow',
      time: '7:00 PM - 8:30 PM'
    }
  },
  {
    type: 'facility_announcement',
    title: 'Holiday Hours Update',
    message: 'All facilities will have modified hours during the holiday season.',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    read: true,
    priority: 'low'
  }
];

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Initialize with sample data
    const initialNotifications = sampleNotifications.map((notification, index) => ({
      ...notification,
      id: `notification-${index + 1}`
    }));
    setNotifications(initialNotifications);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const addNotification = (notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notificationData,
      id: `notification-${Date.now()}`,
      timestamp: new Date(),
      read: false
    };
    
    setNotifications(prev => [newNotification, ...prev]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const showToast = (
    type: Notification['type'], 
    title: string, 
    message: string, 
    reservation?: Notification['relatedReservation']
  ) => {
    // Add to notifications list
    addNotification({
      type,
      title,
      message,
      priority: type === 'reservation_confirmed' || type === 'reservation_reminder' ? 'high' : 'medium',
      relatedReservation: reservation
    });

    // Show toast notification with appropriate styling
    switch (type) {
      case 'reservation_confirmed':
        toast.success(title, {
          description: message,
          duration: 5000,
          action: reservation ? {
            label: 'View Details',
            onClick: () => console.log('Navigate to reservation details')
          } : undefined
        });
        break;
      case 'reservation_cancelled':
        toast.error(title, {
          description: message,
          duration: 6000,
          action: {
            label: 'Book Again',
            onClick: () => console.log('Navigate to booking')
          }
        });
        break;
      case 'reservation_reminder':
        toast.info(title, {
          description: message,
          duration: 8000,
          action: {
            label: 'Get Directions',
            onClick: () => console.log('Open maps')
          }
        });
        break;
      case 'court_change':
        toast.warning(title, {
          description: message,
          duration: 7000
        });
        break;
      case 'payment_received':
        toast.success(title, {
          description: message,
          duration: 4000
        });
        break;
      case 'weather_alert':
        toast.warning(title, {
          description: message,
          duration: 6000
        });
        break;
      case 'facility_announcement':
        toast.info(title, {
          description: message,
          duration: 5000
        });
        break;
      default:
        toast(title, {
          description: message,
          duration: 4000
        });
    }
  };

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
    removeNotification,
    showToast
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}