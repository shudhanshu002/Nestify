import { useState, useEffect } from 'react';
import API from '../../api/client';
import { 
  Calendar, User, Home, ArrowRight, Loader2, 
  CheckCircle2, LogOut, RefreshCcw, DollarSign, 
  CreditCard, Search, ArrowUpRight, ChevronRight,
  Wrench, Clock, MessageSquare, Star, Hash, AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';

const OwnerDashboard = () => {
  const [activeTab, setActiveTab] = useState('live'); 
  const [bookings, setBookings] = useState([]);
  const [tickets, setTickets] = useState([]); // Maintenance State
  const [loading, setLoading] = useState(true);
  const [actionBooking, setActionBooking] = useState(null); 
  const [resolutionNote, setResolutionNote] = useState("");
  const [customDate, setCustomDate] = useState(new Date().toISOString().slice(0, 16));

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // 1. Restore original working fetch
      const res = await API.get('/bookings/owner-bookings');
      setBookings(res.data.data || []);

      // 2. Add maintenance fetch with a "Safety Guard"
      try {
        const ticketRes = await API.get('/maintenance/owner/all');
        setTickets(ticketRes.data.data || []);
      } catch (ticketError) {
        console.warn("Maintenance feature backend not ready yet.");
        setTickets([]); // Default to empty so UI doesn't crash
      }

    } catch (err) { 
      console.error("Dashboard Load Error:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchDashboardData(); }, []);

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      await API.patch(`/bookings/${bookingId}/status`, { status: newStatus, actualDate: customDate });
      alert(`Status updated to ${newStatus}`);
      setActionBooking(null);
      fetchDashboardData();
    } catch (err) { alert(err.response?.data?.message || "Operation failed."); }
  };

  const handleResolveTicket = async (ticketId) => {
    if (!resolutionNote) return alert("Please type a resolution note.");
    try {
      await API.patch(`/maintenance/${ticketId}/respond`, { status: 'RESOLVED', resolutionNote });
      alert("Issue Resolved!");
      setResolutionNote("");
      fetchDashboardData();
    } catch (err) { alert("Error resolving ticket"); }
  };

  const completedBookings = bookings.filter(b => b?.status === 'COMPLETED');
  const totalRevenue = completedBookings.reduce((sum, b) => sum + (b?.totalAmount || 0), 0);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <Loader2 className="animate-spin text-primary mb-4" size={40}/>
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">Syncing Manager Portal</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto py-12 px-6">
      
      {/* HEADER SECTION - SAME AS OLD CODE */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
        <div>
          <h1 className="text-6xl font-black italic tracking-tighter text-gray-900 leading-none">Portal.</h1>
          <div className="flex gap-4 mt-6">
            <button onClick={() => setActiveTab('live')} className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'live' ? 'bg-gray-900 text-white shadow-xl' : 'bg-gray-100 text-gray-400'}`}>Live Occupancy</button>
            <button onClick={() => setActiveTab('ledger')} className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'ledger' ? 'bg-gray-900 text-white shadow-xl' : 'bg-gray-100 text-gray-400'}`}>Transaction Ledger</button>
            <button onClick={() => setActiveTab('queries')} className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'queries' ? 'bg-gray-900 text-white shadow-xl' : 'bg-gray-100 text-gray-400'}`}>
                Service History {tickets.length > 0 && <span className="text-primary ml-1">({tickets.length})</span>}
            </button>
          </div>
        </div>
        <div className="flex gap-4">
          <Link to="/owner/my-properties" className="bg-white border-2 border-gray-900 text-gray-900 px-8 py-4 rounded-2xl font-black text-xs uppercase shadow-sm">Inventory</Link>
          <button onClick={fetchDashboardData} className="p-4 bg-gray-50 rounded-2xl text-gray-400 hover:text-primary transition"><RefreshCcw size={20}/></button>
        </div>
      </div>

      {/* 󾠮 TAB: LIVE OCCUPANCY (RESTORED) */}
      {activeTab === 'live' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-gray-900 text-white p-10 rounded-[3rem] shadow-2xl">
                    <p className="text-[10px] font-black uppercase text-primary mb-1 tracking-widest">Active Guests</p>
                    <h2 className="text-6xl font-black italic">{bookings.filter(b => b.status === 'CHECKED_IN').length}</h2>
                </div>
                <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-black uppercase text-gray-400 mb-1 tracking-widest">Pending Arrivals</p>
                    <h2 className="text-6xl font-black italic text-gray-900">{bookings.filter(b => b.status === 'CONFIRMED').length}</h2>
                </div>
                <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-black uppercase text-gray-400 mb-1 tracking-widest">Revenue Status</p>
                    <h2 className="text-4xl font-black italic text-gray-900">₹{totalRevenue.toLocaleString()}</h2>
                </div>
           </div>

           <div className="bg-white rounded-[4rem] shadow-2xl border border-gray-50 overflow-hidden">
             <table className="w-full text-left">
                <thead className="bg-gray-50/50 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-50">
                    <tr>
                        <th className="p-10">Guest</th>
                        <th className="p-10">Unit</th>
                        <th className="p-10">Duration</th>
                        <th className="p-10 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {bookings.filter(b => b.status !== 'COMPLETED').map(booking => (
                        <tr key={booking._id} className="hover:bg-gray-50/30 transition">
                            <td className="p-10 font-black text-gray-900">
                                {booking.tenant?.firstName} {booking.tenant?.lastName}
                                <p className="text-[10px] text-gray-400 uppercase font-bold">{booking.tenant?.email}</p>
                            </td>
                            <td className="p-10 font-bold text-sm">
                                {booking.property?.title} <br/> 
                                <span className="text-[10px] text-primary uppercase">{booking.room?.roomType}</span>
                            </td>
                            <td className="p-10 text-xs font-black">
                                {new Date(booking.checkInDate).toLocaleDateString()} → {new Date(booking.checkOutDate).toLocaleDateString()}
                            </td>
                            <td className="p-10 text-right">
                                {actionBooking === booking._id ? (
                                    <div className="flex flex-col gap-2 items-end">
                                        <input type="datetime-local" className="p-2 border rounded-xl text-[10px] font-bold border-primary outline-none" value={customDate} onChange={e => setCustomDate(e.target.value)} />
                                        <button onClick={() => handleStatusUpdate(booking._id, booking.status === 'CONFIRMED' ? 'CHECKED_IN' : 'COMPLETED')} className="bg-primary text-white px-4 py-1 rounded-lg text-[9px] font-black uppercase">Confirm</button>
                                    </div>
                                ) : (
                                    <button onClick={() => { setActionBooking(booking._id); setCustomDate(new Date().toISOString().slice(0, 16)); }} className="bg-gray-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2">
                                        {booking.status === 'CONFIRMED' ? 'Log Check-in' : 'Log Check-out'} <ChevronRight size={14}/>
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
             </table>
           </div>
        </div>
      )}

      {/* 󾠯 TAB: TRANSACTION LEDGER (RESTORED) */}
      {activeTab === 'ledger' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white rounded-[4rem] shadow-2xl border border-gray-50 overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-gray-50/50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                    <tr>
                        <th className="p-10">Date</th>
                        <th className="p-10">Tenant</th>
                        <th className="p-10">Amount</th>
                        <th className="p-10 text-right">Receipt</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {completedBookings.map(b => (
                        <tr key={b._id} className="hover:bg-gray-50/30 transition">
                            <td className="p-10 font-bold text-xs">{new Date(b.updatedAt).toLocaleDateString()}</td>
                            <td className="p-10 font-black text-gray-900">{b.tenant?.firstName} {b.tenant?.lastName}</td>
                            <td className="p-10 font-black text-gray-900 text-lg">₹{b.totalAmount}</td>
                            <td className="p-10 text-right">
                                <button className="p-3 bg-gray-100 rounded-xl text-gray-400 hover:bg-gray-900 hover:text-white transition">
                                    <CreditCard size={18}/>
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 󾠰 TAB: MAINTENANCE HISTORY (NEW WORKING VERSION) */}
      {activeTab === 'queries' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {tickets.length > 0 ? tickets.map(t => {
            const duration = t.resolvedAt ? Math.floor((new Date(t.resolvedAt) - new Date(t.createdAt)) / (1000 * 60 * 60)) : null;

            return (
              <div key={t._id} className="bg-white p-10 rounded-[4rem] border border-gray-100 shadow-xl flex flex-col md:flex-row justify-between gap-10">
                <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl ${t.status === 'RESOLVED' ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>
                      <Wrench size={24}/>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.property?.title || "Property"}</p>
                      <h4 className="text-3xl font-black text-gray-900 italic tracking-tighter">
                         {t.issueType} <span className="text-primary not-italic text-sm ml-2 bg-primary/5 px-2 py-1 rounded">Room {t.room?.roomType || 'N/A'}</span>
                      </h4>
                    </div>
                  </div>
                  <p className="text-gray-600 font-medium italic bg-gray-50 p-6 rounded-[2rem]">"{t.description}"</p>
                  <div className="flex gap-6 text-[10px] font-black uppercase text-gray-400">
                     <span className="flex items-center gap-1"><User size={12}/> {t.tenant?.firstName}</span>
                     <span className="flex items-center gap-1"><Clock size={12}/> {new Date(t.createdAt).toLocaleDateString()}</span>
                     {t.status === 'RESOLVED' && t.userRating && (
                        <span className="flex items-center gap-1 text-yellow-500"><Star size={12} fill="currentColor"/> {t.userRating} Star Fix</span>
                     )}
                  </div>
                </div>

                <div className="w-full md:w-96">
                  {t.status !== 'RESOLVED' ? (
                    <div className="bg-gray-900 p-8 rounded-[3rem] space-y-4">
                      <textarea 
                        className="w-full bg-white/10 text-white p-4 rounded-2xl text-xs outline-none focus:border-primary border border-transparent h-24" 
                        placeholder="Resolution message..." 
                        onChange={(e) => setResolutionNote(e.target.value)} 
                      />
                      <button onClick={() => handleResolveTicket(t._id)} className="w-full bg-primary text-white py-4 rounded-2xl font-black text-[10px] uppercase hover:bg-white hover:text-primary transition">Confirm Fix</button>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col justify-center items-center bg-gray-50 rounded-[3rem] p-8 border-2 border-dashed border-gray-100">
                        <CheckCircle2 size={32} className="text-green-500 mb-2"/>
                        <p className="text-[10px] font-black text-gray-400 uppercase">Resolution Logged</p>
                        <p className="text-sm font-bold text-gray-900 mt-2 text-center">"{t.resolutionNote}"</p>
                    </div>
                  )}
                </div>
              </div>
            );
          }) : (
            <div className="text-center py-24 opacity-20"><Wrench size={64} className="mx-auto mb-4"/><p className="font-black uppercase tracking-widest text-sm">No Service History</p></div>
          )}
        </div>
      )}
    </div>
  );
};

export default OwnerDashboard;