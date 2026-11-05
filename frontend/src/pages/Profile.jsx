import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../api/client';
import { 
  User, Mail, ShieldCheck, Heart, Settings, Loader2, 
  Check, AlertCircle, Upload, Clock, FileText, Camera, 
  ArrowRight, Building2, Shield, Calendar, RefreshCw
} from 'lucide-react';
import PropertyCard from '../components/PropertyCard';
import OwnerOnboardingModal from '../components/modals/OwnerOnboardingModal';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';

const Profile = () => {
  const { user, loading, setUser, switchRole } = useContext(AuthContext);
  const [switchingRole, setSwitchingRole] = useState(false);
  const [roleNotice, setRoleNotice] = useState('');
  const [showOwnerModal, setShowOwnerModal] = useState(false);

  const handleRoleSwitch = async () => {
    if (switchingRole || !user || user.role === 'ADMIN') return;
    setSwitchingRole(true);
    setRoleNotice('');
    try {
      if (user.role === 'OWNER') {
        const res = await switchRole('TENANT');
        if (res.success) {
          setRoleNotice('Persona switched to Resident / Tenant!');
          setTimeout(() => setRoleNotice(''), 4000);
          navigate('/');
        }
        return;
      }

      const isOwnerOnboarded = user.isOwnerOnboarded || (user.ownerDetails?.legalAgreementAccepted && user.ownerDetails?.panNumber);
      if (!isOwnerOnboarded) {
        setShowOwnerModal(true);
        return;
      }
      const nextRole = 'OWNER';
      const res = await switchRole(nextRole);
      if (res.success) {
        setRoleNotice(`Persona switched to ${nextRole === 'OWNER' ? 'Landlord / PG Owner' : 'Resident / Tenant'}!`);
        setTimeout(() => setRoleNotice(''), 4000);
        navigate('/owner/dashboard');
      } else {
        alert(res.error || "Failed to switch role.");
      }
    } finally {
      setSwitchingRole(false);
    }
  };
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Set initial tab from URL if present (e.g., /profile?tab=wishlist or /profile?tab=kyc)
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'details'); 
  const [wishlistItems, setWishlistItems] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);

  // KYC States
  const [kycFile, setKycFile] = useState(null);
  const [docType, setDocType] = useState('AADHAAR');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  }, [activeTab]);

  useEffect(() => {
    const fetchWishlist = async () => {
      if (activeTab !== 'wishlist' || !user || user.role === 'OWNER') return;
      setDataLoading(true);
      try {
        const { data } = await API.get('/users/wishlist');
        setWishlistItems(Array.isArray(data) ? data : []); 
      } catch (err) {
        console.error("Wishlist Error:", err);
      } finally {
        setDataLoading(false);
      }
    };
    fetchWishlist();
  }, [activeTab, user]);

  const handleKYCUpload = async (e) => {
    e.preventDefault();
    if (!kycFile) return alert("Please select a document image.");

    setUploading(true);
    const formData = new FormData();
    formData.append('docType', docType);
    formData.append('document', kycFile);

    try {
      const { data } = await API.post('/users/submit-kyc', formData);
      setUser(data.data); 
      alert("Documents submitted for admin review!");
      setActiveTab('kyc');
      setKycFile(null);
    } catch (err) {
      alert(err.response?.data?.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const getInitials = () => {
    if (!user) return 'SS';
    const first = user.firstName ? user.firstName[0].toUpperCase() : '';
    const last = user.lastName ? user.lastName[0].toUpperCase() : '';
    return `${first}${last}` || 'SS';
  };

  if (loading) return (
    <div className="flex h-screen w-full items-center justify-center bg-[#0d0d0d]">
      <Loader2 className="animate-spin text-[#E50914]" size={40} />
    </div>
  );

  if (!user) return (
    <div className="max-w-md mx-auto my-20 p-8 bg-[#141414] border border-neutral-800 rounded-3xl text-center space-y-4 shadow-2xl">
      <p className="text-lg font-black text-white">Please log in to view your profile</p>
      <Link to="/login" className="btn-red-glow inline-block px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow">
        Sign In
      </Link>
    </div>
  );

  return (
    <div className="pt-2 px-2 sm:px-4 md:px-8 max-w-5xl mx-auto space-y-6 text-white pb-20">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left Card: Avatar & Quick Protocol */}
        <aside className="md:col-span-4 bg-[#141414] border border-neutral-800 rounded-3xl p-6 text-center space-y-5 shadow-2xl">
          <div className="relative w-24 h-24 mx-auto">
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt="Profile Avatar"
                className="w-full h-full rounded-2xl object-cover border-2 border-[#E50914]/40 shadow-lg"
              />
            ) : (
              <div className="w-full h-full rounded-2xl bg-[#E50914] flex items-center justify-center text-white text-3xl font-black shadow-lg">
                {getInitials()}
              </div>
            )}
            
            {user.kycStatus === 'VERIFIED' ? (
              <div 
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 border-2 border-[#141414] text-black flex items-center justify-center shadow"
                title="Verified Identity"
              >
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
            ) : (
              <div 
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-500 border-2 border-[#141414] text-black flex items-center justify-center shadow"
                title="Verification Pending"
              >
                <Clock className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-black text-white italic tracking-wide">
              {user.firstName} {user.lastName}
            </h2>
            <div className="flex items-center justify-center gap-1.5 mt-2 flex-wrap">
              <span className="bg-red-950/80 border border-[#E50914]/50 text-[#E50914] text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E50914]"></span> {user.role} ACCOUNT
              </span>
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                user.kycStatus === 'VERIFIED'
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400'
                  : 'bg-amber-950/80 border-amber-500/50 text-amber-400'
              }`}>
                {user.kycStatus || 'NOT VERIFIED'}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-2 truncate">{user.email}</p>

            {user.role !== 'ADMIN' && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleRoleSwitch}
                  disabled={switchingRole}
                  className="w-full text-[11px] font-bold py-2.5 px-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-200 hover:text-white flex items-center justify-between transition cursor-pointer group shadow"
                  title={user.role === 'OWNER' ? "Switch to Resident Persona to browse and book stays" : "Switch to Landlord Persona to list properties and manage rooms"}
                >
                  <div className="flex items-center gap-2">
                    <RefreshCw className={`w-3.5 h-3.5 text-[#E50914] ${switchingRole ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-300'}`} />
                    <span>{switchingRole ? 'Switching...' : user.role === 'OWNER' ? 'Switch to Resident' : 'Switch to Landlord'}</span>
                  </div>
                  <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300">
                    {user.role === 'OWNER' ? 'Tenant' : 'Owner'}
                  </span>
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2 text-left">
            <button 
              onClick={() => setActiveTab('details')}
              className={`w-full text-xs uppercase py-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer font-extrabold ${
                activeTab === 'details' 
                  ? 'btn-red-glow text-white shadow' 
                  : 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800'
              }`}
            >
              <User className="w-4 h-4" /> PROFILE DETAILS
            </button>
            <button 
              onClick={() => setActiveTab('kyc')}
              className={`w-full text-xs uppercase py-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer font-extrabold ${
                activeTab === 'kyc' 
                  ? 'btn-red-glow text-white shadow' 
                  : 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4" /> IDENTITY VERIFICATION
            </button>
            {user.role === 'TENANT' && (
              <button 
                onClick={() => setActiveTab('wishlist')}
                className={`w-full text-xs uppercase py-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer font-extrabold ${
                  activeTab === 'wishlist' 
                    ? 'btn-red-glow text-white shadow' 
                    : 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800'
                }`}
              >
                <Heart className="w-4 h-4" /> SAVED STAYS
              </button>
            )}
          </div>

          <div className="bg-black/50 border border-neutral-800/80 rounded-2xl p-4 text-left flex items-start gap-3">
            <Shield className="w-5 h-5 text-[#E50914] flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-white">Direct Landlord Protocol</h4>
              <p className="text-[10px] text-neutral-400 mt-0.5 leading-relaxed">
                Your credentials and tenancy contracts are protected by 256-bit encryption.
              </p>
            </div>
          </div>
        </aside>

        {/* Right Content Area */}
        <main className="md:col-span-8 space-y-6">
          {/* Dual Persona Protocol Banner */}
          {user.role !== 'ADMIN' && (
            <div className="bg-gradient-to-r from-neutral-900 via-[#181818] to-neutral-950 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-150">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black shrink-0 ${
                  user.role === 'OWNER' 
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                    : 'bg-[#E50914]/20 text-[#E50914] border border-[#E50914]/30'
                }`}>
                  {user.role === 'OWNER' ? <Building2 size={24} /> : <User size={24} />}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
                      DUAL-PERSONA ENABLED
                    </span>
                    <span className={`text-[10px] font-black uppercase ${user.role === 'OWNER' ? 'text-amber-400' : 'text-[#E50914]'}`}>
                      {user.role === 'OWNER' ? '• Currently Landlord Console' : '• Currently Resident Mode'}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-white italic mt-1">
                    {user.role === 'OWNER' ? 'Landlord / Property Owner Persona' : 'Resident / Tenant Persona'}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                    {user.role === 'OWNER' 
                      ? 'You can list PGs, manage room inventory, and sign commercial deals. Switch anytime to Resident to browse and book personal stays.' 
                      : 'You can explore verified PGs, reserve rooms, and manage personal stays. Switch anytime to Landlord to list your own buildings.'}
                  </p>
                  {roleNotice && (
                    <p className="text-xs font-bold text-emerald-400 mt-1.5 flex items-center gap-1 animate-in fade-in">
                      <Check className="w-3.5 h-3.5" /> {roleNotice}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={handleRoleSwitch}
                disabled={switchingRole}
                className="btn-red-glow text-white text-xs font-black uppercase px-5 py-3 rounded-xl shadow cursor-pointer whitespace-nowrap self-stretch sm:self-auto flex items-center justify-center gap-2 transition"
              >
                <RefreshCw size={14} className={switchingRole ? 'animate-spin' : ''} />
                <span>{switchingRole ? 'Switching...' : user.role === 'OWNER' ? 'Switch to Resident' : 'Switch to Landlord'}</span>
              </button>
            </div>
          )}
          
          {/* TAB 1: DETAILS */}
          {activeTab === 'details' && (
            <div className="bg-[#141414] border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase text-[#E50914] tracking-widest block">RESIDENT PROFILE</span>
                  <h1 className="text-2xl sm:text-3xl font-black text-white italic tracking-wide mt-0.5">Account Information</h1>
                  <p className="text-xs text-neutral-400 mt-1">Manage your credentials, trust status, and coliving preferences.</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 flex items-center justify-center">
                  <Settings className="w-4 h-4" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-neutral-400">FIRST NAME</label>
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-3 text-xs text-white flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-[#E50914]" />
                    <span className="font-bold">{user.firstName}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-neutral-400">LAST NAME</label>
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-3 text-xs text-white flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-[#E50914]" />
                    <span className="font-bold">{user.lastName}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-neutral-400">EMAIL ADDRESS</label>
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-3 text-xs text-white flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-[#E50914] flex-shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    <span className="bg-emerald-950/80 text-emerald-400 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase">ACTIVE</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-neutral-400">IDENTITY & TRUST STATUS</label>
                  <div className={`rounded-xl px-3.5 py-3 text-xs font-bold flex items-center justify-between border ${
                    user.kycStatus === 'VERIFIED'
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-400'
                      : 'bg-amber-950/30 border-amber-500/40 text-amber-400'
                  }`}>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      <span>{user.kycStatus || 'NOT VERIFIED'}</span>
                    </div>
                    {user.kycStatus !== 'VERIFIED' && (
                      <button 
                        onClick={() => setActiveTab('kyc')} 
                        className="text-[10px] uppercase font-black underline hover:text-white cursor-pointer"
                      >
                        Verify Now
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-neutral-400">ACCOUNT ROLE</label>
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-3 text-xs text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-[#E50914]" />
                      <span className="font-bold">{user.role}</span>
                    </div>
                    <span className="text-[10px] text-neutral-500">Standard Access</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-neutral-400">MEMBER SINCE</label>
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-3 text-xs text-white flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-[#E50914]" />
                    <span>
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Mar 2026'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Banner at Bottom of Profile: Active Residency */}
              <div className="bg-black/50 border border-neutral-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
                <div>
                  <h4 className="text-sm font-bold text-white">Active Residency & Rent Extensions</h4>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    View current stay agreements, download tax invoices, or extend your move-out date.
                  </p>
                </div>
                <Link 
                  to="/my-bookings" 
                  className="btn-red-glow text-white font-extrabold text-xs uppercase px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow flex-shrink-0"
                >
                  MY BOOKINGS <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

            </div>
          )}

          {/* TAB 2: KYC & IDENTITY VERIFICATION */}
          {activeTab === 'kyc' && (
            <div className="bg-[#141414] border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in duration-200">
              <div className="border-b border-neutral-800 pb-4">
                <span className="text-[10px] font-black uppercase text-[#E50914] tracking-widest block">TRUST & COMPLIANCE</span>
                <h2 className="text-2xl sm:text-3xl font-black text-white italic tracking-wide mt-0.5">
                  Identity Verification Center
                </h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Nestify enforces digital and physical verification to protect residents and landlords against fraudulent listings.
                </p>
              </div>

              {/* Status Banner */}
              <div className={`p-4 sm:p-5 rounded-2xl flex items-start gap-4 border ${
                user.kycStatus === 'VERIFIED' ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-400' :
                user.kycStatus === 'PENDING' ? 'bg-amber-950/30 border-amber-500/40 text-amber-400' :
                user.kycStatus === 'REJECTED' ? 'bg-rose-950/30 border-rose-500/40 text-rose-400' :
                'bg-neutral-900 border-neutral-800 text-neutral-300'
              }`}>
                {user.kycStatus === 'VERIFIED' ? <Check className="w-6 h-6 stroke-[3] shrink-0 mt-0.5 text-emerald-400" /> :
                 user.kycStatus === 'PENDING' ? <Clock className="w-6 h-6 shrink-0 mt-0.5 text-amber-400 animate-spin" /> :
                 <AlertCircle className="w-6 h-6 shrink-0 mt-0.5 text-neutral-400" />}
                <div>
                  <h4 className="font-black text-sm uppercase tracking-wide">
                    {user.kycStatus === 'VERIFIED' ? 'IDENTITY VERIFIED ✅' :
                     user.kycStatus === 'PENDING' ? 'AUDIT IN PROGRESS ⏳' : 
                     user.kycStatus === 'REJECTED' ? 'VERIFICATION REJECTED ❌' : 'VERIFICATION REQUIRED'}
                  </h4>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                    {user.kycStatus === 'VERIFIED'
                      ? 'Your profile is authenticated with full Move-in Escrow Protection and verified lease privileges.'
                      : user.kycStatus === 'PENDING'
                      ? 'Your verification documents are being reviewed by the compliance desk. Reviews finish in 12-24 hours.'
                      : user.kycStatus === 'REJECTED'
                      ? (user.kycRejectionReason || 'Previous document was declined. Please submit a valid Aadhaar, PAN, or Passport.')
                      : 'Upload a government photo ID to enable one-click reservations and zero-brokerage guarantees.'}
                  </p>
                </div>
              </div>

              {/* Upload Form */}
              {user.kycStatus !== 'VERIFIED' && user.kycStatus !== 'PENDING' && (
                <form onSubmit={handleKYCUpload} className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase text-neutral-400">DOCUMENT TYPE</label>
                      <select 
                        value={docType} 
                        onChange={(e) => setDocType(e.target.value)} 
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-3 text-xs text-white outline-none focus:border-[#E50914] font-semibold"
                      >
                        <option value="AADHAAR">Government Aadhaar Card</option>
                        <option value="PAN">Permanent Account Number (PAN)</option>
                        <option value="PASSPORT">International Passport</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase text-neutral-400">UPLOAD ID PHOTO</label>
                      <div className="relative h-[46px] flex items-center px-4 bg-neutral-900 rounded-xl border border-dashed border-neutral-700 hover:border-[#E50914] transition cursor-pointer">
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => setKycFile(e.target.files[0])} 
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                        />
                        <span className="text-xs font-bold text-neutral-300 truncate">
                          {kycFile ? kycFile.name : 'Choose JPG, PNG or PDF'}
                        </span>
                        <Camera className="w-4 h-4 ml-auto text-[#E50914] shrink-0" />
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={uploading} 
                    className="w-full btn-red-glow py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider shadow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Submitting Documents...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" /> SUBMIT DOCUMENTS FOR AUDIT
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Uploaded Documents */}
              {(user.kycDocuments || []).length > 0 && (
                <div className="pt-4 border-t border-neutral-800 space-y-3">
                  <h4 className="text-[10px] font-extrabold uppercase text-neutral-400 tracking-wider">
                    UPLOADED CREDENTIALS
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {user.kycDocuments.map((doc, idx) => (
                      <div key={idx} className="relative rounded-xl overflow-hidden border border-neutral-800 h-24 bg-neutral-900 group">
                        <img src={doc.fileUrl} className="w-full h-full object-cover" alt="ID Document" />
                        <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition p-2 text-center">
                          <FileText className="w-5 h-5 text-[#E50914] mb-1" />
                          <span className="text-[9px] font-bold text-white uppercase">{doc.docType}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WISHLIST */}
          {activeTab === 'wishlist' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-4 flex items-center justify-between shadow-2xl">
                <div>
                  <span className="text-[10px] font-black uppercase text-[#E50914] tracking-wider block">SAVED STAYS</span>
                  <h2 className="text-xl font-black text-white italic">Your Wishlist</h2>
                </div>
                <span className="bg-red-950/80 border border-[#E50914]/40 text-[#E50914] text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 fill-current" /> {wishlistItems.length} Stays Saved
                </span>
              </div>

              {dataLoading ? (
                <div className="py-20 text-center bg-[#141414] rounded-2xl border border-neutral-800">
                  <Loader2 className="animate-spin text-[#E50914] mx-auto" size={36}/>
                  <p className="text-xs text-neutral-400 mt-2 font-bold">Loading your saved stays...</p>
                </div>
              ) : wishlistItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {wishlistItems.map(item => (
                    <PropertyCard 
                      key={item._id} 
                      property={item.property} 
                      onWishlistToggle={(propId) => {
                        setWishlistItems(prev => 
                          prev.filter(w => (w.property?._id || w.property).toString() !== propId.toString())
                        );
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-[#141414] rounded-3xl border border-neutral-800 space-y-4 px-6 shadow-2xl">
                  <div className="w-14 h-14 rounded-2xl bg-[#E50914]/10 border border-[#E50914]/20 text-[#E50914] flex items-center justify-center mx-auto">
                    <Heart size={26} />
                  </div>
                  <h4 className="text-base font-black text-white italic">Your wishlist is empty</h4>
                  <p className="text-xs text-neutral-400 max-w-sm mx-auto font-medium leading-relaxed">
                    Explore top audited rooms, student housing, and luxury coliving suites across India and save your favorites.
                  </p>
                  <Link 
                    to="/search" 
                    className="btn-red-glow inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider shadow"
                  >
                    Browse Stays <ArrowRight size={14} />
                  </Link>
                </div>
              )}
            </div>
          )}

        </main>

        {/* Landlord Onboarding & Verification Modal */}
        <OwnerOnboardingModal 
          isOpen={showOwnerModal}
          onClose={() => setShowOwnerModal(false)}
          user={user}
          switchRole={switchRole}
          onSuccess={() => {
            setRoleNotice('Landlord verification complete! Welcome to your Owner Portal.');
            setTimeout(() => setRoleNotice(''), 4000);
            navigate('/owner/dashboard');
          }}
        />
      </div>
    </div>
  );
};

export default Profile;
