import { useState, useEffect } from 'react';
import API from '../../api/client';
import { ShieldAlert, Users, Building, AlertCircle, CheckCircle } from 'lucide-react';

const AdminDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAllTickets = async () => {
    try {
      const { data } = await API.get('/maintenance/admin/all');
      setTickets(data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAllTickets(); }, []);

  const calculateHours = (date) => Math.abs(new Date() - new Date(date)) / 36e5;

  return (
    <div className="max-w-7xl mx-auto py-12 px-6">
      <h1 className="text-5xl font-black italic tracking-tighter mb-12">Admin Oversight.</h1>

      <div className="bg-white rounded-[3.5rem] shadow-2xl overflow-hidden border border-gray-100">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
            <tr>
              <th className="p-8">Tenant</th>
              <th className="p-8">Property Owner</th>
              <th className="p-8">Issue</th>
              <th className="p-8">Time Elapsed</th>
              <th className="p-8 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {tickets.map(ticket => {
              const hours = calculateHours(ticket.createdAt);
              return (
                <tr key={ticket._id} className={`${hours > 24 && ticket.status === 'OPEN' ? 'bg-red-50/50' : ''}`}>
                  <td className="p-8 font-black text-gray-900">{ticket.tenant?.firstName}</td>
                  <td className="p-8 font-bold text-gray-600">{ticket.property?.owner?.firstName || "Unknown"}</td>
                  <td className="p-8">
                    <span className="text-[10px] font-black text-primary uppercase">{ticket.issueType}</span>
                    <p className="text-xs text-gray-400 truncate max-w-[200px]">{ticket.description}</p>
                  </td>
                  <td className="p-8">
                    <div className="flex items-center gap-2 text-xs font-black">
                      <Clock size={14} className={hours > 24 ? 'text-red-500' : 'text-gray-400'}/>
                      {Math.floor(hours)} Hours
                    </div>
                  </td>
                  <td className="p-8 text-right">
                    {hours > 24 && ticket.status === 'OPEN' ? (
                      <button className="bg-red-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-red-100">
                        Escalate to Owner
                      </button>
                    ) : (
                      <span className="text-[10px] font-black text-gray-300 uppercase italic">Under Review</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;