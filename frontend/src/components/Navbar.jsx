import { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { User, LogOut, LayoutDashboard, Home, Heart, ShieldCheck, HelpCircle, ChevronDown, Bell } from 'lucide-react';
import API from '../api/client';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // 󾠮 Notification Logic
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const { data } = await API.get('/notifications/unread-count');
        setUnreadCount(data.count);
      } catch (err) { console.error("Notif Fetch Error", err); }
    };
    if (user) fetchNotifs();
  }, [user]);

  return (
    <nav className="bg-white border-b border-gray-100 py-4 px-6 flex justify-between items-center sticky top-0 z-50">
      <Link to="/" className="text-2xl font-black text-primary tracking-tighter">PG.FINDER</Link>

      <div className="flex items-center gap-6">

        {/* 󾠯 THE NOTIFICATION BELL */}
        {user && (
          <div className="relative cursor-pointer group" onClick={() => navigate('/notifications')}>
            <Bell size={22} className="text-gray-400 group-hover:text-primary transition-colors" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full font-black border-2 border-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </div>
        )}

      <div className="relative">
        {user ? (
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 p-1 pr-3 rounded-2xl bg-gray-50 hover:bg-gray-100 transition"
            >
              <img 
                src={user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}`} 
                className="w-8 h-8 rounded-xl object-cover" 
              />
              <span className="text-sm font-bold text-gray-700">{user.firstName}</span>
              <ChevronDown size={14} className="text-gray-400" />
            </button>

            {isOpen && (
              <div className="absolute right-0 top-12 w-56 bg-white rounded-3xl shadow-2xl border border-gray-50 p-2 overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-4 py-3 border-b border-gray-50 mb-2">
                  <p className="text-[10px] font-black uppercase text-gray-400">Signed in as</p>
                  <p className="text-sm font-bold text-primary truncate">{user.email}</p>
                </div>

                {/* --- SHARED --- */}
                <Link to="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-xl transition">
                  <User size={18} /> My Profile
                </Link>

                {/* --- TENANT ONLY --- */}
                {user.role === 'TENANT' && (
                  <>
                    <Link to="/my-bookings" className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-xl transition">
                      <Home size={18} /> My Bookings
                    </Link>
                    <Link to="/profile?tab=wishlist" className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-xl transition">
                      <Heart size={18} /> Wishlist
                    </Link>
                  </>
                )}

                {/* --- OWNER ONLY --- */}
                {user.role === 'OWNER' && (
                  <>
                    <Link to="/owner/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-xl transition">
                      <LayoutDashboard size={18} /> Dashboard
                    </Link>
                    <Link to="/verify-identity" className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-xl transition">
                      <ShieldCheck size={18} className="text-secondary" /> Verification
                    </Link>
                  </>
                )}

                {/* --- ADMIN ONLY SECTION --- */}
{user.role === 'ADMIN' && (
  <>
    <div className="px-4 py-2 border-b border-gray-50 mb-2 bg-primary/5 rounded-xl">
      <p className="text-[10px] font-black uppercase text-primary">Admin Matrix</p>
    </div>
    <Link 
      to="/admin/verify-users" 
      className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-900 hover:bg-primary hover:text-white rounded-xl transition"
      onClick={() => setIsOpen(false)}
    >
      <ShieldCheck size={18} /> KYC Approval Queue
    </Link>
    <Link 
      to="/admin/dashboard" 
      className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-xl transition"
      onClick={() => setIsOpen(false)}
    >
      <LayoutDashboard size={18} /> Platform Analytics
    </Link>
  </>
)}

                <div className="border-t border-gray-50 mt-2 pt-2">
                  <Link to="/help" className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-xl transition">
                    <HelpCircle size={18} /> Help Center
                  </Link>
                  <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-accent hover:bg-red-50 rounded-xl transition">
                    <LogOut size={18} /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" className="bg-primary text-white px-6 py-2.5 rounded-2xl font-bold text-sm">Login</Link>
        )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;