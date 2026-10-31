import { useState, useEffect } from 'react';
import API from '../api/client';
import { Bell, CheckCircle, XCircle, Clock, Loader2, ArrowLeft, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchNotifs = async () => {
    try {
      const { data } = await API.get('/notifications');
      setNotifications(data.data || []);
      // Automatically mark all as read when opening this page
      await API.put('/notifications/mark-read');
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchNotifs(); 
  }, []);

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="animate-spin text-primary" size={40} />
    </div>
  );

  const getNotificationIcon = (n) => {
    if (n.type === 'MAINTENANCE' || n.title.includes('Ticket')) {
      if (n.title.includes('Solved') || n.title.includes('Resolved')) {
        return (
          <div className="p-3 rounded-2xl bg-green-100 text-green-600">
            <CheckCircle size={20}/>
          </div>
        );
      }
      return (
        <div className="p-3 rounded-2xl bg-amber-100 text-amber-600">
          <Wrench size={20}/>
        </div>
      );
    }

    if (n.title.includes('Approved') || n.title.includes('Verified')) {
      return (
        <div className="p-3 rounded-2xl bg-green-100 text-green-600">
          <CheckCircle size={20}/>
        </div>
      );
    }

    return (
      <div className="p-3 rounded-2xl bg-red-100 text-red-600">
        <XCircle size={20}/>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <header className="mb-12 flex justify-between items-end">
        <div>
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 mb-2 hover:text-primary transition">
            <ArrowLeft size={14}/> Go Back
          </button>
          <h1 className="text-5xl font-black italic tracking-tighter">Activity.</h1>
        </div>
        <Bell size={40} className="text-gray-100" />
      </header>

      <div className="space-y-4">
        {notifications.length > 0 ? notifications.map(n => (
          <div key={n._id} className={`p-8 rounded-[2.5rem] border transition shadow-sm ${n.isRead ? 'bg-white border-gray-100' : 'bg-blue-50/30 border-blue-100 shadow-blue-50'}`}>
            <div className="flex gap-6 items-start">
              {getNotificationIcon(n)}
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-black text-lg text-gray-900">{n.title}</h3>
                  <span className="text-[10px] font-black text-gray-400 flex items-center gap-1 uppercase">
                    <Clock size={10}/> {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-600 font-medium leading-relaxed">{n.message}</p>
                
                {n.relatedId && n.title.includes('Rejected') && (
                  <button 
                    onClick={() => navigate('/owner/my-properties')}
                    className="mt-4 text-[10px] font-black text-primary uppercase underline tracking-widest"
                  >
                    Fix Listing Now
                  </button>
                )}

                {n.type === 'MAINTENANCE' && (
                  <button 
                    onClick={() => {
                      if (n.title.includes('New Maintenance Ticket')) {
                        navigate('/owner/dashboard');
                      } else {
                        navigate('/my-bookings');
                      }
                    }}
                    className="mt-4 inline-block text-[10px] font-black text-primary uppercase tracking-wider hover:underline"
                  >
                    {n.title.includes('New Maintenance Ticket') ? 'View in Owner Portal →' : 'View in My Bookings →'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )) : (
          <div className="py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
             <p className="font-black text-gray-300 uppercase italic">No activity yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
