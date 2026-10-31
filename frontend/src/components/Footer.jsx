import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import { 
  ShieldCheck, Heart, Sparkles, MapPin, Mail, Phone, 
  ExternalLink, ArrowRight, CheckCircle2, Lock, FileText, 
  Headphones, Globe, Award
} from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#0b0b0b] text-gray-300 border-t border-[#222222] mt-24">
      {/* 1. TOP TRUST & VALUE BAR */}
      <div className="border-b border-[#1c1c1c] bg-[#101010]/80">
        <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 className="text-white font-black text-sm tracking-tight">100% Physical Audits</h4>
              <p className="text-xs text-gray-400 mt-0.5 font-medium">Every listed PG is physically inspected for security, hygiene, and room specs.</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 flex items-center justify-center shrink-0">
              <Lock size={22} />
            </div>
            <div>
              <h4 className="text-white font-black text-sm tracking-tight">Zero Brokerage & Escrow</h4>
              <p className="text-xs text-gray-400 mt-0.5 font-medium">Book directly with verified landlords. Your advance token is held in escrow until move-in.</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-950/60 border border-blue-800/40 text-blue-400 flex items-center justify-center shrink-0">
              <FileText size={22} />
            </div>
            <div>
              <h4 className="text-white font-black text-sm tracking-tight">Legal Move-In Agreements</h4>
              <p className="text-xs text-gray-400 mt-0.5 font-medium">Digitally certified rental agreements and instant GST tax invoices with zero paperwork.</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-950/60 border border-amber-800/40 text-amber-400 flex items-center justify-center shrink-0">
              <Headphones size={22} />
            </div>
            <div>
              <h4 className="text-white font-black text-sm tracking-tight">Rapid Issue Resolution</h4>
              <p className="text-xs text-gray-400 mt-0.5 font-medium">In-app maintenance ticketing with live landlord status tracking and rating guarantee.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN FOOTER DIRECTORY */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Brand Column (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            <Logo size="md" />
            
            <p className="text-sm text-gray-400 font-medium leading-relaxed">
              India's premier co-living and student residency platform. Redefining urban rental living with curated suites, verified hosts, transparent tariffs, and end-to-end digital lease management.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-xs text-gray-300 font-semibold">
                <MapPin size={16} className="text-primary shrink-0" />
                <span>HQ: Cyber City Tower B, DLF Phase 2, Gurugram, India</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-300 font-semibold">
                <Mail size={16} className="text-primary shrink-0" />
                <span>care@nestify.com • official@nestify.com</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-300 font-semibold">
                <Phone size={16} className="text-primary shrink-0" />
                <span>+91 (011) 4920-8000 • Mon - Sat (9:00 AM - 8:00 PM)</span>
              </div>
            </div>

            {/* Newsletter Subscription */}
            <div className="pt-4 border-t border-[#202020]">
              <span className="text-[11px] font-black uppercase text-gray-400 tracking-wider block mb-2">
                Priority Alerts on New Stays & Flash Tariffs
              </span>
              <form onSubmit={(e) => { e.preventDefault(); alert("Thank you for subscribing to Nestify Priority Alerts!"); }} className="flex gap-2">
                <input 
                  type="email" 
                  required
                  placeholder="Enter your email address..." 
                  className="bg-[#181818] border border-[#2e2e2e] rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-primary flex-1 font-medium"
                />
                <button 
                  type="submit" 
                  className="btn-netflix px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 cursor-pointer"
                >
                  Join
                </button>
              </form>
            </div>
          </div>

          {/* Directory Links (8 Cols) */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8">
            
            {/* Column 1: Top City Hubs */}
            <div className="space-y-4">
              <h5 className="text-xs font-black uppercase tracking-widest text-white border-b border-[#222222] pb-2">
                Student & Tech Hubs
              </h5>
              <ul className="space-y-2.5 text-xs font-medium">
                {[
                  { name: 'Noida (Sector 62 & IT Parks)', city: 'Noida' },
                  { name: 'Delhi NCR (North & South Campus)', city: 'Delhi NCR' },
                  { name: 'Gurugram (Cyber City & DLF)', city: 'Gurugram' },
                  { name: 'Bengaluru (Koramangala & HSR)', city: 'Bengaluru' },
                  { name: 'Pune (Hinjewadi & Viman Nagar)', city: 'Pune' },
                  { name: 'Kota (Landmark City & Allen)', city: 'Kota' },
                  { name: 'Mumbai (Powai & Andheri East)', city: 'Mumbai' },
                  { name: 'Hyderabad (HITEC City & Gachibowli)', city: 'Hyderabad' }
                ].map((item) => (
                  <li key={item.name}>
                    <Link 
                      to={`/search?city=${encodeURIComponent(item.city)}`}
                      className="text-gray-400 hover:text-white hover:translate-x-1 inline-block transition duration-200"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 2: Resident Services */}
            <div className="space-y-4">
              <h5 className="text-xs font-black uppercase tracking-widest text-white border-b border-[#222222] pb-2">
                Resident Services
              </h5>
              <ul className="space-y-2.5 text-xs font-medium">
                {[
                  { label: 'Browse Verified Stays', to: '/search' },
                  { label: 'Student Pocket Stays Under ₹8.5k', to: '/search?collection=BUDGET' },
                  { label: 'Premier Luxury Flagships', to: '/search?collection=LUXURY' },
                  { label: 'Interactive Map Explorer', to: '/search?view=map' },
                  { label: 'My Bookings & Stays', to: '/my-bookings' },
                  { label: 'Extend Stay / Rent Online', to: '/my-bookings' },
                  { label: 'Service & Maintenance Desk', to: '/my-bookings' },
                  { label: 'Tax Invoices & Accommodations', to: '/my-bookings' }
                ].map((link) => (
                  <li key={link.label}>
                    <Link 
                      to={link.to}
                      className="text-gray-400 hover:text-white hover:translate-x-1 inline-block transition duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Landlords & Corporate */}
            <div className="space-y-4">
              <h5 className="text-xs font-black uppercase tracking-widest text-white border-b border-[#222222] pb-2">
                Hosts & Platform
              </h5>
              <ul className="space-y-2.5 text-xs font-medium">
                {[
                  { label: 'List Your PG / Hostel', to: '/owner/add-property' },
                  { label: 'Owner Command Center', to: '/owner/dashboard' },
                  { label: 'Identity & KYC Verification', to: '/verify-identity' },
                  { label: 'Move-In Guarantee Policy', to: '/help' },
                  { label: 'Safety & Hygiene Standard', to: '/help' },
                  { label: 'Escrow Protection Terms', to: '/help' },
                  { label: 'Privacy Policy', to: '/help' },
                  { label: 'Terms of Service', to: '/help' }
                ].map((link) => (
                  <li key={link.label}>
                    <Link 
                      to={link.to}
                      className="text-gray-400 hover:text-white hover:translate-x-1 inline-block transition duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </div>

      {/* 3. COMPLIANCE & BOTTOM COPYRIGHT BAR */}
      <div className="border-t border-[#1c1c1c] bg-[#080808]">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-medium text-gray-500">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-gray-400 font-bold">© 2026 Nestify Technologies Pvt. Ltd.</span>
            <span className="hidden sm:inline text-gray-700">•</span>
            <span>CIN: U72900DL2024PTC392810</span>
            <span className="hidden sm:inline text-gray-700">•</span>
            <span>GSTIN: 07AABCN8934L1Z1</span>
          </div>

          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              All Systems Operational
            </span>
            <span className="text-gray-600">|</span>
            <span className="text-gray-400">Encrypted 256-bit SSL</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
