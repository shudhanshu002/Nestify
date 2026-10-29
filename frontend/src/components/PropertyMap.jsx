import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { MapPin, ArrowRight, Star } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// 󾠮 Matrix-Style Marker Icon
const customIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38],
});

// 󾠯 The "Watcher" Sub-component
// This listens for map movement and reports coordinates back to the parent
const MapEvents = ({ onMove }) => {
  useMapEvents({
    dragend: (e) => {
      const center = e.target.getCenter();
      onMove(center.lat, center.lng);
    },
    zoomend: (e) => {
      const center = e.target.getCenter();
      onMove(center.lat, center.lng);
    },
  });
  return null;
};

const PropertyMap = ({ properties, onMapMove }) => {
  const navigate = useNavigate();

  // Default center (Noida/Delhi) if no properties exist
  const defaultCenter = [28.62, 77.36];

  return (
    <div className="h-full w-full rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white relative">
      <MapContainer 
        center={defaultCenter} 
        zoom={13} 
        scrollWheelZoom={true}
        className="h-full w-full z-10"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* 󾠰 Active Listener for Search-on-Move */}
        <MapEvents onMove={onMapMove} />

        {properties.map((prop) => (
          <Marker 
            key={prop._id} 
            // 󾠱 IMPORTANT: MongoDB stores [lng, lat], Leaflet needs [lat, lng]
            position={[prop.location.coordinates.coordinates[1], prop.location.coordinates.coordinates[0]]}
            icon={customIcon}
          >
            <Popup className="matrix-popup">
              <div className="w-48 p-1">
                <div className="relative aspect-video rounded-xl overflow-hidden mb-3">
                  <img 
                    src={prop.images?.[0]?.url || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400'} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded-lg flex items-center gap-1">
                    <Star size={10} className="fill-yellow-400 text-yellow-400"/>
                    <span className="text-[10px] font-black">{prop.averageRating || '0'}</span>
                  </div>
                </div>
                
                <h4 className="font-black italic text-gray-900 leading-tight mb-1">{prop.title}</h4>
                <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1 mb-3">
                  <MapPin size={10}/> {prop.location.city}
                </p>
                
                <button 
                  onClick={() => navigate(`/property/${prop._id}`)}
                  className="w-full bg-gray-900 text-white py-3 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-primary transition"
                >
                  View Building <ArrowRight size={12}/>
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Floating Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] bg-gray-900/80 backdrop-blur-md text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white/20">
        Move map to search new areas
      </div>
    </div>
  );
};

export default PropertyMap;