import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API from '../api/client';
import { Users, CreditCard, ChevronRight, Loader2 } from 'lucide-react';

const RoomCard = ({ room, propertyId }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isBooking, setIsBooking] = useState(false);

  const handleBooking = async () => {
    if (!user) return navigate('/login');
    
    setIsBooking(true);
    try {
      // Calls your Backend: router.post('/initiate', protect, initiateBooking)
      const { data } = await API.post('/bookings/initiate', {
        propertyId,
        roomId: room._id
      });
      
      // If success, move to payment/confirmation with the lock active
      navigate(`/booking/confirm/${data.data._id}`);
    } catch (err) {
      alert(err.response?.data?.message || "Room is currently being locked by someone else.");
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="p-4 border border-gray-100 rounded-2xl hover:border-primary transition group">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-bold text-gray-900">{room.roomType.replace('_', ' ')}</h4>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Users size={12} /> Capacity: {room.capacity}
          </p>
        </div>
        <span className="text-lg font-black text-primary">₹{room.basePrice}</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {room.amenities?.slice(0, 3).map((amenity, idx) => (
          <span key={idx} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {amenity}
          </span>
        ))}
      </div>

      <button
        onClick={handleBooking}
        disabled={isBooking || room.availableInventory === 0}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold transition ${
          room.availableInventory === 0 
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : 'bg-gray-900 text-white hover:bg-primary'
        }`}
      >
        {isBooking ? <Loader2 className="animate-spin" size={18} /> : <CreditCard size={18} />}
        {room.availableInventory === 0 ? 'Sold Out' : 'Reserve Unit'}
        <ChevronRight size={16} className="ml-auto opacity-0 group-hover:opacity-100 transition" />
      </button>
    </div>
  );
};

export default RoomCard;