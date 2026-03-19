import { useState, useEffect } from 'react';
import API from '../api/client';
import { LayoutGrid, Plus, Users, Calendar, TrendingUp, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const OwnerDashboard = () => {
  const [stats, setStats] = useState({ totalProperties: 0, activeBookings: 0, pendingVisits: 0 });
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    const fetchOwnerData = async () => {
      try {
        const { data } = await API.get('/properties/my-listings');
        setProperties(data.data);
        // Mocking stats for UI display
        setStats({ totalProperties: data.data.length, activeBookings: 12, pendingVisits: 4 });
      } catch (err) {
        console.error("Dashboard load failed");
      }
    };
    fetchOwnerData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-gray-900">Portfolio Overview</h1>
        <Link to="/owner/add-property" className="bg-primary text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-100 hover:scale-105 transition">
          <Plus size={20} /> Add New Listing
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'My Listings', value: stats.totalProperties, icon: LayoutGrid, color: 'blue' },
          { label: 'Active Tenants', value: stats.activeBookings, icon: Users, color: 'green' },
          { label: 'Pending Visits', value: stats.pendingVisits, icon: Calendar, color: 'orange' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-6">
            <div className={`p-4 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600`}>
              <stat.icon size={28} />
            </div>
            <div>
              <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-3xl font-black text-gray-900">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Property Management Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-900">Manage Properties</h3>
            <button className="text-primary text-sm font-bold">See All</button>
          </div>
          <div className="divide-y divide-gray-50">
            {properties.map((prop) => (
              <div key={prop._id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition">
                <div className="flex items-center gap-4">
                  <img src={prop.images?.[0]?.url} className="w-12 h-12 rounded-xl object-cover" alt="" />
                  <div>
                    <h5 className="font-bold text-gray-900 text-sm">{prop.title}</h5>
                    <p className="text-xs text-gray-400">{prop.location.city} • {prop.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden md:block">
                    <p className="text-xs font-bold text-gray-900">₹{prop.basePrice}</p>
                    <p className="text-[10px] text-gray-400 uppercase">Monthly</p>
                  </div>
                  <Link to={`/owner/edit/${prop._id}`} className="p-2 hover:bg-gray-100 rounded-lg">
                    <ChevronRight size={18} className="text-gray-400" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Performance */}
        <div className="bg-primary text-white p-8 rounded-3xl shadow-xl flex flex-col justify-between">
          <div>
            <TrendingUp className="mb-4" size={32} />
            <h3 className="text-xl font-bold mb-2">Portfolio Growth</h3>
            <p className="text-blue-100 text-sm">Your average occupancy rate is up 15% this month. Good job!</p>
          </div>
          <button className="mt-8 bg-white text-primary py-3 rounded-xl font-bold hover:bg-blue-50 transition">
            View Analytics Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;