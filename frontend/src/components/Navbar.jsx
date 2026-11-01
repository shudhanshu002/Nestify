import { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { 
  User, LogOut, LayoutDashboard, Home, Heart, ShieldCheck, 
  HelpCircle, ChevronDown, Bell, Headphones, Loader2, BarChart3 
} from 'lucide-react';
import API from '../api/client';
import Logo from './Logo';

const Navbar = () => {
  const { user, logout, wishlistIds } = useContext(AuthContext);
  const { setSelectedChat, setIsChatOpen, socket } = useChat();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [adminChatLoading, setAdminChatLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Auto-close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // 1. Notification Logic with real-time socket & route change updates
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const { data } = await API.get('/notifications/unread-count');
        setUnreadCount(data.count || 0);
      } catch (err) { 
        console.error("Notif Fetch Error", err); 
      }
    };

    if (user) fetchNotifs();

    // Listen to in-app custom event for instant 0ms badge update
    const handleCountEvent = (e) => {
      if (typeof e.detail === 'number') {
        setUnreadCount(e.detail);
      } else {
        fetchNotifs();
      }
    };
    window.addEventListener('notification_count_updated', handleCountEvent);

    if (!socket) {
      return () => {
        window.removeEventListener('notification_count_updated', handleCountEvent);
      };
    }

    const handleNewNotif = () => {
      setUnreadCount(prev => prev + 1);
    };

    const handleRefreshCount = () => {
      fetchNotifs();
    };

    socket.on('notification', handleNewNotif);
    socket.on('unread_notification_count_changed', handleRefreshCount);

    return () => {
      window.removeEventListener('notification_count_updated', handleCountEvent);
      socket.off('notification', handleNewNotif);
      socket.off('unread_notification_count_changed', handleRefreshCount);
    };
  }, [user, socket, location.pathname]);

  // Scroll to top helper when navigating from dropdown
  const handleMenuClick = () => {
    setIsOpen(false);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  };

  // 2. Chat with Admin support handler (for Tenant and Owner)
  const handleChatWithAdmin = async () => {
    setIsOpen(false);
    try {
      setAdminChatLoading(true);
      const { data } = await API.post('/chat/access', { 
        receiverId: 'ADMIN_ROLE_ID' 
      });
      setSelectedChat(data.data);
      setIsChatOpen(true);
    } catch (err) {
      alert(err.response?.data?.message || "Official Support is currently offline.");
    } finally {
      setAdminChatLoading(false);
    }
  };

  const handleSignOut = () => {
    handleMenuClick();
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-[#141414]/95 backdrop-blur-md border-b border-[#262626] py-3.5 px-4 sm:px-8 flex justify-between items-center sticky top-0 z-50 transition-all shadow-xl">
      {/* Brand Logo with 3D Red Canopy Wordmark */}
      <div onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' })} className="cursor-pointer">
        <Logo size="md" />
      </div>

      <div className="flex items-center gap-5 sm:gap-6">
        {/* THE NOTIFICATION BELL */}
        {user && (
          <div 
            className="relative cursor-pointer p-2 rounded-xl hover:bg-[#222222] transition-colors group" 
            onClick={() => {
              handleMenuClick();
              navigate('/notifications');
            }}
            title="Notifications"
          >
            <Bell size={21} className="text-gray-300 group-hover:text-primary transition-colors" />
            {unreadCount > 0 && (
              <span className="absolute top-1 -right-0.5 min-w-[18px] h-[18px] px-1 bg-primary text-white text-[10px] flex items-center justify-center rounded-full font-black border-2 border-[#141414] animate-pulse shadow-md shadow-red-950/60">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
        )}

        <div className="relative" ref={dropdownRef}>
          {user ? (
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2.5 p-1 pr-3 rounded-xl bg-[#222222] hover:bg-[#2a2a2a] border transition cursor-pointer ${
                  isOpen ? 'border-primary ring-1 ring-primary/40' : 'border-[#333333]'
                }`}
              >
                <img 
                  src={user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}&background=E50914&color=fff`} 
                  alt={user.firstName}
                  className="w-8 h-8 rounded-lg object-cover border border-primary/30" 
                />
                <span className="text-sm font-bold text-gray-200">{user.firstName}</span>
                <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
              </button>

              {isOpen && (
                <div className="absolute right-0 top-12 w-64 bg-[#181818] rounded-2xl shadow-2xl border border-[#2e2e2e] p-2 overflow-hidden animate-in fade-in zoom-in-95 duration-150 z-50 text-gray-200">
                  <div className="px-4 py-3 border-b border-[#282828] mb-2 bg-[#121212] rounded-xl flex items-center gap-3">
                    <img 
                      src={user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=E50914&color=fff`} 
                      alt={user.firstName}
                      className="w-9 h-9 rounded-xl object-cover border border-primary/30 shrink-0" 
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-sm font-black text-white truncate">{user.firstName} {user.lastName}</p>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                          {user.role}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                  </div>

                  {/* --- SHARED --- */}
                  <Link 
                    to="/profile" 
                    onClick={handleMenuClick} 
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-300 hover:text-white hover:bg-primary/15 hover:border-l-2 hover:border-primary rounded-xl transition group"
                  >
                    <User size={18} className="text-gray-400 group-hover:text-primary transition-colors" /> My Profile
                  </Link>

                  {/* --- TENANT ONLY --- */}
                  {user.role === 'TENANT' && (
                    <>
                      <Link 
                        to="/my-bookings" 
                        onClick={handleMenuClick} 
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-300 hover:text-white hover:bg-[#242424] rounded-xl transition"
                      >
                        <Home size={18} className="text-gray-400" /> My Bookings
                      </Link>
                      <Link 
                        to="/profile?tab=wishlist" 
                        onClick={handleMenuClick} 
                        className="flex items-center justify-between px-4 py-2.5 text-sm font-bold text-gray-300 hover:text-white hover:bg-[#242424] rounded-xl transition group"
                      >
                        <div className="flex items-center gap-3">
                          <Heart size={18} className="text-gray-400 group-hover:text-primary transition-colors" /> Wishlist
                        </div>
                        {wishlistIds && wishlistIds.size > 0 && (
                          <span className="text-[10px] font-black bg-primary text-white px-2 py-0.5 rounded-full shadow-sm">
                            {wishlistIds.size}
                          </span>
                        )}
                      </Link>
                    </>
                  )}

                  {/* --- OWNER ONLY --- */}
                  {user.role === 'OWNER' && (
                    <>
                      <Link 
                        to="/owner/dashboard" 
                        onClick={handleMenuClick} 
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-300 hover:text-white hover:bg-[#242424] rounded-xl transition"
                      >
                        <LayoutDashboard size={18} className="text-gray-400" /> Dashboard
                      </Link>
                      <Link 
                        to="/verify-identity" 
                        onClick={handleMenuClick} 
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-300 hover:text-white hover:bg-[#242424] rounded-xl transition"
                      >
                        <ShieldCheck size={18} className="text-secondary" /> Verification
                      </Link>
                    </>
                  )}

                  {/* --- CHAT WITH ADMIN (TENANT ONLY) --- */}
                  {user.role === 'TENANT' && (
                    <button 
                      onClick={handleChatWithAdmin}
                      disabled={adminChatLoading}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-300 hover:text-white hover:bg-primary/20 rounded-xl transition text-left group cursor-pointer"
                    >
                      {adminChatLoading ? (
                        <Loader2 size={18} className="animate-spin text-primary" />
                      ) : (
                        <Headphones size={18} className="text-primary group-hover:scale-110 transition-transform" />
                      )}
                      <span>Chat with Admin</span>
                    </button>
                  )}

                  {/* --- ADMIN ONLY SECTION --- */}
                  {user.role === 'ADMIN' && (
                    <>
                      <div className="px-4 py-2 border-b border-[#282828] mb-1 mt-1 bg-primary/10 rounded-xl">
                        <p className="text-[10px] font-black uppercase text-primary tracking-wider">Admin Matrix</p>
                      </div>
                      <Link 
                        to="/admin/verify-users" 
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-300 hover:text-white hover:bg-primary rounded-xl transition"
                        onClick={handleMenuClick}
                      >
                        <ShieldCheck size={18} /> KYC Approval Queue
                      </Link>
                      <Link 
                        to="/admin/dashboard" 
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-300 hover:text-white hover:bg-[#242424] rounded-xl transition"
                        onClick={handleMenuClick}
                      >
                        <BarChart3 size={18} className="text-primary" /> Performance & Analytics
                      </Link>
                    </>
                  )}

                  <div className="border-t border-[#282828] mt-2 pt-2">
                    {user.role !== 'ADMIN' && (
                      <Link 
                        to="/help" 
                        onClick={handleMenuClick} 
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-400 hover:text-white hover:bg-[#242424] rounded-xl transition"
                      >
                        <HelpCircle size={18} /> Help Center
                      </Link>
                    )}
                    <button 
                      onClick={handleSignOut} 
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-primary hover:bg-primary/10 rounded-xl transition cursor-pointer"
                    >
                      <LogOut size={18} /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link 
                to="/login" 
                onClick={handleMenuClick}
                className="btn-netflix px-5 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-black tracking-wide shadow-md shadow-red-950/40"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
