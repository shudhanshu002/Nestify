import { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { 
  User, LogOut, LayoutDashboard, Home as HomeIcon, Heart, ShieldCheck, 
  HelpCircle, ChevronDown, Bell, MessageSquare, Menu, X, PlusCircle,
  FileText, BarChart3, Building2, Flame
} from 'lucide-react';
import API from '../api/client';
import Logo from './Logo';

const Navbar = () => {
  const { user, logout, wishlistIds } = useContext(AuthContext);
  const { isChatOpen, setIsChatOpen, socket, openChatWithAdmin } = useChat();
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
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
        setMobileMenuOpen(false);
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

  // Notification count logic with real-time socket
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

    const handleNewNotif = () => setUnreadCount(prev => prev + 1);
    const handleRefreshCount = () => fetchNotifs();

    socket.on('notification', handleNewNew => handleNewNotif());
    socket.on('unread_notification_count_changed', handleRefreshCount);

    return () => {
      window.removeEventListener('notification_count_updated', handleCountEvent);
      socket.off('notification', handleNewNotif);
      socket.off('unread_notification_count_changed', handleRefreshCount);
    };
  }, [user, socket, location.pathname]);

  const handleMenuClick = () => {
    setIsOpen(false);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  };

  const handleSignOut = () => {
    handleMenuClick();
    logout();
    navigate('/login');
  };

  const getInitials = () => {
    if (!user) return 'GU';
    const first = user.firstName ? user.firstName[0].toUpperCase() : '';
    const last = user.lastName ? user.lastName[0].toUpperCase() : '';
    return `${first}${last}` || 'SS';
  };

  const roleBadge = () => {
    if (!user || user.role === 'TENANT') return 'RESIDENT HUB';
    if (user.role === 'OWNER') return 'OWNER CONSOLE';
    if (user.role === 'ADMIN') return 'ADMIN MATRIX';
    return 'RESIDENT HUB';
  };

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 left-0 right-0 z-40 px-4 md:px-10 py-3 flex items-center justify-between bg-black/95 backdrop-blur-md border-b border-neutral-800/80 transition-all shadow-2xl">
      {/* Left: Brand Logo & Primary Nav Tabs */}
      <div className="flex items-center gap-6 lg:gap-8">
        <Link 
          to="/" 
          onClick={handleMenuClick} 
          className="flex items-center gap-2 group cursor-pointer"
        >
          <Logo size="md" />
          <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#E50914]/20 text-[#E50914] border border-[#E50914]/30 font-black hidden sm:inline-block">
            {roleBadge()}
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-4 lg:gap-6 text-xs lg:text-sm font-semibold text-neutral-300">
          {(!user || user.role === 'TENANT') && (
            <>
              <Link 
                to="/search" 
                onClick={handleMenuClick}
                className={`transition-colors ${isActive('/search') ? 'text-white font-extrabold border-b-2 border-[#E50914] pb-1' : 'hover:text-white'}`}
              >
                Browse Stays
              </Link>
              <Link 
                to="/" 
                onClick={handleMenuClick}
                className={`transition-colors flex items-center gap-1 ${location.pathname === '/' ? 'text-white font-extrabold border-b-2 border-[#E50914] pb-1' : 'hover:text-white'}`}
              >
                <Flame size={13} className="text-[#E50914]" /> Trending
              </Link>
              {user && (
                <Link 
                  to="/my-bookings" 
                  onClick={handleMenuClick}
                  className={`transition-colors ${isActive('/my-bookings') ? 'text-white font-extrabold border-b-2 border-[#E50914] pb-1' : 'hover:text-white'}`}
                >
                  My Stays
                </Link>
              )}
              {user && (
                <Link 
                  to="/profile?tab=wishlist" 
                  onClick={handleMenuClick}
                  className={`transition-colors flex items-center gap-1.5 ${location.search.includes('wishlist') ? 'text-white font-extrabold border-b-2 border-[#E50914] pb-1' : 'hover:text-white'}`}
                >
                  <span>Wishlist</span>
                  {wishlistIds && wishlistIds.size > 0 && (
                    <span className="text-[9px] font-black bg-[#E50914] text-white px-1.5 py-0.2 rounded-full">
                      {wishlistIds.size}
                    </span>
                  )}
                </Link>
              )}
              {user && (
                <Link 
                  to="/profile" 
                  onClick={handleMenuClick}
                  className={`transition-colors ${isActive('/profile') && !location.search.includes('wishlist') ? 'text-white font-extrabold border-b-2 border-[#E50914] pb-1' : 'hover:text-white'}`}
                >
                  Profile
                </Link>
              )}
              <Link 
                to="/help" 
                onClick={handleMenuClick}
                className={`transition-colors ${isActive('/help') ? 'text-white font-extrabold border-b-2 border-[#E50914] pb-1' : 'hover:text-white'}`}
              >
                Help Centre
              </Link>
            </>
          )}

          {user && user.role === 'OWNER' && (
            <>
              <Link 
                to="/owner/my-properties" 
                onClick={handleMenuClick}
                className={`transition-colors ${isActive('/owner/my-properties') ? 'text-white font-extrabold border-b-2 border-[#E50914] pb-1' : 'hover:text-white'}`}
              >
                Portfolio
              </Link>
              <Link 
                to="/owner/dashboard" 
                onClick={handleMenuClick}
                className={`transition-colors ${isActive('/owner/dashboard') ? 'text-white font-extrabold border-b-2 border-[#E50914] pb-1' : 'hover:text-white'}`}
              >
                Console Dashboard
              </Link>
              <Link 
                to="/owner/add-property" 
                onClick={handleMenuClick}
                className={`transition-colors flex items-center gap-1 ${isActive('/owner/add-property') ? 'text-white font-extrabold border-b-2 border-[#E50914] pb-1' : 'hover:text-white'}`}
              >
                <PlusCircle size={14} className="text-[#E50914]" /> List PG
              </Link>
              <Link 
                to="/verify-identity" 
                onClick={handleMenuClick}
                className={`transition-colors ${isActive('/verify-identity') ? 'text-white font-extrabold border-b-2 border-[#E50914] pb-1' : 'hover:text-white'}`}
              >
                KYC & Compliance
              </Link>
            </>
          )}

          {user && user.role === 'ADMIN' && (
            <>
              <Link 
                to="/admin/dashboard" 
                onClick={handleMenuClick}
                className={`transition-colors ${isActive('/admin/dashboard') ? 'text-white font-extrabold border-b-2 border-[#E50914] pb-1' : 'hover:text-white'}`}
              >
                Command Console
              </Link>
              <Link 
                to="/admin/verify-users" 
                onClick={handleMenuClick}
                className={`transition-colors ${isActive('/admin/verify-users') ? 'text-white font-extrabold border-b-2 border-[#E50914] pb-1' : 'hover:text-white'}`}
              >
                KYC & Deeds Queue
              </Link>
              <Link 
                to="/admin/dashboard?tab=deals" 
                onClick={handleMenuClick}
                className="hover:text-white transition-colors"
              >
                Deals & Commercials
              </Link>
            </>
          )}
        </nav>
      </div>

      {/* Right Controls: Concierge, Notifications, Avatar Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Concierge Chat Trigger */}
        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="relative flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-600 text-neutral-200 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer"
          title="Open Concierge Support"
        >
          <span className="w-2 h-2 rounded-full bg-[#46D369] animate-pulse"></span>
          <MessageSquare className="w-3.5 h-3.5 text-[#E50914]" />
          <span className="hidden sm:inline">Concierge</span>
        </button>

        {/* Activity & Notifications Bell */}
        {user && (
          <button 
            onClick={() => {
              handleMenuClick();
              navigate('/notifications');
            }}
            className="relative p-2 rounded-full bg-neutral-900 border border-neutral-800 hover:border-neutral-600 text-neutral-300 hover:text-white transition cursor-pointer"
            title="Activity & Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#E50914] animate-ping" />
            )}
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#E50914]" />
            )}
          </button>
        )}

        {/* User Avatar & Dropdown */}
        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 p-1 pl-1 pr-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-600 transition cursor-pointer group"
              title={`${user.firstName} ${user.lastName} - Profile`}
            >
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.firstName}
                  className="w-7 h-7 rounded-lg object-cover border border-[#E50914]/40" 
                />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-[#E50914] text-white flex items-center justify-center font-black text-xs ring-1 ring-transparent group-hover:ring-white transition shadow">
                  {getInitials()}
                </div>
              )}
              <span className="text-xs font-bold text-neutral-200 hidden sm:inline max-w-[80px] truncate">
                {user.firstName}
              </span>
              <ChevronDown size={12} className={`text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#E50914]' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
              <div className="absolute right-0 top-11 w-64 bg-[#141414] rounded-2xl shadow-2xl border border-neutral-800 p-2 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3.5 py-3 border-b border-neutral-800/80 mb-1.5 bg-[#181818] rounded-xl flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#E50914] text-white flex items-center justify-center font-black text-sm shrink-0 shadow">
                    {getInitials()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-black text-white truncate">{user.firstName} {user.lastName}</p>
                      <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded-full bg-[#E50914]/20 text-[#E50914] border border-[#E50914]/30">
                        {user.role}
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-400 truncate">{user.email}</p>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <Link 
                    to="/profile" 
                    onClick={handleMenuClick} 
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-neutral-300 hover:text-white hover:bg-neutral-800/80 rounded-xl transition group"
                  >
                    <User size={15} className="text-neutral-400 group-hover:text-[#E50914]" /> Profile Details
                  </Link>

                  {user.role === 'TENANT' && (
                    <>
                      <Link 
                        to="/my-bookings" 
                        onClick={handleMenuClick} 
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-neutral-300 hover:text-white hover:bg-neutral-800/80 rounded-xl transition"
                      >
                        <HomeIcon size={15} className="text-neutral-400" /> My Stays
                      </Link>
                      <Link 
                        to="/profile?tab=wishlist" 
                        onClick={handleMenuClick} 
                        className="flex items-center justify-between px-3 py-2 text-xs font-bold text-neutral-300 hover:text-white hover:bg-neutral-800/80 rounded-xl transition group"
                      >
                        <div className="flex items-center gap-2.5">
                          <Heart size={15} className="text-neutral-400 group-hover:text-[#E50914]" /> Wishlist
                        </div>
                        {wishlistIds && wishlistIds.size > 0 && (
                          <span className="text-[9px] font-black bg-[#E50914] text-white px-1.5 py-0.2 rounded-full">
                            {wishlistIds.size}
                          </span>
                        )}
                      </Link>
                    </>
                  )}

                  {user.role === 'OWNER' && (
                    <>
                      <Link 
                        to="/owner/dashboard" 
                        onClick={handleMenuClick} 
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-neutral-300 hover:text-white hover:bg-neutral-800/80 rounded-xl transition"
                      >
                        <LayoutDashboard size={15} className="text-neutral-400" /> Owner Console
                      </Link>
                      <Link 
                        to="/verify-identity" 
                        onClick={handleMenuClick} 
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-neutral-300 hover:text-white hover:bg-neutral-800/80 rounded-xl transition"
                      >
                        <ShieldCheck size={15} className="text-[#46D369]" /> KYC Verification
                      </Link>
                    </>
                  )}

                  {user.role === 'ADMIN' && (
                    <>
                      <Link 
                        to="/admin/dashboard" 
                        onClick={handleMenuClick} 
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-neutral-300 hover:text-white hover:bg-neutral-800/80 rounded-xl transition"
                      >
                        <BarChart3 size={15} className="text-[#E50914]" /> Admin Dashboard
                      </Link>
                      <Link 
                        to="/admin/verify-users" 
                        onClick={handleMenuClick} 
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-neutral-300 hover:text-white hover:bg-neutral-800/80 rounded-xl transition"
                      >
                        <ShieldCheck size={15} className="text-[#46D369]" /> KYC Approvals
                      </Link>
                    </>
                  )}

                  <Link 
                    to="/help" 
                    onClick={handleMenuClick} 
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-neutral-400 hover:text-white hover:bg-neutral-800/80 rounded-xl transition"
                  >
                    <HelpCircle size={15} /> Help Centre
                  </Link>
                </div>

                <div className="border-t border-neutral-800 mt-1.5 pt-1.5">
                  <button 
                    onClick={handleSignOut} 
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[#E50914] hover:bg-[#E50914]/10 rounded-xl transition cursor-pointer text-left"
                  >
                    <LogOut size={15} /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link 
              to="/login" 
              onClick={handleMenuClick}
              className="btn-red-glow text-white px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wide transition shadow"
            >
              Sign In
            </Link>
          </div>
        )}

        {/* Mobile Menu Toggle Button */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white transition cursor-pointer"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-[60px] left-0 right-0 bg-[#0d0d0d] border-b border-neutral-800 p-5 space-y-3 shadow-2xl z-50 animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col space-y-2 text-sm font-semibold">
            {(!user || user.role === 'TENANT') && (
              <>
                <Link to="/search" onClick={handleMenuClick} className="py-2 px-3 rounded-lg hover:bg-neutral-900 text-neutral-200">
                  Browse Stays
                </Link>
                <Link to="/" onClick={handleMenuClick} className="py-2 px-3 rounded-lg hover:bg-neutral-900 text-neutral-200">
                  Trending
                </Link>
                {user && (
                  <Link to="/my-bookings" onClick={handleMenuClick} className="py-2 px-3 rounded-lg hover:bg-neutral-900 text-neutral-200">
                    My Stays
                  </Link>
                )}
                {user && (
                  <Link to="/profile?tab=wishlist" onClick={handleMenuClick} className="py-2 px-3 rounded-lg hover:bg-neutral-900 text-neutral-200">
                    Wishlist ({wishlistIds ? wishlistIds.size : 0})
                  </Link>
                )}
                {user && (
                  <Link to="/profile" onClick={handleMenuClick} className="py-2 px-3 rounded-lg hover:bg-neutral-900 text-neutral-200">
                    Profile
                  </Link>
                )}
                <Link to="/help" onClick={handleMenuClick} className="py-2 px-3 rounded-lg hover:bg-neutral-900 text-neutral-200">
                  Help Centre
                </Link>
              </>
            )}

            {user && user.role === 'OWNER' && (
              <>
                <Link to="/owner/my-properties" onClick={handleMenuClick} className="py-2 px-3 rounded-lg hover:bg-neutral-900 text-neutral-200">
                  Portfolio
                </Link>
                <Link to="/owner/dashboard" onClick={handleMenuClick} className="py-2 px-3 rounded-lg hover:bg-neutral-900 text-neutral-200">
                  Console Dashboard
                </Link>
                <Link to="/owner/add-property" onClick={handleMenuClick} className="py-2 px-3 rounded-lg hover:bg-neutral-900 text-neutral-200">
                  + List PG
                </Link>
                <Link to="/verify-identity" onClick={handleMenuClick} className="py-2 px-3 rounded-lg hover:bg-neutral-900 text-neutral-200">
                  KYC & Compliance
                </Link>
              </>
            )}

            {user && user.role === 'ADMIN' && (
              <>
                <Link to="/admin/dashboard" onClick={handleMenuClick} className="py-2 px-3 rounded-lg hover:bg-neutral-900 text-neutral-200">
                  Command Console
                </Link>
                <Link to="/admin/verify-users" onClick={handleMenuClick} className="py-2 px-3 rounded-lg hover:bg-neutral-900 text-neutral-200">
                  KYC & Deeds Queue
                </Link>
                <Link to="/admin/dashboard?tab=deals" onClick={handleMenuClick} className="py-2 px-3 rounded-lg hover:bg-neutral-900 text-neutral-200">
                  Deals & Commercials
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
