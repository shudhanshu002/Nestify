// import { useState, useRef } from 'react';
// import { useNavigate } from 'react-router-dom';
// import API from '../../api/client';
// import { 
//   Building2, MapPin, CheckCircle, FileText, Loader2, 
//   Wifi, Shield, Video, Battery, Image as ImageIcon, Plus, X, UploadCloud 
// } from 'lucide-react';

// const AddProperty = () => {
//   const navigate = useNavigate();
//   const fileInputRef = useRef(null); // Ref to trigger file input click
//   const [loading, setLoading] = useState(false);
  
//   // 󾠮 Textual and Boolean form data
//   const [formData, setFormData] = useState({
//     title: '',
//     description: '',
//     category: 'PG',
//     genderPreference: 'UNISEX',
//     address: '',
//     city: '',
//     state: '',
//     lng: '77.36', // Default long (Noida)
//     lat: '28.62', // Default lat (Noida)
//     amenities: 'WiFi, CCTV, Power Backup, Laundry, Gym', // Common amenities default
//     internetSpeed: 'High',
//     noiseLevel: 'Low',
//     powerBackup: true,
//     cctv: true
//   });

//   // 󾠯 THE FILE UPLOAD STATE
//   // Each object here will be { file: FileObject, preview: 'blob:url' }
//   const [images, setImages] = useState([]);

//   // 󾠰 Handle file selection from browser
//   const handleFileChange = (e) => {
//     const files = Array.from(e.target.files);
//     const newImages = files.map(file => ({
//       file: file, // Keep the actual File object for upload
//       preview: URL.createObjectURL(file) // Create temporary URL for thumbnail
//     }));
//     setImages([...images, ...newImages]); // Add to existing selections
//   };

