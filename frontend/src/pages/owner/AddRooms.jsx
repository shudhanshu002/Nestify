import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../api/client';
import { Plus, CheckCircle, Image as ImageIcon, Loader2, ArrowLeft, Bed } from 'lucide-react';

const AddRooms = () => {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [roomData, setRoomData] = useState({
    roomType: 'CLASSIC',
    basePrice: '',
    totalInventory: '',
    capacity: 1,
    amenities: 'Attached Bath, WiFi, Study Table'
  });

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('roomType', roomData.roomType);
      formData.append('basePrice', roomData.basePrice);
      formData.append('totalInventory', roomData.totalInventory);
      formData.append('capacity', roomData.capacity);
      formData.append('amenities', JSON.stringify(roomData.amenities.split(',').map(a => a.trim()).filter(Boolean)));

      selectedFiles.forEach(file => {
        formData.append('images', file);
      });

      await API.post(`/properties/${propertyId}/rooms`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert("Room Type Added! You can add another room type or finish.");
      setPreviews([]);
      setSelectedFiles([]);
      setRoomData({ ...roomData, basePrice: '', totalInventory: '' });
      
    } catch (err) {
      console.error("Room addition error:", err);
      alert(err.response?.data?.message || "Failed to add room inventory.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 sm:py-12 px-4 sm:px-6 text-white">
      <div className="mb-8">
        <button 
          onClick={() => navigate('/owner/dashboard')} 
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-white transition-colors cursor-pointer mb-2"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </button>
        <h1 className="text-2xl sm:text-4xl font-black italic tracking-tight text-white flex items-center gap-2">
          <span>Set Room Inventory & Pricing</span>
        </h1>
        <p className="text-gray-400 font-medium text-xs sm:text-sm mt-1">
          Step 2: Add room types, tariffs, bed capacity, and photos
        </p>
      </div>

      <form onSubmit={handleUpload} className="space-y-6 bg-[#181818] p-6 sm:p-8 rounded-3xl shadow-2xl border border-[#2a2a2a]">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Room Type</label>
            <select 
              className="w-full py-2.5 px-3.5 bg-[#222222] border border-[#333333] rounded-xl text-xs sm:text-sm text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none transition font-medium cursor-pointer" 
              value={roomData.roomType}
              onChange={e => setRoomData({ ...roomData, roomType: e.target.value })}
            >
              <option value="CLASSIC">Classic Room</option>
              <option value="DELUXE">Deluxe Room</option>
              <option value="PREMIUM">Premium Suite</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Monthly Rent (₹)</label>
            <input 
              required 
              type="number" 
              className="w-full py-2.5 px-3.5 bg-[#222222] border border-[#333333] rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition font-medium" 
              placeholder="e.g. 8500" 
              value={roomData.basePrice} 
              onChange={e => setRoomData({ ...roomData, basePrice: e.target.value })} 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Number of Rooms Available</label>
            <input 
              required 
              type="number" 
              className="w-full py-2.5 px-3.5 bg-[#222222] border border-[#333333] rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition font-medium" 
              placeholder="e.g. 5" 
              value={roomData.totalInventory} 
              onChange={e => setRoomData({ ...roomData, totalInventory: e.target.value })} 
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Sharing / Capacity per Room</label>
            <input 
              required 
              type="number" 
              min="1"
              max="6"
              className="w-full py-2.5 px-3.5 bg-[#222222] border border-[#333333] rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition font-medium" 
              placeholder="1" 
              value={roomData.capacity} 
              onChange={e => setRoomData({ ...roomData, capacity: e.target.value })} 
            />
          </div>
        </div>

        {/* IMAGE UPLOAD FOR ROOM */}
        <div className="space-y-3 pt-4 border-t border-[#282828]">
          <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
            <ImageIcon size={13} className="text-primary"/> Room Photographs
          </label>
          <div className="flex gap-3 overflow-x-auto pb-2">
            <label className="w-20 h-20 shrink-0 bg-[#222222] rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-[#282828] transition border-2 border-dashed border-[#383838] group">
              <Plus className="text-gray-400 group-hover:text-primary transition-colors" size={20} />
              <span className="text-[9px] text-gray-400 mt-1">Add Photo</span>
              <input type="file" multiple className="hidden" onChange={handleFileChange} />
            </label>
            {previews.map((url, i) => (
              <div key={i} className="w-20 h-20 shrink-0 rounded-xl overflow-hidden border border-[#333333] bg-[#111]">
                <img src={url} className="w-full h-full object-cover" alt={`Preview ${i + 1}`} />
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-[#282828]">
          <button 
            type="submit" 
            disabled={loading} 
            className="flex-1 btn-netflix py-3 rounded-xl font-black text-xs sm:text-sm shadow-lg shadow-red-950/40 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle size={16} />}
            <span>Add Room Type</span>
          </button>
          
          <button 
            type="button" 
            onClick={() => navigate('/owner/dashboard')} 
            className="btn-netflix-secondary px-6 py-3 rounded-xl font-bold text-xs uppercase cursor-pointer"
          >
            Finish
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddRooms;
