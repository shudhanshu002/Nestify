import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, Headphones, ShieldCheck, 
  HelpCircle, ChevronDown, ChevronUp, Wrench, ArrowRight,
  Mail, Sparkles
} from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { AuthContext } from '../context/AuthContext';

const FAQ_DATA = [
  {
    category: 'Bookings & Escrow',
    q: 'How does the Nestify Zero-Brokerage & Escrow model work?',
    a: 'Nestify directly connects verified residents with building owners. We do not charge any brokerage fees. Your reservation fee is held securely in an audited escrow account until you complete physical check-in and verify that the room matches its listing.'
  },
  {
    category: 'Bookings & Escrow',
    q: 'What happens if the room does not match the photos or amenities?',
    a: 'Under our Move-In Guarantee, if your allocated room or key amenities (AC, Wi-Fi, power backup) differ from the verified listing, you can request an instant 100% refund or free relocation to another partner property within 24 hours.'
  },
  {
    category: 'Rent Extension',
    q: 'How do I extend my stay or rent online?',
    a: 'Open your "My Stays" tab, locate your active booking, and click "Extend Stay". You can choose quick presets (+15 days, +1 month, +2 months) or pick an exact check-out date. Nestify checks live calendar inventory in real time to prevent any overbooking and updates your official tax invoice automatically.'
  },
  {
    category: 'Rent Extension',
    q: 'Can I extend my stay if other guests have already booked the room?',
    a: 'Our strict night-by-night concurrency verification prevents overbooking. If all units of your room type are reserved for the extension window, the system prevents double-booking and suggests available dates.'
  },
  {
    category: 'Maintenance',
    q: 'How do I report room maintenance issues like Wi-Fi or plumbing?',
    a: 'Go to "My Stays" and click "Raise Ticket". Categorize the issue (Wi-Fi, Plumbing, Cleaning, Electric, etc.), choose the priority level, and describe the problem. The building manager is notified instantly and must log a resolution within 24 hours.'
  },
  {
    category: 'KYC & Safety',
    q: 'Why is government ID verification mandatory?',
    a: 'To maintain resident safety across all coliving and PG properties, every resident and property manager must complete digital identity verification (Aadhaar, Passport, or PAN) before check-in.'
  },
  {
    category: 'Payments & Receipts',
    q: 'How can I download my official GST tax invoice and payment receipt?',
    a: 'In "My Stays", click "Receipt" next to any booking. Your official tax invoice includes your SAC/HSN codes, itemized room tariffs, all recorded extension transactions, and is formatted for printing or saving as a PDF.'
  },
  {
    category: 'For Property Owners',
    q: 'How do building owners receive tenant payouts?',
    a: 'Once a tenant checks in successfully, rental settlements are credited to the verified landlord bank account on a scheduled weekly or monthly cycle, with transparent platform statements accessible from the Owner Dashboard.'
  }
];

const CATEGORIES = [
  { id: 'all', label: 'ALL QUERIES' },
  { id: 'Bookings & Escrow', label: 'BOOKINGS & ESCROW' },
  { id: 'Rent Extension', label: 'RENT EXTENSION' },
  { id: 'Maintenance', label: 'MAINTENANCE & TICKETS' },
  { id: 'KYC & Safety', label: 'KYC & SAFETY' }
];

