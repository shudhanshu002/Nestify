import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { MapPin, ArrowRight, Star, ShieldCheck, Bed, Eye } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet marker icons in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Standard coordinates for major Indian cities as reliable fallback
const CITY_COORDINATES = {
  noida: [28.5355, 77.3910],
  delhi: [28.6139, 77.2090],
  gurugram: [28.4595, 77.0266],
  gurgaon: [28.4595, 77.0266],
  bengaluru: [12.9716, 77.5946],
  bangalore: [12.9716, 77.5946],
  pune: [18.5204, 73.8567],
  mumbai: [19.0760, 72.8777],
  hyderabad: [17.3850, 78.4867],
  kota: [25.2138, 75.8648],
  jaipur: [26.9124, 75.7873],
  chennai: [13.0827, 80.2707],
  kolkata: [22.5726, 88.3639],
  ahmedabad: [23.0225, 72.5714]
};

// Safe helper to extract [lat, lng] without crashes
export const extractCoordinates = (prop, index = 0) => {
  let lng = null;
  let lat = null;
  const coordsObj = prop?.location?.coordinates;

  if (Array.isArray(coordsObj?.coordinates) && coordsObj.coordinates.length >= 2) {
    lng = coordsObj.coordinates[0];
    lat = coordsObj.coordinates[1];
  } else if (Array.isArray(coordsObj) && coordsObj.length >= 2) {
    lng = coordsObj[0];
    lat = coordsObj[1];
  }

  // Validate numbers
  if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0)) {
    return [lat, lng];
  }

  // City based fallback
  const city = (prop?.location?.city || '').toLowerCase().trim();
  const base = CITY_COORDINATES[city] || [28.62, 77.36];
  
  // Safe deterministic jitter so pins in same city do not completely overlap
  const jitterLat = Math.sin((index + 1) * 2.3) * 0.015;
  const jitterLng = Math.cos((index + 1) * 2.3) * 0.015;
  return [base[0] + jitterLat, base[1] + jitterLng];
};

// Custom OYO & Airbnb styled HTML Price Pill marker
const createPriceIcon = (price, isSelected = false) => {
  const formatted = price 
    ? `₹${price >= 1000 ? (price / 1000).toFixed(price % 1000 === 0 ? 0 : 1) + 'k' : price}` 
    : '₹Stay';

  const bg = isSelected ? '#E11D48' : '#0F172A';
  return L.divIcon({
    className: 'custom-map-pill',
    html: `
      <div style="
        background: ${bg};
        color: #ffffff;
        font-family: inherit;
        font-size: 11px;
        font-weight: 900;
        letter-spacing: -0.02em;
        padding: 5px 10px;
        border-radius: 9999px;
        border: 2px solid #ffffff;
        box-shadow: 0 6px 18px rgba(0,0,0,0.3);
        white-space: nowrap;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        transform: translate(-50%, -50%);
        transition: transform 0.15s ease, background 0.15s ease;
      ">
        <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#10B981;"></span>
        ${formatted}
      </div>
    `,
    iconSize: [64, 28],
    iconAnchor: [32, 14]
  });
};

// Map Watcher to listen for pan/zoom
const MapEvents = ({ onMove, searchOnMove }) => {
  useMapEvents({
    dragend: (e) => {
      if (searchOnMove && onMove) {
        const center = e.target.getCenter();
        onMove(center.lat, center.lng);
      }
    },
    zoomend: (e) => {
      if (searchOnMove && onMove) {
        const center = e.target.getCenter();
        onMove(center.lat, center.lng);
      }
    },
  });
  return null;
};

// Map bounds controller to automatically fit markers
const MapBoundsController = ({ properties }) => {
  const map = useMap();

  useEffect(() => {
    if (!properties || properties.length === 0) return;
    try {
      const validPoints = properties.map((p, idx) => extractCoordinates(p, idx));
      if (validPoints.length > 0) {
        const bounds = L.latLngBounds(validPoints);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }
    } catch (err) {
      // Ignore bounds failure
    }
  }, [properties, map]);

  return null;
};