//   // 󾠱 Remove a specific selected image
//   const removeImage = (index) => {
//     const filteredImages = images.filter((_, i) => i !== index);
//     // Revoke the Blob URL to prevent memory leaks
//     URL.revokeObjectURL(images[index].preview);
//     setImages(filteredImages);
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     try {
//       // 󾠲 CORE SHIFT: CREATE FORMDATA
//       // We cannot send File objects inside a JSON body. We must use FormData.
//       const multiPartFormData = new FormData();

//       // 󾠳 1. APPEND FILES INDIVIDUALLY
//       // Make sure the key ('images') matches what the backend expects
//       images.forEach((imgObj) => {
//         multiPartFormData.append('images', imgObj.file); 
//       });

//       // 2. APPEND TEXTUAL FIELDS (STRINGIFY NESTED OBJECTS)
//       multiPartFormData.append('title', formData.title);
//       multiPartFormData.append('description', formData.description);
//       multiPartFormData.append('category', formData.category);
//       multiPartFormData.append('genderPreference', formData.genderPreference);

//       // Re-structure Location for GeoJSON
//       const locationJSON = JSON.stringify({
//         address: formData.address,
//         city: formData.city,
//         state: formData.state,
//         coordinates: {
//           type: 'Point',
//           coordinates: [parseFloat(formData.lng) || 0, parseFloat(formData.lat) || 0]
//         }
//       });
//       multiPartFormData.append('location', locationJSON); // Must send as string

//       // Process Amenities array
//       const amenitiesArr = formData.amenities.split(',').map(item => item.trim());
//       multiPartFormData.append('amenities', JSON.stringify(amenitiesArr)); // Send as stringified array

//       // Safety Metrics
//       const safetyJSON = JSON.stringify({
//         noiseLevel: formData.noiseLevel,
//         internetSpeed: formData.internetSpeed,
//         powerBackup: formData.powerBackup,
//         cctv: formData.cctv
//       });
//       multiPartFormData.append('safetyMetrics', safetyJSON); // Must send as string

//       // 󾠴 3. SEND MULTIPART/FORM-DATA REQUEST
//       const { data } = await API.post('/properties', multiPartFormData, {
//         headers: {
//           'Content-Type': 'multipart/form-data' // Crucial header for file uploads
//         }
//       });
      
//       // SUCCESS: Route to Add Rooms for this Property ID
//       navigate(`/owner/add-rooms/${data.propertyId}`);
//     } catch (err) {
//       console.error("Payload Error:", err.response?.data);
//       alert(err.response?.data?.message || "Missing Required Fields. Ensure images are uploaded.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="max-w-5xl mx-auto py-20 px-6">
//       <div className="mb-12">
//         <h1 className="text-5xl font-black italic tracking-tighter text-gray-900">List Property.</h1>
//         <p className="text-gray-400 font-bold mt-2 uppercase text-xs tracking-[0.3em]">Step 1: Building Identity & Photos</p>
//       </div>

//       <form onSubmit={handleSubmit} className="space-y-12 bg-white p-12 rounded-[4rem] shadow-2xl border border-gray-100">
        
//         {/* --- SECTION 1: BASICS --- */}
//         <section className="space-y-6">
//           <h3 className="text-xl font-black italic text-primary">01. Basic Information</h3>
//           <div className="space-y-2">
//             <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2"><Building2 size={12}/> Building Title</label>
//             <input required className="w-full p-6 bg-gray-50 rounded-3xl font-bold outline-none" 
//               placeholder="The Royal Residency (PG)" onChange={e => setFormData({...formData, title: e.target.value})} />
//           </div>
//           <div className="space-y-2">
//             <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2"><FileText size={12}/> Building Description</label>
//             <textarea required rows="4" className="w-full p-6 bg-gray-50 rounded-3xl font-bold outline-none resize-none" 
//               placeholder="Describe the property, atmosphere, and surroundings..." onChange={e => setFormData({...formData, description: e.target.value})} />
//           </div>
//           <div className="grid grid-cols-2 gap-6">
//             <select className="p-6 bg-gray-50 rounded-3xl font-bold outline-none cursor-pointer" onChange={e => setFormData({...formData, category: e.target.value})}>
//               <option value="PG">PG</option>
//               <option value="Hotel">Hotel</option>
//               <option value="Hostel">Hostel</option>
//             </select>
//             <select className="p-6 bg-gray-50 rounded-3xl font-bold outline-none cursor-pointer" onChange={e => setFormData({...formData, genderPreference: e.target.value})}>
//               <option value="UNISEX">Unisex</option>
//               <option value="MALE">Male Only</option>
//               <option value="FEMALE">Female Only</option>
//             </select>
//           </div>
//         </section>

//         {/* --- SECTION 2: LOCATION --- */}
//         <section className="space-y-6 pt-12 border-t border-gray-100">
//           <h3 className="text-xl font-black italic text-primary flex items-center gap-3"><MapPin/> Precise Location</h3>
//           <input required className="w-full p-6 bg-gray-50 rounded-3xl font-bold outline-none" 
//             placeholder="Street Address, Area" onChange={e => setFormData({...formData, address: e.target.value})} />
//           <div className="grid grid-cols-2 gap-6">
//             <input required className="p-6 bg-gray-50 rounded-3xl font-bold outline-none" placeholder="City" onChange={e => setFormData({...formData, city: e.target.value})} />
//             <input required className="p-6 bg-gray-50 rounded-3xl font-bold outline-none" placeholder="State" onChange={e => setFormData({...formData, state: e.target.value})} />
//           </div>
//           <div className="grid grid-cols-2 gap-6">
//             <input type="number" step="any" className="p-6 bg-gray-50 rounded-3xl font-bold outline-none" placeholder="Longitude (e.g. 77.36)" value={formData.lng} onChange={e => setFormData({...formData, lng: e.target.value})} />
//             <input type="number" step="any" className="p-6 bg-gray-50 rounded-3xl font-bold outline-none" placeholder="Latitude (e.g. 28.62)" value={formData.lat} onChange={e => setFormData({...formData, lat: e.target.value})} />
//           </div>
//         </section>

//         {/* --- SECTION 3: SAFETY & AMENITIES --- */}
//         <section className="space-y-8 pt-12 border-t border-gray-100">
//           <h3 className="text-xl font-black italic text-primary">03. High-Grade Features</h3>
//           <div className="grid grid-cols-2 gap-8">
//             <div className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl">
//               <span className="flex items-center gap-2 font-black text-xs text-gray-500"><Video size={16}/> CCTV Active?</span>
//               <input type="checkbox" className="w-6 h-6 rounded-md border-gray-300" checked={formData.cctv} onChange={e => setFormData({...formData, cctv: e.target.checked})} />
//             </div>
//             <div className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl">
//               <span className="flex items-center gap-2 font-black text-xs text-gray-500"><Battery size={16}/> Power Backup?</span>
//               <input type="checkbox" className="w-6 h-6 rounded-md border-gray-300" checked={formData.powerBackup} onChange={e => setFormData({...formData, powerBackup: e.target.checked})} />
//             </div>
//           </div>
//           <div className="space-y-2">
//             <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2"><Wifi size={12}/> Building Amenities</label>
//             <input className="w-full p-6 bg-gray-50 rounded-3xl font-bold outline-none" placeholder="List with commas (WiFi, Gym, Laundry...)" value={formData.amenities} onChange={e => setFormData({...formData, amenities: e.target.value})} />
//           </div>
//         </section>

//         {/* --- SECTION 4: REAL IMAGE UPLOAD --- */}
//         <section className="space-y-6 pt-12 border-t border-gray-100">
//           <h3 className="text-xl font-black italic text-primary flex items-center gap-3"><ImageIcon/> Visual Proof</h3>
          
//           {/* 󾠵 CLICK-TO-UPLOAD BOX */}
//           <div 
//             onClick={() => fileInputRef.current.click()}
//             className="border-4 border-dashed border-gray-200 rounded-[3rem] p-16 text-center hover:border-primary hover:bg-primary/5 transition cursor-pointer group"
//           >
//             <input 
//               type="file" 
//               multiple 
//               accept="image/*" 
//               ref={fileInputRef}
//               onChange={handleFileChange} 
//               className="hidden" 
//             />
//             <UploadCloud size={48} className="mx-auto text-gray-300 group-hover:text-primary mb-4"/>
//             <p className="font-black text-gray-900 text-lg">Click or Drag to Upload Building Photos</p>
//             <p className="text-xs text-gray-400 font-medium">PNG, JPG, or WEBP. Max 5MB per file.</p>
//           </div>
          
//           {/* 󾠶 THUMBNAIL PREVIEW GRID */}
//           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
//             {images.map((img, idx) => (
//               <div key={`${img.file.name}-${idx}`} className="relative aspect-square rounded-2xl overflow-hidden shadow-lg group border-2 border-gray-100">
//                 <img src={img.preview} className="w-full h-full object-cover" alt={`Preview ${idx + 1}`} />
//                 <button 
//                     type="button" 
//                     onClick={() => removeImage(idx)} 
//                     className="absolute top-2 right-2 p-1.5 bg-red-500/80 backdrop-blur-sm text-white rounded-lg opacity-0 group-hover:opacity-100 transition"
//                 >
//                     <X size={14}/>
//                 </button>
//                 <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/50 text-white text-[9px] font-bold truncate">
//                     {img.file.name}
//                 </div>
//               </div>
//             ))}
//           </div>
//         </section>

//         <button 
//           disabled={loading}
//           type="submit" 
//           className="w-full bg-gray-900 text-white py-8 rounded-[2.5rem] font-black text-2xl hover:bg-primary transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-4 disabled:opacity-50"
//         >
//           {loading ? <Loader2 className="animate-spin"/> : <CheckCircle size={28}/>}
//           {loading ? 'Processing Photos & Profile...' : 'Complete Profile'}
//         </button>
//       </form>
//     </div>
//   );
// };

// export default AddProperty;

import { useState, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/client';
import { 
  Building2, MapPin, CheckCircle, FileText, Loader2, 
  Wifi, Shield, Video, Battery, Image as ImageIcon, Plus, X, UploadCloud, ShieldCheck 
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';

const AddProperty = () => {

  const { user } = useContext(AuthContext); // Get user from context


  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const legalInputRef = useRef(null); // NEW: for legal doc
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'PG',
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
  const [legalDoc, setLegalDoc] = useState(null); // NEW: State for legal document

  // --- THE SHIELD LOGIC ---
  // Place this before any other logic but after hooks
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
              Your identity must be <span className="text-primary underline">VERIFIED</span> by our admin team before you can list a property on the Matrix.
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

      // 1. ORIGINAL LOGIC: Append Building Images
      images.forEach((imgObj) => {
        multiPartFormData.append('images', imgObj.file); 
      });

      // 2. NEW LOGIC: Append Legal Document
      multiPartFormData.append('legalDocument', legalDoc.file);

      // 3. ORIGINAL LOGIC: Append Textual Fields
      multiPartFormData.append('title', formData.title);
      multiPartFormData.append('description', formData.description);
      multiPartFormData.append('category', formData.category);
      multiPartFormData.append('genderPreference', formData.genderPreference);

      // 4. ORIGINAL LOGIC: Location Stringification
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

      // 5. ORIGINAL LOGIC: Amenities processing
      const amenitiesArr = formData.amenities.split(',').map(item => item.trim());
      multiPartFormData.append('amenities', JSON.stringify(amenitiesArr));

      // 6. ORIGINAL LOGIC: Safety Metrics Stringification
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
        <p className="text-gray-400 font-bold mt-2 uppercase text-xs tracking-[0.3em]">Step 1: Identity, Docs & Photos</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-12 bg-white p-12 rounded-[4rem] shadow-2xl border border-gray-100">
        {/* --- SECTION 1: BASICS --- */}
        <section className="space-y-6">
          <h3 className="text-xl font-black italic text-primary">01. Basic Information</h3>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2"><Building2 size={12}/> Building Title</label>
            <input required className="w-full p-6 bg-gray-50 rounded-3xl font-bold outline-none" 
              placeholder="The Royal Residency" onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2"><FileText size={12}/> Building Description</label>
            <textarea required rows="4" className="w-full p-6 bg-gray-50 rounded-3xl font-bold outline-none resize-none" 
              placeholder="Describe the property..." onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <select className="p-6 bg-gray-50 rounded-3xl font-bold outline-none cursor-pointer" onChange={e => setFormData({...formData, category: e.target.value})}>
              <option value="PG">PG</option>
              <option value="Hotel">Hotel</option>
              <option value="Hostel">Hostel</option>
            </select>
            <select className="p-6 bg-gray-50 rounded-3xl font-bold outline-none cursor-pointer" onChange={e => setFormData({...formData, genderPreference: e.target.value})}>
              <option value="UNISEX">Unisex</option>
              <option value="MALE">Male Only</option>
              <option value="FEMALE">Female Only</option>
            </select>
          </div>
        </section>

        {/* --- NEW SECTION 2: LEGAL DOCS (Does not break original flow) --- */}
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

        {/* --- SECTION 3: LOCATION (Original) --- */}
        <section className="space-y-6 pt-12 border-t border-gray-100">
          <h3 className="text-xl font-black italic text-primary flex items-center gap-3"><MapPin/> Precise Location</h3>
          <input required className="w-full p-6 bg-gray-50 rounded-3xl font-bold outline-none" placeholder="Street Address" onChange={e => setFormData({...formData, address: e.target.value})} />
          <div className="grid grid-cols-2 gap-6">
            <input required className="p-6 bg-gray-50 rounded-3xl font-bold outline-none" placeholder="City" onChange={e => setFormData({...formData, city: e.target.value})} />
            <input required className="p-6 bg-gray-50 rounded-3xl font-bold outline-none" placeholder="State" onChange={e => setFormData({...formData, state: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <input type="number" step="any" className="p-6 bg-gray-50 rounded-3xl font-bold outline-none" placeholder="Longitude" value={formData.lng} onChange={e => setFormData({...formData, lng: e.target.value})} />
            <input type="number" step="any" className="p-6 bg-gray-50 rounded-3xl font-bold outline-none" placeholder="Latitude" value={formData.lat} onChange={e => setFormData({...formData, lat: e.target.value})} />
          </div>
        </section>

        {/* --- SECTION 4: IMAGES (Original) --- */}
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
                <img src={img.preview} className="w-full h-full object-cover" />
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