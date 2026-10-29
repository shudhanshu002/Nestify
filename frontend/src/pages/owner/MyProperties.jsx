import { useEffect, useState } from 'react';
import API from '../../api/client';
import { 
  Plus, Loader2, ChevronRight, ArrowLeft, 
  CheckCircle, Clock, AlertOctagon, UploadCloud, FileText, X, MapPin 
} from 'lucide-react';
import { Link } from 'react-router-dom';

const MyProperties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('VERIFIED'); // Default view
  const [selectedProp, setSelectedProp] = useState(null); // For Resubmit Modal

  const fetchMyProperties = async () => {
    try {
      const { data } = await API.get('/properties/my-listings'); 
      setProperties(data.data);
    } catch (err) { 
      console.error("Fetch Error:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchMyProperties(); 
  }, []);

  // Filter logic for tabs
  const filteredProperties = properties.filter(p => p.verificationStatus === activeTab);

  // Status Counters
  const stats = {
    verified: properties.filter(p => p.verificationStatus === 'VERIFIED').length,
    pending: properties.filter(p => p.verificationStatus === 'PENDING').length,
    rejected: properties.filter(p => p.verificationStatus === 'REJECTED').length,
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <Link to="/owner/dashboard" className="flex items-center gap-2 text-gray-400 font-black text-[10px] uppercase mb-2 hover:text-primary transition">
            <ArrowLeft size={14}/> Back to Occupancy
          </Link>
          <h1 className="text-5xl font-black text-gray-900 italic tracking-tighter">Inventory.</h1>
        </div>
        <Link to="/owner/add-property" className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-2xl active:scale-95 transition hover:bg-primary">
          <Plus size={20} /> New Building
        </Link>
      </div>

      {/* 󾠮 TAB SYSTEM: CLEANER NAVIGATION */}
      <div className="flex bg-gray-100 p-2 rounded-[2rem] mb-10 w-fit">
        <button 
          onClick={() => setActiveTab('VERIFIED')}
          className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase transition-all flex items-center gap-2 ${activeTab === 'VERIFIED' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
        >
          <CheckCircle size={14}/> Live ({stats.verified})
        </button>
        <button 
          onClick={() => setActiveTab('PENDING')}
          className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase transition-all flex items-center gap-2 ${activeTab === 'PENDING' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
        >
          <Clock size={14}/> Pending ({stats.pending})
        </button>
        <button 
          onClick={() => setActiveTab('REJECTED')}
          className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase transition-all flex items-center gap-2 ${activeTab === 'REJECTED' ? 'bg-white text-red-500 shadow-sm' : 'text-gray-400'}`}
        >
          <AlertOctagon size={14}/> Rejected ({stats.rejected})
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="animate-spin mx-auto text-primary" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredProperties.length > 0 ? filteredProperties.map(pg => (
            <div key={pg._id} className="bg-white p-8 rounded-[3.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 group">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                
                {/* BUILDING INFO */}
                <div className="flex items-center gap-8 w-full md:w-auto">
                  <div className="relative">
                    <img 
                      src={pg.images?.[0]?.url || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=300'} 
                      className={`w-32 h-32 rounded-[2.5rem] object-cover shadow-2xl transition-all duration-700 ${pg.verificationStatus === 'REJECTED' ? 'grayscale opacity-50' : ''}`} 
                    />
                    {pg.verificationStatus === 'VERIFIED' && (
                      <div className="absolute -top-2 -right-2 bg-green-500 text-white p-1.5 rounded-full border-4 border-white">
                        <CheckCircle size={14} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-2xl text-gray-900 leading-none mb-2">{pg.title}</h3>
                    <p className="text-gray-400 text-xs font-bold flex items-center gap-1 mb-4">
                      <MapPin size={12}/> {pg.location?.city || "Location Pending"}
                    </p>
                    
                    {/* SHOW REASON IF REJECTED */}
                    {pg.verificationStatus === 'REJECTED' && (
                      <div className="inline-block px-4 py-2 bg-red-50 border border-red-100 rounded-xl">
                        <p className="text-[10px] font-black text-red-500 uppercase">
                          Reason: <span className="italic font-bold text-gray-700 normal-case">"{pg.rejectionReason || "Documents unclear."}"</span>
                        </p>
                      </div>
                    )}

                    {/* SHOW PENDING NOTICE */}
                    {pg.verificationStatus === 'PENDING' && (
                      <p className="text-[10px] font-black text-orange-500 uppercase flex items-center gap-1">
                        <Clock size={12}/> Currently Under Review
                      </p>
                    )}
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex gap-3 w-full md:w-auto">
                  {pg.verificationStatus === 'REJECTED' ? (
                    <button 
                      onClick={() => setSelectedProp(pg)}
                      className="flex-1 md:flex-none bg-red-500 text-white px-8 py-5 rounded-3xl font-black text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-red-600 shadow-lg shadow-red-100 transition active:scale-95"
                    >
                      <UploadCloud size={16} /> Try Again / Resubmit
                    </button>
                  ) : (
                    <>
                      <Link 
                        to={`/owner/add-room/${pg._id}`} 
                        className="flex-1 md:flex-none bg-gray-50 text-gray-500 px-6 py-5 rounded-3xl font-black text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-gray-900 hover:text-white transition"
                      >
                        <Plus size={16} /> Inventory
                      </Link>
                      {pg.verificationStatus === 'VERIFIED' && (
                        <Link 
                          to={`/property/${pg._id}`} 
                          className="flex-1 md:flex-none bg-white border-2 border-gray-900 text-gray-900 px-6 py-5 rounded-3xl font-black text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-gray-900 hover:text-white transition"
                        >
                          Preview <ChevronRight size={16} />
                        </Link>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )) : (
            <div className="py-32 text-center bg-gray-50 rounded-[4rem] border-4 border-dashed border-gray-100">
               <p className="font-black text-gray-300 uppercase tracking-widest text-sm italic">
                 No {activeTab.toLowerCase()} listings in the Matrix.
               </p>
            </div>
          )}
        </div>
      )}

      {/* 󾠱 RESUBMIT MODAL */}
      {selectedProp && (
        <ResubmitModal 
          property={selectedProp} 
          onClose={() => setSelectedProp(null)} 
          onSuccess={() => { 
            fetchMyProperties(); 
            setActiveTab('PENDING'); // Move user to pending tab to see progress
            setSelectedProp(null); 
          }}
        />
      )}
    </div>
  );
};

// --- MODAL COMPONENT ---
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[600] flex items-center justify-center p-6">
      <div className="bg-white max-w-lg w-full rounded-[4rem] p-12 space-y-8 animate-in zoom-in duration-300">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-black italic">Fix Listing.</h2>
            <p className="text-[10px] font-black uppercase text-gray-400 mt-1">Property: {property.title}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24}/>
          </button>
        </div>
        
        <div className="border-4 border-dashed border-blue-50 bg-blue-50/50 p-12 rounded-[3rem] text-center relative cursor-pointer group transition-colors hover:border-primary/30">
          <input 
            type="file" 
            className="absolute inset-0 opacity-0 cursor-pointer" 
            onChange={(e) => setFile(e.target.files[0])} 
          />
          <FileText size={40} className="mx-auto text-blue-300 group-hover:text-primary transition-all" />
          <p className="mt-4 text-[10px] font-black uppercase text-gray-500 tracking-widest">
            {file ? file.name : "Select Clear Ownership Proof"}
          </p>
        </div>

        <button 
          onClick={handleAction} 
          disabled={upLoading}
          className="w-full bg-gray-900 text-white py-6 rounded-3xl font-black uppercase text-sm shadow-xl active:scale-95 transition flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {upLoading ? <Loader2 className="animate-spin" /> : "Send for Admin Review"}
        </button>
      </div>
    </div>
  );
};

export default MyProperties;