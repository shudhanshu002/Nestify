import { useState, useEffect, useMemo } from 'react';
import API from '../api/client';
import { 
  Bell, CheckCircle, XCircle, Clock, Loader2, ArrowLeft, 
  Wrench, ShieldCheck, CheckCheck, Trash2, CalendarCheck, 
  AlertCircle, ChevronRight, Inbox, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, UNREAD, MAINTENANCE, BOOKINGS
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

  const fetchNotifs = async () => {
    try {
      const { data } = await API.get('/notifications');
      setNotifications(data.data || []);
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
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
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
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error("Mark single read failed:", err);
    }
  };

  const deleteNotification = async (id, e) => {
    e?.stopPropagation();
    try {
      await API.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
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
          icon: <CheckCircle size={16} />,
          badgeClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
          category: 'MAINTENANCE',
        };
      }
      return {
        icon: <Wrench size={16} />,
        badgeClass: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
        category: 'MAINTENANCE',
      };
    }

    if (title.toLowerCase().includes('approved') || title.toLowerCase().includes('verified') || type === 'KYC_UPDATE') {
      return {
        icon: <ShieldCheck size={16} />,
        badgeClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
        category: 'BOOKINGS',
      };
    }

    if (type === 'BOOKING' || title.toLowerCase().includes('booking') || title.toLowerCase().includes('extend')) {
      return {
        icon: <CalendarCheck size={16} />,
        badgeClass: 'bg-primary/10 text-primary border border-primary/20',
        category: 'BOOKINGS',
      };
    }

    if (title.toLowerCase().includes('rejected') || title.toLowerCase().includes('failed') || title.toLowerCase().includes('blocked')) {
      return {
        icon: <XCircle size={16} />,
        badgeClass: 'bg-red-500/10 text-red-400 border border-red-500/20',
        category: 'SYSTEM',
      };
    }

    return {
      icon: <Bell size={16} />,
      badgeClass: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      category: 'SYSTEM',
    };
  };

  const handleActionClick = (n) => {
    const title = n.title || '';
    const type = n.type || '';

    if (title.includes('Rejected')) {
      navigate('/owner/my-properties');
    } else if (type === 'MAINTENANCE' || title.includes('Ticket')) {
      if (title.includes('New Maintenance Ticket')) {
        navigate('/owner/dashboard');
      } else {
        navigate('/my-bookings');
      }
    } else if (type === 'BOOKING' || title.includes('Booking') || title.includes('Extend')) {
      navigate('/my-bookings');
    } else if (title.includes('KYC') || type === 'KYC_UPDATE') {
      navigate('/verify-identity');
    } else {
      navigate('/my-bookings');
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
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-primary" size={36} />
          <p className="text-xs font-semibold text-gray-400 tracking-wider uppercase">Loading Notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-8 sm:py-12 text-white">
      {/* Subtle Ambient Red Glow */}
      <div className="relative">
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-80 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <button 
            onClick={() => navigate(-1)} 
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-white transition-colors cursor-pointer mb-2"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>Activity & Notifications</span>
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-primary/20 text-primary border border-primary/30">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Stay updated with lease updates, grievance tickets, and resident alerts.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#202020] hover:bg-[#282828] border border-[#333333] text-xs font-bold text-gray-200 hover:text-white transition cursor-pointer"
              title="Mark all notifications as read"
            >
              <CheckCheck size={14} className="text-primary" />
              <span>Mark all read</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#202020] hover:bg-red-950/30 border border-[#333333] hover:border-red-900/40 text-xs font-bold text-gray-400 hover:text-red-400 transition cursor-pointer"
              title="Clear all notifications"
            >
              <Trash2 size={13} />
              <span className="hidden sm:inline">Clear all</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 mb-6 border-b border-[#222222]">
        {[
          { id: 'ALL', label: 'All Activity', count: notifications.length },
          { id: 'UNREAD', label: 'Unread', count: unreadCount },
          { id: 'MAINTENANCE', label: 'Grievance & Tickets' },
          { id: 'BOOKINGS', label: 'Bookings & KYC' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'bg-primary text-white shadow-md shadow-red-950/40'
                  : 'bg-[#1a1a1a] text-gray-400 hover:text-gray-200 hover:bg-[#242424] border border-[#2a2a2a]'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  isActive ? 'bg-black/30 text-white' : 'bg-[#2a2a2a] text-gray-300'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      <div className="space-y-2.5">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((n) => {
            const config = getNotificationConfig(n);
            const isUnread = !n.isRead;

            return (
              <div
                key={n._id}
                onClick={() => {
                  if (isUnread) markSingleRead(n._id);
                  handleActionClick(n);
                }}
                className={`group relative flex items-start gap-3.5 p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                  isUnread
                    ? 'bg-[#1c1c1c] border-primary/40 hover:border-primary/70 shadow-lg shadow-black/40 ring-1 ring-primary/20'
                    : 'bg-[#161616] border-[#262626] hover:bg-[#1a1a1a] hover:border-[#383838]'
                }`}
              >
                {/* Visual Unread Glow Indicator */}
                {isUnread && (
                  <span className="absolute top-4 left-2 w-1.5 h-1.5 rounded-full bg-primary ring-2 ring-primary/40"></span>
                )}

                {/* Compact Icon Badge */}
                <div className={`p-2.5 rounded-xl shrink-0 ${config.badgeClass} transition-transform group-hover:scale-105 ml-1`}>
                  {config.icon}
                </div>

                {/* Main Content */}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <h3 className={`text-xs sm:text-sm font-bold truncate ${
                        isUnread ? 'text-white' : 'text-gray-200'
                      }`}>
                        {n.title}
                      </h3>
                      {isUnread && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-primary/20 text-primary border border-primary/30 shrink-0">
                          New
                        </span>
                      )}
                    </div>
                    
                    <span className="text-[10px] sm:text-xs font-medium text-gray-500 flex items-center gap-1 shrink-0">
                      <Clock size={11} /> {formatTimeAgo(n.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs text-gray-400 font-medium leading-relaxed line-clamp-2 sm:line-clamp-none">
                    {n.message}
                  </p>

                  {/* Contextual Action Pill */}
                  <div className="flex items-center justify-between gap-3 mt-2.5 pt-2 border-t border-[#242424]">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary group-hover:translate-x-0.5 transition-transform">
                      {n.title.includes('Rejected')
                        ? 'Fix Listing Now'
                        : n.type === 'MAINTENANCE' || n.title.includes('Ticket')
                        ? (n.title.includes('New Maintenance Ticket') ? 'View Owner Portal' : 'View in My Bookings')
                        : n.title.includes('KYC')
                        ? 'View Identity Status'
                        : 'View Details'}
                      <ChevronRight size={12} />
                    </span>

                    {/* Inline Quick Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isUnread && (
                        <button
                          onClick={(e) => markSingleRead(n._id, e)}
                          title="Mark as read"
                          className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#282828] transition"
                        >
                          <CheckCheck size={13} />
                        </button>
                      )}
                      <button
                        onClick={(e) => deleteNotification(n._id, e)}
                        title="Delete notification"
                        className="p-1 rounded-lg text-gray-400 hover:text-red-400 hover:bg-[#282828] transition"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          /* Sleek Empty State */
          <div className="py-16 sm:py-20 text-center bg-[#181818] rounded-3xl border border-[#262626] px-4 flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-[#222222] border border-[#333333] flex items-center justify-center text-gray-400 mb-4 shadow-inner">
              <Inbox size={26} className="text-gray-500" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              {activeTab === 'UNREAD' ? 'All Caught Up!' : 'No Notifications Yet'}
            </h3>
            <p className="text-xs text-gray-400 max-w-sm">
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
