import { useState, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/client';
import { 
  Building2, MapPin, CheckCircle, FileText, Loader2, 
  Wifi, Shield, Video, Battery, Image as ImageIcon, Plus, X, UploadCloud, ShieldCheck, Sparkles 
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';

const TIERS = [
  { 
    id: 'FLAGSHIP', 
    title: '⭐ Nestify Flagship', 
    badge: 'Popular',
    desc: 'Verified standard co-living with serviced amenities & power backup' 
  },
  { 
    id: 'LUXURY', 
    title: '💎 Luxury Collection', 
    badge: 'Premium',
    desc: 'High-end interior suites, AC, private washrooms & hotel-grade service' 
  },
  { 
    id: 'BUDGET', 
    title: '🎓 Student & Budget', 
    badge: 'Affordable',
    desc: 'Pocket-friendly student stay with meals, Wi-Fi & study environment' 
  },
  { 
    id: 'STANDARD', 
    title: '🏠 Standard PG', 
    badge: 'Classic',
    desc: 'Classic independent stay with essential facilities' 
  }
];

const AddProperty = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const legalInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'PG',
    tier: 'FLAGSHIP', // Explicit Tier
    genderPreference: 'UNISEX',
    address: '',
    city: '',
    state: '',
    lng: '77.36',
    lat: '28.62',
    amenities: 'WiFi, CCTV, Power Backup, Laundry, Gym',
    internetSpeed: 'High',
    noiseLevel: 'Low',
    powerBackup: true,
    cctv: true
  });

  const [images, setImages] = useState([]);
  const [legalDoc, setLegalDoc] = useState(null);

  // Identity verification lock
  if (user?.kycStatus !== 'VERIFIED') {
    return (
      <div className="max-w-4xl mx-auto py-20 px-6 text-center">
        <div className="bg-white p-16 rounded-[4rem] shadow-2xl border border-gray-100 space-y-8 animate-in zoom-in duration-500">
          <div className="w-24 h-24 bg-blue-50 text-primary rounded-full flex items-center justify-center mx-auto shadow-inner">
            <ShieldCheck size={48} />
          </div>
          <div>
            <h2 className="text-4xl font-black italic tracking-tighter">Identity Required.</h2>
            <p className="text-gray-400 font-bold mt-4 max-w-md mx-auto">
              Your identity must be <span className="text-primary underline">VERIFIED</span> by our admin team before you can list a property on Nestify.
            </p>
          </div>
          <button 
            onClick={() => navigate('/profile?tab=kyc')}
            className="bg-gray-900 text-white px-10 py-5 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-primary transition-all shadow-xl"
          >
            Go to Verification
          </button>
        </div>
      </div>
    );
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => ({
      file: file,
      preview: URL.createObjectURL(file)
    }));
    setImages([...images, ...newImages]);
  };

  const handleLegalChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLegalDoc({
        file: file,
        name: file.name
      });
    }
  };

  const removeImage = (index) => {
    const filteredImages = images.filter((_, i) => i !== index);
    URL.revokeObjectURL(images[index].preview);
    setImages(filteredImages);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!legalDoc) return alert("Please upload ownership documents for verification.");
    setLoading(true);

    try {
      const multiPartFormData = new FormData();

      // 1. Append Building Images
      images.forEach((imgObj) => {
        multiPartFormData.append('images', imgObj.file); 
      });

      // 2. Append Legal Document
      multiPartFormData.append('legalDocument', legalDoc.file);

      // 3. Append Textual Fields
      multiPartFormData.append('title', formData.title);
      multiPartFormData.append('description', formData.description);
      multiPartFormData.append('category', formData.category);
      multiPartFormData.append('tier', formData.tier || 'FLAGSHIP'); // Explicit Tier Saved
      multiPartFormData.append('genderPreference', formData.genderPreference);

      // 4. Location Stringification
      const locationJSON = JSON.stringify({
        address: formData.address,
        city: formData.city,
        state: formData.state,
        coordinates: {
          type: 'Point',
          coordinates: [parseFloat(formData.lng) || 0, parseFloat(formData.lat) || 0]
        }
      });
      multiPartFormData.append('location', locationJSON);

      // 5. Amenities processing
      const amenitiesArr = formData.amenities.split(',').map(item => item.trim());
      multiPartFormData.append('amenities', JSON.stringify(amenitiesArr));

      // 6. Safety Metrics Stringification
      const safetyJSON = JSON.stringify({
        noiseLevel: formData.noiseLevel,
        internetSpeed: formData.internetSpeed,
        powerBackup: formData.powerBackup,
        cctv: formData.cctv
      });
      multiPartFormData.append('safetyMetrics', safetyJSON);

      const { data } = await API.post('/properties', multiPartFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      navigate(`/owner/add-room/${data.propertyId}`);
    } catch (err) {
      console.error("Payload Error:", err.response?.data);
      alert(err.response?.data?.message || "Check your backend connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-20 px-6">
      <div className="mb-12">
        <h1 className="text-5xl font-black italic tracking-tighter text-gray-900">List Property.</h1>
        <p className="text-gray-400 font-bold mt-2 uppercase text-xs tracking-[0.3em]">Step 1: Identity, Tier, Docs & Photos</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-12 bg-white p-8 sm:p-12 rounded-[4rem] shadow-2xl border border-gray-100">
        
        {/* --- SECTION 1: BASICS --- */}
        <section className="space-y-6">
          <h3 className="text-xl font-black italic text-primary">01. Basic Information</h3>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
              <Building2 size={12}/> Building Title
            </label>
            <input 
              required 
              className="w-full p-6 bg-gray-50 rounded-3xl font-bold outline-none" 
              placeholder="The Royal Residency" 
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})} 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
              <FileText size={12}/> Building Description
            </label>
            <textarea 
              required 
              rows="4" 
              className="w-full p-6 bg-gray-50 rounded-3xl font-bold outline-none resize-none" 
              placeholder="Describe the property, atmosphere, connectivity..." 
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})} 
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-2">Category</label>
              <select 
                className="w-full p-6 bg-gray-50 rounded-3xl font-bold outline-none cursor-pointer" 
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                <option value="PG">PG / Co-Living</option>
                <option value="Hotel">Hotel</option>
                <option value="Hostel">Hostel</option>
                <option value="Guest House">Guest House</option>
              </select>
            </div>
            
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-2">Resident Preference</label>
              <select 
                className="w-full p-6 bg-gray-50 rounded-3xl font-bold outline-none cursor-pointer" 
                value={formData.genderPreference}
                onChange={e => setFormData({...formData, genderPreference: e.target.value})}
              >
                <option value="UNISEX">Unisex (All Welcome)</option>
                <option value="MALE">Male Only (Boys)</option>
                <option value="FEMALE">Female Only (Girls)</option>
              </select>
            </div>
          </div>

          {/* EXPLICIT TIER SELECTION (OYO TIER COLLECTION) */}
          <div className="space-y-3 pt-2">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
              <Sparkles size={14} className="text-amber-500" />
              Property Experience Tier (Collection Type)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {TIERS.map(t => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setFormData({ ...formData, tier: t.id })}
                  className={`p-4 rounded-3xl border-2 text-left transition-all ${
                    formData.tier === t.id 
                      ? 'border-primary bg-primary/5 shadow-md scale-[1.02]' 
                      : 'border-gray-100 hover:border-gray-200 bg-gray-50/60'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-black text-sm text-gray-900">{t.title}</span>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
                      {t.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium leading-snug mt-1">
                    {t.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* --- SECTION 2: LEGAL DOCS --- */}
        <section className="space-y-6 pt-12 border-t border-gray-100">
          <h3 className="text-xl font-black italic text-secondary flex items-center gap-3"><ShieldCheck/> Legal Verification</h3>
          <div 
            onClick={() => legalInputRef.current.click()}
            className={`border-4 border-dashed rounded-[3rem] p-10 text-center transition cursor-pointer ${legalDoc ? 'border-green-500 bg-green-50' : 'border-blue-100 bg-blue-50'}`}
          >
            <input type="file" ref={legalInputRef} onChange={handleLegalChange} className="hidden" />
            <FileText size={32} className={`mx-auto mb-2 ${legalDoc ? 'text-green-500' : 'text-blue-400'}`} />
            <p className="font-black text-sm text-gray-700">{legalDoc ? legalDoc.name : "Upload Ownership Proof (Registry/Tax Receipt)"}</p>
          </div>
        </section>

        {/* --- SECTION 3: LOCATION --- */}
        <section className="space-y-6 pt-12 border-t border-gray-100">
          <h3 className="text-xl font-black italic text-primary flex items-center gap-3"><MapPin/> Precise Location</h3>
          <input required className="w-full p-6 bg-gray-50 rounded-3xl font-bold outline-none" placeholder="Street Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
          <div className="grid grid-cols-2 gap-6">
            <input required className="p-6 bg-gray-50 rounded-3xl font-bold outline-none" placeholder="City" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
            <input required className="p-6 bg-gray-50 rounded-3xl font-bold outline-none" placeholder="State" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <input type="number" step="any" className="p-6 bg-gray-50 rounded-3xl font-bold outline-none" placeholder="Longitude" value={formData.lng} onChange={e => setFormData({...formData, lng: e.target.value})} />
            <input type="number" step="any" className="p-6 bg-gray-50 rounded-3xl font-bold outline-none" placeholder="Latitude" value={formData.lat} onChange={e => setFormData({...formData, lat: e.target.value})} />
          </div>
        </section>

        {/* --- SECTION 4: IMAGES --- */}
        <section className="space-y-6 pt-12 border-t border-gray-100">
          <h3 className="text-xl font-black italic text-primary flex items-center gap-3"><ImageIcon/> Visual Proof</h3>
          <div onClick={() => fileInputRef.current.click()} className="border-4 border-dashed border-gray-200 rounded-[3rem] p-16 text-center hover:border-primary cursor-pointer group transition">
            <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            <UploadCloud size={48} className="mx-auto text-gray-300 group-hover:text-primary mb-4"/>
            <p className="font-black text-gray-900 text-lg">Click to Upload Building Photos</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {images.map((img, idx) => (
              <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-gray-100 group">
                <img src={img.preview} className="w-full h-full object-cover" alt={`Preview ${idx + 1}`} />
                <button type="button" onClick={() => removeImage(idx)} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition"><X size={14}/></button>
              </div>
            ))}
          </div>
        </section>

        <button disabled={loading} type="submit" className="w-full bg-gray-900 text-white py-8 rounded-[2.5rem] font-black text-2xl hover:bg-primary transition shadow-2xl flex items-center justify-center gap-4">
          {loading ? <Loader2 className="animate-spin"/> : <CheckCircle size={28}/>}
          {loading ? 'Securing Data...' : 'Submit for Verification'}
        </button>
      </form>
    </div>
  );
};

export default AddProperty;
