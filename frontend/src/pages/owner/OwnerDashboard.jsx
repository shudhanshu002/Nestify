import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import API from '../../api/client';
import { useChat } from '../../context/ChatContext';
import { 
  Building, Calendar, User, Bed, CheckCircle2, Clock, 
  AlertOctagon, RefreshCcw, DollarSign, CreditCard, Search, 
  ArrowRight, ChevronRight, Wrench, MessageSquare, Star, 
  Receipt, ShieldCheck, Plus, CheckCheck, Loader2, ArrowLeft,
  ChevronDown, ChevronUp, Sparkles, Filter, Users, Eye
} from 'lucide-react';
import ReceiptModal from '../../components/modals/ReceiptModal';

const OwnerDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'occupancy';
  const initialPropId = searchParams.get('propertyId') || 'ALL';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedPropertyId, setSelectedPropertyId] = useState(initialPropId);
  const [targetDate, setTargetDate] = useState(new Date().toISOString().slice(0, 10));

  // Data states
  const [occupancyMatrix, setOccupancyMatrix] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [occupancyLoading, setOccupancyLoading] = useState(false);

  // Expanded room history toggles: { [roomId]: boolean }
  const [expandedRooms, setExpandedRooms] = useState({});

  // Action states
  const [actionBooking, setActionBooking] = useState(null);
  const [customActionDate, setCustomActionDate] = useState(new Date().toISOString().slice(0, 16));
  const [selectedReceiptBooking, setSelectedReceiptBooking] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState({});
  const [resolvingId, setResolvingId] = useState(null);

  const { socket } = useChat();

  // 1. Fetch Room & Occupancy Schedule Matrix
  const fetchOccupancyMatrix = useCallback(async (dateStr = targetDate) => {
    try {
      setOccupancyLoading(true);
      const res = await API.get(`/bookings/owner-occupancy?targetDate=${dateStr}`);
      setOccupancyMatrix(res.data.data || []);
    } catch (err) {
      console.error("Occupancy Matrix Error:", err);
    } finally {
      setOccupancyLoading(false);
    }
  }, [targetDate]);

  // 2. Fetch Bookings and Maintenance Tickets
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [bookingsRes, ticketsRes] = await Promise.all([
        API.get('/bookings/owner-bookings'),
        API.get('/maintenance/owner/all').catch(() => ({ data: { data: [] } }))
      ]);

      setBookings(bookingsRes.data.data || []);
      setTickets(ticketsRes.data?.data || []);
      await fetchOccupancyMatrix(targetDate);
    } catch (err) {
      console.error("Dashboard Load Error:", err);
    } finally {
      setLoading(false);
    }
  }, [fetchOccupancyMatrix, targetDate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Sync tab with URL search params
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      return next;
    });
  };

  // Sync property filter with URL
  const handlePropertyFilterChange = (propId) => {
    setSelectedPropertyId(propId);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (propId === 'ALL') {
        next.delete('propertyId');
      } else {
        next.set('propertyId', propId);
      }
      return next;
    });
  };

  // 3. Real-time Socket Listeners for Live Room & Ticket Sync
  useEffect(() => {
    if (!socket) return;

    // Real-time booking inventory update listener (new booking, extension, status change)
    const handleBookingUpdate = () => {
      fetchOccupancyMatrix(targetDate);
      API.get('/bookings/owner-bookings').then(res => setBookings(res.data.data || [])).catch(() => {});
    };

    // Maintenance ticket listeners
    const handleNewTicket = (newTicket) => {
      setTickets(prev => prev.some(t => t._id === newTicket._id) ? prev : [newTicket, ...prev]);
    };

    const handleTicketUpdated = (updatedTicket) => {
      setTickets(prev => prev.map(t => t._id === updatedTicket._id ? updatedTicket : t));
    };

    socket.on('booking_inventory_updated', handleBookingUpdate);
    socket.on('new_maintenance_ticket', handleNewTicket);
    socket.on('ticket_updated', handleTicketUpdated);

    return () => {
      socket.off('booking_inventory_updated', handleBookingUpdate);
      socket.off('new_maintenance_ticket', handleNewTicket);
      socket.off('ticket_updated', handleTicketUpdated);
    };
  }, [socket, targetDate, fetchOccupancyMatrix]);

  // Handle Date Inspector Change
  const handleDateChange = (newDate) => {
    setTargetDate(newDate);
    fetchOccupancyMatrix(newDate);
  };

  // Date shortcut helpers
  const setDateShortcut = (daysFromNow) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    const dateStr = d.toISOString().slice(0, 10);
    setTargetDate(dateStr);
    fetchOccupancyMatrix(dateStr);
  };

  // Update Check-in / Check-out Status
  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      await API.patch(`/bookings/${bookingId}/status`, { 
        status: newStatus, 
        actualDate: customActionDate 
      });
      alert(`Status updated to ${newStatus}`);
      setActionBooking(null);
      fetchOccupancyMatrix(targetDate);
      const res = await API.get('/bookings/owner-bookings');
      setBookings(res.data.data || []);
    } catch (err) {
      alert(err.response?.data?.message || "Operation failed.");
    }
  };

  // Resolve Maintenance Ticket
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
      setTickets(prev => prev.map(t => t._id === ticketId ? data.data : t));
      setResolutionNotes(prev => {
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

  // Filter properties based on property selector
  const filteredMatrix = selectedPropertyId === 'ALL' 
    ? occupancyMatrix 
    : occupancyMatrix.filter(p => p._id === selectedPropertyId);

  // Compute aggregate totals across visible properties
  const aggregateStats = filteredMatrix.reduce((acc, p) => {
    acc.totalUnits += (p.totalUnits || 0);
    acc.totalOccupied += (p.totalOccupiedUnits || 0);
    acc.totalVacant += (p.totalVacantUnits || 0);
    return acc;
  }, { totalUnits: 0, totalOccupied: 0, totalVacant: 0 });

  const overallOccupancyPct = aggregateStats.totalUnits > 0 
    ? Math.round((aggregateStats.totalOccupied / aggregateStats.totalUnits) * 100) 
    : 0;

  const pendingTickets = tickets.filter(t => t.status !== 'RESOLVED');
  const resolvedTickets = tickets.filter(t => t.status === 'RESOLVED');
  const completedBookings = bookings.filter(b => b?.status === 'COMPLETED');
  const totalRevenue = completedBookings.reduce((sum, b) => sum + (b?.totalAmount || 0), 0);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-white">
        <Loader2 className="animate-spin text-primary mb-4" size={40}/>
        <p className="text-xs font-black uppercase tracking-widest text-gray-400">Syncing PG Management Portal...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 text-white space-y-8">
      
      {/* 1. TOP HEADER & PORTAL NAVIGATION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-[#262626]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            <Building size={14} className="text-primary"/> Owner Console • Live Synchronization
          </div>
          <h1 className="text-3xl sm:text-5xl font-black italic tracking-tight text-white leading-tight">
            PG & Room Management
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-1 max-w-xl">
            Inspect real-time room occupancy, track booked vs vacant dates, and manage tenant stays across all your properties.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link 
            to="/owner/my-properties" 
            className="btn-netflix-secondary px-4 py-2.5 rounded-xl font-bold text-xs uppercase flex items-center gap-1.5 transition"
          >
            <Building size={14} /> All Properties
          </Link>
          <Link 
            to="/owner/add-property" 
            className="btn-netflix px-4 py-2.5 rounded-xl font-black text-xs uppercase flex items-center gap-1.5 shadow-lg shadow-red-950/40 transition active:scale-95"
          >
            <Plus size={14} /> List New PG
          </Link>
          <button 
            onClick={fetchDashboardData} 
            className="p-2.5 bg-[#222222] hover:bg-[#2c2c2c] border border-[#333333] rounded-xl text-gray-300 hover:text-white transition cursor-pointer"
            title="Refresh All Real-time Data"
          >
            <RefreshCcw size={16}/>
          </button>
        </div>
      </div>

      {/* 2. TAB CONTROLS (NETFLIX DARK THEME) */}
      <div className="flex bg-[#1a1a1a] p-1.5 rounded-2xl border border-[#2a2a2a] w-full sm:w-fit overflow-x-auto gap-1">
        <button 
          onClick={() => handleTabChange('occupancy')}
          className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'occupancy' 
              ? 'btn-netflix text-white shadow-md' 
              : 'text-gray-400 hover:text-white hover:bg-[#252525]'
          }`}
        >
          <Calendar size={14} />
          <span>Room & Date Schedule</span>
        </button>

        <button 
          onClick={() => handleTabChange('live')}
          className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'live' 
              ? 'btn-netflix text-white shadow-md' 
              : 'text-gray-400 hover:text-white hover:bg-[#252525]'
          }`}
        >
          <Users size={14} />
          <span>Guest Arrivals & Stays</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/20 text-white">
            {bookings.filter(b => ['CONFIRMED', 'CHECKED_IN'].includes(b.status)).length}
          </span>
        </button>

        <button 
          onClick={() => handleTabChange('ledger')}
          className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'ledger' 
              ? 'btn-netflix text-white shadow-md' 
              : 'text-gray-400 hover:text-white hover:bg-[#252525]'
          }`}
        >
          <CreditCard size={14} />
          <span>Financial Ledger</span>
        </button>

        <button 
          onClick={() => handleTabChange('pending_tasks')}
          className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'pending_tasks' 
              ? 'bg-amber-600 text-white shadow-md' 
              : 'text-gray-400 hover:text-white hover:bg-[#252525]'
          }`}
        >
          <Wrench size={14} />
          <span>Service Requests</span>
          {pendingTickets.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white text-amber-900 animate-pulse">
              {pendingTickets.length}
            </span>
          )}
        </button>
      </div>

      {/* =========================================================================
          TAB 1: ROOM & DATE OCCUPANCY SCHEDULE (HERO MANAGEMENT VIEW)
         ========================================================================= */}
      {activeTab === 'occupancy' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* INSPECTOR & PROPERTY FILTER BAR */}
          <div className="bg-[#181818] p-5 sm:p-6 rounded-2xl border border-[#2a2a2a] shadow-xl space-y-5">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
              
              {/* Filter By Property */}
              <div className="flex-1 w-full lg:w-auto">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1.5 flex items-center gap-1.5">
                  <Filter size={12} className="text-primary"/> Select PG Property
                </label>
                <select 
                  value={selectedPropertyId} 
                  onChange={(e) => handlePropertyFilterChange(e.target.value)}
                  className="w-full bg-[#222222] border border-[#333333] text-white text-xs font-bold rounded-xl py-2.5 px-3.5 focus:border-primary outline-none cursor-pointer transition"
                >
                  <option value="ALL">🏢 All Properties ({occupancyMatrix.length} PGs)</option>
                  {occupancyMatrix.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.title} ({p.location?.city || "City"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Inspector Picker */}
              <div className="w-full lg:w-auto flex-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1.5 flex items-center gap-1.5">
                  <Calendar size={12} className="text-primary"/> Check Date Occupancy
                </label>
                <div className="flex items-center gap-2">
                  <input 
                    type="date" 
                    value={targetDate} 
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="flex-1 bg-[#222222] border border-[#333333] text-white text-xs font-bold rounded-xl py-2.5 px-3.5 focus:border-primary outline-none cursor-pointer transition"
                  />
                  {occupancyLoading && <Loader2 size={16} className="animate-spin text-primary" />}
                </div>
              </div>

              {/* Quick Date Shortcuts */}
              <div className="w-full lg:w-auto">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1.5">
                  Quick Time Travel
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button 
                    onClick={() => setDateShortcut(0)}
                    className={`px-3 py-2 rounded-xl text-[11px] font-black uppercase transition cursor-pointer ${
                      targetDate === new Date().toISOString().slice(0, 10)
                        ? 'btn-netflix text-white'
                        : 'bg-[#222222] hover:bg-[#2c2c2c] text-gray-300 border border-[#333333]'
                    }`}
                  >
                    Today
                  </button>
                  <button 
                    onClick={() => setDateShortcut(1)}
                    className="px-3 py-2 rounded-xl text-[11px] font-bold uppercase bg-[#222222] hover:bg-[#2c2c2c] text-gray-300 border border-[#333333] transition cursor-pointer"
                  >
                    Tomorrow
                  </button>
                  <button 
                    onClick={() => setDateShortcut(7)}
                    className="px-3 py-2 rounded-xl text-[11px] font-bold uppercase bg-[#222222] hover:bg-[#2c2c2c] text-gray-300 border border-[#333333] transition cursor-pointer"
                  >
                    +7 Days
                  </button>
                  <button 
                    onClick={() => setDateShortcut(30)}
                    className="px-3 py-2 rounded-xl text-[11px] font-bold uppercase bg-[#222222] hover:bg-[#2c2c2c] text-gray-300 border border-[#333333] transition cursor-pointer"
                  >
                    +30 Days
                  </button>
                </div>
              </div>
            </div>

            {/* LIVE OCCUPANCY BANNER ON TARGET DATE */}
            <div className="pt-4 border-t border-[#262626] grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#202020] p-3.5 rounded-xl border border-[#2e2e2e]">
                <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider block">Inspecting Date</span>
                <p className="text-sm sm:text-base font-black text-white font-mono mt-0.5">
                  {new Date(targetDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>

              <div className="bg-[#202020] p-3.5 rounded-xl border border-[#2e2e2e]">
                <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider block">Total Room Units</span>
                <p className="text-sm sm:text-base font-black text-white font-mono mt-0.5">
                  {aggregateStats.totalUnits} <span className="text-[10px] text-gray-400 font-normal">Beds/Units</span>
                </p>
              </div>

              <div className="bg-[#202020] p-3.5 rounded-xl border border-red-950/60 bg-gradient-to-br from-[#202020] to-red-950/20">
                <span className="text-[9px] font-black uppercase text-red-400 tracking-wider block">Booked Units</span>
                <p className="text-sm sm:text-base font-black text-red-400 font-mono mt-0.5">
                  {aggregateStats.totalOccupied} <span className="text-[10px] text-gray-400 font-normal">Occupied ({overallOccupancyPct}%)</span>
                </p>
              </div>

              <div className="bg-[#202020] p-3.5 rounded-xl border border-emerald-950/60 bg-gradient-to-br from-[#202020] to-emerald-950/20">
                <span className="text-[9px] font-black uppercase text-emerald-400 tracking-wider block">Vacant & Ready</span>
                <p className="text-sm sm:text-base font-black text-emerald-400 font-mono mt-0.5">
                  {aggregateStats.totalVacant} <span className="text-[10px] text-gray-400 font-normal">Available</span>
                </p>
              </div>
            </div>
          </div>

          {/* PROPERTY BY PROPERTY BREAKDOWN */}
          <div className="space-y-8">
            {filteredMatrix.length > 0 ? (
              filteredMatrix.map(property => (
                <div 
                  key={property._id} 
                  className="bg-[#181818] rounded-2xl border border-[#2a2a2a] overflow-hidden shadow-2xl transition hover:border-[#383838]"
                >
                  {/* Property Header Banner */}
                  <div className="p-5 sm:p-6 bg-[#1f1f1f] border-b border-[#2c2c2c] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <img 
                        src={property.images?.[0]?.url || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=300'} 
                        alt={property.title} 
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-[#333333] shadow-md shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] font-black uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
                            {property.category || 'PG'}
                          </span>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 size={10} /> {property.verificationStatus}
                          </span>
                        </div>
                        <h2 className="text-lg sm:text-2xl font-black text-white italic tracking-tight leading-tight">
                          {property.title}
                        </h2>
                        <p className="text-xs text-gray-400 font-medium">
                          {property.location?.address ? `${property.location.address}, ` : ''}{property.location?.city || "Location Pending"}
                        </p>
                      </div>
                    </div>

                    {/* Property Occupancy Badges & Actions */}
                    <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-start md:justify-end">
                      <div className="px-3.5 py-2 rounded-xl bg-[#141414] border border-[#2e2e2e] text-left">
                        <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider block">Occupancy Rate</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-black font-mono text-white">
                            {property.occupancyRate}%
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold">
                            ({property.totalOccupiedUnits}/{property.totalUnits} Units)
                          </span>
                        </div>
                      </div>

                      <Link 
                        to={`/property/${property._id}`} 
                        className="btn-netflix-secondary px-3.5 py-2 rounded-xl text-xs font-bold uppercase flex items-center gap-1.5 transition"
                      >
                        <Eye size={13} /> View Live
                      </Link>
                      <Link 
                        to={`/owner/add-room/${property._id}`} 
                        className="btn-netflix px-3.5 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 shadow-md shadow-red-950/40 transition"
                      >
                        <Plus size={13} /> Add Room
                      </Link>
                    </div>
                  </div>

                  {/* ROOMS MATRIX UNDER THIS PG */}
                  <div className="p-5 sm:p-6 space-y-6">
                    {property.rooms && property.rooms.length > 0 ? (
                      property.rooms.map(room => {
                        const isExpanded = !!expandedRooms[room._id];

                        return (
                          <div 
                            key={room._id} 
                            className="bg-[#1f1f1f] rounded-2xl border border-[#2e2e2e] p-4 sm:p-5 space-y-4"
                          >
                            {/* Room Header Line */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#2c2c2c]">
                              <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-[#292929] rounded-xl text-primary border border-[#383838]">
                                  <Bed size={18} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="text-base sm:text-lg font-black text-white italic tracking-tight">
                                      {room.roomType} UNIT
                                    </h3>
                                    <span className="text-[9px] font-mono font-bold text-gray-400 bg-[#292929] px-2 py-0.5 rounded-md border border-[#383838]">
                                      ₹{room.basePrice?.toLocaleString()} / mo
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-gray-400 font-medium">
                                    Inventory: {room.totalInventory} Units Total • Capacity: {room.totalInventory} Stays
                                  </p>
                                </div>
                              </div>

                              {/* Availability Pill */}
                              <div className="flex items-center gap-2">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                                  room.isFullyBooked
                                    ? 'bg-red-950/50 text-red-400 border border-red-800/50'
                                    : room.availableCount > 0
                                    ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/50'
                                    : 'bg-amber-950/50 text-amber-400 border border-amber-800/50'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${room.isFullyBooked ? 'bg-red-500' : 'bg-emerald-400'}`}></span>
                                  {room.isFullyBooked 
                                    ? `Fully Booked (${room.occupiedCount}/${room.totalInventory})` 
                                    : `${room.availableCount} Vacant • ${room.occupiedCount} Booked`}
                                </span>

                                <button 
                                  onClick={() => setExpandedRooms(prev => ({ ...prev, [room._id]: !prev[room._id] }))}
                                  className="p-1.5 bg-[#292929] hover:bg-[#333333] text-gray-300 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                  title="Toggle Stay Details"
                                >
                                  <span className="text-[10px] font-black uppercase hidden sm:inline">Stays ({room.allBookings?.length || 0})</span>
                                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </button>
                              </div>
                            </div>

                            {/* VISUAL UNIT SLOTS (WHICH ROOM UNITS ARE BOOKED ON WHAT DATE & WHICH ARE NOT BOOKED) */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                                  Bed / Unit Status on {new Date(targetDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}:
                                </span>
                                <span className="text-[10px] font-bold text-gray-400">
                                  {room.availableCount} of {room.totalInventory} Free
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {room.slots && room.slots.map(slot => {
                                  // 1. OCCUPIED ON THIS DATE
                                  if (slot.status === 'BOOKED' && slot.booking) {
                                    const b = slot.booking;
                                    const isCurrentActive = b.status === 'CHECKED_IN';
                                    const checkInStr = new Date(b.checkInDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                                    const checkOutStr = new Date(b.checkOutDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                                    const nights = Math.max(1, Math.round((new Date(b.checkOutDate) - new Date(b.checkInDate)) / (1000 * 60 * 60 * 24)));

                                    return (
                                      <div 
                                        key={slot.slotNumber} 
                                        className="bg-[#242424] border border-red-900/40 rounded-xl p-3.5 space-y-2.5 relative shadow-md hover:border-red-600/50 transition group"
                                      >
                                        <div className="flex items-start justify-between">
                                          <div className="flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-md bg-red-600/20 text-red-400 font-mono text-[10px] font-black flex items-center justify-center border border-red-800/40">
                                              #{slot.slotNumber}
                                            </span>
                                            <span className="text-[10px] font-black uppercase tracking-wider text-red-400 bg-red-950/60 px-2 py-0.5 rounded-md border border-red-900/40">
                                              {isCurrentActive ? "Checked In" : "Confirmed Arrival"}
                                            </span>
                                          </div>

                                          {/* Receipt Trigger */}
                                          <button 
                                            onClick={() => setSelectedReceiptBooking(b)} 
                                            className="p-1 text-gray-400 hover:text-white hover:bg-[#333333] rounded-md transition cursor-pointer"
                                            title="View Resident Receipt"
                                          >
                                            <Receipt size={13} />
                                          </button>
                                        </div>

                                        {/* Resident Info */}
                                        <div className="flex items-center gap-2 pt-1">
                                          <div className="w-7 h-7 rounded-full bg-[#333333] border border-[#444444] flex items-center justify-center text-xs font-black text-white shrink-0">
                                            {b.tenant?.firstName?.[0] || 'G'}
                                          </div>
                                          <div className="min-w-0">
                                            <p className="text-xs font-black text-white truncate leading-tight">
                                              {b.tenant?.firstName} {b.tenant?.lastName}
                                            </p>
                                            <p className="text-[10px] text-gray-400 truncate">
                                              {b.tenant?.phone || b.tenant?.email}
                                            </p>
                                          </div>
                                        </div>

                                        {/* Booked Dates Range */}
                                        <div className="bg-[#1c1c1c] p-2 rounded-lg border border-[#303030] text-[10px] space-y-1">
                                          <div className="flex items-center justify-between text-gray-300 font-mono font-bold">
                                            <span>📅 {checkInStr}</span>
                                            <span>→</span>
                                            <span>{checkOutStr}</span>
                                          </div>
                                          <div className="flex items-center justify-between text-[9px] text-gray-400">
                                            <span>Duration: {nights} Nights</span>
                                            <span className="text-emerald-400 font-bold">₹{b.totalAmount?.toLocaleString()}</span>
                                          </div>
                                          {slot.isExtended && (
                                            <div className="text-[9px] font-black text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/40 mt-1">
                                              ⚡ Stay Extended ({slot.extensions?.length}x)
                                            </div>
                                          )}
                                        </div>

                                        {/* Vacant From Notice & Check-in / Check-out Quick Log */}
                                        <div className="flex items-center justify-between pt-1 border-t border-[#303030]">
                                          <span className="text-[9px] text-gray-400 font-medium">
                                            Frees up: {checkOutStr}
                                          </span>
                                          
                                          {b.status === 'CONFIRMED' ? (
                                            <button 
                                              onClick={() => handleStatusUpdate(b._id, 'CHECKED_IN')}
                                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-[9px] font-black uppercase transition cursor-pointer"
                                            >
                                              Check-In
                                            </button>
                                          ) : b.status === 'CHECKED_IN' ? (
                                            <button 
                                              onClick={() => handleStatusUpdate(b._id, 'COMPLETED')}
                                              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-md text-[9px] font-black uppercase transition cursor-pointer"
                                            >
                                              Check-Out
                                            </button>
                                          ) : null}
                                        </div>
                                      </div>
                                    );
                                  }

                                  // 2. VACANT ON THIS DATE (BUT ARRIVING LATER)
                                  if (slot.status === 'VACANT_UNTIL_UPCOMING') {
                                    const nextIn = new Date(slot.nextCheckInDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

                                    return (
                                      <div 
                                        key={slot.slotNumber} 
                                        className="bg-[#1c1c1c] border border-amber-800/40 border-dashed rounded-xl p-3.5 space-y-2.5 shadow-sm"
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-md bg-amber-600/20 text-amber-400 font-mono text-[10px] font-black flex items-center justify-center border border-amber-800/40">
                                              #{slot.slotNumber}
                                            </span>
                                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-900/40">
                                              Vacant Now
                                            </span>
                                          </div>
                                        </div>

                                        <p className="text-xs font-bold text-gray-200">
                                          Available on Selected Date
                                        </p>
                                        <p className="text-[10px] text-amber-300 font-medium">
                                          Next booking begins on <span className="font-bold font-mono">{nextIn}</span> ({slot.tenant?.firstName || "Guest"}).
                                        </p>

                                        <div className="pt-1 border-t border-[#2a2a2a] text-[9px] text-gray-400 flex items-center justify-between">
                                          <span>Slot #{slot.slotNumber} Ready</span>
                                          <span className="text-emerald-400 font-bold">Free to Host</span>
                                        </div>
                                      </div>
                                    );
                                  }

                                  // 3. COMPLETELY VACANT & READY
                                  return (
                                    <div 
                                      key={slot.slotNumber} 
                                      className="bg-[#1a1a1a] border border-emerald-900/40 border-dashed rounded-xl p-3.5 space-y-2.5 shadow-sm"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <span className="w-5 h-5 rounded-md bg-emerald-600/20 text-emerald-400 font-mono text-[10px] font-black flex items-center justify-center border border-emerald-800/40">
                                            #{slot.slotNumber}
                                          </span>
                                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-900/40">
                                            🟢 Vacant & Available
                                          </span>
                                        </div>
                                      </div>

                                      <p className="text-xs font-bold text-gray-300">
                                        No active bookings
                                      </p>
                                      <p className="text-[10px] text-gray-400">
                                        Open for guest reservations across all future calendar dates.
                                      </p>

                                      <div className="pt-1 border-t border-[#2a2a2a] text-[9px] text-emerald-400 font-bold flex items-center justify-between">
                                        <span>Unit Ready for Check-in</span>
                                        <span>Instant Bookable</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* EXPANDABLE COMPLETE STAY HISTORY FOR THIS ROOM */}
                            {isExpanded && (
                              <div className="pt-3 border-t border-[#2c2c2c] space-y-2 animate-in fade-in duration-200">
                                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-2">
                                  All Logged Reservations & History ({room.allBookings?.length || 0})
                                </span>

                                {room.allBookings && room.allBookings.length > 0 ? (
                                  <div className="divide-y divide-[#2a2a2a] bg-[#171717] rounded-xl border border-[#2c2c2c] overflow-hidden">
                                    {room.allBookings.map(b => (
                                      <div key={b._id} className="p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <span className="font-bold text-white">
                                              {b.tenant?.firstName} {b.tenant?.lastName}
                                            </span>
                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded ${
                                              b.status === 'CHECKED_IN' ? 'bg-red-950 text-red-400 border border-red-800/40' :
                                              b.status === 'CONFIRMED' ? 'bg-blue-950 text-blue-400 border border-blue-800/40' :
                                              'bg-[#282828] text-gray-400'
                                            }`}>
                                              {b.status}
                                            </span>
                                            {b.extensions && b.extensions.length > 0 && (
                                              <span className="text-[9px] font-black text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/40">
                                                Extended
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                                            📅 {new Date(b.checkInDate).toLocaleDateString()} → {new Date(b.checkOutDate).toLocaleDateString()}
                                          </p>
                                        </div>

                                        <div className="flex items-center gap-3">
                                          <span className="font-mono font-bold text-white">
                                            ₹{b.totalAmount?.toLocaleString()}
                                          </span>
                                          <button 
                                            onClick={() => setSelectedReceiptBooking(b)}
                                            className="btn-netflix-secondary px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1"
                                          >
                                            <Receipt size={12}/> Receipt
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-[11px] text-gray-400 italic">No bookings recorded for this room yet.</p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-10 bg-[#161616] rounded-xl border border-[#262626] p-6">
                        <Bed size={32} className="mx-auto text-gray-500 mb-2" />
                        <h4 className="text-sm font-black text-white">No Room Units Configured Yet</h4>
                        <p className="text-xs text-gray-400 mt-1 mb-4">
                          Add rooms and define your inventory units to start tracking real-time availability.
                        </p>
                        <Link 
                          to={`/owner/add-room/${property._id}`}
                          className="btn-netflix px-4 py-2 rounded-xl text-xs font-black uppercase inline-flex items-center gap-1.5"
                        >
                          <Plus size={14} /> Add First Room
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16 bg-[#181818] rounded-2xl border border-[#2a2a2a] p-8">
                <Building size={40} className="mx-auto text-gray-500 mb-3" />
                <h3 className="text-lg font-black text-white">No Properties Found</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                  {selectedPropertyId !== 'ALL' 
                    ? "The selected property has no active listings." 
                    : "You haven't listed any PG properties yet. Add a property to start tracking occupancy."}
                </p>
                <div className="mt-4">
                  <Link 
                    to="/owner/add-property"
                    className="btn-netflix px-5 py-2.5 rounded-xl text-xs font-black uppercase"
                  >
                    + List New PG
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: GUEST ARRIVALS & CHECK-IN / CHECK-OUT QUEUE
         ========================================================================= */}
      {activeTab === 'live' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#181818] p-5 rounded-2xl border border-[#2a2a2a] shadow-lg">
              <span className="text-[10px] font-black uppercase text-primary tracking-wider block">Checked-in Guests</span>
              <h2 className="text-3xl sm:text-4xl font-black italic text-white font-mono mt-1">
                {bookings.filter(b => b.status === 'CHECKED_IN').length}
              </h2>
            </div>
            <div className="bg-[#181818] p-5 rounded-2xl border border-[#2a2a2a] shadow-lg">
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider block">Upcoming Arrivals</span>
              <h2 className="text-3xl sm:text-4xl font-black italic text-white font-mono mt-1">
                {bookings.filter(b => b.status === 'CONFIRMED').length}
              </h2>
            </div>
            <div className="bg-[#181818] p-5 rounded-2xl border border-[#2a2a2a] shadow-lg">
              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider block">Total Stays Completed</span>
              <h2 className="text-3xl sm:text-4xl font-black italic text-white font-mono mt-1">
                {completedBookings.length}
              </h2>
            </div>
          </div>

          <div className="bg-[#181818] rounded-2xl border border-[#2a2a2a] overflow-hidden shadow-xl">
            <div className="p-4 sm:p-5 bg-[#1f1f1f] border-b border-[#2c2c2c] flex items-center justify-between">
              <h3 className="font-black text-sm uppercase tracking-wider text-white">Active Guest Stays & Check-in Queue</h3>
              <span className="text-xs text-gray-400">{bookings.length} Total Bookings</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#161616] text-[10px] font-black uppercase text-gray-400 tracking-wider border-b border-[#262626]">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6">Guest Resident</th>
                    <th className="py-3.5 px-4 sm:px-6">Property & Unit</th>
                    <th className="py-3.5 px-4 sm:px-6">Booked Dates</th>
                    <th className="py-3.5 px-4 sm:px-6">Status</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262626]">
                  {bookings.map(b => (
                    <tr key={b._id} className="hover:bg-[#202020] transition">
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="font-black text-white">{b.tenant?.firstName} {b.tenant?.lastName}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{b.tenant?.email}</div>
                      </td>
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="font-bold text-gray-200">{b.property?.title}</div>
                        <div className="text-[10px] text-primary uppercase font-black">{b.room?.roomType} Unit</div>
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 font-mono font-bold text-gray-300">
                        {new Date(b.checkInDate).toLocaleDateString()} → {new Date(b.checkOutDate).toLocaleDateString()}
                        {b.extensions && b.extensions.length > 0 && (
                          <div className="text-[9px] text-amber-400 font-sans">⚡ Extended stay</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6">
                        <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase ${
                          b.status === 'CHECKED_IN' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40' :
                          b.status === 'CONFIRMED' ? 'bg-blue-950/60 text-blue-400 border border-blue-800/40' :
                          'bg-[#282828] text-gray-400'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setSelectedReceiptBooking(b)} 
                            className="p-2 bg-[#262626] hover:bg-[#333333] text-gray-300 hover:text-white rounded-lg transition"
                            title="View Official Receipt"
                          >
                            <Receipt size={14}/>
                          </button>

                          {actionBooking === b._id ? (
                            <div className="flex flex-col gap-1.5 items-end">
                              <input 
                                type="datetime-local" 
                                className="p-1 bg-[#141414] border border-primary text-[10px] rounded text-white outline-none" 
                                value={customActionDate} 
                                onChange={e => setCustomActionDate(e.target.value)} 
                              />
                              <button 
                                onClick={() => handleStatusUpdate(b._id, b.status === 'CONFIRMED' ? 'CHECKED_IN' : 'COMPLETED')} 
                                className="btn-netflix px-3 py-1 rounded text-[9px] font-black uppercase"
                              >
                                Confirm
                              </button>
                            </div>
                          ) : (
                            b.status !== 'COMPLETED' && (
                              <button 
                                onClick={() => { setActionBooking(b._id); setCustomActionDate(new Date().toISOString().slice(0, 16)); }} 
                                className="px-3 py-1.5 bg-[#252525] hover:bg-primary text-gray-200 hover:text-white rounded-lg font-black text-[10px] uppercase transition flex items-center gap-1 cursor-pointer"
                              >
                                {b.status === 'CONFIRMED' ? 'Log Check-in' : 'Log Check-out'}
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: FINANCIAL LEDGER & RECEIPTS
         ========================================================================= */}
      {activeTab === 'ledger' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#181818] p-5 rounded-2xl border border-[#2a2a2a] shadow-lg">
              <span className="text-[10px] font-black uppercase text-primary tracking-wider block">Total Realized Revenue</span>
              <h2 className="text-3xl sm:text-4xl font-black italic text-white font-mono mt-1">
                ₹{totalRevenue.toLocaleString()}
              </h2>
            </div>
            <div className="bg-[#181818] p-5 rounded-2xl border border-[#2a2a2a] shadow-lg">
              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider block">Settled Transactions</span>
              <h2 className="text-3xl sm:text-4xl font-black italic text-white font-mono mt-1">
                {completedBookings.length}
              </h2>
            </div>
          </div>

          <div className="bg-[#181818] rounded-2xl border border-[#2a2a2a] overflow-hidden shadow-xl">
            <div className="p-4 sm:p-5 bg-[#1f1f1f] border-b border-[#2c2c2c] flex items-center justify-between">
              <h3 className="font-black text-sm uppercase tracking-wider text-white">Transaction History & Tax Invoices</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#161616] text-[10px] font-black uppercase text-gray-400 tracking-wider border-b border-[#262626]">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6">Date</th>
                    <th className="py-3.5 px-4 sm:px-6">Resident</th>
                    <th className="py-3.5 px-4 sm:px-6">Property / Room</th>
                    <th className="py-3.5 px-4 sm:px-6">Gross Amount</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Tax Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262626]">
                  {completedBookings.map(b => (
                    <tr key={b._id} className="hover:bg-[#202020] transition">
                      <td className="py-3.5 px-4 sm:px-6 font-mono text-gray-300">
                        {new Date(b.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 font-black text-white">
                        {b.tenant?.firstName} {b.tenant?.lastName}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-gray-300">
                        {b.property?.title} ({b.room?.roomType})
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 font-mono font-black text-white">
                        ₹{b.totalAmount?.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <button 
                          onClick={() => setSelectedReceiptBooking(b)} 
                          className="btn-netflix px-3 py-1.5 rounded-lg text-xs font-black uppercase inline-flex items-center gap-1.5 transition"
                        >
                          <Receipt size={13}/> Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: PENDING MAINTENANCE TASKS
         ========================================================================= */}
      {activeTab === 'pending_tasks' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black italic text-white tracking-tight">Active Maintenance Requests</h3>
            <span className="text-xs text-amber-400 font-bold bg-amber-950/60 border border-amber-800/40 px-3 py-1 rounded-full">
              {pendingTickets.length} Requiring Action
            </span>
          </div>

          {pendingTickets.length > 0 ? (
            pendingTickets.map(t => (
              <div key={t._id} className="bg-[#181818] p-5 sm:p-6 rounded-2xl border border-amber-900/40 shadow-xl flex flex-col lg:flex-row justify-between gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-lg">
                      {t.property?.title || "Property"}
                    </span>
                    <span className="text-[10px] font-bold uppercase text-gray-400 bg-[#252525] px-2 py-0.5 rounded-lg">
                      Room {t.room?.roomNumber || t.room?.roomType || 'Unit'}
                    </span>
                    <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-lg border border-amber-800/40">
                      Priority: {t.priority || 'MEDIUM'}
                    </span>
                  </div>

                  <h4 className="text-lg sm:text-xl font-black text-white italic">
                    {t.issueType} <span className="not-italic text-xs font-mono text-gray-400 font-normal">#{t._id.slice(-6).toUpperCase()}</span>
                  </h4>

                  <div className="bg-[#222222] p-4 rounded-xl border border-[#303030]">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1">Tenant Description</p>
                    <p className="text-gray-200 text-xs italic">"{t.description}"</p>
                  </div>

                  <div className="text-[10px] text-gray-400 flex flex-wrap gap-4">
                    <span>Resident: {t.tenant?.firstName} {t.tenant?.lastName}</span>
                    <span>Reported: {new Date(t.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* RESOLUTION BOX */}
                <div className="w-full lg:w-80 bg-[#202020] p-4 rounded-xl border border-[#303030] space-y-3">
                  <label className="text-[10px] font-black uppercase text-gray-300 block">
                    Manager Resolution Note
                  </label>
                  <textarea 
                    value={resolutionNotes[t._id] || ''} 
                    onChange={e => setResolutionNotes({ ...resolutionNotes, [t._id]: e.target.value })} 
                    className="w-full bg-[#161616] text-white p-2.5 rounded-lg text-xs outline-none focus:border-primary border border-[#333333] h-20 resize-none"
                    placeholder="E.g. Electrician fixed switchboard."
                  />
                  <button 
                    onClick={() => handleResolveTicket(t._id)}
                    disabled={resolvingId === t._id}
                    className="w-full btn-netflix py-2.5 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-1.5 shadow-md shadow-red-950/40"
                  >
                    {resolvingId === t._id ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14}/>}
                    <span>Confirm Fix & Close</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 bg-[#181818] rounded-2xl border border-[#2a2a2a] p-8">
              <CheckCircle2 size={40} className="mx-auto text-emerald-400 mb-2" />
              <h4 className="text-base font-black text-white">All Clear! No Pending Issues</h4>
              <p className="text-xs text-gray-400 mt-1">All tenant maintenance requests have been resolved.</p>
            </div>
          )}
        </div>
      )}

      {/* OFFICIAL INDUSTRY-GRADE TAX INVOICE & RECEIPT MODAL */}
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
