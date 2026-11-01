import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, MessageSquare, Headphones, ShieldCheck, 
  HelpCircle, ChevronDown, ChevronUp, FileText, 
  CreditCard, Wrench, Shield, Award, Clock, ArrowRight,
  Phone, Mail, CheckCircle2, AlertCircle, Sparkles, Building
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
  { id: 'all', label: 'All Queries' },
  { id: 'Bookings & Escrow', label: 'Bookings & Escrow' },
  { id: 'Rent Extension', label: 'Rent Extension' },
  { id: 'Maintenance', label: 'Maintenance & Tickets' },
  { id: 'KYC & Safety', label: 'KYC & Safety' },
  { id: 'Payments & Receipts', label: 'Payments & Invoices' }
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
  };

  const filteredFaqs = FAQ_DATA.filter(item => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const query = searchQuery.toLowerCase();
    const matchesQuery = !query || item.q.toLowerCase().includes(query) || item.a.toLowerCase().includes(query);
    return matchesCat && matchesQuery;
  });

  return (
    <div className="min-h-screen text-white pb-20 selection:bg-primary selection:text-white">
      {/* 1. HERO SECTION */}
      <section className="relative rounded-[3rem] bg-gradient-to-b from-[#1c1c1c] to-[#141414] border border-[#2a2a2a] p-8 sm:p-14 overflow-hidden shadow-2xl text-center">
        {/* Ambient red backlight */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-primary/15 blur-[120px] pointer-events-none rounded-full" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary/20 text-primary border border-primary/30 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md">
            <Sparkles size={12} className="text-primary" /> Nestify Care & Support Desk
          </div>

          <h1 className="text-4xl sm:text-6xl font-black italic tracking-tighter leading-tight text-white drop-shadow-md">
            How can we help your stay?
          </h1>

          <p className="text-gray-400 text-sm sm:text-base font-medium max-w-xl mx-auto leading-relaxed">
            Search answers to common questions about bookings, rent extensions, move-in guarantees, or chat live with an administrator.
          </p>

          {/* Search Box */}
          <div className="pt-4 max-w-xl mx-auto">
            <div className="relative">
              <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search queries e.g. extend rent, refund, maintenance..."
                className="w-full bg-[#202020] pl-12 pr-4 py-4 rounded-2xl text-xs sm:text-sm font-semibold text-white outline-none border border-[#303030] focus:border-primary transition shadow-xl placeholder:text-gray-500"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Quick Support Action Pill */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleAdminChatClick}
              className="btn-netflix px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition cursor-pointer"
            >
              <Headphones size={16} /> Chat with Admin
            </button>
            <Link
              to="/my-bookings"
              className="btn-netflix-secondary px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer"
            >
              <Wrench size={16} /> Raise Issue Ticket
            </Link>
          </div>
        </div>
      </section>

      {/* 2. LIVE SUPPORT & CONTACT CHANNELS */}
      <section className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Chat with Admin Card */}
        <div 
          onClick={handleAdminChatClick}
          className="bg-[#181818] hover:bg-[#202020] p-7 rounded-[2.5rem] border border-[#2a2a2a] hover:border-primary/50 transition duration-300 shadow-xl group cursor-pointer space-y-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition">
            <Headphones size={22} />
          </div>
          <div>
            <h3 className="text-xl font-black italic tracking-tight text-white group-hover:text-primary transition">
              Live Admin Chat
            </h3>
            <p className="text-xs text-gray-400 font-medium leading-relaxed mt-1">
              Connect directly with a dedicated platform administrator for dispute resolution, refunds, and stay assistance.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-black uppercase text-primary tracking-wider group-hover:translate-x-1 transition-transform">
            <span>Open Chat Drawer</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Maintenance Ticket Desk */}
        <Link 
          to="/my-bookings"
          className="bg-[#181818] hover:bg-[#202020] p-7 rounded-[2.5rem] border border-[#2a2a2a] hover:border-primary/50 transition duration-300 shadow-xl group cursor-pointer space-y-4 block"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-950/60 text-amber-400 border border-amber-800/40 flex items-center justify-center group-hover:scale-110 transition">
            <Wrench size={22} />
          </div>
          <div>
            <h3 className="text-xl font-black italic tracking-tight text-white group-hover:text-amber-400 transition">
              Property Issue Hub
            </h3>
            <p className="text-xs text-gray-400 font-medium leading-relaxed mt-1">
              Raise maintenance tickets for Wi-Fi, plumbing, cleaning, or electrical repairs directly to building owners.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-black uppercase text-amber-400 tracking-wider group-hover:translate-x-1 transition-transform">
            <span>Manage My Tickets</span>
            <ArrowRight size={14} />
          </div>
        </Link>

        {/* Move-in Guarantee & Escrow */}
        <div className="bg-[#181818] p-7 rounded-[2.5rem] border border-[#2a2a2a] shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 flex items-center justify-center">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h3 className="text-xl font-black italic tracking-tight text-white">
              Escrow Protection
            </h3>
            <p className="text-xs text-gray-400 font-medium leading-relaxed mt-1">
              Every booking is protected by zero-brokerage escrow. 100% refund guaranteed if the property does not match descriptions.
            </p>
          </div>
          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest font-bold">
            Audit Standard • Verified 24/7
          </p>
        </div>
      </section>

      {/* 3. CATEGORY FILTER TABS & FAQ ACCORDION */}
      <section className="mt-14 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-primary text-[10px] font-black uppercase tracking-[0.25em]">Knowledge Base</span>
            <h2 className="text-3xl font-black italic tracking-tighter text-white mt-1">Frequently Asked Questions</h2>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition shrink-0 cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'btn-netflix shadow-md'
                    : 'bg-[#202020] text-gray-400 hover:text-white border border-[#2c2c2c]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* FAQs List */}
        <div className="space-y-3">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, idx) => {
              const isOpen = expandedFaq === idx;
              return (
                <div 
                  key={idx}
                  className="bg-[#181818] border border-[#2a2a2a] rounded-2xl overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => setExpandedFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-[#202020]/60 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                      <span className="font-bold text-sm sm:text-base text-white">{faq.q}</span>
                    </div>
                    {isOpen ? <ChevronUp size={18} className="text-primary shrink-0" /> : <ChevronDown size={18} className="text-gray-400 shrink-0" />}
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-gray-400 font-medium leading-relaxed border-t border-[#262626] bg-[#151515]/50">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-16 bg-[#181818] rounded-3xl border border-[#262626] space-y-2">
              <HelpCircle size={40} className="mx-auto text-gray-600 mb-1" />
              <p className="text-xs font-black uppercase text-gray-300">No questions found</p>
              <p className="text-xs text-gray-500">Try a different search term or connect with live admin support.</p>
            </div>
          )}
        </div>
      </section>

      {/* 4. EMERGENCY & GRIEVANCE DIRECTORY */}
      <section className="mt-14 bg-[#181818] p-8 sm:p-10 rounded-[3rem] border border-[#2a2a2a] shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-primary text-[10px] font-black uppercase tracking-[0.25em]">Direct Channels</span>
            <h3 className="text-2xl font-black italic text-white">Still have an unresolved query?</h3>
            <p className="text-gray-400 text-xs sm:text-sm font-medium max-w-lg">
              Our platform grievance officers and support team are available 24/7 to resolve disputes, review audits, and guarantee resident safety.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleAdminChatClick}
              className="btn-netflix px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl cursor-pointer"
            >
              <Headphones size={16} /> Open Chat with Admin
            </button>
            <a
              href="mailto:care@nestify.com"
              className="btn-netflix-secondary px-5 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer"
            >
              <Mail size={16} /> care@nestify.com
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HelpCenter;

