import { useState, useEffect } from 'react';
import API from '../../api/client';
import { useChat } from '../../context/ChatContext';
import { 
  Calendar, User, Home, ArrowRight, Loader2, 
  CheckCircle2, LogOut, RefreshCcw, DollarSign, 
  CreditCard, Search, ArrowUpRight, ChevronRight,
  Wrench, Clock, MessageSquare, Star, Hash, AlertTriangle,
  Inbox, CheckCheck, Send, Receipt, FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ReceiptModal from '../../components/modals/ReceiptModal';

const OwnerDashboard = () => {
  const [activeTab, setActiveTab] = useState('live'); 
  const [bookings, setBookings] = useState([]);
  const [tickets, setTickets] = useState([]); // Maintenance State
  const [loading, setLoading] = useState(true);
  const [actionBooking, setActionBooking] = useState(null); 
  const [selectedReceiptBooking, setSelectedReceiptBooking] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState({}); // Per-ticket resolution note state
  const [resolvingId, setResolvingId] = useState(null);
  const [customDate, setCustomDate] = useState(new Date().toISOString().slice(0, 16));

  const { socket } = useChat();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // 1. Fetch bookings
      const res = await API.get('/bookings/owner-bookings');
      setBookings(res.data.data || []);

      // 2. Fetch all tickets for owner's properties
      try {
        const ticketRes = await API.get('/maintenance/owner/all');
        setTickets(ticketRes.data.data || []);
      } catch (ticketError) {
        console.warn("Maintenance feature backend error:", ticketError);
        setTickets([]);
      }

    } catch (err) { 
      console.error("Dashboard Load Error:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchDashboardData(); 
  }, []);

  // Real-time socket listener for live ticket updates without page refresh
  useEffect(() => {
    if (!socket) return;

    const handleNewTicket = (newTicket) => {
      setTickets((prev) => {
        // Prevent duplicate if already in state
        if (prev.some((t) => t._id === newTicket._id)) return prev;
        return [newTicket, ...prev];
      });
    };

    const handleTicketUpdated = (updatedTicket) => {
      setTickets((prev) =>
        prev.map((t) => (t._id === updatedTicket._id ? updatedTicket : t))
      );
    };

    socket.on('new_maintenance_ticket', handleNewTicket);
    socket.on('ticket_updated', handleTicketUpdated);

    return () => {
      socket.off('new_maintenance_ticket', handleNewTicket);
      socket.off('ticket_updated', handleTicketUpdated);
    };
  }, [socket]);

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      await API.patch(`/bookings/${bookingId}/status`, { status: newStatus, actualDate: customDate });
      alert(`Status updated to ${newStatus}`);
      setActionBooking(null);
      fetchDashboardData();
    } catch (err) { 
      alert(err.response?.data?.message || "Operation failed."); 
    }
  };

  const handleResolveTicket = async (ticketId) => {
    const note = resolutionNotes[ticketId]?.trim();
    if (!note) return alert("Please type a resolution note before marking it solved.");

    try {
      setResolvingId(ticketId);
      const { data } = await API.patch(`/maintenance/${ticketId}/respond`, { 
        status: 'RESOLVED', 
        resolutionNote: note 
      });

      alert("Issue marked as Resolved! Tenant has been notified.");
      
      // Update local state immediately so it moves from Pending to Service History
      setTickets((prev) =>
        prev.map((t) => (t._id === ticketId ? data.data : t))
      );

      setResolutionNotes((prev) => {
        const copy = { ...prev };
        delete copy[ticketId];
        return copy;
      });
    } catch (err) { 
      alert(err.response?.data?.message || "Error resolving ticket"); 
    } finally {
      setResolvingId(null);
    }
  };

  const pendingTickets = tickets.filter(t => t.status !== 'RESOLVED');
  const resolvedTickets = tickets.filter(t => t.status === 'RESOLVED');

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
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
        <div>
          <h1 className="text-6xl font-black italic tracking-tighter text-gray-900 leading-none">Portal.</h1>
          <div className="flex flex-wrap gap-3 mt-6">
            <button 
              onClick={() => setActiveTab('live')} 
              className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'live' ? 'bg-gray-900 text-white shadow-xl' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              Live Occupancy
            </button>
            <button 
              onClick={() => setActiveTab('ledger')} 
              className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'ledger' ? 'bg-gray-900 text-white shadow-xl' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              Transaction Ledger
            </button>
            <button 
              onClick={() => setActiveTab('pending_tasks')} 
              className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition flex items-center gap-2 ${activeTab === 'pending_tasks' ? 'bg-red-500 text-white shadow-xl' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              <span>Pending Tasks</span>
              {pendingTickets.length > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${activeTab === 'pending_tasks' ? 'bg-white text-red-500' : 'bg-red-500 text-white animate-pulse'}`}>
                  {pendingTickets.length}
                </span>
              )}
            </button>
            <button 
              onClick={() => setActiveTab('service_history')} 
              className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition flex items-center gap-2 ${activeTab === 'service_history' ? 'bg-gray-900 text-white shadow-xl' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              <span>Service History</span>
              {resolvedTickets.length > 0 && (
                <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-[9px] font-black">
                  {resolvedTickets.length}
                </span>
              )}
            </button>
          </div>
        </div>
        <div className="flex gap-4">
          <Link to="/owner/my-properties" className="bg-white border-2 border-gray-900 text-gray-900 px-8 py-4 rounded-2xl font-black text-xs uppercase shadow-sm hover:bg-gray-900 hover:text-white transition">Inventory</Link>
          <button onClick={fetchDashboardData} className="p-4 bg-gray-50 rounded-2xl text-gray-400 hover:text-primary transition" title="Refresh Data"><RefreshCcw size={20}/></button>
        </div>
      </div>

      {/* 1. TAB: LIVE OCCUPANCY */}
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
                                <div className="flex items-center justify-end gap-2">
                                  {/* View Official Receipt / Voucher for this resident */}
                                  <button
                                    onClick={() => setSelectedReceiptBooking(booking)}
                                    className="p-3 bg-gray-50 hover:bg-gray-900 hover:text-white rounded-2xl text-gray-500 transition shadow-sm"
                                    title="View Guest Receipt & Voucher"
                                  >
                                    <Receipt size={16}/>
                                  </button>

                                  {actionBooking === booking._id ? (
                                      <div className="flex flex-col gap-2 items-end">
                                          <input type="datetime-local" className="p-2 border rounded-xl text-[10px] font-bold border-primary outline-none" value={customDate} onChange={e => setCustomDate(e.target.value)} />
                                          <button onClick={() => handleStatusUpdate(booking._id, booking.status === 'CONFIRMED' ? 'CHECKED_IN' : 'COMPLETED')} className="bg-primary text-white px-4 py-1 rounded-lg text-[9px] font-black uppercase">Confirm</button>
                                      </div>
                                  ) : (
                                      <button onClick={() => { setActionBooking(booking._id); setCustomDate(new Date().toISOString().slice(0, 16)); }} className="bg-gray-900 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase flex items-center gap-1.5 hover:bg-primary transition shadow-md">
                                          {booking.status === 'CONFIRMED' ? 'Log Check-in' : 'Log Check-out'} <ChevronRight size={14}/>
                                      </button>
                                  )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
             </table>
           </div>
        </div>
      )}

      {/* 2. TAB: TRANSACTION LEDGER (Client / Owner Side Receipt Generation) */}
      {activeTab === 'ledger' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white rounded-[4rem] shadow-2xl border border-gray-50 overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-gray-50/50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                    <tr>
                        <th className="p-10">Date</th>
                        <th className="p-10">Tenant</th>
                        <th className="p-10">Amount</th>
                        <th className="p-10 text-right">Tax Invoice / Receipt</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {completedBookings.map(b => (
                        <tr key={b._id} className="hover:bg-gray-50/30 transition">
                            <td className="p-10 font-bold text-xs">{new Date(b.updatedAt).toLocaleDateString()}</td>
                            <td className="p-10 font-black text-gray-900">{b.tenant?.firstName} {b.tenant?.lastName}</td>
                            <td className="p-10 font-black text-gray-900 text-lg">₹{b.totalAmount}</td>
                            <td className="p-10 text-right">
                                <button 
                                  onClick={() => setSelectedReceiptBooking(b)}
                                  className="p-3 bg-blue-50/80 hover:bg-primary text-primary hover:text-white rounded-2xl font-black text-xs transition flex items-center gap-2 ml-auto active:scale-95 shadow-sm border border-blue-100"
                                  title="Generate Official Industry Receipt"
                                >
                                    <Receipt size={16}/>
                                    <span>Generate Receipt</span>
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. TAB: PENDING TASKS (Live & Unfinished requests) */}
      {activeTab === 'pending_tasks' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-2xl font-black text-gray-900 italic tracking-tight">Active Maintenance Requests</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Live queue of tickets requiring resolution</p>
            </div>
            <div className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-1.5 rounded-full text-xs font-black">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              <span>Live Synced</span>
            </div>
          </div>

          {pendingTickets.length > 0 ? pendingTickets.map(t => (
            <div key={t._id} className="bg-white p-10 rounded-[3.5rem] border border-red-100 shadow-xl flex flex-col lg:flex-row justify-between gap-8 transition-all hover:shadow-2xl">
              <div className="flex-1 space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="p-3.5 rounded-2xl bg-red-50 text-red-500">
                    <Wrench size={22}/>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                        {t.property?.title || "Property"}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase bg-gray-100 px-2.5 py-1 rounded-lg">
                        {t.room?.roomNumber ? `Room ${t.room.roomNumber}` : (t.room?.roomType ? `Unit: ${t.room.roomType}` : 'Assigned Room')}
                      </span>
                      <span className="text-[10px] font-black uppercase text-red-600 bg-red-50 px-2.5 py-1 rounded-lg">
                        Priority: {t.priority || 'MEDIUM'}
                      </span>
                    </div>
                    <h4 className="text-3xl font-black text-gray-900 italic tracking-tighter mt-1">
                      {t.issueType} <span className="not-italic text-xs font-bold text-gray-400 ml-2">Ticket #{t._id.slice(-6).toUpperCase()}</span>
                    </h4>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Issue Description</p>
                  <p className="text-gray-800 font-medium italic text-base leading-relaxed">"{t.description}"</p>
                </div>

                <div className="flex flex-wrap gap-6 text-[10px] font-black uppercase text-gray-400">
                  <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl text-gray-600">
                    <User size={13} className="text-primary"/> Tenant: {t.tenant?.firstName} {t.tenant?.lastName} ({t.tenant?.email})
                  </span>
                  <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl">
                    <Clock size={13}/> Raised: {new Date(t.createdAt).toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1.5 bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-xl">
                    Status: {t.status}
                  </span>
                </div>
              </div>

              {/* ACTION: RESOLVE ISSUE */}
              <div className="w-full lg:w-96 flex flex-col justify-between bg-gray-950 p-7 rounded-[2.8rem] space-y-4 shadow-xl">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2 block flex items-center gap-1.5">
                    <MessageSquare size={13} className="text-primary"/> Resolution Reply for Tenant
                  </label>
                  <textarea 
                    value={resolutionNotes[t._id] || ''}
                    onChange={(e) => setResolutionNotes({ ...resolutionNotes, [t._id]: e.target.value })}
                    className="w-full bg-white/10 text-white placeholder-gray-400 p-4 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-primary border border-transparent h-28 resize-none transition" 
                    placeholder="E.g. Plumber replaced the leaking pipe. Work completed successfully." 
                  />
                </div>
                <button 
                  onClick={() => handleResolveTicket(t._id)}
                  disabled={resolvingId === t._id}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-wider hover:bg-white hover:text-primary transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                >
                  {resolvingId === t._id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <CheckCheck size={16}/>
                  )}
                  <span>Confirm Fix & Move to History</span>
                </button>
              </div>
            </div>
          )) : (
            <div className="text-center py-24 bg-white rounded-[3.5rem] border-2 border-dashed border-gray-100 p-12">
              <CheckCircle2 size={56} className="mx-auto mb-4 text-green-400"/>
              <h4 className="text-xl font-black text-gray-900 tracking-tight">All Tasks Finished!</h4>
              <p className="font-bold text-gray-400 text-xs mt-1 uppercase tracking-widest">No pending maintenance requests right now.</p>
            </div>
          )}
        </div>
      )}

      {/* 4. TAB: SERVICE HISTORY (Finished/Resolved tasks only) */}
      {activeTab === 'service_history' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-2xl font-black text-gray-900 italic tracking-tight">Resolved Service History</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Archive of resolved tickets with manager replies and resident ratings</p>
            </div>
            <span className="text-xs font-black uppercase text-gray-400 bg-gray-100 px-4 py-1.5 rounded-full">
              {resolvedTickets.length} Completed
            </span>
          </div>

          {resolvedTickets.length > 0 ? resolvedTickets.map(t => {
            const duration = t.resolvedAt ? Math.max(1, Math.round((new Date(t.resolvedAt) - new Date(t.createdAt)) / (1000 * 60 * 60))) : null;

            return (
              <div key={t._id} className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-xl flex flex-col lg:flex-row justify-between gap-8">
                <div className="flex-1 space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="p-3.5 rounded-2xl bg-green-50 text-green-600">
                      <CheckCircle2 size={24}/>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg">
                          {t.property?.title || "Property"}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase bg-gray-100 px-2.5 py-1 rounded-lg">
                          {t.room?.roomNumber ? `Room ${t.room.roomNumber}` : (t.room?.roomType ? `Unit: ${t.room.roomType}` : 'Room')}
                        </span>
                        <span className="text-[10px] font-black uppercase text-green-700 bg-green-50 px-2.5 py-1 rounded-lg">
                          Solved
                        </span>
                      </div>
                      <h4 className="text-3xl font-black text-gray-900 italic tracking-tighter mt-1">
                        {t.issueType} <span className="not-italic text-xs font-bold text-gray-400 ml-2">Ticket #{t._id.slice(-6).toUpperCase()}</span>
                      </h4>
                    </div>
                  </div>

                  <p className="text-gray-700 font-medium italic bg-gray-50 p-6 rounded-[2rem]">"{t.description}"</p>

                  <div className="flex flex-wrap gap-6 text-[10px] font-black uppercase text-gray-400">
                    <span className="flex items-center gap-1.5"><User size={12}/> Tenant: {t.tenant?.firstName} {t.tenant?.lastName}</span>
                    <span className="flex items-center gap-1.5"><Clock size={12}/> Reported: {new Date(t.createdAt).toLocaleDateString()}</span>
                    {t.resolvedAt && (
                      <span className="flex items-center gap-1.5 text-green-600"><CheckCircle2 size={12}/> Resolved: {new Date(t.resolvedAt).toLocaleDateString()} ({duration}h turnaround)</span>
                    )}
                    {t.userRating && (
                      <span className="flex items-center gap-1 text-yellow-500 font-black"><Star size={12} fill="currentColor"/> {t.userRating} Star Rating</span>
                    )}
                  </div>
                </div>

                <div className="w-full lg:w-96 flex flex-col justify-center items-stretch bg-gray-50 rounded-[2.8rem] p-7 border-2 border-dashed border-gray-100">
                  <div className="flex items-center gap-2 mb-2 text-green-600">
                    <CheckCheck size={18}/>
                    <span className="text-[10px] font-black uppercase tracking-wider">Manager Resolution</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900 bg-white p-5 rounded-2xl shadow-sm border border-gray-100 italic">
                    "{t.resolutionNote || 'Ticket marked resolved by owner.'}"
                  </p>
                  {t.userFeedback && (
                    <div className="mt-3 text-xs text-gray-500 italic bg-yellow-50/50 p-3 rounded-xl border border-yellow-100">
                      <span className="font-bold text-[9px] uppercase text-yellow-700 not-italic block">Tenant Feedback:</span>
                      "{t.userFeedback}"
                    </div>
                  )}
                </div>
              </div>
            );
          }) : (
            <div className="text-center py-24 bg-white rounded-[3.5rem] border-2 border-dashed border-gray-100 p-12">
              <Inbox size={56} className="mx-auto mb-4 text-gray-300"/>
              <h4 className="text-xl font-black text-gray-900 tracking-tight">No Service History Yet</h4>
              <p className="font-bold text-gray-400 text-xs mt-1 uppercase tracking-widest">Finished tasks will be archived here once resolved.</p>
            </div>
          )}
        </div>
      )}

      {/* OFFICIAL INDUSTRY-GRADE TAX INVOICE & RECEIPT (CLIENT / OWNER SIDE) */}
      {selectedReceiptBooking && (
        <ReceiptModal 
          booking={selectedReceiptBooking} 
          onClose={() => setSelectedReceiptBooking(null)} 
        />
      )}
    </div>
  );
};

export default OwnerDashboard;
