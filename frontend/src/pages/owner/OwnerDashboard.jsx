import { useState, useEffect, useCallback, useContext } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import API from '../../api/client';
import { useChat } from '../../context/ChatContext';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  Building, Calendar, User, Bed, CheckCircle2, Clock, 
  AlertOctagon, RefreshCcw, DollarSign, CreditCard, Search, 
  ArrowRight, ChevronRight, Wrench, MessageSquare, Star, 
  Receipt, ShieldCheck, Plus, CheckCheck, Loader2, ArrowLeft,
  ChevronDown, ChevronUp, Sparkles, Filter, Users, Eye,
  Handshake, FileText, Lock, Copy, Check, ShieldAlert, Award, Percent,
  AlertTriangle
} from 'lucide-react';
import ReceiptModal from '../../components/modals/ReceiptModal';
import CustomDatePicker from '../../components/common/CustomDatePicker';
import CustomDateTimePicker from '../../components/common/CustomDateTimePicker';

const OwnerDashboard = () => {
  const { user } = useContext(AuthContext);
  const toast = useToast();
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

  // Commercial Deal / Agreement States
  const [dealData, setDealData] = useState(null);
  const [dealLoading, setDealLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('ANNUAL_TOKEN');
  const [signatoryName, setSignatoryName] = useState(
    user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : ''
  );
  const [agreedToClauses, setAgreedToClauses] = useState(false);
  const [submittingDeal, setSubmittingDeal] = useState(false);
  const [isEditingDeal, setIsEditingDeal] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  const { socket } = useChat();

  // 0. Fetch Owner's Commercial Deal & KYC Status
  const fetchDealData = useCallback(async () => {
    try {
      setDealLoading(true);
      const res = await API.get('/users/deal');
      if (res.data?.success) {
        setDealData(res.data.data);
        if (res.data.data.deal?.dealType) {
          setSelectedPlan(res.data.data.deal.dealType);
        }
        if (res.data.data.deal?.signatureName) {
          setSignatoryName(res.data.data.deal.signatureName);
        } else if (user) {
          setSignatoryName(`${user.firstName || ''} ${user.lastName || ''}`.trim());
        }
      }
    } catch (err) {
      console.error("Deal load error:", err);
    } finally {
      setDealLoading(false);
    }
  }, [user]);

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

  // 2. Fetch Bookings, Maintenance Tickets & Commercial Deal
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [bookingsRes, ticketsRes] = await Promise.all([
        API.get('/bookings/owner-bookings'),
        API.get('/maintenance/owner/all').catch(() => ({ data: { data: [] } }))
      ]);

      setBookings(bookingsRes.data.data || []);
      setTickets(ticketsRes.data?.data || []);
      await Promise.all([
        fetchOccupancyMatrix(targetDate),
        fetchDealData()
      ]);
    } catch (err) {
      console.error("Dashboard Load Error:", err);
    } finally {
      setLoading(false);
    }
  }, [fetchOccupancyMatrix, fetchDealData, targetDate]);

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

  // 3. Real-time Socket Listeners for Live Room, Deal & Ticket Sync
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

    const handleDealUpdated = (updatedDeal) => {
      setDealData(prev => prev ? { ...prev, deal: updatedDeal } : prev);
      toast.info("Commercial Agreement terms updated by platform administrator.");
    };

    const handleKycUpdated = () => {
      fetchDealData();
    };

    socket.on('booking_inventory_updated', handleBookingUpdate);
    socket.on('new_maintenance_ticket', handleNewTicket);
    socket.on('ticket_updated', handleTicketUpdated);
    socket.on('deal_updated', handleDealUpdated);
    socket.on('kyc_updated', handleKycUpdated);

    return () => {
      socket.off('booking_inventory_updated', handleBookingUpdate);
      socket.off('new_maintenance_ticket', handleNewTicket);
      socket.off('ticket_updated', handleTicketUpdated);
      socket.off('deal_updated', handleDealUpdated);
      socket.off('kyc_updated', handleKycUpdated);
    };
  }, [socket, targetDate, fetchOccupancyMatrix, fetchDealData, toast]);

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
      toast.success(`Booking status updated to ${newStatus}`);
      setActionBooking(null);
      fetchOccupancyMatrix(targetDate);
      const res = await API.get('/bookings/owner-bookings');
      setBookings(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed.");
    }
  };

  // Resolve Maintenance Ticket
  const handleResolveTicket = async (ticketId) => {
    const note = resolutionNotes[ticketId]?.trim();
    if (!note) return toast.warning("Please type a resolution note before marking it solved.");

    try {
      setResolvingId(ticketId);
      const { data } = await API.patch(`/maintenance/${ticketId}/respond`, { 
        status: 'RESOLVED', 
        resolutionNote: note 
      });

      toast.success("Issue marked as Resolved! Tenant has been notified.");
      setTickets(prev => prev.map(t => t._id === ticketId ? data.data : t));
      setResolutionNotes(prev => {
        const copy = { ...prev };
        delete copy[ticketId];
        return copy;
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Error resolving ticket");
    } finally {
      setResolvingId(null);
    }
  };

  // Copy Agreement Reference
  const handleCopyRef = (refId) => {
    if (!refId) return;
    navigator.clipboard.writeText(refId);
    setCopiedRef(true);
    toast.success("Agreement Reference copied to clipboard!");
    setTimeout(() => setCopiedRef(false), 2000);
  };

  // Sign / Execute Commercial Deal
  const handleSignDeal = async (e) => {
    e?.preventDefault();
    if (!agreedToClauses) {
      toast.warning("Please check the declaration box confirming agreement to terms.");
      return;
    }
    if (!signatoryName.trim()) {
      toast.warning("Please enter your full legal name as authorized signatory.");
      return;
    }

    try {
      setSubmittingDeal(true);
      const res = await API.post('/users/deal/select', {
        dealType: selectedPlan,
        signatureName: signatoryName.trim()
      });

      toast.success(res.data.message || "Commercial Agreement activated successfully!");
      setDealData(prev => ({
        ...prev,
        deal: res.data.data
      }));
      setIsEditingDeal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to execute agreement.");
    } finally {
      setSubmittingDeal(false);
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-neutral-800">
        <div>
          <span className="bg-red-950/80 border border-[#E50914]/50 text-[#E50914] text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 w-fit mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E50914]"></span> OWNER CONSOLE • LIVE SYNCHRONIZATION
          </span>
          <h1 className="text-3xl sm:text-4xl font-black italic tracking-wide text-white leading-tight">
            PG & Room Management
          </h1>
          <p className="text-neutral-400 text-xs sm:text-sm mt-1 max-w-xl">
            Inspect real-time room occupancy, track booked vs vacant dates, and manage tenant stays across all your properties.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <Link 
            to="/owner/my-properties" 
            className="bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 px-4 py-2.5 rounded-xl font-bold text-xs uppercase flex items-center gap-1.5 transition"
          >
            <Building size={14} /> All Properties
          </Link>
          <Link 
            to="/owner/add-property" 
            className="btn-red-glow px-4 py-2.5 rounded-xl font-black text-xs uppercase flex items-center gap-1.5 shadow transition"
          >
            <Plus size={14} /> List New PG
          </Link>
          <button 
            onClick={fetchDashboardData} 
            className="w-9 h-9 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            title="Refresh All Real-time Data"
          >
            <RefreshCcw size={16}/>
          </button>
        </div>
      </div>

      {/* 2. TAB CONTROLS (NETFLIX DARK THEME) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar text-xs font-extrabold pb-1">
        <button 
          onClick={() => handleTabChange('occupancy')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
            activeTab === 'occupancy' 
              ? 'bg-[#E50914] text-white shadow-lg' 
              : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
          }`}
        >
          <Calendar size={14} />
          <span>ROOM & DATE SCHEDULE</span>
        </button>

        <button 
          onClick={() => handleTabChange('live')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
            activeTab === 'live' 
              ? 'bg-[#E50914] text-white shadow-lg' 
              : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
          }`}
        >
          <Users size={14} />
          <span>GUEST ARRIVALS & STAYS</span>
          <span className="w-2 h-2 rounded-full bg-[#E50914]"></span>
        </button>

        <button 
          onClick={() => handleTabChange('ledger')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
            activeTab === 'ledger' 
              ? 'bg-[#E50914] text-white shadow-lg' 
              : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
          }`}
        >
          <CreditCard size={14} />
          <span>FINANCIAL LEDGER</span>
        </button>

        <button 
          onClick={() => handleTabChange('pending_tasks')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
            activeTab === 'pending_tasks' 
              ? 'bg-amber-600 text-white shadow-lg' 
              : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
          }`}
        >
          <Wrench size={14} />
          <span>SERVICE REQUESTS</span>
          {pendingTickets.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-white text-black font-black text-[9px] flex items-center justify-center">
              {pendingTickets.length}
            </span>
          )}
        </button>

        <button 
          onClick={() => handleTabChange('deal')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
            activeTab === 'deal' 
              ? 'bg-neutral-800 text-emerald-400 shadow-lg border border-emerald-500/40' 
              : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
          }`}
        >
          <Handshake size={14} />
          <span>COMMERCIAL AGREEMENT</span>
          {dealData?.deal?.status === 'ACTIVE' ? (
            <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-500/30">
              ACTIVE
            </span>
          ) : dealData?.kycStatus === 'VERIFIED' ? (
            <span className="text-[9px] font-black uppercase text-amber-400 bg-amber-950 px-1.5 py-0.2 rounded border border-amber-500/30 animate-pulse">
              SELECT DEAL
            </span>
          ) : (
            <span className="text-[9px] font-black uppercase text-neutral-400 bg-neutral-800 px-1.5 py-0.2 rounded flex items-center gap-1">
              <Lock size={9} /> KYC REQ
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
          <div className="bg-[#141414] p-5 sm:p-6 rounded-3xl border border-neutral-800 shadow-2xl space-y-5">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
              
              {/* Filter By Property */}
              <div className="flex-1 w-full lg:w-auto">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block mb-1.5 flex items-center gap-1.5">
                  <Filter size={12} className="text-[#E50914]"/> SELECT PG PROPERTY
                </label>
                <select 
                  value={selectedPropertyId} 
                  onChange={(e) => handlePropertyFilterChange(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 text-white text-xs font-bold rounded-xl py-2.5 px-3.5 focus:border-neutral-600 outline-none cursor-pointer transition"
                >
                  <option value="ALL">🏢 All Properties ({occupancyMatrix.length} PGs)</option>
                  {occupancyMatrix.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.title} ({p.location?.city || "City"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Inspector Picker with Custom Calendar */}
              <div className="w-full lg:w-auto flex-1">
                <CustomDatePicker 
                  label="Check Date Occupancy"
                  value={targetDate}
                  onChange={handleDateChange}
                  showShortcuts={false}
                />
              </div>

              {/* Quick Date Shortcuts */}
              <div className="w-full lg:w-auto">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block mb-1.5">
                  QUICK TIME TRAVEL
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button 
                    onClick={() => setDateShortcut(0)}
                    className={`px-3 py-2 rounded-lg text-[10px] font-extrabold uppercase transition cursor-pointer ${
                      targetDate === new Date().toISOString().slice(0, 10)
                        ? 'bg-[#E50914] text-white shadow'
                        : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 border border-neutral-800'
                    }`}
                  >
                    TODAY
                  </button>
                  <button 
                    onClick={() => setDateShortcut(1)}
                    className="px-3 py-2 rounded-lg text-[10px] font-extrabold uppercase bg-neutral-900 hover:bg-neutral-800 text-neutral-400 border border-neutral-800 transition cursor-pointer"
                  >
                    TOMORROW
                  </button>
                  <button 
                    onClick={() => setDateShortcut(7)}
                    className="px-3 py-2 rounded-lg text-[10px] font-extrabold uppercase bg-neutral-900 hover:bg-neutral-800 text-neutral-400 border border-neutral-800 transition cursor-pointer"
                  >
                    +7 DAYS
                  </button>
                  <button 
                    onClick={() => setDateShortcut(30)}
                    className="px-3 py-2 rounded-lg text-[10px] font-extrabold uppercase bg-neutral-900 hover:bg-neutral-800 text-neutral-400 border border-neutral-800 transition cursor-pointer"
                  >
                    +30 DAYS
                  </button>
                </div>
              </div>
            </div>

            {/* LIVE OCCUPANCY BANNER ON TARGET DATE */}
            <div className="pt-4 border-t border-neutral-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5">
                <span className="text-[9px] uppercase font-bold text-neutral-400 block">INSPECTING DATE</span>
                <p className="text-sm sm:text-base font-black text-white italic mt-0.5">
                  {new Date(targetDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5">
                <span className="text-[9px] uppercase font-bold text-neutral-400 block">TOTAL ROOM UNITS</span>
                <p className="text-sm sm:text-base font-black text-white italic mt-0.5">
                  {aggregateStats.totalUnits} <span className="text-[10px] text-neutral-500 font-normal">Beds/Units</span>
                </p>
              </div>

              <div className="bg-neutral-900 border border-red-950/80 rounded-xl p-3.5">
                <span className="text-[9px] uppercase font-bold text-[#E50914] block">BOOKED UNITS</span>
                <p className="text-sm sm:text-base font-black text-[#E50914] italic mt-0.5">
                  {aggregateStats.totalOccupied} <span className="text-[10px] text-neutral-400 font-normal">Occupied ({overallOccupancyPct}%)</span>
                </p>
              </div>

              <div className="bg-neutral-900 border border-emerald-950/80 rounded-xl p-3.5">
                <span className="text-[9px] uppercase font-bold text-emerald-400 block">VACANT & READY</span>
                <p className="text-sm sm:text-base font-black text-emerald-400 italic mt-0.5">
                  {aggregateStats.totalVacant} <span className="text-[10px] text-neutral-400 font-normal">Available</span>
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
                                      Γé╣{room.basePrice?.toLocaleString()} / mo
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-gray-400 font-medium">
                                    Inventory: {room.totalInventory} Units Total ΓÇó Capacity: {room.totalInventory} Stays
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
                                    : `${room.availableCount} Vacant ΓÇó ${room.occupiedCount} Booked`}
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
                                            <span>≡ƒôà {checkInStr}</span>
                                            <span>ΓåÆ</span>
                                            <span>{checkOutStr}</span>
                                          </div>
                                          <div className="flex items-center justify-between text-[9px] text-gray-400">
                                            <span>Duration: {nights} Nights</span>
                                            <span className="text-emerald-400 font-bold">Γé╣{b.totalAmount?.toLocaleString()}</span>
                                          </div>
                                          {slot.isExtended && (
                                            <div className="text-[9px] font-black text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/40 mt-1">
                                              ΓÜí Stay Extended ({slot.extensions?.length}x)
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
                                            ≡ƒƒó Vacant & Available
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
                                            ≡ƒôà {new Date(b.checkInDate).toLocaleDateString()} ΓåÆ {new Date(b.checkOutDate).toLocaleDateString()}
                                          </p>
                                        </div>

                                        <div className="flex items-center gap-3">
                                          <span className="font-mono font-bold text-white">
                                            Γé╣{b.totalAmount?.toLocaleString()}
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
            <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-5 shadow-xl">
              <span className="text-[10px] font-extrabold uppercase text-[#E50914] block tracking-wider">CHECKED-IN GUESTS</span>
              <h2 className="text-3xl font-black text-white italic mt-1 block">
                {bookings.filter(b => b.status === 'CHECKED_IN').length}
              </h2>
            </div>
            <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-5 shadow-xl">
              <span className="text-[10px] font-extrabold uppercase text-amber-400 block tracking-wider">UPCOMING ARRIVALS</span>
              <h2 className="text-3xl font-black text-white italic mt-1 block">
                {bookings.filter(b => b.status === 'CONFIRMED').length}
              </h2>
            </div>
            <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-5 shadow-xl">
              <span className="text-[10px] font-extrabold uppercase text-emerald-400 block tracking-wider">TOTAL STAYS COMPLETED</span>
              <h2 className="text-3xl font-black text-white italic mt-1 block">
                {completedBookings.length}
              </h2>
            </div>
          </div>

          <div className="bg-[#141414] border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">ACTIVE GUEST STAYS & CHECK-IN QUEUE</h3>
              <span className="text-xs text-neutral-500 font-bold">{bookings.length} Total Bookings</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] uppercase font-black text-neutral-500 border-b border-neutral-800/80">
                  <tr>
                    <th className="py-2.5">GUEST RESIDENT</th>
                    <th className="py-2.5">PROPERTY & UNIT</th>
                    <th className="py-2.5">BOOKED DATES</th>
                    <th className="py-2.5">STATUS</th>
                    <th className="py-2.5 text-right">QUICK ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900">
                  {bookings.map(b => (
                    <tr key={b._id} className="hover:bg-neutral-900/50 transition">
                      <td className="py-3">
                        <div className="font-bold text-white">{b.tenant?.firstName} {b.tenant?.lastName}</div>
                        <div className="text-[10px] text-neutral-500">{b.tenant?.email}</div>
                      </td>
                      <td className="py-3">
                        <div className="font-bold text-white">{b.property?.title}</div>
                        <div className="text-[10px] text-[#E50914] font-extrabold">{b.room?.roomType} Unit</div>
                      </td>
                      <td className="py-3">
                        <span className="text-neutral-300 block">{new Date(b.checkInDate).toLocaleDateString()} → {new Date(b.checkOutDate).toLocaleDateString()}</span>
                        {b.extensions && b.extensions.length > 0 && (
                          <span className="text-[10px] text-amber-400 font-bold">⚡ Extended stay</span>
                        )}
                      </td>
                      <td className="py-3">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                          b.status === 'COMPLETED' ? 'bg-neutral-800 text-neutral-400' :
                          b.status === 'CHECKED_IN' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' :
                          'bg-blue-950 text-blue-400 border border-blue-500/30'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => setSelectedReceiptBooking(b)} 
                            className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800"
                            title="View Official Receipt"
                          >
                            <Receipt size={14}/>
                          </button>

                          {actionBooking === b._id ? (
                            <div className="flex flex-col gap-1.5 items-end">
                              <CustomDateTimePicker 
                                value={customActionDate} 
                                onChange={setCustomActionDate} 
                              />
                              <button 
                                onClick={() => handleStatusUpdate(b._id, b.status === 'CONFIRMED' ? 'CHECKED_IN' : 'COMPLETED')} 
                                className="btn-red-glow px-3 py-1 rounded text-[9px] font-black uppercase shadow"
                              >
                                Confirm
                              </button>
                            </div>
                          ) : (
                            b.status !== 'COMPLETED' && (
                              <button 
                                onClick={() => { setActionBooking(b._id); setCustomActionDate(new Date().toISOString().slice(0, 16)); }} 
                                className="bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 text-[10px] font-black uppercase px-2.5 py-1 rounded-lg transition cursor-pointer"
                              >
                                {b.status === 'CONFIRMED' ? 'LOG CHECK-IN' : 'LOG CHECK-OUT'}
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
        <div className="space-y-5 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#141414] border border-neutral-800 rounded-3xl p-6 shadow-xl">
              <span className="text-[10px] font-extrabold uppercase text-[#E50914] block tracking-wider">TOTAL REALIZED REVENUE</span>
              <span className="text-3xl sm:text-4xl font-black text-white italic mt-1 block">
                ₹{totalRevenue.toLocaleString()}
              </span>
            </div>
            <div className="bg-[#141414] border border-neutral-800 rounded-3xl p-6 shadow-xl">
              <span className="text-[10px] font-extrabold uppercase text-emerald-400 block tracking-wider">SETTLED TRANSACTIONS</span>
              <span className="text-3xl sm:text-4xl font-black text-white italic mt-1 block">
                {completedBookings.length}
              </span>
            </div>
          </div>

          <div className="bg-[#141414] border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider border-b border-neutral-800 pb-3">
              TRANSACTION HISTORY & TAX INVOICES
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] uppercase font-black text-neutral-500 border-b border-neutral-800">
                  <tr>
                    <th className="py-2.5">DATE</th>
                    <th className="py-2.5">RESIDENT</th>
                    <th className="py-2.5">PROPERTY / ROOM</th>
                    <th className="py-2.5">GROSS AMOUNT</th>
                    <th className="py-2.5 text-right">TAX INVOICE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900">
                  {completedBookings.map(b => (
                    <tr key={b._id} className="hover:bg-neutral-900/50 transition">
                      <td className="py-3 text-neutral-400">
                        {new Date(b.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 font-bold text-white">
                        {b.tenant?.firstName} {b.tenant?.lastName}
                      </td>
                      <td className="py-3 text-neutral-300">
                        {b.property?.title} ({b.room?.roomType})
                      </td>
                      <td className="py-3 font-black text-white italic">
                        ₹{b.totalAmount?.toLocaleString()}
                      </td>
                      <td className="py-3 text-right">
                        <button 
                          onClick={() => setSelectedReceiptBooking(b)} 
                          className="btn-red-glow text-white text-[10px] font-extrabold uppercase px-3 py-1.5 rounded-lg shadow inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Receipt size={13}/> RECEIPT
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
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-white italic">Active Maintenance Requests</h2>
            <span className="bg-amber-950/80 border border-amber-500/50 text-amber-400 text-xs font-bold px-3 py-1 rounded-full">
              {pendingTickets.length} Requiring Action
            </span>
          </div>

          {pendingTickets.length > 0 ? (
            pendingTickets.map(t => (
              <div key={t._id} className="bg-[#141414] border border-neutral-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-red-950 text-[#E50914] text-[9px] font-black uppercase px-2 py-0.5 rounded">
                    {t.property?.title || "Property"}
                  </span>
                  <span className="bg-neutral-800 text-neutral-300 text-[9px] font-black uppercase px-2 py-0.5 rounded">
                    Room {t.room?.roomNumber || t.room?.roomType || 'Unit'}
                  </span>
                  <span className="bg-amber-950 text-amber-400 text-[9px] font-black uppercase px-2 py-0.5 rounded">
                    PRIORITY: {t.priority || 'MEDIUM'}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-white italic">
                    {t.issueType} <span className="not-italic text-xs font-mono text-neutral-500">#{t._id.slice(-6).toUpperCase()}</span>
                  </h3>
                  
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 mt-2">
                    <span className="text-[9px] uppercase font-bold text-neutral-400 block">TENANT DESCRIPTION</span>
                    <p className="text-xs text-neutral-300 mt-1 italic">"{t.description}"</p>
                    <p className="text-[10px] text-neutral-500 mt-2">
                      Resident: {t.tenant?.firstName} {t.tenant?.lastName} • Reported: {new Date(t.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Manager Resolution Note Box */}
                <div className="bg-black/50 border border-neutral-800 rounded-2xl p-4 space-y-3">
                  <span className="text-[9px] uppercase font-bold text-neutral-400 block">MANAGER RESOLUTION NOTE</span>
                  <textarea 
                    rows="2"
                    value={resolutionNotes[t._id] || ''} 
                    onChange={e => setResolutionNotes({ ...resolutionNotes, [t._id]: e.target.value })} 
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-xs text-white outline-none focus:border-neutral-600"
                    placeholder="E.g. Electrician fixed switchboard."
                  />
                  <button 
                    onClick={() => handleResolveTicket(t._id)}
                    disabled={resolvingId === t._id}
                    className="w-full btn-red-glow text-white text-xs font-black uppercase py-3 rounded-xl shadow flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {resolvingId === t._id ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14}/>}
                    <span>CONFIRM FIX & CLOSE</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 bg-[#141414] rounded-3xl border border-neutral-800 p-8">
              <CheckCircle2 size={40} className="mx-auto text-emerald-400 mb-2" />
              <h4 className="text-base font-black text-white italic">All Clear! No Pending Issues</h4>
              <p className="text-xs text-neutral-400 mt-1">All tenant maintenance requests have been resolved.</p>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 5: COMMERCIAL AGREEMENT & MONETIZATION DEAL (PREREQUISITE: KYC VERIFIED)
         ========================================================================= */}
      {activeTab === 'deal' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* 1. SECTION BANNER */}
          <div className="bg-[#181818] p-6 sm:p-8 rounded-3xl border border-[#2a2a2a] shadow-xl relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-primary/10 rounded-full blur-[90px] pointer-events-none"></div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 relative z-10">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 bg-primary/15 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-primary border border-primary/30">
                  <Handshake size={12} /> Commercial Agreement & Monetization
                </div>
                <h2 className="text-2xl sm:text-4xl font-black italic tracking-tight text-white">
                  Platform Deal & Partnership Agreement
                </h2>
                <p className="text-gray-400 text-xs sm:text-sm max-w-xl">
                  Choose your monetization structure: Pay an annual token amount for 0% booking commission, or pay a flexible percentage share per booking.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {dealData?.kycStatus === 'VERIFIED' ? (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                    <CheckCircle2 size={14} /> KYC Verified Partner
                  </span>
                ) : dealData?.kycStatus === 'PENDING' ? (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-amber-950/60 text-amber-400 border border-amber-800/40 animate-pulse">
                    <Clock size={14} /> KYC Review In Progress
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-red-950/60 text-red-400 border border-red-800/40">
                    <ShieldAlert size={14} /> KYC Verification Required
                  </span>
                )}
              </div>
            </div>
          </div>

          {dealLoading ? (
            <div className="py-20 flex justify-center items-center">
              <Loader2 className="animate-spin text-primary" size={36} />
            </div>
          ) : dealData?.kycStatus !== 'VERIFIED' ? (
            /* 2. PREREQUISITE: KYC NOT VERIFIED STATE */
            <div className="space-y-6">
              <div className="bg-[#1c1415] rounded-3xl p-6 sm:p-8 border border-red-900/40 shadow-2xl relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="p-3.5 bg-red-500/15 text-red-400 border border-red-500/30 rounded-2xl shrink-0">
                    <Lock size={28} />
                  </div>
                  <div className="space-y-2 flex-1">
                    <h3 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                      <span>Identity Verification Prerequisite</span>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                        Required First
                      </span>
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-2xl">
                      Commercial partnership agreements and booking payout contracts on Nestify are legally binding. To protect tenants, prevent unauthorized listings, and comply with tax regulations, you must complete your **Government Identity Verification (KYC)** before executing platform agreements.
                    </p>

                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      {dealData?.kycStatus === 'PENDING' ? (
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-400 bg-amber-950/40 border border-amber-800/50 px-4 py-2.5 rounded-xl">
                          <Clock size={14} className="animate-spin" />
                          <span>Your documents are under compliance review. Agreement selection unlocks immediately upon admin approval.</span>
                        </div>
                      ) : dealData?.kycStatus === 'REJECTED' ? (
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-xs text-red-400 font-bold">
                            Rejection Reason: {dealData?.deal?.rejectionReason || "Documents were unclear or rejected."}
                          </span>
                          <Link 
                            to="/verify-identity" 
                            className="btn-netflix px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider inline-flex items-center gap-1.5 shadow-md shadow-red-950/40"
                          >
                            <ShieldCheck size={14} /> Resubmit Documents
                          </Link>
                        </div>
                      ) : (
                        <Link 
                          to="/verify-identity" 
                          className="btn-netflix px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider inline-flex items-center gap-1.5 shadow-md shadow-red-950/40"
                        >
                          <ShieldCheck size={14} /> Complete Identity Verification Now
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* PREVIEW OF MONETIZATION DEALS */}
              <div className="bg-[#181818] rounded-3xl p-6 sm:p-8 border border-[#2a2a2a] space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                    <Sparkles size={14} className="text-amber-400" /> Platform Agreement Preview
                  </div>
                  <h3 className="text-xl font-black text-white">Monetization Options (Unlocks After KYC)</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Review the two commercial partnership models below so you are ready to choose as soon as your identity is approved.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 opacity-75">
                  {/* PREVIEW CARD 1: ANNUAL TOKEN */}
                  <div className="bg-[#202020] rounded-2xl p-6 border border-[#303030] relative space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-block mb-1">
                          Option A: Fixed Annual Fee
                        </span>
                        <h4 className="text-lg font-black text-white">Annual Token Amount Plan</h4>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black italic text-amber-400">₹9,999</span>
                        <span className="text-[10px] text-gray-400 block font-bold">/ year</span>
                      </div>
                    </div>

                    <div className="p-3 bg-amber-950/20 border border-amber-800/30 rounded-xl text-xs font-bold text-amber-300 flex items-center gap-2">
                      <CheckCircle2 size={16} /> 0% Booking Commission (Keep 100% of guest rent)
                    </div>

                    <ul className="space-y-2 text-xs text-gray-300">
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-emerald-400 shrink-0" /> Fixed annual token fee — zero deduction from guest bookings
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-emerald-400 shrink-0" /> Full 365-day platform validity across all your PG listings
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-emerald-400 shrink-0" /> Flagship verified partner badge & priority search placement
                      </li>
                    </ul>
                  </div>

                  {/* PREVIEW CARD 2: PERCENTAGE SHARE */}
                  <div className="bg-[#202020] rounded-2xl p-6 border border-[#303030] relative space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 inline-block mb-1">
                          Option B: Pay-As-You-Earn
                        </span>
                        <h4 className="text-lg font-black text-white">Percentage Share Plan</h4>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black italic text-cyan-400">6%</span>
                        <span className="text-[10px] text-gray-400 block font-bold">/ booking</span>
                      </div>
                    </div>

                    <div className="p-3 bg-cyan-950/20 border border-cyan-800/30 rounded-xl text-xs font-bold text-cyan-300 flex items-center gap-2">
                      <CheckCircle2 size={16} /> ₹0 Upfront Fee (Pay only when rooms get booked)
                    </div>

                    <ul className="space-y-2 text-xs text-gray-300">
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-emerald-400 shrink-0" /> Zero upfront investment or annual subscription
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-emerald-400 shrink-0" /> 6% platform fee automatically deducted from booking settlement
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-emerald-400 shrink-0" /> Hassle-free automatic escrow payouts to your bank account
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : dealData?.deal?.status === 'ACTIVE' && !isEditingDeal ? (
            /* 3. ACTIVE DEAL VIEW: OFFICIAL PARTNERSHIP CERTIFICATE */
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-[#1a1c1a] via-[#161616] to-[#1a1414] rounded-3xl p-6 sm:p-10 border border-emerald-900/50 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="relative z-10 space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-[#2a2a2a]">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
                        <Award size={26} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                            Active Agreement
                          </span>
                          <span className="text-xs text-gray-400 font-mono">
                            Ref: {dealData.deal.agreementReference || 'NEST-AGR-VERIFIED'}
                          </span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-white italic tracking-tight mt-0.5">
                          Official Commercial Partnership Certificate
                        </h3>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyRef(dealData.deal.agreementReference)}
                      className="btn-netflix-secondary px-4 py-2 rounded-xl text-xs font-bold uppercase flex items-center gap-1.5 transition"
                    >
                      {copiedRef ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      <span>{copiedRef ? "Copied!" : "Copy Reference"}</span>
                    </button>
                  </div>

                  {/* Metrics Breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-[#1c1c1c] p-4 rounded-2xl border border-[#2c2c2c]">
                      <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Active Monetization Plan</span>
                      <p className="text-lg font-black text-white mt-1">
                        {dealData.deal.dealType === 'ANNUAL_TOKEN' ? '⚡ Annual Token Plan' : '📈 Pay-As-You-Earn'}
                      </p>
                      <span className="text-[11px] text-gray-400 block mt-0.5">
                        {dealData.deal.dealType === 'ANNUAL_TOKEN' ? 'Fixed 1-Year Membership' : 'Per Confirmed Booking'}
                      </span>
                    </div>

                    <div className="bg-[#1c1c1c] p-4 rounded-2xl border border-[#2c2c2c]">
                      <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Booking Commission</span>
                      <p className="text-lg font-black text-emerald-400 mt-1">
                        {dealData.deal.dealType === 'ANNUAL_TOKEN' ? '0% Commission' : `${dealData.deal.commissionRate || 6}% Commission`}
                      </p>
                      <span className="text-[11px] text-gray-400 block mt-0.5">
                        {dealData.deal.dealType === 'ANNUAL_TOKEN' ? 'You keep 100% of guest rent' : 'Deducted on booking check-in'}
                      </span>
                    </div>

                    <div className="bg-[#1c1c1c] p-4 rounded-2xl border border-[#2c2c2c]">
                      <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Platform Membership Fee</span>
                      <p className="text-lg font-black text-amber-400 mt-1">
                        {dealData.deal.dealType === 'ANNUAL_TOKEN' ? `₹${dealData.deal.annualTokenAmount || 9999} / yr` : '₹0 Upfront'}
                      </p>
                      <span className="text-[11px] text-gray-400 block mt-0.5">
                        {dealData.deal.dealType === 'ANNUAL_TOKEN' ? 'Paid & Active' : 'No recurring charge'}
                      </span>
                    </div>

                    <div className="bg-[#1c1c1c] p-4 rounded-2xl border border-[#2c2c2c]">
                      <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Valid Until</span>
                      <p className="text-lg font-black text-white mt-1">
                        {dealData.deal.validUntil ? new Date(dealData.deal.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '365 Days from Sign'}
                      </p>
                      <span className="text-[11px] text-emerald-400 block mt-0.5">
                        Active & Compliant
                      </span>
                    </div>
                  </div>

                  {/* Signatory & Legal Clauses Summary */}
                  <div className="bg-[#181818] p-5 rounded-2xl border border-[#2a2a2a] space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs text-gray-400 border-b border-[#252525] pb-3">
                      <div>
                        <span className="font-bold text-gray-300">Authorized Signatory:</span> {dealData.deal.signatureName || `${user?.firstName} ${user?.lastName || ''}`}
                      </div>
                      <div>
                        <span className="font-bold text-gray-300">Executed At:</span> {dealData.deal.agreedAt ? new Date(dealData.deal.agreedAt).toLocaleString() : 'Recent'}
                      </div>
                      <div>
                        <span className="font-bold text-gray-300">Counterpart:</span> Nestify Platform Governance
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-gray-300">
                      <div className="flex items-center gap-2">
                        <Check size={14} className="text-emerald-400" />
                        <span>Direct landlord payout disbursed within 24 hours of guest check-in.</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check size={14} className="text-emerald-400" />
                        <span>All properties listed under your account are covered by this commercial agreement.</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check size={14} className="text-emerald-400" />
                        <span>24/7 dedicated tenant escrow and automated GST invoice reconciliation.</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                    <div className="text-xs text-gray-400 font-medium">
                      Want to modify terms or transition to a different model?
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditingDeal(true)}
                      className="btn-netflix-secondary px-5 py-2.5 rounded-xl font-bold text-xs uppercase flex items-center gap-2 transition"
                    >
                      <RefreshCcw size={14} /> Switch / Change Partnership Model
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* 4. DEAL SELECTION & SIGNING INTERFACE */
            <form onSubmit={handleSignDeal} className="space-y-8">
              <div className="bg-[#181818] rounded-3xl p-6 sm:p-8 border border-[#2a2a2a] shadow-xl space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 inline-block mb-1">
                      KYC Verification Passed • Agreement Selection
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white italic tracking-tight">
                      Choose Your Commercial Model
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                      Decide between paying an annual token fee or a flexible booking percentage.
                    </p>
                  </div>

                  {isEditingDeal && (
                    <button
                      type="button"
                      onClick={() => setIsEditingDeal(false)}
                      className="text-xs font-bold text-gray-400 hover:text-white underline cursor-pointer"
                    >
                      Cancel & Keep Current Plan
                    </button>
                  )}
                </div>

                {/* TWO PLAN SELECTION CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* PLAN 1: ANNUAL TOKEN PLAN */}
                  <div
                    onClick={() => setSelectedPlan('ANNUAL_TOKEN')}
                    className={`p-6 sm:p-8 rounded-3xl border-2 transition-all cursor-pointer relative space-y-5 ${
                      selectedPlan === 'ANNUAL_TOKEN'
                        ? 'bg-gradient-to-b from-[#241b14] to-[#181818] border-amber-500 shadow-xl shadow-amber-950/30'
                        : 'bg-[#1e1e1e] border-[#2e2e2e] hover:border-[#444444]'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        Fixed Annual Fee • Highest Margin
                      </span>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedPlan === 'ANNUAL_TOKEN' ? 'border-amber-400 bg-amber-400' : 'border-gray-500'
                      }`}>
                        {selectedPlan === 'ANNUAL_TOKEN' && <Check size={12} className="text-black font-black" />}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-2xl font-black text-white tracking-tight">Annual Token Plan</h4>
                      <p className="text-xs text-gray-400 mt-0.5">Pay once a year, enjoy zero commission cuts on guest bookings.</p>
                    </div>

                    <div className="py-2 border-y border-[#333333] flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-black italic text-amber-400">₹9,999</span>
                      <span className="text-xs font-bold text-gray-400 uppercase">/ 1 Year (365 Days)</span>
                    </div>

                    <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl text-xs font-black text-amber-300 flex items-center gap-2">
                      <Award size={16} /> 0% Platform Commission (You keep 100% of guest rent)
                    </div>

                    <ul className="space-y-2.5 text-xs text-gray-300">
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                        <span><strong>Zero commission</strong> on all room bookings throughout the year</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                        <span><strong>Keep 100%</strong> of guest rent — higher profit for high-occupancy PGs</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                        <span><strong>Flagship Partner badge</strong> on all your properties</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                        <span><strong>Priority discovery ranking</strong> on search and map views</span>
                      </li>
                    </ul>
                  </div>

                  {/* PLAN 2: PERCENTAGE SHARE PLAN */}
                  <div
                    onClick={() => setSelectedPlan('COMMISSION_PERCENTAGE')}
                    className={`p-6 sm:p-8 rounded-3xl border-2 transition-all cursor-pointer relative space-y-5 ${
                      selectedPlan === 'COMMISSION_PERCENTAGE'
                        ? 'bg-gradient-to-b from-[#142024] to-[#181818] border-cyan-500 shadow-xl shadow-cyan-950/30'
                        : 'bg-[#1e1e1e] border-[#2e2e2e] hover:border-[#444444]'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                        Pay-As-You-Earn • Zero Upfront Cost
                      </span>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedPlan === 'COMMISSION_PERCENTAGE' ? 'border-cyan-400 bg-cyan-400' : 'border-gray-500'
                      }`}>
                        {selectedPlan === 'COMMISSION_PERCENTAGE' && <Check size={12} className="text-black font-black" />}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-2xl font-black text-white tracking-tight">Percentage Share Plan</h4>
                      <p className="text-xs text-gray-400 mt-0.5">Pay only when you earn from confirmed guest stays.</p>
                    </div>

                    <div className="py-2 border-y border-[#333333] flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-black italic text-cyan-400">6%</span>
                      <span className="text-xs font-bold text-gray-400 uppercase">/ Confirmed Booking</span>
                    </div>

                    <div className="p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-xl text-xs font-black text-cyan-300 flex items-center gap-2">
                      <Percent size={16} /> ₹0 Upfront Fee (Pay only on actual bookings)
                    </div>

                    <ul className="space-y-2.5 text-xs text-gray-300">
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                        <span><strong>₹0 Upfront</strong> registration or annual membership charge</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                        <span><strong>Nominal 6% fee</strong> deducted automatically upon check-in</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                        <span><strong>Zero financial risk</strong> for seasonal or new PG properties</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                        <span><strong>Standard Verified badge</strong> & 24/7 guest concierge support</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* AGREEMENT TERMS & LEGAL CLAUSES */}
                <div className="bg-[#202020] rounded-2xl p-5 border border-[#303030] space-y-3">
                  <h5 className="text-xs font-black uppercase tracking-wider text-gray-300 flex items-center gap-2">
                    <FileText size={14} className="text-primary" /> Key Partnership Clauses & SLA Commitments
                  </h5>
                  <div className="text-xs text-gray-400 space-y-2 leading-relaxed">
                    <p>
                      <strong>1. Settlement Cycle:</strong> Rental disbursements for confirmed bookings are settled to the landlord's registered bank account within 24 hours of guest check-in.
                    </p>
                    <p>
                      <strong>2. Commission Structure:</strong> For the Annual Token Plan, platform commission is fixed at 0% for 365 days. For the Percentage Plan, a 6% service fee is deducted per confirmed booking.
                    </p>
                    <p>
                      <strong>3. Property Integrity & Safety:</strong> Landlord agrees to maintain rooms in clean, safe condition matching listed photos and resolve critical tenant issues within 24 hours.
                    </p>
                    <p>
                      <strong>4. Term Duration:</strong> This commercial agreement is effective immediately upon electronic signature and valid for 1 full year, renewable automatically.
                    </p>
                  </div>
                </div>

                {/* SIGNATURE & CONFIRMATION BOX */}
                <div className="bg-[#1c1415] rounded-2xl p-5 border border-primary/30 space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={agreedToClauses} 
                      onChange={e => setAgreedToClauses(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded border-gray-600 text-primary focus:ring-primary bg-[#2a2a2a] cursor-pointer"
                    />
                    <span className="text-xs text-gray-300 font-medium">
                      I hereby declare that I am the legal owner or authorized manager of the listed PG properties. I accept the selected commercial model (<strong>{selectedPlan === 'ANNUAL_TOKEN' ? 'Annual Token Plan (₹9,999/yr, 0% Comm)' : 'Percentage Plan (6% per booking)'}</strong>) and agree to adhere to Nestify's Partnership & Dispute Guidelines.
                    </span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1.5">
                        Authorized Signatory Full Legal Name
                      </label>
                      <input 
                        type="text" 
                        value={signatoryName}
                        onChange={e => setSignatoryName(e.target.value)}
                        placeholder="Enter your full legal name"
                        className="w-full bg-[#242424] text-white p-2.5 rounded-xl text-xs font-bold outline-none focus:border-primary border border-[#383838]"
                        required
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="submit"
                        disabled={submittingDeal || !agreedToClauses}
                        className="w-full btn-netflix py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-950/50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        {submittingDeal ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Handshake size={16} />
                        )}
                        <span>Execute & Activate Platform Agreement</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
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
