import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';

const MapView = ({ properties }) => {
  // Default center (e.g., center of India or first property)
  const center = properties[0]?.location?.coordinates?.coordinates?.reverse() || [20.5937, 78.9629];

  return (
    <div className="h-[500px] w-full rounded-3xl overflow-hidden shadow-inner border border-gray-100 mb-10">
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {properties.map(pg => (
          <Marker 
            key={pg._id} 
            position={[pg.location.coordinates.coordinates[1], pg.location.coordinates.coordinates[0]]}
          >
            <Popup className="rounded-xl overflow-hidden">
              <div className="p-2 space-y-2">
                <img src={pg.images?.[0]?.url} className="w-full h-24 object-cover rounded-lg" />
                <h4 className="font-bold text-gray-900">{pg.title}</h4>
                <p className="text-xs text-primary font-bold">₹{pg.basePrice}/mo</p>
                <Link to={`/property/${pg._id}`} className="block text-center bg-gray-900 text-white py-1 rounded-lg text-[10px] font-bold">
                  View Property
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapView;