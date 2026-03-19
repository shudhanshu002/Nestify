import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/client';
import { AuthContext } from '../context/AuthContext';
import RoomCard from '../components/RoomCard';
import { ShieldCheck, Wifi, Zap, Volume2, MapPin, Loader2, ArrowLeft } from 'lucide-react';

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [property, setProperty] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const [propRes, roomRes] = await Promise.all([
          API.get(`/properties/${id}`),
          API.get(`/properties/${id}/rooms`)
        ]);
        setProperty(propRes.data.data);
        setRooms(roomRes.data.data || roomRes.data); // Handle different response shapes
      } catch (err) {
        console.error("Failed to fetch property details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <Loader2 className="animate-spin text-primary" size={40} />
      <p className="text-gray-500 font-medium">Preparing your stay...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto pb-20">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-primary mb-6 transition">
        <ArrowLeft size={18} /> Back to Search
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left: Images & Info */}
        <div className="lg:col-span-2 space-y-8">
          <div className="rounded-3xl overflow-hidden shadow-lg h-[400px]">
            <img 
              src={property.images?.[0]?.url || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267'} 
              className="w-full h-full object-cover" 
              alt={property.title} 
            />
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-3xl font-black text-gray-900">{property.title}</h1>
              {property.isVerified && (
                <span className="bg-green-50 text-green-700 px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 border border-green-100">
                  <ShieldCheck size={18} /> Verified Listing
                </span>
              )}
            </div>
            
            <p className="flex items-center gap-2 text-gray-500 mb-6">
              <MapPin size={18} className="text-primary" /> {property.location.address}, {property.location.city}
            </p>
            
            <h3 className="font-bold text-lg mb-3">About this property</h3>
            <p className="text-gray-600 leading-relaxed mb-8">{property.description}</p>

            {/* Safety Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gray-50 rounded-2xl">
              <div className="text-center space-y-1">
                <Wifi className="mx-auto text-blue-500" size={24} />
                <p className="text-[10px] uppercase font-bold text-gray-400">Internet</p>
                <p className="text-sm font-bold">{property.safetyMetrics?.internetSpeed || 'High Speed'}</p>
              </div>
              <div className="text-center space-y-1">
                <Zap className="mx-auto text-yellow-500" size={24} />
                <p className="text-[10px] uppercase font-bold text-gray-400">Power</p>
                <p className="text-sm font-bold">{property.safetyMetrics?.powerBackup ? '24/7 Backup' : 'Standard'}</p>
              </div>
              <div className="text-center space-y-1">
                <Volume2 className="mx-auto text-purple-500" size={24} />
                <p className="text-[10px] uppercase font-bold text-gray-400">Noise Level</p>
                <p className="text-sm font-bold">{property.safetyMetrics?.noiseLevel || 'Quiet'}</p>
              </div>
              <div className="text-center space-y-1">
                <ShieldCheck className="mx-auto text-green-500" size={24} />
                <p className="text-[10px] uppercase font-bold text-gray-400">Security</p>
                <p className="text-sm font-bold">{property.safetyMetrics?.cctv ? 'CCTV Active' : 'Regular'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Room Selection & Booking */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm sticky top-8">
            <h2 className="text-xl font-black text-gray-900 mb-6">Available Units</h2>
            <div className="space-y-4">
              {rooms.length > 0 ? (
                rooms.map(room => (
                  <RoomCard key={room._id} room={room} propertyId={property._id} />
                ))
              ) : (
                <p className="text-gray-400 text-center py-10">No rooms listed yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetail;