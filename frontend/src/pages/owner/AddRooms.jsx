import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../api/client';
import { Plus, CheckCircle, Image as ImageIcon, Loader2, X } from 'lucide-react';

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
    setSelectedFiles([...selectedFiles, ...files]);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews([...previews, ...newPreviews]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 󾠮 Must use FormData for image upload
      const formData = new FormData();
      formData.append('roomType', roomData.roomType);
      formData.append('basePrice', roomData.basePrice);
      formData.append('totalInventory', roomData.totalInventory);
      formData.append('capacity', roomData.capacity);
      formData.append('amenities', JSON.stringify(roomData.amenities.split(',').map(a => a.trim())));

      // 󾠯 Append all selected room images
      selectedFiles.forEach(file => {
        formData.append('images', file);
      });

      await API.post(`/properties/${propertyId}/rooms`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert("Room Type Added! You can add more or finish.");
      // Optional: Clear form to add another room type
      setPreviews([]);
      setSelectedFiles([]);
      setRoomData({ ...roomData, basePrice: '', totalInventory: '' });
      
    } catch (err) {
      console.error(err);
      alert("Failed to add room inventory.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-20 px-6">
      <div className="mb-12">
        <h1 className="text-5xl font-black italic tracking-tighter">Set Room Matrix.</h1>
        <p className="text-gray-400 font-bold mt-2 uppercase text-xs tracking-widest">Step 2: Define Pricing & Inventory</p>
      </div>

      <form onSubmit={handleUpload} className="space-y-8 bg-white p-12 rounded-[4rem] shadow-2xl border border-gray-100">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400">Room Type</label>
            <select className="w-full p-6 bg-gray-50 rounded-3xl font-bold outline-none" 
              onChange={e => setRoomData({...roomData, roomType: e.target.value})}>
              <option value="CLASSIC">Classic Room</option>
              <option value="DELUXE">Deluxe Room</option>
              <option value="PREMIUM">Premium Suite</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400">Monthly Price (₹)</label>
            <input required type="number" className="w-full p-6 bg-gray-50 rounded-3xl font-bold outline-none" 
              placeholder="8500" value={roomData.basePrice} onChange={e => setRoomData({...roomData, basePrice: e.target.value})} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400">Number of Rooms Available</label>
            <input required type="number" className="w-full p-6 bg-gray-50 rounded-3xl font-bold outline-none" 
              placeholder="e.g. 5" value={roomData.totalInventory} onChange={e => setRoomData({...roomData, totalInventory: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400">Room Capacity</label>
            <input required type="number" className="w-full p-6 bg-gray-50 rounded-3xl font-bold outline-none" 
              placeholder="1" value={roomData.capacity} onChange={e => setRoomData({...roomData, capacity: e.target.value})} />
          </div>
        </div>

        {/* IMAGE UPLOAD FOR ROOM */}
        <div className="space-y-4 pt-6 border-t border-gray-50">
          <label className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-2">
            <ImageIcon size={14}/> Room Photos (Specific to this type)
          </label>
          <div className="flex gap-4 overflow-x-auto pb-4">
            <label className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-gray-200 transition border-2 border-dashed border-gray-300">
              <Plus className="text-gray-400"/>
              <input type="file" multiple className="hidden" onChange={handleFileChange} />
            </label>
            {previews.map((url, i) => (
              <img key={i} src={url} className="w-24 h-24 flex-shrink-0 object-cover rounded-2xl shadow-md border border-gray-100" />
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <button type="submit" disabled={loading} className="flex-1 bg-primary text-white py-6 rounded-3xl font-black text-xl shadow-xl flex items-center justify-center gap-3">
            {loading ? <Loader2 className="animate-spin"/> : <CheckCircle />} Add to Inventory
          </button>
          <button type="button" onClick={() => navigate('/owner/dashboard')} className="px-8 bg-gray-900 text-white rounded-3xl font-black">
            Finish
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddRooms;