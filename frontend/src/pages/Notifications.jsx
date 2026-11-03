import { useState, useEffect, useMemo, useContext } from 'react';
import API from '../api/client';
import { AuthContext } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { 
  Bell, CheckCircle, XCircle, Clock, Loader2, ArrowLeft, 
  Wrench, ShieldCheck, CheckCheck, Trash2, CalendarCheck, 
  ChevronRight, Inbox
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Notifications = () => {
  const { user } = useContext(AuthContext);
  const { socket } = useChat();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, UNREAD, MAINTENANCE, BOOKINGS
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

  const syncUnreadCount = (notifs) => {
    const unread = notifs.filter(n => !n.isRead).length;
    window.dispatchEvent(new CustomEvent('notification_count_updated', { detail: unread }));
    if (socket && user?._id) {
      socket.emit('notification_read', { userId: user._id });
    }
  };

  const fetchNotifs = async () => {
    try {
      const { data } = await API.get('/notifications');
      const list = data.data || [];
      setNotifications(list);
      syncUnreadCount(list);
    } catch (err) { 
      console.error("Fetch notifications failed:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchNotifs(); 
  }, []);

  const markAllRead = async () => {
    try {
      setActionLoading(true);
      await API.put('/notifications/mark-read');
      const updated = notifications.map(n => ({ ...n, isRead: true }));
      setNotifications(updated);
      syncUnreadCount(updated);
    } catch (err) {
      console.error("Mark all read failed:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const markSingleRead = async (id, e) => {
    e?.stopPropagation();
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications(prev => {
        const updated = prev.map(n => n._id === id ? { ...n, isRead: true } : n);
        syncUnreadCount(updated);
        return updated;
      });
    } catch (err) {
      console.error("Mark single read failed:", err);
    }
  };

  const deleteNotification = async (id, e) => {
    e?.stopPropagation();
    try {
      await API.delete(`/notifications/${id}`);
      setNotifications(prev => {
        const updated = prev.filter(n => n._id !== id);
        syncUnreadCount(updated);
        return updated;
      });
    } catch (err) {
      console.error("Delete notification failed:", err);
    }
  };

  const clearAll = async () => {
    if (!window.confirm("Are you sure you want to clear all notifications?")) return;
    try {
      setActionLoading(true);
      await API.delete('/notifications');
      setNotifications([]);
      syncUnreadCount([]);
    } catch (err) {
      console.error("Clear all notifications failed:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const getNotificationConfig = (n) => {
    const title = n.title || '';
    const type = n.type || '';

    if (type === 'MAINTENANCE' || title.toLowerCase().includes('ticket') || title.toLowerCase().includes('maintenance')) {
      if (title.toLowerCase().includes('solved') || title.toLowerCase().includes('resolved')) {
        return {
          icon: <CheckCircle className="w-5 h-5 text-emerald-400" />,
          boxClass: 'bg-emerald-950/40 border border-emerald-500/40',
          category: 'MAINTENANCE',
        };
      }
      return {
        icon: <Wrench className="w-5 h-5 text-amber-400" />,
        boxClass: 'bg-amber-950/40 border border-amber-500/40',
        category: 'MAINTENANCE',
      };
    }

    if (title.toLowerCase().includes('approved') || title.toLowerCase().includes('verified') || type === 'KYC_UPDATE') {
      return {
        icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
        boxClass: 'bg-emerald-950/40 border border-emerald-500/40',
        category: 'BOOKINGS',
      };
    }

    if (type === 'BOOKING' || title.toLowerCase().includes('booking') || title.toLowerCase().includes('extend')) {
      return {
        icon: <CalendarCheck className="w-5 h-5 text-[#E50914]" />,
        boxClass: 'bg-red-950/40 border border-[#E50914]/40',
        category: 'BOOKINGS',
      };
    }

    if (title.toLowerCase().includes('rejected') || title.toLowerCase().includes('failed') || title.toLowerCase().includes('blocked')) {
      return {
        icon: <XCircle className="w-5 h-5 text-[#E50914]" />,
        boxClass: 'bg-red-950/40 border border-[#E50914]/40',
        category: 'SYSTEM',
      };
    }

    return {
      icon: <Bell className="w-5 h-5 text-neutral-300" />,
      boxClass: 'bg-neutral-900 border border-neutral-700',
      category: 'SYSTEM',
    };
  };

  const handleActionClick = (n, e) => {
    e?.stopPropagation();
    if (!n.isRead) {
      markSingleRead(n._id);
    }

    const title = n.title || '';
    const type = n.type || '';
    const userRole = user?.role || 'TENANT';

    if (userRole === 'OWNER') {
      if (title.includes('Rejected') || type === 'PROPERTY_VERIFICATION') {
        navigate('/owner/my-properties');
      } else if (type === 'MAINTENANCE' || title.includes('Ticket')) {
        navigate('/owner/dashboard');
      } else if (title.includes('KYC') || type === 'KYC_UPDATE') {
        navigate('/verify-identity');
      } else {
        navigate('/owner/dashboard');
      }
      return;
    }

    if (userRole === 'ADMIN') {
      if (title.includes('KYC') || type === 'KYC_UPDATE' || title.includes('Verification')) {
        navigate('/admin/verify-users');
      } else {
        navigate('/admin/dashboard');
      }
      return;
    }

    // TENANT role
    if (type === 'MAINTENANCE' || title.includes('Ticket')) {
      navigate('/my-bookings');
    } else if (type === 'BOOKING' || title.includes('Booking') || title.includes('Extend')) {
      navigate('/my-bookings');
    } else if (title.includes('KYC') || type === 'KYC_UPDATE') {
      navigate('/verify-identity');
    } else {
      navigate('/my-bookings');
    }
  };

  const handleCardClick = (n) => {
    if (!n.isRead) {
      markSingleRead(n._id);
    }
  };

  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

  const filteredNotifications = useMemo(() => {
    if (activeTab === 'UNREAD') {
      return notifications.filter(n => !n.isRead);
    }
    if (activeTab === 'MAINTENANCE') {
      return notifications.filter(n => {
        const conf = getNotificationConfig(n);
        return conf.category === 'MAINTENANCE';
      });
    }
    if (activeTab === 'BOOKINGS') {
      return notifications.filter(n => {
        const conf = getNotificationConfig(n);
        return conf.category === 'BOOKINGS';
      });
    }
    return notifications;
  }, [notifications, activeTab]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#0d0d0d]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-[#E50914]" size={36} />
          <p className="text-xs font-bold text-neutral-400 tracking-wider uppercase">Loading Notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-2 px-2 sm:px-4 md:px-8 max-w-4xl mx-auto space-y-6 text-white pb-20">
      
      {/* Back button */}
      <button 
        onClick={() => navigate(-1)} 
        className="text-neutral-400 hover:text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-white italic tracking-wide">
              Activity & Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#E50914]/20 text-[#E50914] border border-[#E50914]/30">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Stay updated with lease updates, grievance tickets, and resident alerts.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-bold text-neutral-200 hover:text-white transition cursor-pointer"
              title="Mark all notifications as read"
            >
              <CheckCheck className="w-3.5 h-3.5 text-[#E50914]" />
              <span>Mark all read</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white text-xs font-bold transition cursor-pointer"
              title="Clear all notifications"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear all</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto text-xs font-bold no-scrollbar pb-1">
        {[
          { id: 'ALL', label: `All Activity (${notifications.length})` },
          { id: 'UNREAD', label: `Unread (${unreadCount})` },
          { id: 'MAINTENANCE', label: 'Grievance & Tickets' },
          { id: 'BOOKINGS', label: 'Bookings & KYC' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-full whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-[#E50914] text-white shadow'
                  : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((n) => {
            const config = getNotificationConfig(n);
            const isUnread = !n.isRead;

            return (
              <div
                key={n._id}
                onClick={() => handleCardClick(n)}
                className={`bg-[#141414] border rounded-2xl p-4 sm:p-5 flex items-start gap-4 shadow-xl transition cursor-pointer group ${
                  isUnread
                    ? 'border-[#E50914]/50 shadow-[0_0_15px_rgba(229,9,20,0.15)] ring-1 ring-[#E50914]/30'
                    : 'border-neutral-800 hover:border-neutral-700'
                }`}
              >
                {/* Icon Container */}
                <div className={`w-10 h-10 rounded-xl ${config.boxClass} flex items-center justify-center shrink-0`}>
                  {config.icon}
                </div>

                {/* Details */}
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <h3 className="text-sm font-bold text-white truncate">
                        {n.title}
                      </h3>
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-[#E50914] shrink-0" />
                      )}
                    </div>
                    <span className="text-xs text-neutral-500 flex items-center gap-1 shrink-0">
                      <Clock size={12} /> {formatTimeAgo(n.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-400 leading-relaxed">
                    {n.message}
                  </p>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={(e) => handleActionClick(n, e)}
                      className="text-[#E50914] text-xs font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>
                        {user?.role === 'OWNER'
                          ? 'Open Owner Portal'
                          : user?.role === 'ADMIN'
                          ? 'Review in Admin Matrix'
                          : (n.type === 'MAINTENANCE' || n.title.includes('Ticket') ? 'View in My Bookings' : 'View Stay Details')}
                      </span>
                      <ChevronRight size={12} />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => deleteNotification(n._id, e)}
                      title="Delete notification"
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-rose-400 transition cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-16 text-center bg-[#141414] rounded-3xl border border-neutral-800 px-4 flex flex-col items-center shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-500 mb-3">
              <Inbox size={26} />
            </div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider mb-1">
              {activeTab === 'UNREAD' ? 'All Caught Up!' : 'No Notifications Yet'}
            </h3>
            <p className="text-xs text-neutral-500 max-w-sm">
              {activeTab === 'UNREAD' 
                ? 'You have read all your recent notifications. New alerts will show up here.'
                : 'There is no recorded activity in this category. Important updates will appear right here.'}
            </p>
          </div>
        )}
      </div>

    </div>
  );
};

export default Notifications;