const HelpCenter = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { openChatWithAdmin, setIsChatOpen } = useChat();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedFaq, setExpandedFaq] = useState(0);

  const handleAdminChatClick = () => {
    if (!user) {
      navigate('/login', { state: { from: '/help' } });
      return;
    }
    openChatWithAdmin();
    setIsChatOpen(true);
  };

  const filteredFaqs = FAQ_DATA.filter(item => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const query = searchQuery.toLowerCase();
    const matchesQuery = !query || item.q.toLowerCase().includes(query) || item.a.toLowerCase().includes(query);
    return matchesCat && matchesQuery;
  });

  return (
    <div className="pt-2 px-2 sm:px-4 md:px-8 max-w-5xl mx-auto space-y-8 text-white pb-20">
      
      {/* 1. TOP HERO CARD */}
      <section className="bg-[#141414] border border-neutral-800 rounded-3xl p-6 sm:p-10 text-center space-y-4 shadow-2xl relative overflow-hidden">
        <span className="bg-[#E50914]/20 text-[#E50914] border border-[#E50914]/30 text-[10px] font-black uppercase px-2.5 py-0.5 rounded tracking-wider inline-flex items-center gap-1">
          <Headphones size={12} className="text-[#E50914]" /> NESTIFY CARE & SUPPORT DESK
        </span>

        <h1 className="text-3xl sm:text-5xl font-black text-white italic tracking-wide">
          How can we help your stay?
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 max-w-xl mx-auto leading-relaxed">
          Search answers to common questions about bookings, rent extensions, move-in guarantees, or chat live with an administrator.
        </p>

        {/* Search Box */}
        <div className="max-w-xl mx-auto relative pt-2">
          <Search size={16} className="w-4 h-4 text-neutral-500 absolute left-4 top-5" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search queries e.g. extend rent, refund, maintenance..." 
            className="w-full bg-black/60 border border-neutral-800 rounded-2xl pl-11 pr-4 py-3 text-xs text-white outline-none focus:border-neutral-600 transition"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-5 text-xs text-neutral-400 hover:text-white cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Quick Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button 
            onClick={handleAdminChatClick}
            className="btn-red-glow text-white font-extrabold text-xs uppercase px-4 py-2.5 rounded-xl flex items-center gap-2 shadow cursor-pointer"
          >
            <Headphones className="w-4 h-4" /> CHAT WITH ADMIN
          </button>
          <Link 
            to="/my-bookings"
            className="bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 text-xs font-bold uppercase px-4 py-2.5 rounded-xl flex items-center gap-2 transition cursor-pointer"
          >
            <Wrench className="w-4 h-4 text-[#E50914]" /> RAISE ISSUE TICKET
          </Link>
        </div>
      </section>

      {/* 2. 3 QUICK CARDS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1 */}
        <div 
          onClick={handleAdminChatClick}
          className="bg-[#141414] border border-neutral-800 hover:border-neutral-700 rounded-2xl p-5 space-y-2 transition shadow-xl cursor-pointer group"
        >
          <Headphones className="w-6 h-6 text-[#E50914] group-hover:scale-110 transition-transform" />
          <h3 className="text-sm font-black text-white italic">Live Admin Chat</h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Connect directly with a dedicated platform administrator for dispute resolution, refunds, and stay assistance.
          </p>
          <span className="text-[#E50914] text-xs font-bold group-hover:underline pt-1 block">
            OPEN CHAT DRAWER &gt;
          </span>
        </div>

        {/* Card 2 */}
        <Link 
          to="/my-bookings"
          className="bg-[#141414] border border-neutral-800 hover:border-neutral-700 rounded-2xl p-5 space-y-2 transition shadow-xl block group"
        >
          <Wrench className="w-6 h-6 text-amber-500 group-hover:scale-110 transition-transform" />
          <h3 className="text-sm font-black text-white italic">Property Issue Hub</h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Raise maintenance tickets for Wi-Fi, plumbing, cleaning, or electrical repairs directly to building owners.
          </p>
          <span className="text-amber-400 text-xs font-bold group-hover:underline pt-1 block">
            MANAGE MY TICKETS &gt;
          </span>
        </Link>

        {/* Card 3 */}
        <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-5 space-y-2 shadow-xl">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
          <h3 className="text-sm font-black text-white italic">Escrow Protection</h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Every booking is protected by zero-brokerage escrow. 100% refund guaranteed if the property does not match descriptions.
          </p>
          <span className="text-[10px] text-neutral-500 block pt-1 uppercase font-bold tracking-wider">
            AUDIT STANDARD • VERIFIED 24/7
          </span>
        </div>
      </section>

      {/* 3. FAQ ACCORDION */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-black uppercase text-[#E50914] tracking-wider block">KNOWLEDGE BASE</span>
            <h2 className="text-2xl font-black text-white italic">Frequently Asked Questions</h2>
          </div>
          
          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-bold no-scrollbar">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-full transition cursor-pointer shrink-0 ${
                  selectedCategory === cat.id
                    ? 'bg-[#E50914] text-white shadow'
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {filteredFaqs.map((faq, idx) => {
            const isOpen = expandedFaq === idx;
            return (
              <div 
                key={idx}
                className="bg-[#141414] border border-neutral-800 rounded-xl overflow-hidden shadow-md"
              >
                <div 
                  onClick={() => setExpandedFaq(isOpen ? null : idx)} 
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-neutral-900/50 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-[#E50914] shrink-0" />
                    <h4 className="text-xs font-bold text-white">{faq.q}</h4>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-[#E50914] shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-neutral-400 shrink-0" />
                  )}
                </div>

                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-neutral-400 leading-relaxed border-t border-neutral-800/60 bg-black/30">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. BOTTOM DIRECT CHANNELS */}
      <section className="bg-[#141414] border border-neutral-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase text-[#E50914] tracking-wider block">DIRECT CHANNELS</span>
          <h3 className="text-lg font-black text-white italic">Still have an unresolved query?</h3>
          <p className="text-xs text-neutral-400 max-w-xl">
            Our platform grievance officers and support team are available 24/7 to resolve disputes, review audits, and guarantee resident safety.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button 
            onClick={handleAdminChatClick}
            className="btn-red-glow text-white text-xs font-bold uppercase px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow cursor-pointer"
          >
            <Headphones className="w-4 h-4" /> OPEN CHAT WITH ADMIN
          </button>
          <a 
            href="mailto:care@nestify.com" 
            className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs font-bold uppercase px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition"
          >
            <Mail className="w-4 h-4" /> CARE@NESTIFY.COM
          </a>
        </div>
      </section>

    </div>
  );
};

export default HelpCenter;
