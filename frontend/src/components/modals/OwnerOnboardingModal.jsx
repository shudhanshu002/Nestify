import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Building2, ShieldCheck, CheckCircle2, AlertCircle, 
  X, Loader2, Landmark, FileText, UserCheck, Phone 
} from 'lucide-react';

const INDIAN_CITIES = [
  'Bangalore', 'Delhi-NCR', 'Mumbai', 'Pune', 'Hyderabad', 
  'Chennai', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Chandigarh'
];

const OwnerOnboardingModal = ({ isOpen, onClose, onSuccess, user, switchRole }) => {
  const [formData, setFormData] = useState({
    phone: user?.phone || '',
    entityType: 'INDIVIDUAL',
    businessName: '',
    operatingCity: 'Bangalore',
    panNumber: user?.ownerDetails?.panNumber || '',
    gstin: user?.ownerDetails?.gstin || '',
    accountHolderName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
    bankName: user?.ownerDetails?.bankDetails?.bankName || '',
    accountNumber: user?.ownerDetails?.bankDetails?.accountNumber || '',
    confirmAccountNumber: user?.ownerDetails?.bankDetails?.accountNumber || '',
    ifscCode: user?.ownerDetails?.bankDetails?.ifscCode || '',
    ownershipDeclaration: false,
    legalAgreementAccepted: false
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Lock background scroll when modal is active
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

  // Real-time format validators
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  const isPanValid = panRegex.test(formData.panNumber.toUpperCase().trim());

  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  const isIfscValid = ifscRegex.test(formData.ifscCode.toUpperCase().trim());

  const isPhoneValid = (formData.phone || '').trim().length >= 10;
  const isAccountValid = formData.accountNumber.trim().length >= 8 && 
    formData.accountNumber === formData.confirmAccountNumber;

  const canSubmit = isPanValid && isIfscValid && isPhoneValid && isAccountValid && 
    formData.accountHolderName.trim() && formData.ownershipDeclaration && 
    formData.legalAgreementAccepted;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isPhoneValid) {
      setError('Please provide a valid 10-digit primary phone contact number.');
      return;
    }

    if (!isPanValid) {
      setError('Invalid PAN Number. Please enter a valid 10-character PAN (e.g. ABCDE1234F).');
      return;
    }

    if (!isAccountValid) {
      setError('Bank Account numbers must match and be at least 8 digits.');
      return;
    }

    if (!isIfscValid) {
      setError('Invalid IFSC Code format (e.g. HDFC0001234).');
      return;
    }

    if (!formData.ownershipDeclaration || !formData.legalAgreementAccepted) {
      setError('You must accept the legal declarations and Landlord Terms of Service.');
      return;
    }

    setLoading(true);
    try {
      const ownerPayload = {
        phone: formData.phone.trim(),
        entityType: formData.entityType,
        businessName: formData.businessName.trim(),
        operatingCity: formData.operatingCity,
        panNumber: formData.panNumber.toUpperCase().trim(),
        gstin: formData.gstin.toUpperCase().trim(),
        bankDetails: {
          accountHolderName: formData.accountHolderName.trim(),
          bankName: formData.bankName.trim(),
          accountNumber: formData.accountNumber.trim(),
          ifscCode: formData.ifscCode.toUpperCase().trim()
        },
        ownershipDeclaration: true,
        legalAgreementAccepted: true
      };

      const res = await switchRole('OWNER', ownerPayload);
      if (res.success) {
        onSuccess(res.user);
        onClose();
      } else {
        setError(res.error || 'Failed to complete owner verification.');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred during onboarding.');
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#16161a] border border-[#262838] rounded-3xl p-6 sm:p-8 shadow-2xl my-auto max-h-[92vh] overflow-y-auto">
        
        {/* Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 rounded-t-3xl"></div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute right-5 top-5 p-2 rounded-full text-gray-400 hover:text-white hover:bg-[#222432] transition cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-1">
            <Building2 size={24} />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider mb-1">
              <ShieldCheck size={12} /> Host Verification &amp; Legal Onboarding
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Activate Landlord Persona
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              To list properties, manage leases, and collect escrow rental payouts, please complete your landlord verification and business registration.
            </p>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-6 p-3.5 bg-red-950/40 text-red-300 rounded-xl text-xs sm:text-sm border border-red-800/40 font-medium flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle size={16} className="text-primary shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section 1: Entity & Contact */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase text-gray-400 tracking-wider">
              <UserCheck size={14} className="text-emerald-400" />
              <span>1. Host &amp; Entity Profile</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">
                  Entity Category
                </label>
                <select
                  value={formData.entityType}
                  onChange={(e) => setFormData({ ...formData, entityType: e.target.value })}
                  className="w-full rounded-xl bg-[#20222e] border border-[#2e3245] py-2.5 px-3 text-white text-xs font-medium focus:ring-1 focus:ring-emerald-500 outline-none"
                >
                  <option value="INDIVIDUAL">Individual Property Host</option>
                  <option value="REGISTERED_BUSINESS">Commercial Real Estate Firm</option>
                  <option value="AUTHORIZED_MANAGER">Authorized Property Manager</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">
                  Primary Operating City
                </label>
                <select
                  value={formData.operatingCity}
                  onChange={(e) => setFormData({ ...formData, operatingCity: e.target.value })}
                  className="w-full rounded-xl bg-[#20222e] border border-[#2e3245] py-2.5 px-3 text-white text-xs font-medium focus:ring-1 focus:ring-emerald-500 outline-none"
                >
                  {INDIAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">
                  Brand / Business Name {formData.entityType === 'INDIVIDUAL' && '(Optional)'}
                </label>
                <input
                  type="text"
                  placeholder={formData.entityType === 'INDIVIDUAL' ? "e.g. Skyline Residency (or leave blank)" : "Registered Enterprise Name"}
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full rounded-xl bg-[#20222e] border border-[#2e3245] py-2.5 px-3 text-white text-xs font-medium placeholder-gray-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] font-bold uppercase text-gray-400 ml-1 flex items-center justify-between">
                  <span>Primary Host Phone Number</span>
                  {isPhoneValid && <span className="text-emerald-400 text-[10px] font-semibold flex items-center gap-1"><CheckCircle2 size={11} /> Valid Contact</span>}
                </label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3.5 top-3 text-gray-400" />
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-xl bg-[#20222e] border border-[#2e3245] py-2.5 pl-9 pr-3 text-white text-xs font-medium placeholder-gray-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Legal & Tax Identifiers */}
          <div className="space-y-4 pt-2 border-t border-[#232535]">
            <div className="flex items-center gap-2 text-xs font-black uppercase text-gray-400 tracking-wider">
              <FileText size={14} className="text-emerald-400" />
              <span>2. Legal &amp; Tax Compliance</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-400 ml-1 flex items-center justify-between">
                  <span>Permanent Account Number (PAN) *</span>
                  {isPanValid && <span className="text-emerald-400 text-[10px] font-semibold flex items-center gap-1"><CheckCircle2 size={11} /> Valid PAN</span>}
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  placeholder="ABCDE1234F"
                  value={formData.panNumber}
                  onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                  className="w-full rounded-xl bg-[#20222e] border border-[#2e3245] py-2.5 px-3 text-white text-xs font-mono font-bold tracking-wider placeholder-gray-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">
                  GSTIN (Optional)
                </label>
                <input
                  type="text"
                  maxLength={15}
                  placeholder="29AAAAA0000A1Z5"
                  value={formData.gstin}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                  className="w-full rounded-xl bg-[#20222e] border border-[#2e3245] py-2.5 px-3 text-white text-xs font-mono placeholder-gray-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Escrow Payout Banking */}
          <div className="space-y-4 pt-2 border-t border-[#232535]">
            <div className="flex items-center gap-2 text-xs font-black uppercase text-gray-400 tracking-wider">
              <Landmark size={14} className="text-emerald-400" />
              <span>3. Escrow Rental Payout Account</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">
                  Beneficiary Account Holder Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Official Name matching Bank Account"
                  value={formData.accountHolderName}
                  onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                  className="w-full rounded-xl bg-[#20222e] border border-[#2e3245] py-2.5 px-3 text-white text-xs font-medium placeholder-gray-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC Bank, SBI, ICICI"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="w-full rounded-xl bg-[#20222e] border border-[#2e3245] py-2.5 px-3 text-white text-xs font-medium placeholder-gray-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-400 ml-1 flex items-center justify-between">
                  <span>IFSC Code</span>
                  {isIfscValid && <span className="text-emerald-400 text-[10px] font-semibold flex items-center gap-1"><CheckCircle2 size={11} /> Valid IFSC</span>}
                </label>
                <input
                  type="text"
                  required
                  maxLength={11}
                  placeholder="HDFC0001234"
                  value={formData.ifscCode}
                  onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                  className="w-full rounded-xl bg-[#20222e] border border-[#2e3245] py-2.5 px-3 text-white text-xs font-mono font-bold placeholder-gray-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">
                  Bank Account Number
                </label>
                <input
                  type="password"
                  required
                  placeholder="Account Number"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value.replace(/\D/g, '') })}
                  className="w-full rounded-xl bg-[#20222e] border border-[#2e3245] py-2.5 px-3 text-white text-xs font-mono placeholder-gray-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-400 ml-1 flex items-center justify-between">
                  <span>Confirm Account Number</span>
                  {isAccountValid && <span className="text-emerald-400 text-[10px] font-semibold flex items-center gap-1"><CheckCircle2 size={11} /> Matched</span>}
                </label>
                <input
                  type="text"
                  required
                  placeholder="Re-enter Account Number"
                  value={formData.confirmAccountNumber}
                  onChange={(e) => setFormData({ ...formData, confirmAccountNumber: e.target.value.replace(/\D/g, '') })}
                  className="w-full rounded-xl bg-[#20222e] border border-[#2e3245] py-2.5 px-3 text-white text-xs font-mono placeholder-gray-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Legal Declarations */}
          <div className="space-y-3 pt-2 border-t border-[#232535]">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-gray-300 select-none">
              <input
                type="checkbox"
                required
                checked={formData.ownershipDeclaration}
                onChange={(e) => setFormData({ ...formData, ownershipDeclaration: e.target.checked })}
                className="w-4 h-4 mt-0.5 rounded border-[#333333] bg-[#222222] text-emerald-500 focus:ring-emerald-500 accent-emerald-500 cursor-pointer shrink-0"
              />
              <span className="leading-relaxed">
                I declare that I am the legal titleholder or authorized property management agent with power of attorney for all listings I create on Nestify.
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-gray-300 select-none">
              <input
                type="checkbox"
                required
                checked={formData.legalAgreementAccepted}
                onChange={(e) => setFormData({ ...formData, legalAgreementAccepted: e.target.checked })}
                className="w-4 h-4 mt-0.5 rounded border-[#333333] bg-[#222222] text-emerald-500 focus:ring-emerald-500 accent-emerald-500 cursor-pointer shrink-0"
              />
              <span className="leading-relaxed">
                I agree to the Nestify Landlord Terms, Escrow Settlement Policies (6% fee or Annual Plan), and Tenant Safety Guarantee.
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#232535]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white bg-[#1e202b] hover:bg-[#282a39] transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || !canSubmit}
              className="px-6 py-2.5 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
              <span>Verify &amp; Activate Landlord Portal</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};

export default OwnerOnboardingModal;
