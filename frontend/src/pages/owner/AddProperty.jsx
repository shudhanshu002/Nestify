import { useState, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/client';
import { 
  Building2, MapPin, CheckCircle, FileText, Loader2, 
  Wifi, Shield, Video, Battery, Image as ImageIcon, Plus, X, 
  UploadCloud, ShieldCheck, Sparkles, ArrowLeft
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
    tier: 'FLAGSHIP',
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

  // Identity verification lock (styled to website dark theme)
  if (user?.kycStatus !== 'VERIFIED') {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center text-white">
        <div className="bg-[#181818] p-8 sm:p-12 rounded-3xl shadow-2xl border border-[#2a2a2a] space-y-6 relative overflow-hidden">
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="w-16 h-16 bg-[#222222] border border-[#333333] text-primary rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black italic tracking-tight">Identity Verification Required</h2>
            <p className="text-gray-400 font-medium text-xs sm:text-sm mt-2 max-w-md mx-auto leading-relaxed">
              Your identity must be <span className="text-primary font-bold">VERIFIED</span> by our admin team before listing properties on Nestify.
            </p>
          </div>
          <button 
            onClick={() => navigate('/verify-identity')}
            className="btn-netflix px-6 py-3 rounded-xl font-black uppercase text-xs tracking-wider shadow-lg shadow-red-950/40 cursor-pointer"
          >
            Complete Verification Now
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
    setImages(prev => [...prev, ...newImages]);
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
    if (images[index]?.preview) URL.revokeObjectURL(images[index].preview);
    setImages(filteredImages);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!legalDoc) return alert("Please upload ownership documents for legal verification.");
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
      multiPartFormData.append('title', formData.title.trim());
      multiPartFormData.append('description', formData.description.trim());
      multiPartFormData.append('category', formData.category);
      multiPartFormData.append('tier', formData.tier || 'FLAGSHIP');
      multiPartFormData.append('genderPreference', formData.genderPreference);

      // 4. Location
      const locationJSON = JSON.stringify({
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        coordinates: {
          type: 'Point',
          coordinates: [parseFloat(formData.lng) || 0, parseFloat(formData.lat) || 0]
        }
      });
      multiPartFormData.append('location', locationJSON);

      // 5. Amenities processing
      const amenitiesArr = formData.amenities.split(',').map(item => item.trim()).filter(Boolean);
      multiPartFormData.append('amenities', JSON.stringify(amenitiesArr));

      // 6. Safety Metrics
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
      alert(err.response?.data?.message || "Failed to list property. Please check inputs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-12 px-4 sm:px-6 text-white">
      {/* Top Header */}
      <div className="mb-8">
        <button 
          onClick={() => navigate(-1)} 
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-white transition-colors cursor-pointer mb-2"
        >
          <ArrowLeft size={14} /> Back
        </button>
        <h1 className="text-2xl sm:text-4xl font-black italic tracking-tight text-white">
          List New PG / Co-Living
        </h1>
        <p className="text-gray-400 font-medium text-xs sm:text-sm mt-1">
          Step 1: Property profile, experience tier, legal verification, & photos
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-[#181818] p-6 sm:p-9 rounded-3xl shadow-2xl border border-[#2a2a2a]">
        
        {/* --- SECTION 1: BASICS --- */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#282828]">
            <span className="text-xs font-black uppercase tracking-wider text-primary">01</span>
            <h3 className="text-sm sm:text-base font-black text-white">Basic Information</h3>
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
              <Building2 size={12} className="text-primary"/> Building / PG Title
            </label>
            <input 
              required 
              className="w-full py-2.5 px-3.5 bg-[#222222] border border-[#333333] rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition font-medium" 
              placeholder="e.g. Royal Nest Residency" 
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })} 
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
              <FileText size={12} className="text-primary"/> Description & Highlights
            </label>
            <textarea 
              required 
              rows="3" 
              className="w-full p-3.5 bg-[#222222] border border-[#333333] rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition font-medium resize-none" 
              placeholder="Describe the property ambience, student/corporate friendly facilities, connectivity to metro/tech parks..." 
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })} 
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Property Category</label>
              <select 
                className="w-full py-2.5 px-3.5 bg-[#222222] border border-[#333333] rounded-xl text-xs sm:text-sm text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none transition font-medium cursor-pointer" 
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="PG">PG / Co-Living</option>
                <option value="Hotel">Hotel</option>
                <option value="Hostel">Hostel</option>
                <option value="Guest House">Guest House</option>
              </select>
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Resident Preference</label>
              <select 
                className="w-full py-2.5 px-3.5 bg-[#222222] border border-[#333333] rounded-xl text-xs sm:text-sm text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none transition font-medium cursor-pointer" 
                value={formData.genderPreference}
                onChange={e => setFormData({ ...formData, genderPreference: e.target.value })}
              >
                <option value="UNISEX">Unisex (All Welcome)</option>
                <option value="MALE">Male Only (Boys)</option>
                <option value="FEMALE">Female Only (Girls)</option>
              </select>
            </div>
          </div>

          {/* EXPLICIT TIER SELECTION */}
          <div className="space-y-2 pt-2">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
              <Sparkles size={12} className="text-amber-400" />
              Property Experience Tier (Collection Type)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {TIERS.map(t => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setFormData({ ...formData, tier: t.id })}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    formData.tier === t.id 
                      ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary/30 text-white' 
                      : 'border-[#303030] bg-[#222222] hover:border-[#444444] text-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-xs">{t.title}</span>
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md bg-[#2c2c2c] text-gray-300">
                      {t.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-normal leading-snug">
                    {t.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* --- SECTION 2: LEGAL DOCS --- */}
        <section className="space-y-3 pt-6 border-t border-[#282828]">
          <div className="flex items-center gap-2 pb-1">
            <span className="text-xs font-black uppercase tracking-wider text-secondary">02</span>
            <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              <ShieldCheck size={16} className="text-secondary"/> Legal Verification Document
            </h3>
          </div>
          
          <div 
            onClick={() => legalInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer ${
              legalDoc 
                ? 'border-emerald-500/60 bg-emerald-950/20 text-emerald-400' 
                : 'border-[#383838] hover:border-primary/50 bg-[#202020]'
            }`}
          >
            <input type="file" ref={legalInputRef} onChange={handleLegalChange} className="hidden" />
            <FileText size={24} className={`mx-auto mb-1.5 ${legalDoc ? 'text-emerald-400' : 'text-gray-400'}`} />
            <p className="font-bold text-xs sm:text-sm text-gray-200">
              {legalDoc ? legalDoc.name : "Click to Upload Ownership Proof (Registry / Utility Bill / Tax Receipt)"}
            </p>
            <p className="text-[10px] text-gray-500 mt-0.5">PDF or high-resolution photo supported</p>
          </div>
        </section>

        {/* --- SECTION 3: LOCATION --- */}
        <section className="space-y-4 pt-6 border-t border-[#282828]">
          <div className="flex items-center gap-2 pb-1">
            <span className="text-xs font-black uppercase tracking-wider text-primary">03</span>
            <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              <MapPin size={16} className="text-primary"/> Precise Location
            </h3>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Street Address</label>
            <input 
              required 
              className="w-full py-2.5 px-3.5 bg-[#222222] border border-[#333333] rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition font-medium" 
              placeholder="e.g. Plot 42, Sector 62, Near Metro Station" 
              value={formData.address} 
              onChange={e => setFormData({ ...formData, address: e.target.value })} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">City</label>
              <input 
                required 
                className="w-full py-2.5 px-3.5 bg-[#222222] border border-[#333333] rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition font-medium" 
                placeholder="e.g. Noida / Bengaluru" 
                value={formData.city} 
                onChange={e => setFormData({ ...formData, city: e.target.value })} 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">State</label>
              <input 
                required 
                className="w-full py-2.5 px-3.5 bg-[#222222] border border-[#333333] rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition font-medium" 
                placeholder="e.g. Uttar Pradesh" 
                value={formData.state} 
                onChange={e => setFormData({ ...formData, state: e.target.value })} 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Longitude</label>
              <input 
                type="number" 
                step="any" 
                className="w-full py-2.5 px-3.5 bg-[#222222] border border-[#333333] rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition font-medium" 
                placeholder="77.36" 
                value={formData.lng} 
                onChange={e => setFormData({ ...formData, lng: e.target.value })} 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Latitude</label>
              <input 
                type="number" 
                step="any" 
                className="w-full py-2.5 px-3.5 bg-[#222222] border border-[#333333] rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition font-medium" 
                placeholder="28.62" 
                value={formData.lat} 
                onChange={e => setFormData({ ...formData, lat: e.target.value })} 
              />
            </div>
          </div>
        </section>

        {/* --- SECTION 4: AMENITIES & SPECS --- */}
        <section className="space-y-4 pt-6 border-t border-[#282828]">
          <div className="flex items-center gap-2 pb-1">
            <span className="text-xs font-black uppercase tracking-wider text-primary">04</span>
            <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              <Wifi size={16} className="text-primary"/> Amenities & Infrastructure
            </h3>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
              Amenities (Comma Separated)
            </label>
            <input 
              className="w-full py-2.5 px-3.5 bg-[#222222] border border-[#333333] rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition font-medium" 
              placeholder="WiFi, CCTV, Power Backup, Laundry, Gym, Meals" 
              value={formData.amenities} 
              onChange={e => setFormData({ ...formData, amenities: e.target.value })} 
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <label className="flex items-center gap-2 p-2.5 bg-[#222222] rounded-xl border border-[#333333] cursor-pointer text-xs font-bold text-gray-300">
              <input 
                type="checkbox" 
                checked={formData.powerBackup} 
                onChange={e => setFormData({ ...formData, powerBackup: e.target.checked })} 
                className="accent-primary w-4 h-4 rounded" 
              />
              <span>Power Backup</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 bg-[#222222] rounded-xl border border-[#333333] cursor-pointer text-xs font-bold text-gray-300">
              <input 
                type="checkbox" 
                checked={formData.cctv} 
                onChange={e => setFormData({ ...formData, cctv: e.target.checked })} 
                className="accent-primary w-4 h-4 rounded" 
              />
              <span>CCTV Security</span>
            </label>

            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider block">Internet Speed</label>
              <select 
                className="w-full py-1.5 px-2 bg-[#222222] border border-[#333333] rounded-xl text-xs text-white outline-none cursor-pointer"
                value={formData.internetSpeed}
                onChange={e => setFormData({ ...formData, internetSpeed: e.target.value })}
              >
                <option value="High">High (100+ Mbps)</option>
                <option value="Moderate">Moderate (50 Mbps)</option>
                <option value="Basic">Basic (25 Mbps)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider block">Noise Level</label>
              <select 
                className="w-full py-1.5 px-2 bg-[#222222] border border-[#333333] rounded-xl text-xs text-white outline-none cursor-pointer"
                value={formData.noiseLevel}
                onChange={e => setFormData({ ...formData, noiseLevel: e.target.value })}
              >
                <option value="Low">Low (Quiet / Study)</option>
                <option value="Moderate">Moderate</option>
                <option value="Lively">Lively</option>
              </select>
            </div>
          </div>
        </section>

        {/* --- SECTION 5: PHOTOS --- */}
        <section className="space-y-4 pt-6 border-t border-[#282828]">
          <div className="flex items-center gap-2 pb-1">
            <span className="text-xs font-black uppercase tracking-wider text-primary">05</span>
            <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              <ImageIcon size={16} className="text-primary"/> Building Photographs
            </h3>
          </div>

          <div 
            onClick={() => fileInputRef.current?.click()} 
            className="border-2 border-dashed border-[#383838] hover:border-primary/60 rounded-2xl p-8 text-center cursor-pointer group transition bg-[#202020]"
          >
            <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            <UploadCloud size={32} className="mx-auto text-gray-400 group-hover:text-primary mb-2 transition-colors"/>
            <p className="font-bold text-gray-200 text-xs sm:text-sm">Click to Upload Building Exterior & Common Areas</p>
            <p className="text-[10px] text-gray-500 mt-0.5">JPG, PNG, or WEBP up to 10MB per photo</p>
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {images.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-[#333333] group bg-[#111]">
                  <img src={img.preview} className="w-full h-full object-cover" alt={`Preview ${idx + 1}`} />
                  <button 
                    type="button" 
                    onClick={() => removeImage(idx)} 
                    className="absolute top-1.5 right-1.5 p-1 bg-red-600/90 text-white rounded-lg opacity-90 hover:opacity-100 transition cursor-pointer"
                  >
                    <X size={12}/>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <button 
          disabled={loading} 
          type="submit" 
          className="btn-netflix w-full py-3.5 rounded-xl font-black text-sm sm:text-base transition shadow-xl shadow-red-950/40 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
        >
          {loading ? <Loader2 className="animate-spin" size={18}/> : <CheckCircle size={18}/>}
          <span>{loading ? 'Submitting Property Data...' : 'Submit Property for Verification'}</span>
        </button>
      </form>
    </div>
  );
};

export default AddProperty;
