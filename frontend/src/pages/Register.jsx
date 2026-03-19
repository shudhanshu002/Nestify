import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/client';
import { User, Mail, Lock, Phone, ShieldCheck } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', password: '', role: 'TENANT'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/auth/register', formData);
      navigate('/login', { state: { message: 'Registration successful! Please login.' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-8 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
      <h2 className="text-3xl font-bold text-center mb-2">Join the Community</h2>
      <p className="text-center text-gray-500 mb-8">Choose your path and get started</p>

      {/* Role Selection Toggle */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setFormData({ ...formData, role: 'TENANT' })}
          className={`flex-1 py-4 rounded-xl border-2 transition flex flex-col items-center gap-2 ${
            formData.role === 'TENANT' ? 'border-primary bg-blue-50 text-primary' : 'border-gray-100 text-gray-400'
          }`}
        >
          <User size={24} />
          <span className="font-bold">I'm a Tenant</span>
        </button>
        <button
          onClick={() => setFormData({ ...formData, role: 'OWNER' })}
          className={`flex-1 py-4 rounded-xl border-2 transition flex flex-col items-center gap-2 ${
            formData.role === 'OWNER' ? 'border-secondary bg-green-50 text-secondary' : 'border-gray-100 text-gray-400'
          }`}
        >
          <ShieldCheck size={24} />
          <span className="font-bold">I'm an Owner</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        <div className="col-span-1">
          <input
            placeholder="First Name"
            required
            className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary"
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          />
        </div>
        <div className="col-span-1">
          <input
            placeholder="Last Name"
            required
            className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary"
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
          />
        </div>
        <div className="col-span-2">
          <input
            type="email"
            placeholder="Email Address"
            required
            className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary"
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
        <div className="col-span-2">
          <input
            type="password"
            placeholder="Create Password"
            required
            className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary"
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
        </div>
        
        <button
          disabled={loading}
          className="col-span-2 bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-black transition disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Complete Registration'}
        </button>
      </form>
    </div>
  );
};

export default Register;