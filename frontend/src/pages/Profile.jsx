import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../api/client';
import { 
  User, Mail, ShieldCheck, Heart, Settings, Loader2, 
  CheckCircle2, AlertCircle, Upload, Clock, XCircle, FileText, Camera, 
  ArrowRight, Building2, Sparkles, Shield, ExternalLink, Calendar
} from 'lucide-react';
import PropertyCard from '../components/PropertyCard';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';

const Profile = () => {
  const { user, loading, setUser } = useContext(AuthContext);
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

  if (loading) return (
    <div className="flex h-screen w-full items-center justify-center bg-[#141414]">
      <Loader2 className="animate-spin text-primary" size={40} />
    </div>
  );

  if (!user) return (
    <div className="max-w-md mx-auto my-20 p-8 bg-[#181818] border border-[#2a2a2a] rounded-3xl text-center space-y-4">
      <p className="text-lg font-black text-white">Please log in to view your profile</p>
      <Link to="/login" className="btn-netflix inline-block px-6 py-2.5 rounded-xl text-sm font-bold">
        Sign In
      </Link>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 min-h-screen text-white">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* 1. LEFT SIDEBAR USER PROFILE CARD */}
        <aside className="lg:w-1/3 shrink-0">
          <div className="bg-[#181818] p-8 rounded-[2.5rem] shadow-2xl border border-[#2a2a2a] text-center relative overflow-hidden">
            {/* Ambient Red Glow in Corner */}
            <div className="absolute right-[-60px] top-[-60px] w-44 h-44 bg-primary/15 rounded-full blur-[80px] pointer-events-none"></div>

            {/* Profile Avatar */}
            <div className="relative inline-block mb-5">
              <img 
                src={user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=E50914&color=fff`} 
                className="w-28 h-28 rounded-3xl object-cover border-2 border-[#333333] shadow-2xl" 
                alt="Avatar"
              />
              {user.kycStatus === 'VERIFIED' && (
                <div 
                  className="absolute -bottom-2 -right-2 bg-emerald-500 p-1.5 rounded-xl border-2 border-[#181818] shadow-md"
                  title="Verified Resident Identity"
                >
                  <CheckCircle2 size={16} className="text-white" />
                </div>
              )}
            </div>
            
            {/* User Name & Role Pill */}
            <h2 className="text-2xl font-black italic tracking-tight text-white leading-tight">
              {user.firstName} {user.lastName}
            </h2>
            
            <div className="mt-2.5 flex items-center justify-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-[#242424] text-gray-300 border border-[#333333] flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                {user.role} ACCOUNT
              </span>
              {user.kycStatus === 'VERIFIED' && (
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                  VERIFIED
                </span>
              )}
            </div>

            <p className="text-xs text-gray-400 font-medium truncate mt-2">
              {user.email}
            </p>

            {/* Navigation Tab Switchers */}
            <div className="mt-8 space-y-2 border-t border-[#262626] pt-6 text-left">
              <button 
                onClick={() => setActiveTab('details')} 
                className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'details' 
                    ? 'btn-netflix shadow-lg text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-[#242424]'
                }`}
              >
                <User size={18} /> Profile Details
              </button>

              <button 
                onClick={() => setActiveTab('kyc')} 
                className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'kyc' 
                    ? 'btn-netflix shadow-lg text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-[#242424]'
                }`}
              >
                <ShieldCheck size={18} /> Identity Verification
              </button>
              
              {user.role === 'TENANT' && (
                <button 
                  onClick={() => setActiveTab('wishlist')} 
                  className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'wishlist' 
                      ? 'btn-netflix shadow-lg text-white' 
                      : 'text-gray-400 hover:text-white hover:bg-[#242424]'
                  }`}
                >
                  <Heart size={18} /> Saved Stays
                </button>
              )}
            </div>

            {/* Platform Security Assurance Card */}
            <div className="mt-8 pt-6 border-t border-[#262626] text-left flex items-start gap-3 bg-[#141414] p-4 rounded-2xl border border-[#262626]">
              <Shield size={20} className="text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-white">Direct Landlord Protocol</p>
                <p className="text-[11px] text-gray-400 mt-0.5 font-medium leading-relaxed">
                  Your credentials and tenancy contracts are protected by 256-bit encryption.
                </p>
              </div>
            </div>

          </div>
        </aside>

        {/* 2. MAIN CONTENT AREA */}
        <main className="lg:w-2/3">
          
          {/* TAB 1: DETAILS */}
          {activeTab === 'details' && (
            <div className="bg-[#181818] p-8 sm:p-10 rounded-[2.5rem] shadow-2xl border border-[#2a2a2a] space-y-8 animate-in fade-in duration-300">
              
              {/* Card Header */}
              <div className="flex justify-between items-center border-b border-[#282828] pb-6">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">Resident Profile</span>
                  <h3 className="text-2xl sm:text-3xl font-black italic tracking-tight text-white mt-0.5">
                    Account Information
                  </h3>
                  <p className="text-xs text-gray-400 font-medium mt-1">
                    Manage your credentials, trust status, and coliving preferences.
                  </p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-[#242424] border border-[#333333] flex items-center justify-center text-gray-300">
                  <Settings size={20} />
                </div>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">First Name</p>
                  <div className="p-4 bg-[#202020] rounded-2xl text-white font-bold text-sm border border-[#2e2e2e] flex items-center gap-3">
                    <User size={18} className="text-primary shrink-0" />
                    <span>{user.firstName}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Last Name</p>
                  <div className="p-4 bg-[#202020] rounded-2xl text-white font-bold text-sm border border-[#2e2e2e] flex items-center gap-3">
                    <User size={18} className="text-primary shrink-0" />
                    <span>{user.lastName}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Email Address</p>
                  <div className="p-4 bg-[#202020] rounded-2xl text-white font-bold text-sm border border-[#2e2e2e] flex items-center justify-between gap-3 truncate">
                    <div className="flex items-center gap-3 truncate">
                      <Mail size={18} className="text-primary shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 shrink-0">
                      Active
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Identity & Trust Status</p>
                  <div className={`p-4 rounded-2xl font-black text-sm flex items-center justify-between gap-3 border ${
                    user.kycStatus === 'VERIFIED' 
                      ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-400' 
                      : user.kycStatus === 'PENDING'
                      ? 'bg-amber-950/40 border-amber-800/50 text-amber-400'
                      : 'bg-rose-950/40 border-rose-800/50 text-rose-400'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck size={18} />
                      <span>{user.kycStatus || 'NOT STARTED'}</span>
                    </div>
                    {user.kycStatus !== 'VERIFIED' && (
                      <button 
                        onClick={() => setActiveTab('kyc')} 
                        className="text-[10px] uppercase font-black underline hover:text-white"
                      >
                        Verify Now
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Account Role</p>
                  <div className="p-4 bg-[#202020] rounded-2xl text-white font-bold text-sm border border-[#2e2e2e] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Building2 size={18} className="text-primary shrink-0" />
                      <span>{user.role}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium">Standard Access</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Member Since</p>
                  <div className="p-4 bg-[#202020] rounded-2xl text-white font-bold text-sm border border-[#2e2e2e] flex items-center gap-3">
                    <Calendar size={18} className="text-primary shrink-0" />
                    <span>
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '2026'}
                    </span>
                  </div>
                </div>

              </div>

              {/* Quick Navigation Banners based on Role */}
              <div className="pt-4 border-t border-[#282828]">
                {user.role === 'TENANT' && (
                  <div className="bg-gradient-to-r from-primary/10 via-[#202020] to-[#202020] p-6 rounded-2xl border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-black text-sm text-white">Active Residency & Rent Extensions</h4>
                      <p className="text-xs text-gray-400 mt-0.5 font-medium">
                        View current stay agreements, download tax invoices, or extend your move-out date.
                      </p>
                    </div>
                    <Link 
                      to="/my-bookings" 
                      className="btn-netflix px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 flex items-center gap-1.5"
                    >
                      My Bookings <ArrowRight size={14} />
                    </Link>
                  </div>
                )}

                {user.role === 'OWNER' && (
                  <div className="bg-gradient-to-r from-primary/10 via-[#202020] to-[#202020] p-6 rounded-2xl border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-black text-sm text-white">Landlord Command Center</h4>
                      <p className="text-xs text-gray-400 mt-0.5 font-medium">
                        Monitor room occupancy, tenant extensions, rent payouts, and list new properties.
                      </p>
                    </div>
                    <Link 
                      to="/owner/dashboard" 
                      className="btn-netflix px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 flex items-center gap-1.5"
                    >
                      Dashboard <ArrowRight size={14} />
                    </Link>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: KYC & IDENTITY VERIFICATION */}
          {activeTab === 'kyc' && (
            <div className="bg-[#181818] p-8 sm:p-10 rounded-[2.5rem] shadow-2xl border border-[#2a2a2a] space-y-8 animate-in fade-in duration-300">
              
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Trust & Governance</span>
                <h3 className="text-2xl sm:text-3xl font-black italic tracking-tight text-white mt-0.5">
                  Identity Verification Center
                </h3>
                <p className="text-xs text-gray-400 font-medium mt-1">
                  Nestify enforces physical and digital verification to protect residents and landlords against fraudulent listings.
                </p>
              </div>
              
              {/* STATUS BANNER */}
              <div className={`p-6 rounded-2xl flex items-start gap-4 border ${
                user.kycStatus === 'VERIFIED' ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400' :
                user.kycStatus === 'PENDING' ? 'bg-amber-950/40 border-amber-800/60 text-amber-400' :
                user.kycStatus === 'REJECTED' ? 'bg-rose-950/40 border-rose-800/60 text-rose-400' : 
                'bg-[#222222] border-[#333333] text-gray-300'
              }`}>
                {user.kycStatus === 'VERIFIED' ? <CheckCircle2 size={24} className="shrink-0 mt-0.5" /> : 
                 user.kycStatus === 'PENDING' ? <Clock size={24} className="shrink-0 mt-0.5 animate-spin" /> : 
                 <AlertCircle size={24} className="shrink-0 mt-0.5" />}
                <div>
                  <p className="font-black text-sm uppercase tracking-wide">
                    {user.kycStatus || 'ACTION REQUIRED'}
                  </p>
                  <p className="text-xs font-medium mt-1 opacity-90 leading-relaxed">
                    {user.kycStatus === 'VERIFIED' 
                      ? 'Your identity is fully verified. You have instant move-in escrow privileges and priority booking verification.' 
                      : user.kycStatus === 'PENDING' 
                      ? 'Your verification documents are under review by our audit team. Reviews are completed within 12-24 hours.' 
                      : user.kycStatus === 'REJECTED'
                      ? (user.kycRejectionReason || 'Previous verification was rejected. Please re-upload a clear, government-issued photo ID.')
                      : 'Please upload a clear government photo ID (Aadhaar, PAN, or Passport) to complete your verification.'}
                  </p>
                </div>
              </div>

              {/* UPLOAD FORM (Shown if not verified & not pending) */}
              {user.kycStatus !== 'VERIFIED' && user.kycStatus !== 'PENDING' && (
                <form onSubmit={handleKYCUpload} className="space-y-6 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                        Document Type
                      </label>
                      <select 
                        value={docType} 
                        onChange={(e) => setDocType(e.target.value)} 
                        className="w-full bg-[#202020] border border-[#333333] p-4 rounded-2xl outline-none font-bold text-sm text-white focus:border-primary transition"
                      >
                        <option value="AADHAAR" className="bg-[#202020] text-white">Aadhaar Card (Front/Back)</option>
                        <option value="PAN" className="bg-[#202020] text-white">Permanent Account Number (PAN)</option>
                        <option value="PASSPORT" className="bg-[#202020] text-white">Government Passport</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                         Upload Document Image
                       </label>
                       <div className="relative h-[56px] flex items-center px-4 bg-[#202020] rounded-2xl border-2 border-dashed border-[#3e3e3e] hover:border-primary transition group cursor-pointer">
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => setKycFile(e.target.files[0])} 
                            className="absolute inset-0 opacity-0 cursor-pointer" 
                          />
                          <span className="text-xs font-bold text-gray-300 truncate">
                            {kycFile ? kycFile.name : 'Choose JPG, PNG or Photo'}
                          </span>
                          <Camera size={18} className="ml-auto text-primary group-hover:scale-110 transition-transform shrink-0" />
                       </div>
                    </div>

                  </div>

                  <button 
                    type="submit" 
                    disabled={uploading} 
                    className="btn-netflix w-full py-4 rounded-2xl font-black text-xs uppercase tracking-wider shadow-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {uploading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Encrypting & Submitting...
                      </>
                    ) : (
                      <>
                        <Upload size={16} /> Submit Documents for Audit
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* DOCUMENT GALLERY / AUDIT HISTORY */}
              {(user.kycDocuments || []).length > 0 && (
                <div className="pt-6 border-t border-[#282828] space-y-4">
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                    Verification Audit History
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {user.kycDocuments.map((doc, idx) => (
                      <div key={idx} className="relative group rounded-2xl overflow-hidden border border-[#2e2e2e] h-28 bg-[#202020]">
                        <img src={doc.fileUrl} className="w-full h-full object-cover" alt="Verification Document" />
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all p-2 text-center">
                          <FileText size={20} className="text-primary mb-1" />
                          <span className="text-[10px] font-black uppercase text-white">{doc.docType}</span>
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
            <div className="space-y-6 animate-in fade-in duration-300">
              
              <div className="flex justify-between items-center bg-[#181818] p-6 rounded-2xl border border-[#2a2a2a]">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">Saved Stays</span>
                  <h3 className="text-2xl font-black italic tracking-tight text-white mt-0.5">
                    Your Wishlist
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 bg-[#242424] px-3.5 py-1.5 rounded-full border border-[#333333]">
                  <Heart size={14} className="text-primary fill-primary" />
                  <span>{wishlistItems.length} Stays Saved</span>
                </div>
              </div>

              {dataLoading ? (
                <div className="py-20 text-center">
                  <Loader2 className="animate-spin text-primary mx-auto" size={40}/>
                  <p className="text-xs text-gray-400 mt-2 font-bold">Loading your saved stays...</p>
                </div>
              ) : wishlistItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <div className="text-center py-20 bg-[#181818] rounded-[2.5rem] border border-[#2a2a2a] space-y-4 px-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto">
                    <Heart size={28} />
                  </div>
                  <h4 className="text-lg font-black text-white">Your wishlist is empty</h4>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto font-medium leading-relaxed">
                    Explore top audited rooms, student housing, and luxury coliving suites across India and save your favorites.
                  </p>
                  <Link 
                    to="/search" 
                    className="btn-netflix inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider"
                  >
                    Browse Stays <ArrowRight size={14} />
                  </Link>
                </div>
              )}

            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default Profile;
