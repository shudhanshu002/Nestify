import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../api/client';
import { 
  Building2, Users, CreditCard, LayoutGrid, 
  Settings, Plus, Search, MoreVertical, ShieldCheck, 
  TrendingUp, AlertCircle, Hotel
} from 'lucide-react';

const CompanyDashboard = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('properties');
  const [stats, setStats] = useState({ totalRevenue: 0, totalBookings: 0, activeManagers: 0 });

  // 󾠮 IDENTIFY THE USER LEVEL
  const isAdmin = user.role === 'COMPANY_ADMIN';

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-72 bg-white border-r border-gray-100 p-8 flex flex-col">
        <div className="mb-12">
          <h2 className="text-2xl font-black italic tracking-tighter text-primary">Royal Series.</h2>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Management Suite</p>
        </div>

        <nav className="space-y-2 flex-1">
          <button onClick={() => setActiveTab('properties')} className={`w-full flex items-center gap-3 p-4 rounded-2xl font-black text-sm transition ${activeTab === 'properties' ? 'bg-primary text-white shadow-xl shadow-blue-100' : 'text-gray-400 hover:bg-gray-50'}`}>
            <Building2 size={18}/> Properties
          </button>
          
          {/* 󾠯 ONLY ADMINS SEE THE TEAM TAB */}
          {isAdmin && (
            <button onClick={() => setActiveTab('managers')} className={`w-full flex items-center gap-3 p-4 rounded-2xl font-black text-sm transition ${activeTab === 'managers' ? 'bg-primary text-white shadow-xl shadow-blue-100' : 'text-gray-400 hover:bg-gray-50'}`}>
              <Users size={18}/> Manage Team
            </button>
          )}

          <button onClick={() => setActiveTab('revenue')} className={`w-full flex items-center gap-3 p-4 rounded-2xl font-black text-sm transition ${activeTab === 'revenue' ? 'bg-primary text-white shadow-xl shadow-blue-100' : 'text-gray-400 hover:bg-gray-50'}`}>
            <CreditCard size={18}/> Revenue & Payouts
          </button>
        </nav>

        <div className="p-6 bg-gray-900 rounded-[2rem] text-white">
          <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Logged in as</p>
          <p className="font-black text-sm truncate">{user.firstName} {user.lastName}</p>
          <span className="text-[8px] font-black bg-primary px-2 py-1 rounded-md mt-2 inline-block">
            {user.role}
          </span>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-12 overflow-y-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter italic">
              {isAdmin ? "Company Overview" : "Manager Console"}
            </h1>
            <p className="text-gray-400 font-bold">Good evening, {user.firstName}.</p>
          </div>
          {isAdmin && (
            <button className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-primary transition shadow-xl">
              <Plus size={20}/> List New Hotel
            </button>
          )}
        </header>

        {/* TOP STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <StatCard icon={<TrendingUp />} label="Total Earnings" value="₹4.2L" color="bg-green-500" />
          <StatCard icon={<Hotel />} label="Active Rooms" value="128" color="bg-blue-500" />
          <StatCard icon={<AlertCircle />} label="Open Disputes" value="02" color="bg-orange-500" />
        </div>

        {/* CONTENT SWITCHER */}
        {activeTab === 'properties' && <PropertyGrid isAdmin={isAdmin} />}
        {activeTab === 'managers' && isAdmin && <ManagerTable />}
      </main>
    </div>
  );
};

// Sub-Component: Stat Cards
const StatCard = ({ icon, label, value, color }) => (
  <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 flex items-center gap-6">
    <div className={`p-4 rounded-2xl text-white ${color}`}>{icon}</div>
    <div>
      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{label}</p>
      <p className="text-3xl font-black text-gray-900">{value}</p>
    </div>
  </div>
);

// Sub-Component: Manager Management (Admin Only)
const ManagerTable = () => (
  <div className="bg-white rounded-[3rem] shadow-xl border border-gray-50 overflow-hidden">
    <div className="p-8 border-b border-gray-50 flex justify-between items-center">
      <h3 className="text-xl font-black italic">Staff Hierarchy</h3>
      <button className="text-primary font-black text-xs uppercase tracking-widest">+ Invite Manager</button>
    </div>
    <table className="w-full text-left">
      <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
        <tr>
          <th className="p-6">Manager Name</th>
          <th>Assigned Hotel</th>
          <th>Performance</th>
          <th>Status</th>
          <th className="p-6">Actions</th>
        </tr>
      </thead>
      <tbody className="font-bold text-sm text-gray-600">
        <tr className="border-t border-gray-50">
          <td className="p-6 flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-gray-100" /> Rajesh Reddy</td>
          <td>Royal Residency LPU</td>
          <td className="text-green-500">4.8 ★</td>
          <td><span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px]">Active</span></td>
          <td className="p-6"><MoreVertical size={18} className="text-gray-300 cursor-pointer"/></td>
        </tr>
      </tbody>
    </table>
  </div>
);

const PropertyGrid = ({ isAdmin }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
     {/* Property Card Loop */}
     <div className="bg-white p-8 rounded-[3.5rem] shadow-xl border border-gray-50 group hover:border-primary/20 transition">
        <div className="flex justify-between items-start mb-6">
          <div className="w-20 h-20 bg-gray-100 rounded-3xl" />
          <span className="bg-primary/10 text-primary px-4 py-2 rounded-xl text-[10px] font-black">MANAGED</span>
        </div>
        <h4 className="text-xl font-black text-gray-900">Royal Hotel Phase 1</h4>
        <p className="text-gray-400 text-sm font-bold mb-6">LPU Gate 2, Phagwara</p>
        <div className="flex justify-between items-center pt-6 border-t border-gray-50">
           <div className="flex -space-x-2">
             {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200" />)}
             <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-900 text-white flex items-center justify-center text-[8px]">+12</div>
           </div>
           <button className="font-black text-xs text-primary uppercase tracking-widest group-hover:underline">Edit Inventory</button>
        </div>
     </div>
  </div>
);

export default CompanyDashboard;