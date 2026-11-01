import { useEffect, useContext, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogOut, ArrowRight, Home, CheckCircle2 } from 'lucide-react';
import Logo from '../components/Logo';

const Logout = () => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);
  const loggedOutRef = useRef(false);

  useEffect(() => {
    if (!loggedOutRef.current) {
      loggedOutRef.current = true;
      logout();
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/login', { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [logout, navigate]);

  return (
    <div className="flex min-h-[75vh] items-center justify-center px-4 py-12 text-white">
      <div className="w-full max-w-md bg-[#181818]/95 backdrop-blur-xl p-8 sm:p-10 rounded-[2.5rem] shadow-2xl border border-[#2a2a2a] text-center relative overflow-hidden">
        {/* Subtle Ambient Red Glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-4">
            <Logo size="lg" />
          </div>

          <div className="w-16 h-16 rounded-2xl bg-[#222222] border border-[#333333] flex items-center justify-center text-primary mb-4 shadow-inner">
            <LogOut size={30} className="text-primary" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
            Signed Out Successfully
          </h2>
          <p className="text-sm text-gray-400 font-medium mb-6">
            Your session has been securely terminated. Thank you for staying with Nestify.
          </p>

          <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mb-8 font-medium">
            <CheckCircle2 size={14} className="text-emerald-400" />
            <span>Redirecting to login in {countdown}s</span>
          </div>

          <div className="w-full grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="btn-netflix py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-red-950/40"
            >
              <span>Sign Back In</span>
              <ArrowRight size={14} />
            </button>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="py-3 rounded-2xl font-bold text-xs sm:text-sm bg-[#222222] hover:bg-[#282828] border border-[#333333] text-gray-300 hover:text-white flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Home size={14} />
              <span>Explore Stays</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Logout;
