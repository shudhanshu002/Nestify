import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../api/client';
import { 
  User, Mail, ShieldCheck, Heart, Settings, Loader2, 
  CheckCircle2, AlertCircle, Upload, Clock, XCircle, FileText, Camera, ArrowRight 
} from 'lucide-react';
import PropertyCard from '../components/PropertyCard';
import { useNavigate, useSearchParams } from 'react-router-dom';

const Profile = () => {
  const { user, loading, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Set initial tab from URL if present (e.g., /profile?tab=wishlist)
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'details'); 
  const [wishlistItems, setWishlistItems] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);

  // KYC States
  const [kycFile, setKycFile] = useState(null);
  const [docType, setDocType] = useState('AADHAAR');
  const [uploading, setUploading] = useState(false);

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
    formData.append('document', kycFile); // Must match uploadKYC.single('document') in backend

    try {
      const { data } = await API.post('/users/submit-kyc', formData);
      setUser(data.data); 
      alert("Documents submitted for admin review!");
      setActiveTab('kyc');
    } catch (err) {
      alert(err.response?.data?.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <Loader2 className="animate-spin text-primary" size={40} />
    </div>
  );

  if (!user) return <div className="p-20 text-center font-black">Please Login to view Profile</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 min-h-screen">
      <div className="flex flex-col lg:flex-row gap-10">
        
        {/* SIDEBAR */}
        <aside className="lg:w-1/3">
          <div className="bg-white p-8 rounded-[3rem] shadow-2xl shadow-blue-50 border border-gray-50 text-center">
            <div className="relative inline-block mb-6">
              <img 
                src={user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=006AFF&color=fff`} 
                className="w-28 h-28 rounded-3xl object-cover border-4 border-gray-50 shadow-md" 
                alt="Avatar"
              />
              {user.kycStatus === 'VERIFIED' && (
                <div className="absolute -bottom-2 -right-2 bg-green-500 p-1.5 rounded-xl border-2 border-white shadow-sm">
                  <CheckCircle2 size={16} className="text-white" />
                </div>
              )}
            </div>
            
            <h2 className="text-2xl font-black text-gray-900 leading-tight">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-2 flex items-center justify-center gap-1">
              {user.role} ACCOUNT {user.kycStatus === 'VERIFIED' && <CheckCircle2 size={10} className="text-green-500"/>}
            </p>

            <div className="mt-10 space-y-2">
              <button onClick={() => setActiveTab('details')} className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-sm transition-all ${activeTab === 'details' ? 'bg-gray-900 text-white shadow-xl' : 'text-gray-500 hover:bg-gray-50'}`}>
                <User size={18} /> Profile Details
              </button>

              <button onClick={() => setActiveTab('kyc')} className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-sm transition-all ${activeTab === 'kyc' ? 'bg-gray-900 text-white shadow-xl' : 'text-gray-500 hover:bg-gray-50'}`}>
                <ShieldCheck size={18} /> Verification
              </button>
              
              {user.role === 'TENANT' && (
                <button onClick={() => setActiveTab('wishlist')} className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-sm transition-all ${activeTab === 'wishlist' ? 'bg-gray-900 text-white shadow-xl' : 'text-gray-500 hover:bg-gray-50'}`}>
                  <Heart size={18} /> Saved Stays
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="lg:w-2/3">
          {activeTab === 'details' && (
            <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-50 space-y-10 animate-in fade-in duration-500">
              <div className="flex justify-between items-center border-b pb-6">
                <h3 className="text-2xl font-black text-gray-900">Account Information</h3>
                <Settings size={20} className="text-gray-300 cursor-pointer" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-gray-400 ml-1">Email</p>
                  <div className="p-4 bg-gray-50 rounded-2xl text-gray-600 font-bold flex items-center gap-3"><Mail size={18} className="text-gray-300"/>{user.email}</div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-gray-400 ml-1">Trust Status</p>
                  <div className={`p-4 rounded-2xl font-black text-sm flex items-center gap-3 ${user.kycStatus === 'VERIFIED' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-primary'}`}>
                    <ShieldCheck size={18}/> {user.kycStatus || 'NOT STARTED'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'kyc' && (
            <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-50 space-y-8 animate-in slide-in-from-right-4 duration-500">
              <h3 className="text-2xl font-black text-gray-900">Verification Center</h3>
              
              {/* STATUS BANNER */}
              <div className={`p-6 rounded-[2rem] flex items-center gap-4 ${
                user.kycStatus === 'VERIFIED' ? 'bg-green-50 text-green-700' :
                user.kycStatus === 'PENDING' ? 'bg-blue-50 text-blue-700' :
                user.kycStatus === 'REJECTED' ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-700'
              }`}>
                {user.kycStatus === 'VERIFIED' ? <CheckCircle2 size={24} /> : user.kycStatus === 'PENDING' ? <Clock size={24} /> : <AlertCircle size={24} />}
                <div>
                  <p className="font-black text-sm uppercase">{user.kycStatus || 'ACTION REQUIRED'}</p>
                  <p className="text-xs font-medium opacity-80">
                    {user.kycStatus === 'VERIFIED' ? 'Identity verified. You are a trusted member.' :
                     user.kycStatus === 'PENDING' ? 'Verification in progress. Usually takes 24h.' : 'Please upload a Govt ID to access all features.'}
                  </p>
                </div>
              </div>

              {/* UPLOAD FORM */}
              {user.kycStatus !== 'VERIFIED' && user.kycStatus !== 'PENDING' && (
                <form onSubmit={handleKYCUpload} className="space-y-6 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400">ID Type</label>
                      <select value={docType} onChange={(e) => setDocType(e.target.value)} className="w-full bg-gray-50 p-4 rounded-2xl outline-none font-bold text-sm">
                        <option value="AADHAAR">Aadhaar Card</option>
                        <option value="PAN">PAN Card</option>
                        <option value="PASSPORT">Passport</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-gray-400">File</label>
                       <div className="relative h-[56px] flex items-center px-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                          <input type="file" accept="image/*" onChange={(e) => setKycFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
                          <span className="text-xs font-bold text-gray-400 truncate">{kycFile ? kycFile.name : 'Choose JPG/PNG'}</span>
                          <Camera size={18} className="ml-auto text-gray-300" />
                       </div>
                    </div>
                  </div>
                  <button type="submit" disabled={uploading} className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black shadow-xl disabled:opacity-50">
                    {uploading ? 'Processing Matrix...' : 'Submit Documents'}
                  </button>
                </form>
              )}

              {/* DOCUMENT GALLERY (Safe for Legacy Users) */}
              {(user.kycDocuments || []).length > 0 && (
                <div className="pt-6 border-t border-gray-100">
                  <p className="text-[10px] font-black uppercase text-gray-400 mb-4 tracking-widest">History</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {user.kycDocuments.map((doc, idx) => (
                      <div key={idx} className="relative group rounded-2xl overflow-hidden border border-gray-100 h-24 bg-gray-50">
                        <img src={doc.fileUrl} className="w-full h-full object-cover" alt="Doc" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"><FileText size={20} className="text-white" /></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'wishlist' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <h3 className="text-2xl font-black text-gray-900">Your Favorites</h3>
              {dataLoading ? <Loader2 className="animate-spin text-primary mx-auto" size={40}/> : wishlistItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{wishlistItems.map(item => <PropertyCard key={item._id} property={item.property} />)}</div>
              ) : <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-gray-100 text-gray-400 font-bold">Wishlist is empty.</div>}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Profile;