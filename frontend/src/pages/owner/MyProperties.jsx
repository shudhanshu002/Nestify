import { useEffect, useState } from 'react';
import API from '../../api/client';
import { 
  Plus, Loader2, ChevronRight, ArrowLeft, 
  CheckCircle2, Clock, AlertOctagon, UploadCloud, FileText, X, MapPin, Calendar 
} from 'lucide-react';
import { Link } from 'react-router-dom';

const MyProperties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('VERIFIED');
  const [selectedProp, setSelectedProp] = useState(null);

  const fetchMyProperties = async () => {
    try {
      const { data } = await API.get('/properties/my-listings'); 
      setProperties(data.data || []);
    } catch (err) { 
      console.error("Fetch Error:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchMyProperties(); 
  }, []);

  const filteredProperties = properties.filter(p => p.verificationStatus === activeTab);

  const stats = {
    verified: properties.filter(p => p.verificationStatus === 'VERIFIED').length,
    pending: properties.filter(p => p.verificationStatus === 'PENDING').length,
    rejected: properties.filter(p => p.verificationStatus === 'REJECTED').length,
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 text-white space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-neutral-800 pb-5">
        <div>
          <Link to="/owner/dashboard" className="flex items-center gap-1.5 text-neutral-400 font-bold text-xs uppercase mb-2 hover:text-white transition">
            <ArrowLeft size={14}/> Back to Occupancy
          </Link>
          <h1 className="text-3xl sm:text-4xl font-black text-white italic tracking-wide">
            Inventory & Buildings
          </h1>
          <p className="text-xs text-neutral-400 mt-1">Manage listed stays, upload legal deeds, and track live verification stages.</p>
        </div>
        <Link 
          to="/owner/add-property" 
          className="btn-red-glow px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow transition"
        >
          <Plus size={16} /> List New PG
        </Link>
      </div>

      {/* TAB SYSTEM: COMPACT PILLS */}
      <div className="flex items-center gap-2 overflow-x-auto text-[11px] font-extrabold w-full md:w-auto">
        <button 
          onClick={() => setActiveTab('VERIFIED')}
          className={`px-3.5 py-1.5 rounded-full font-black text-xs uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'VERIFIED' 
              ? 'bg-[#E50914] text-white shadow' 
              : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
          }`}
        >
          <CheckCircle2 size={13}/> LIVE ({stats.verified})
        </button>
        <button 
          onClick={() => setActiveTab('PENDING')}
          className={`px-3.5 py-1.5 rounded-full font-black text-xs uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'PENDING' 
              ? 'bg-amber-600 text-white shadow' 
              : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
          }`}
        >
          <Clock size={13}/> PENDING ({stats.pending})
        </button>
        <button 
          onClick={() => setActiveTab('REJECTED')}
          className={`px-3.5 py-1.5 rounded-full font-black text-xs uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'REJECTED' 
              ? 'bg-red-700 text-white shadow' 
              : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
          }`}
        >
          <AlertOctagon size={13}/> REJECTED ({stats.rejected})
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="animate-spin mx-auto text-primary" size={36} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredProperties.length > 0 ? filteredProperties.map(pg => (
            <div 
              key={pg._id} 
              className="bg-[#141414] p-5 sm:p-6 rounded-2xl border border-neutral-800 shadow-xl hover:border-neutral-700 transition group"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                
                {/* BUILDING INFO */}
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="relative shrink-0">
                    <img 
                      src={pg.images?.[0]?.url || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=300'} 
                      alt={pg.title}
                      className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shadow-md border border-neutral-800 ${
                        pg.verificationStatus === 'REJECTED' ? 'grayscale opacity-60' : ''
                      }`} 
                    />
                    {pg.verificationStatus === 'VERIFIED' && (
                      <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white p-1 rounded-full border-2 border-[#141414]">
                        <CheckCircle2 size={11} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-base sm:text-lg text-white leading-tight mb-1 truncate">{pg.title}</h3>
                    <p className="text-neutral-400 text-xs font-medium flex items-center gap-1 mb-2">
                      <MapPin size={12} className="text-[#E50914] shrink-0"/> 
                      <span className="truncate">{pg.location?.address ? `${pg.location.address}, ` : ''}{pg.location?.city || "Location Pending"}</span>
                    </p>
                    
                    {/* SHOW REASON IF REJECTED */}
                    {pg.verificationStatus === 'REJECTED' && (
                      <div className="inline-block px-2.5 py-1 bg-red-950/40 border border-red-900/40 rounded-lg">
                        <p className="text-[10px] font-bold text-red-400">
                          Reason: <span className="text-gray-300 font-medium">"{pg.rejectionReason || "Documents unclear."}"</span>
                        </p>
                      </div>
                    )}

                    {/* SHOW PENDING NOTICE */}
                    {pg.verificationStatus === 'PENDING' && (
                      <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                        <Clock size={11}/> Currently Under Review
                      </span>
                    )}
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {pg.verificationStatus === 'REJECTED' ? (
                    <button 
                      onClick={() => setSelectedProp(pg)}
                      className="btn-red-glow px-4 py-2 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-1.5 shadow cursor-pointer"
                    >
                      <UploadCloud size={14} /> Resubmit
                    </button>
                  ) : (
                    <>
                      <Link 
                        to={`/owner/dashboard?tab=occupancy&propertyId=${pg._id}`} 
                        className="bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 px-3.5 py-2 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer transition"
                        title="View Room & Date Schedule"
                      >
                        <Calendar size={13} /> Room Schedule
                      </Link>
                      <Link 
                        to={`/owner/add-room/${pg._id}`} 
                        className="bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 px-3.5 py-2 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer transition"
                      >
                        <Plus size={14} /> Inventory
                      </Link>
                      {pg.verificationStatus === 'VERIFIED' && (
                        <Link 
                          to={`/property/${pg._id}`} 
                          className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white font-bold text-xs uppercase flex items-center justify-center gap-1 cursor-pointer transition"
                        >
                          Preview <ChevronRight size={13} />
                        </Link>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )) : (
            <div className="py-20 text-center bg-[#141414] rounded-2xl border border-neutral-800 p-8">
               <p className="font-bold text-neutral-400 text-xs uppercase tracking-wider">
                 No {activeTab.toLowerCase()} listings in your inventory.
               </p>
            </div>
          )}
        </div>
      )}

      {/* RESUBMIT MODAL */}
      {selectedProp && (
        <ResubmitModal 
          property={selectedProp} 
          onClose={() => setSelectedProp(null)} 
          onSuccess={() => { 
            fetchMyProperties(); 
            setActiveTab('PENDING');
            setSelectedProp(null); 
          }}
        />
      )}
    </div>
  );
};

// --- MODAL COMPONENT (DARK THEME) ---
const ResubmitModal = ({ property, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [upLoading, setUpLoading] = useState(false);

  const handleAction = async () => {
    if(!file) return alert("Please select a valid document first.");
    setUpLoading(true);
    
    const formData = new FormData();
    formData.append('legalDocument', file);

    try {
      await API.put(`/properties/${property._id}/resubmit`, formData);
      alert("Documents Re-submitted! Your building is back in the queue.");
      onSuccess();
    } catch (err) { 
      alert(err.response?.data?.message || "Resubmission failed."); 
    } finally { 
      setUpLoading(false); 
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[600] flex items-center justify-center p-4 animate-in fade-in duration-200 text-white">
      <div className="bg-[#141414] border border-neutral-800 max-w-md w-full rounded-3xl p-6 sm:p-8 space-y-6 relative shadow-2xl">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-black italic text-white">Fix Listing Proof</h2>
            <p className="text-xs text-neutral-400 mt-0.5 truncate max-w-xs">{property.title}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition cursor-pointer">
            <X size={18}/>
          </button>
        </div>
        
        <div className="border-2 border-dashed border-neutral-800 hover:border-neutral-600 bg-black/40 p-8 rounded-2xl text-center relative cursor-pointer group transition">
          <input 
            type="file" 
            className="absolute inset-0 opacity-0 cursor-pointer" 
            onChange={(e) => setFile(e.target.files[0])} 
          />
          <FileText size={32} className="mx-auto text-[#E50914] mb-2 transition-transform group-hover:scale-105" />
          <p className="text-xs font-bold text-neutral-300">
            {file ? file.name : "Select Ownership Proof (Registry / Tax Receipt)"}
          </p>
          <p className="text-[10px] text-neutral-500 mt-1">PDF or image files</p>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-400 hover:text-white transition cursor-pointer"
          >
            Cancel
          </button>
          <button 
            onClick={handleAction} 
            disabled={upLoading}
            className="btn-red-glow px-5 py-2.5 rounded-xl font-black text-xs uppercase shadow flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {upLoading ? <Loader2 className="animate-spin" size={14} /> : "Submit for Review"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyProperties;
