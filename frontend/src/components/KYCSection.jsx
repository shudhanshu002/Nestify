import { ShieldCheck, Phone, Camera, HeartPulse, GraduationCap, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const KYCSection = ({ user }) => {
  const isPhoneVerified = !!user?.isPhoneVerified;
  const isIdentityVerified = user?.kycStatus === 'VERIFIED';
  const isSelfieVerified = !!user?.selfieVerification?.isVerified;
  const isEmergencyVerified = !!user?.profile?.emergencyContact?.isVerified;
  const isStudentOrWorkVerified = user?.studentOrWorkVerification?.status === 'VERIFIED';

  const verificationItems = [
    {
      id: 'mobile',
      label: '1. Mobile Number (OTP)',
      desc: isPhoneVerified ? `Verified: ${user.phone || '+91 Confirmed'}` : 'Mandatory for bookings and SMS escrow notices',
      verified: isPhoneVerified,
      icon: <Phone size={16} />
    },
    {
      id: 'identity',
      label: '2. Aadhaar & Identity',
      desc: isIdentityVerified ? `Verified: ${user.identityVerification?.docType || 'Government ID'}` : 'Mandatory under UIDAI & IT Act compliance',
      verified: isIdentityVerified,
      icon: <ShieldCheck size={16} />
    },
    {
      id: 'selfie',
      label: '3. Live Selfie (Liveness)',
      desc: isSelfieVerified ? 'Liveness Authenticated ✓' : 'Anti-impersonation face verification',
      verified: isSelfieVerified,
      icon: <Camera size={16} />
    },
    {
      id: 'emergency',
      label: '4. Emergency Contact',
      desc: isEmergencyVerified ? `Verified: ${user.profile?.emergencyContact?.name || 'Contact SOS'}` : 'Verified family/guardian SOS contact',
      verified: isEmergencyVerified,
      icon: <HeartPulse size={16} />
    },
    {
      id: 'student_work',
      label: '5. Student / Corporate',
      desc: isStudentOrWorkVerified ? `Verified: ${user.studentOrWorkVerification?.organizationName || 'Affiliated'}` : 'Optional college or employee badge',
      verified: isStudentOrWorkVerified,
      icon: <GraduationCap size={16} />
    }
  ];

  return (
    <section className="bg-[#181818] rounded-2xl p-6 sm:p-8 border border-[#2a2a2a] text-white shadow-xl space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#262626]">
        <div>
          <span className="text-[10px] font-black uppercase text-red-500 tracking-wider block">5-Pillar Verification</span>
          <h3 className="text-xl sm:text-2xl font-black italic tracking-tight text-white">Trust &amp; Verification Center</h3>
        </div>
        <Link
          to="/verify-identity"
          className="btn-netflix px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5"
        >
          <span>Open Verification Hub</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {verificationItems.map((item) => (
          <Link
            key={item.id}
            to={`/verify-identity?tab=${item.id}`}
            className={`p-3.5 rounded-xl border flex items-start gap-3 transition cursor-pointer ${
              item.verified 
                ? 'bg-emerald-950/20 border-emerald-800/40 hover:bg-emerald-950/30' 
                : 'bg-[#1e1f26] border-[#2c2d38] hover:border-red-500/50'
            }`}
          >
            <div className={`p-2 rounded-lg mt-0.5 shrink-0 ${
              item.verified ? 'bg-emerald-900/40 text-emerald-400' : 'bg-[#292a36] text-gray-400'
            }`}>
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-black text-white truncate">{item.label}</span>
                {item.verified ? (
                  <span className="text-[10px] font-black text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={11} /> Verified
                  </span>
                ) : (
                  <span className="text-[9px] font-bold text-red-400 uppercase">Action Req</span>
                )}
              </div>
              <p className="text-[11px] text-gray-400 truncate mt-0.5">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default KYCSection;
