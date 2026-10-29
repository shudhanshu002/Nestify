import { useState } from 'react';
import { 
  Building2, MapPin, Search, CalendarDays, Users, Star, 
  Wifi, Zap, Shield, Image, Share2, ChevronLeft, ChevronRight, 
  Tv, AirVent, ParkingCircle, Water, Crosshair, Phone, Languages, UserCircle
} from 'lucide-react';

const HotelPage = () => {
  // Placeholder Data - Represents data coming from an API
  const hotelData = {
    name: "Hotel O ECR Chennai Kanathur",
    address: "91/114A, Plot Number 18, Sivasubramanam Street, Kanathur, Reddykuppam, Kanchipuram, Chennai",
    rating: 4.1,
    numRatings: 871,
    overallReviewText: "VERY GOOD",
    badges: ["Company-Serviced", "WIZARD MEMBER"],
    subRating: { score: 5.0, type: "Check-in rating", experience: "Delightful experience" },
    images: [
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=1200", // Large
      "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=600",
      "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?q=80&w=600",
    ],
    pricing: { final: 831, original: 3647, discount: 77, taxes: 89 },
    dates: { checkin: "Sat, 21 Mar", checkout: "Sun, 22 Mar" },
    guestsRooms: "1 Room, 1 Guest",
    amenities: [
      { icon: AirVent, text: "AC" },
      { icon: Wifi, text: "Free Wifi" },
      { icon: Tv, text: "TV" },
      { icon: Water, text: "Geyser" },
      { icon: Zap, text: "Power backup" },
      { icon: ParkingCircle, text: "Parking" },
    ],
    about: {
      short: "'Kanathurs Coastal Charm, Bay Views Stunning Seaside Dining and Injambakkams Serene Beaches await nearby.'",
      property: "Enjoy your stay at Super Hotel O ECR Chennai Kanathur, where comfort and functionality come together for an ideal experience."
    },
    rooms: [
      { id: 1, type: "Classic", size: "9 sqm", amenities: ['AC', 'TV'], isSelected: true, originalPrice: 3647, finalPrice: 831, taxes: 89, image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=400" },
      { id: 2, type: "Deluxe", size: "9 sqm", amenities: ['AC', 'TV'], isSoldOut: true, originalPrice: 4011, finalPrice: 915, taxes: 97, image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=400" },
    ],
    reviews: {
      breakdown: [
        { stars: 5, percentage: 73 },
        { stars: 4, percentage: 11 },
        { stars: 3, percentage: 6 },
        { stars: 2, percentage: 1 },
        { stars: 1, percentage: 6 },
      ],
      items: [
        { name: "Noel Francies cx", date: "20 Feb 2026", rating: 5, review: "Great experience", hasImage: true },
        { name: "AGASTIN", date: "11 Jul 2025", rating: 5, review: "Clean and neat rooms" },
      ]
    },
    policies: { checkin: "12:00 PM", checkout: "11:00 AM" }
  };

  const navTabs = ["Amenities", "About this OYO", "Choose your room", "Ratings and Reviews", "Hotel Rules", "What's nearby"];

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      {/* 1. Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <nav className="max-w-[1500px] mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <h1 className="text-3xl font-black text-red-600 italic">OYO</h1>
            <div className="relative w-80">
              <input type="text" placeholder="Search by city, hotel, or neighborhood" className="w-full pl-6 pr-12 py-3 border border-gray-200 rounded-full text-sm outline-none focus:ring-2 focus:ring-red-100" />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 bg-gray-100 text-gray-500 p-2 rounded-full flex items-center gap-1.5 text-xs font-bold hover:bg-gray-200 transition">
                <Crosshair size={14} /> Near me
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-gray-50 border border-gray-100 p-2 rounded-full text-sm font-bold text-gray-700">
            <CalendarDays size={18} className="text-gray-400" />
            <span>{hotelData.dates.checkin} – {hotelData.dates.checkout}</span>
            <div className="h-6 w-px bg-gray-200"></div>
            <Users size={18} className="text-gray-400" />
            <span>{hotelData.guestsRooms}</span>
            <button className="bg-[#2ecc71] text-white px-8 py-3 rounded-full hover:bg-[#27ae60] transition flex items-center gap-2">
              <Search size={18} /> Search
            </button>
          </div>
          <div className="flex items-center gap-6 text-sm font-bold text-gray-700">
            <button className="flex items-center gap-1.5 hover:text-red-600 transition"><Languages size={18} /> EN</button>
            <button className="flex items-center gap-1.5 hover:text-red-600 transition"><Phone size={18} /> Call to Book</button>
            <button className="flex items-center gap-1.5 hover:text-red-600 transition"><UserCircle size={22} /> Login / Signup</button>
          </div>
        </nav>
      </header>

      {/* 2. Image Gallery */}
      <section className="relative group">
        <img src={hotelData.images[0]} className="w-full h-[600px] object-cover" />
        <button className="absolute top-1/2 left-6 -translate-y-1/2 bg-white/70 p-4 rounded-full text-gray-700 shadow-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition"><ChevronLeft size={24} /></button>
        <button className="absolute top-1/2 right-6 -translate-y-1/2 bg-white/70 p-4 rounded-full text-gray-700 shadow-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition"><ChevronRight size={24} /></button>
        <button className="absolute top-6 right-6 bg-white/80 px-6 py-3 rounded-full text-gray-700 shadow-lg backdrop-blur-sm text-sm font-black flex items-center gap-2 hover:bg-white transition">
          <Share2 size={18} /> Share
        </button>
        <button className="absolute bottom-6 right-6 bg-white px-6 py-3 rounded-xl text-gray-700 shadow-xl text-sm font-black flex items-center gap-2 hover:bg-gray-50 transition border border-gray-100">
          <Image size={18} /> View all photos
        </button>
      </section>

      {/* 3. Main Content Wrapper */}
      <main className="max-w-[1300px] mx-auto grid grid-cols-1 md:grid-cols-[1fr,360px] gap-10 px-6 py-10">
        
        {/* Left Column */}
        <div className="space-y-12">
          
          {/* Hotel Basic Info */}
          <section className="grid grid-cols-1 lg:grid-cols-[1fr,auto] gap-6 items-start">
            <div className="space-y-3">
              <h2 className="text-4xl font-black text-gray-900 tracking-tighter">{hotelData.name}</h2>
              <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-xl">{hotelData.address}</p>
              <div className="flex flex-wrap gap-2.5 pt-2">
                <span className="bg-gray-100 text-gray-600 px-3.5 py-1.5 rounded-full text-xs font-black uppercase flex items-center gap-1.5">
                  <Shield size={14} className="text-gray-400" />
                  Company-Serviced
                </span>
                <span className="bg-primary/10 text-primary px-3.5 py-1.5 rounded-full text-xs font-black uppercase">
                  WIZARD MEMBER
                </span>
                <span className="text-gray-400 text-xs font-bold pt-1.5">5.0 · {hotelData.subRating.type} &gt; {hotelData.subRating.experience}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-gray-100 p-2 rounded-2xl border border-gray-100">
              <div className="bg-[#2ecc71] text-white px-5 py-3 rounded-xl text-2xl font-black flex items-center gap-1.5">
                {hotelData.rating} <Star size={18} className="fill-white" />
              </div>
              <p className="text-xs text-gray-600 font-bold uppercase tracking-wider">{hotelData.numRatings} Ratings</p>
            </div>
          </section>

          {/* Amenities */}
          <section className="space-y-6">
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Amenities</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {hotelData.amenities.map(amenity => (
                <div key={amenity.text} className="flex items-center gap-4 bg-white p-5 rounded-3xl border border-gray-100 hover:border-red-100 hover:shadow-red-50 hover:shadow-lg transition">
                  <div className="p-3 bg-red-50 rounded-2xl text-red-600"><amenity.icon size={22} /></div>
                  <p className="font-bold text-gray-700 text-sm">{amenity.text}</p>
                </div>
              ))}
            </div>
            <button className="text-red-600 font-black text-sm pt-2 hover:underline">Show More</button>
          </section>

          {/* About This OYO */}
          <section className="space-y-6">
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">About this OYO</h3>
            <p className="text-gray-500 font-medium leading-relaxed italic">{hotelData.about.short}</p>
            <div className="space-y-3">
              <h4 className="font-black text-lg text-gray-800">About Property</h4>
              <p className="text-gray-500 font-medium leading-relaxed max-w-3xl">{hotelData.about.property}</p>
            </div>
            <button className="text-red-600 font-black text-sm hover:underline">Read more</button>
          </section>

          {/* 4. Choose your Room & 5. Room Type Options */}
          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Choose your room</h3>
              <div className="flex gap-2 bg-gray-100 p-1.5 rounded-full border border-gray-100">
                {navTabs.map(tab => (
                  <button key={tab} className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest ${tab === "Choose your room" ? 'bg-primary text-white shadow-lg shadow-red-100' : 'text-gray-500 hover:bg-gray-200'}`}>{tab}</button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {hotelData.rooms.map(room => (
                <div key={room.id} className={`bg-white p-8 rounded-[3rem] border ${room.isSelected ? 'border-primary' : 'border-gray-100'} hover:shadow-lg transition-all`}>
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr,200px] gap-8">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h4 className="flex items-center gap-2.5 text-2xl font-black text-gray-900">{room.type} <CheckCircle2 size={20} className="text-[#2ecc71]" /></h4>
                          <p className="text-sm text-gray-400 font-bold">Room size: {room.size} approx</p>
                        </div>
                        <div className="flex gap-4">
                           <div className="flex items-center gap-2 text-xs font-bold text-gray-600"><AirVent size={16} className="text-gray-400" /> AC</div>
                           <div className="flex items-center gap-2 text-xs font-bold text-gray-600"><Tv size={16} className="text-gray-400" /> TV</div>
                        </div>
                      </div>
                      
                      <img src={room.image} className="rounded-3xl h-36 w-full object-cover" />
                    </div>

                    <div className="space-y-6 text-center lg:text-right flex flex-col items-center lg:items-end justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm justify-end">
                          <span className="font-black text-3xl text-gray-900">₹{room.finalPrice}</span>
                          <span className="text-gray-400 line-through">₹{room.originalPrice}</span>
                        </div>
                        <p className="text-xs text-gray-400 font-bold">+ {room.taxes} taxes & fee</p>
                      </div>
                      
                      <button className={`w-full lg:w-auto px-10 py-4 rounded-full font-black text-sm uppercase flex items-center gap-2 ${room.isSelected ? 'bg-primary text-white shadow-lg' : room.isSoldOut ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-gray-700 transition'}`}>
                        {room.isSelected && <CheckCircle2 size={18} />} {room.isSelected ? "SELECTED" : room.isSoldOut ? "SOLD OUT" : "Select Room"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 6. Ratings and reviews */}
          <section className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-10">
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Ratings and reviews</h3>
            <div className="grid grid-cols-1 md:grid-cols-[1fr,2px,1.5fr] gap-10 items-center">
              <div className="space-y-4">
                <div className="bg-[#2ecc71] text-white px-6 py-4 rounded-xl text-3xl font-black flex items-center gap-2 w-max mx-auto md:mx-0">
                  {hotelData.rating} <Star size={22} className="fill-white" />
                </div>
                <div className="text-center md:text-left">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{hotelData.overallReviewText}</p>
                    <p className="text-xs text-gray-400 font-medium">{hotelData.numRatings} ratings</p>
                </div>
              </div>
              
              <div className="h-full w-px bg-gray-100"></div>

              <div className="grid grid-cols-1 gap-1.5 text-xs">
                {hotelData.reviews.breakdown.map(item => (
                    <div key={item.stars} className="flex items-center gap-3">
                        <p className="font-bold text-gray-600 flex items-center gap-1.5 w-6">{item.stars} <Star size={14} className="text-gray-400" /></p>
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-400 rounded-full" style={{ width: `${item.percentage}%` }}></div>
                        </div>
                        <p className="text-gray-400 font-medium w-10 text-right">{item.percentage}%</p>
                    </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {hotelData.reviews.items.map((review, i) => (
                <div key={i} className="flex gap-5 bg-gray-50 p-6 rounded-3xl border border-gray-100">
                    <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400"><UserCircle size={28} /></div>
                    <div className="space-y-2 flex-1">
                        <div className="flex items-center justify-between">
                            <h5 className="font-bold text-gray-800">{review.name}</h5>
                            <span className="text-xs text-gray-400 font-medium">{review.date}</span>
                        </div>
                        <p className="text-xs text-gray-500 font-medium">{review.review}</p>
                        {review.hasImage && <img src={hotelData.images[0]} className="h-16 w-24 object-cover rounded-xl mt-3 border border-gray-100 shadow-inner" />}
                    </div>
                </div>
              ))}
            </div>
            <button className="text-red-600 font-black text-sm pt-2 hover:underline">See all reviews</button>
          </section>

          {/* 7. Hotel Policies */}
          <section className="space-y-6">
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Hotel policies</h3>
            <div className="flex flex-wrap gap-4">
              <div className="bg-white px-8 py-5 rounded-3xl border border-gray-100 space-y-1">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Check-in</p>
                <p className="font-black text-xl text-gray-900">{hotelData.policies.checkin}</p>
              </div>
              <div className="bg-white px-8 py-5 rounded-3xl border border-gray-100 space-y-1">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Check-out</p>
                <p className="font-black text-xl text-gray-900">{hotelData.policies.checkout}</p>
              </div>
            </div>
          </section>

        </div>

        {/* 8. Sticky Booking Bar (Right Column) */}
        <aside className="relative md:block">
          <div className="sticky top-28 bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl space-y-8">
            <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-black text-3xl text-gray-900">₹{hotelData.pricing.final}</span>
                  <span className="text-gray-400 line-through">₹{hotelData.pricing.original}</span>
                </div>
                <p className="text-xs text-gray-400 font-bold">+ taxes & fee: ₹{hotelData.pricing.taxes}</p>
            </div>
            
            <div className="grid grid-cols-[1fr,auto] gap-4 bg-gray-50 border border-gray-100 p-4 rounded-full text-xs font-bold text-gray-700">
                <div className="flex items-center gap-1.5"><CalendarDays size={16} className="text-gray-400" /> {hotelData.dates.checkin} – {hotelData.dates.checkout}</div>
                <div className="h-6 w-px bg-gray-200"></div>
                <div className="flex items-center gap-1.5"><Users size={16} className="text-gray-400" /> {hotelData.guestsRooms}</div>
            </div>

            <div className="h-px bg-gray-100"></div>

            <button className="w-full bg-[#2ecc71] text-white py-5 rounded-[2rem] font-black text-lg hover:bg-[#27ae60] transition flex items-center justify-center gap-3">
              <ShieldCheck size={20} /> Continue to Book
            </button>
            <p className="text-[11px] text-orange-600 font-bold flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-full"><Zap size={14} /> 12 people booked this hotel in last 6 hours</p>
          </div>
        </aside>

      </main>
    </div>
  );
};

export default HotelPage;