import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, AlertTriangle, CheckCircle2, 
  XCircle, ArrowRight, Lock, Mail, Phone, 
  FileCheck, X 
} from 'lucide-react';

const OwnerVerificationWarningModal = ({ 
  isOpen, 
  onClose, 
  onProceedToOnboarding, 
  user 
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isEmailVerified = !!user?.isEmailVerified;
  const isPhoneVerified = !!(user?.isPhoneVerified || (user?.phone && user.phone.length >= 10));
  const isKycVerified = user?.kycStatus === 'VERIFIED';
  const hasKycSubmitted = isKycVerified || user?.kycStatus === 'PENDING' || (user?.kycDocuments && user.kycDocuments.length > 0);

  const handleGoToVerification = () => {
    onClose();
    navigate('/verify-identity');
  };

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-[99999] overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-[#14151b] border border-amber-600/40 rounded-3xl w-full max-w-lg p-6 sm:p-8 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient warning accent */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-amber-500/15 rounded-full blur-[70px] pointer-events-none"></div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 bg-[#1f2029] hover:bg-[#2c2d3a] text-gray-400 hover:text-white rounded-xl transition cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* Warning Icon & Header */}
        <div className="flex items-start gap-4">
          <div className="p-3.5 bg-amber-950/60 border border-amber-600/50 text-amber-400 rounded-2xl shrink-0">
            <ShieldAlert size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-800/60">
                Identity Compliance Required
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black italic tracking-tight text-white">
              Account Verification Warning
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              You must verify your identity before switching to a Landlord / PG Owner account.
            </p>
          </div>
        </div>

        {/* Warning Notice Box */}
        <div className="bg-amber-950/40 border border-amber-800/40 p-4 rounded-2xl flex items-start gap-3 text-amber-200">
          <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed">
            Under Nestify's Co-Living Security Guidelines &amp; Anti-Fraud Compliance, unverified users cannot publish PG room listings, handle guest deposits, or execute rental agreements.
          </p>
        </div>

        {/* Verification Requirements Checklist */}
        <div className="space-y-2.5">
          <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">
            Verification Prerequisites for Landlords
          </span>

          {/* 1. Email Verification */}
          <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
            isEmailVerified 
              ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300' 
              : 'bg-red-950/30 border-red-800/40 text-red-300'
          }`}>
            <div className="flex items-center gap-2.5">
              <Mail size={15} className={isEmailVerified ? 'text-emerald-400' : 'text-red-400'} />
              <span className="font-bold">Email Address Verification</span>
            </div>
            <span className="text-[10px] font-black uppercase flex items-center gap-1 font-mono">
              {isEmailVerified ? (
                <><CheckCircle2 size={13} className="text-emerald-400" /> Verified</>
              ) : (
                <><XCircle size={13} className="text-red-400" /> Required</>
              )}
            </span>
          </div>

          {/* 2. Phone Verification */}
          <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
            isPhoneVerified 
              ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300' 
              : 'bg-red-950/30 border-red-800/40 text-red-300'
          }`}>
            <div className="flex items-center gap-2.5">
              <Phone size={15} className={isPhoneVerified ? 'text-emerald-400' : 'text-red-400'} />
              <span className="font-bold">10-Digit Mobile Number (WhatsApp / Mobile OTP)</span>
            </div>
            <span className="text-[10px] font-black uppercase flex items-center gap-1 font-mono">
              {isPhoneVerified ? (
                <><CheckCircle2 size={13} className="text-emerald-400" /> Verified</>
              ) : (
                <><XCircle size={13} className="text-red-400" /> Required</>
              )}
            </span>
          </div>

          {/* 3. Government Identity (KYC) */}
          <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
            hasKycSubmitted 
              ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300' 
              : 'bg-red-950/30 border-red-800/40 text-red-300'
          }`}>
            <div className="flex items-center gap-2.5">
              <FileCheck size={15} className={hasKycSubmitted ? 'text-emerald-400' : 'text-red-400'} />
              <span className="font-bold">Government ID (Aadhaar / PAN / Passport)</span>
            </div>
            <span className="text-[10px] font-black uppercase flex items-center gap-1 font-mono">
              {hasKycSubmitted ? (
                <><CheckCircle2 size={13} className="text-emerald-400" /> Submitted</>
              ) : (
                <><XCircle size={13} className="text-red-400" /> Required</>
              )}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2 border-t border-[#232535]">
          <button
            type="button"
            onClick={handleGoToVerification}
            className="w-full btn-netflix py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-950/50 cursor-pointer"
          >
            <span>Complete Verification in Hub</span>
            <ArrowRight size={14} />
          </button>

          {onProceedToOnboarding && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onProceedToOnboarding();
              }}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-gray-300 hover:text-white bg-[#1c1d26] hover:bg-[#252733] border border-[#2e3040] transition cursor-pointer"
            >
              Fill Onboarding Form &amp; Upload ID Directly
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-[11px] font-bold text-gray-400 hover:text-gray-300 transition text-center cursor-pointer"
          >
            Stay as Resident for Now
          </button>
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default OwnerVerificationWarningModal;