const PropertyMap = ({ 
  properties = [], 
  onMapMove, 
  centerCoords = [28.62, 77.36],
  selectedPropertyId = null,
  onSelectProperty,
  enableAutoFit = true,
  height = "100%"
}) => {
  const navigate = useNavigate();
  const [searchOnMove, setSearchOnMove] = useState(false);
  const [activeProperty, setActiveProperty] = useState(null);

  // Determine initial center
  const initialCenter = useMemo(() => {
    if (properties.length > 0) {
      return extractCoordinates(properties[0], 0);
    }
    return centerCoords || [28.62, 77.36];
  }, [properties, centerCoords]);

  return (
    <div className="relative w-full rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white bg-gray-100" style={{ height }}>
      <MapContainer 
        center={initialCenter} 
        zoom={12} 
        scrollWheelZoom={true}
        className="h-full w-full z-10"
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {enableAutoFit && properties.length > 0 && (
          <MapBoundsController properties={properties} />
        )}
        
        <MapEvents onMove={onMapMove} searchOnMove={searchOnMove} />

        {properties.map((prop, idx) => {
          const coords = extractCoordinates(prop, idx);
          const isSelected = (selectedPropertyId === prop._id) || (activeProperty?._id === prop._id);
          const markerIcon = createPriceIcon(prop.basePrice, isSelected);

          return (
            <Marker 
              key={prop._id || idx} 
              position={coords}
              icon={markerIcon}
              eventHandlers={{
                click: () => {
                  setActiveProperty(prop);
                  if (onSelectProperty) onSelectProperty(prop);
                }
              }}
            >
              <Popup className="oyo-map-popup" maxWidth={280}>
                <div className="p-1 space-y-2.5">
                  <div className="relative h-32 rounded-xl overflow-hidden bg-gray-100">
                    <img 
                      src={prop.images?.[0]?.url || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500'} 
                      alt={prop.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-gray-900/80 backdrop-blur-md text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                      {prop.category || 'PG'}
                    </div>
                    {prop.averageRating > 0 && (
                      <div className="absolute top-2 right-2 bg-emerald-600 text-white px-2 py-0.5 rounded-lg flex items-center gap-1 text-[10px] font-black shadow-md">
                        <Star size={10} className="fill-white" />
                        <span>{prop.averageRating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="font-black text-sm text-gray-900 leading-tight line-clamp-1">{prop.title}</h4>
                    <p className="text-[11px] font-bold text-gray-400 flex items-center gap-1 mt-0.5">
                      <MapPin size={11} className="text-primary shrink-0" />
                      <span className="truncate">{prop.location?.address ? `${prop.location.address}, ` : ''}{prop.location?.city}</span>
                    </p>
                  </div>

                  {prop.rooms && prop.rooms.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {prop.rooms.slice(0, 2).map((r, ri) => (
                        <span key={ri} className="text-[9px] font-bold bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                          {r.roomType} • ₹{r.basePrice?.toLocaleString()}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                    <div>
                      <span className="text-[9px] font-black uppercase text-gray-400 block">From</span>
                      <p className="text-base font-black text-gray-900 font-mono">
                        ₹{(prop.basePrice || 0).toLocaleString()}
                        <span className="text-[10px] text-gray-400 font-normal">/mo</span>
                      </p>
                    </div>

                    <button 
                      onClick={() => navigate(`/property/${prop._id}`)}
                      className="bg-primary hover:bg-rose-600 text-white px-3.5 py-1.5 rounded-xl font-black text-[10px] uppercase flex items-center gap-1 transition shadow-md"
                    >
                      View <ArrowRight size={11}/>
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Floating Controls Overlay */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <label className="bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-lg border border-gray-100 flex items-center gap-2 cursor-pointer text-xs font-black text-gray-800 hover:bg-white transition select-none">
          <input 
            type="checkbox" 
            checked={searchOnMove} 
            onChange={(e) => setSearchOnMove(e.target.checked)} 
            className="w-4 h-4 accent-primary rounded cursor-pointer"
          />
          Search as I move map
        </label>
      </div>

      <div className="absolute bottom-4 left-4 z-[1000] bg-gray-950/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full border border-white/10 shadow-lg">
        {properties.length} Stays Mapped
      </div>
    </div>
  );
};

export default PropertyMap;
