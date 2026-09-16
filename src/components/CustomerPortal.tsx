import React, { useState } from 'react';
import { Wifi, Phone, Mail, CheckCircle, AlertCircle, ArrowRight, Shield, Clock, Ticket, RefreshCw, Smartphone } from 'lucide-react';
import { Bundle, NetworkCode, Transaction } from '../types';
import { UssdPhoneModal } from './UssdPhoneModal';

interface CustomerPortalProps {
  bundles: Bundle[];
  onPaymentSuccess: (txn: Transaction) => void;
  onVoucherRedeem: (code: string, phone: string) => { success: boolean; message: string; bundle?: Bundle };
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  bundles,
  onPaymentSuccess,
  onVoucherRedeem,
}) => {
  const [selectedBundleId, setSelectedBundleId] = useState<number>(bundles[0]?.id || 1);
  const [phone, setPhone] = useState<string>('');
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkCode>('YAS');
  
  // States: 'SELECTION' | 'WAITING_USSD' | 'SUCCESS' | 'FAILED' | 'VOUCHER'
  const [viewState, setViewState] = useState<'SELECTION' | 'WAITING_USSD' | 'SUCCESS' | 'FAILED' | 'VOUCHER'>('SELECTION');
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [activeTxn, setActiveTxn] = useState<Transaction | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Voucher states
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherPhone, setVoucherPhone] = useState('');
  const [voucherError, setVoucherError] = useState<string | null>(null);

  const selectedBundle = bundles.find((b) => b.id === selectedBundleId) || bundles[0];

  // Auto-detect network prefix
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setPhone(raw);
    setPhoneError(null);

    if (raw.length >= 3) {
      const prefix = raw.substring(0, 3);
      if (['071', '065', '067', '077'].includes(prefix)) setSelectedNetwork('YAS');
      else if (['068', '069', '078'].includes(prefix)) setSelectedNetwork('AIRTEL');
      else if (['074', '075', '076'].includes(prefix)) setSelectedNetwork('VODACOM');
      else if (['061', '062'].includes(prefix)) setSelectedNetwork('HALOTEL');
    }
  };

  const handlePayNow = () => {
    if (!phone || phone.length < 10) {
      setPhoneError('Please enter a valid 10-digit Tanzanian number (e.g. 0718923451 or 0618781830)');
      return;
    }

    const newTxnUuid = `CN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const now = new Date();
    const expiry = new Date(now.getTime() + (selectedBundle.duration_hours || 24) * 60 * 60 * 1000);

    const pendingTxn: Transaction = {
      id: Date.now(),
      txn_id: newTxnUuid,
      phone: phone,
      network: selectedNetwork,
      bundle: selectedBundle.name,
      amount: selectedBundle.price_tsh,
      currency: 'TSH',
      provider: `AzamPay (${selectedNetwork})`,
      payment_status: 'PENDING',
      azampay_ref: `AZM-${Math.floor(100000 + Math.random() * 900000)}`,
      created_at: now.toISOString().replace('T', ' ').substring(0, 19),
      activation_status: 'PENDING',
      activated_at: now.toISOString().replace('T', ' ').substring(0, 19),
      expires_at: expiry.toISOString().replace('T', ' ').substring(0, 19),
    };

    setActiveTxn(pendingTxn);
    setViewState('WAITING_USSD');
    // Open the simulated phone USSD prompt
    setIsPhoneModalOpen(true);
  };

  const handleSimulatedSuccess = () => {
    if (!activeTxn) return;
    const completedTxn: Transaction = {
      ...activeTxn,
      payment_status: 'SUCCESS',
      activation_status: 'ACTIVATED',
    };
    setActiveTxn(completedTxn);
    setIsPhoneModalOpen(false);
    setViewState('SUCCESS');
    onPaymentSuccess(completedTxn);
  };

  const handleSimulatedCancel = () => {
    setIsPhoneModalOpen(false);
    setViewState('FAILED');
  };

  const handleRedeemVoucherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherCode.trim() || !voucherPhone.trim()) {
      setVoucherError('Please enter both the voucher code and your phone number.');
      return;
    }

    const res = onVoucherRedeem(voucherCode.trim().toUpperCase(), voucherPhone.trim());
    if (res.success && res.bundle) {
      const now = new Date();
      const expiry = new Date(now.getTime() + (res.bundle.duration_hours || 24) * 60 * 60 * 1000);
      const voucherTxn: Transaction = {
        id: Date.now(),
        txn_id: `VCH-${voucherCode.toUpperCase()}`,
        phone: voucherPhone,
        network: 'YAS',
        bundle: res.bundle.name,
        amount: res.bundle.price_tsh,
        currency: 'TSH',
        provider: 'Prepaid Voucher',
        payment_status: 'SUCCESS',
        azampay_ref: voucherCode.toUpperCase(),
        created_at: now.toISOString().replace('T', ' ').substring(0, 19),
        activation_status: 'ACTIVATED',
        activated_at: now.toISOString().replace('T', ' ').substring(0, 19),
        expires_at: expiry.toISOString().replace('T', ' ').substring(0, 19),
      };
      setActiveTxn(voucherTxn);
      setViewState('SUCCESS');
    } else {
      setVoucherError(res.message || 'Invalid or expired voucher code.');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      
      {/* Portal Container Card */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
        
        {/* Brand Header */}
        <div className="bg-gradient-to-b from-sky-50 to-white px-6 pt-6 pb-4 text-center border-b border-slate-100">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-black text-base shadow-md shadow-sky-600/20">
              CN
            </div>
            <div className="text-left">
              <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">
                CLASSIC <span className="text-sky-600">NET</span>
              </h1>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Hotspot &amp; Broadband
              </span>
            </div>
          </div>
          <div className="inline-block mt-2 bg-sky-100/70 text-sky-800 text-xs font-semibold px-3 py-0.5 rounded-full">
            Fast • Simple • Reliable Internet
          </div>
        </div>

        {/* 1. SELECTION STATE (Standard Captive Portal) */}
        {viewState === 'SELECTION' && (
          <div className="p-6">
            
            <div className="text-center mb-5">
              <h2 className="text-base font-extrabold text-slate-900">
                Welcome to CLASSIC NET
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Choose an internet package to connect instantly
              </p>
            </div>

            {/* Step 1: Bundles List */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                1. Choose your internet package:
              </label>
              <div className="space-y-2.5">
                {bundles.filter(b => b.is_active).map((b) => {
                  const isSelected = b.id === selectedBundleId;
                  return (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBundleId(b.id)}
                      className={`relative flex items-center justify-between p-3.5 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'border-sky-600 bg-sky-50/70 shadow-sm ring-1 ring-sky-600'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900">
                            {b.name}
                          </span>
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {b.badge_text || 'Unlimited'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{b.duration_label || `${b.duration_hours} Hours`} Validity</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-black text-sky-700">
                          TSH {b.price_tsh.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          Tanzanian Shillings
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Mobile Number Input */}
            <div className="mb-5">
              <label htmlFor="customerPhone" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                2. Enter Mobile Number (Tanzania):
              </label>
              <div className="relative">
                <input
                  id="customerPhone"
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="07XXXXXXXX or 06XXXXXXXX"
                  maxLength={10}
                  className="w-full text-lg font-bold tracking-wider px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-sky-600 focus:ring-2 focus:ring-sky-600/20 outline-none text-slate-900 transition"
                />
                {phone.length === 10 && (
                  <CheckCircle className="w-5 h-5 text-emerald-500 absolute right-3 top-3.5" />
                )}
              </div>
              {phoneError && (
                <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {phoneError}
                </p>
              )}
            </div>

            {/* Step 3: Network Selector */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                3. Choose Network:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { code: 'YAS' as NetworkCode, label: 'YAS', bg: '#FFCC00', text: '#002D72' },
                  { code: 'AIRTEL' as NetworkCode, label: 'airtel', bg: '#E60000', text: '#FFFFFF' },
                  { code: 'VODACOM' as NetworkCode, label: 'vodacom', bg: '#E60000', text: '#FFFFFF' },
                  { code: 'HALOTEL' as NetworkCode, label: 'halotel', bg: '#FF5500', text: '#FFFFFF' },
                ].map((net) => {
                  const isSelected = selectedNetwork === net.code;
                  return (
                    <button
                      key={net.code}
                      type="button"
                      onClick={() => setSelectedNetwork(net.code)}
                      className={`h-12 rounded-xl border-2 flex flex-col items-center justify-center p-1 transition-all duration-200 ${
                        isSelected
                          ? 'border-sky-600 ring-2 ring-sky-600/30 bg-sky-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div
                        style={{ backgroundColor: net.bg, color: net.text }}
                        className="w-full h-7 rounded-lg flex items-center justify-center font-black text-xs tracking-wider uppercase px-1"
                      >
                        {net.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pay Button */}
            <button
              type="button"
              onClick={handlePayNow}
              className="w-full py-4 px-6 rounded-2xl bg-sky-600 hover:bg-sky-700 active:scale-[0.99] text-white font-extrabold text-base tracking-wide shadow-lg shadow-sky-600/25 flex items-center justify-center gap-2 transition"
            >
              <span>PAY NOW</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Voucher Alternative */}
            <button
              type="button"
              onClick={() => setViewState('VOUCHER')}
              className="w-full mt-3 py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition"
            >
              <Ticket className="w-3.5 h-3.5 text-sky-600" />
              <span>HAVE A VOUCHER? USE VOUCHER</span>
            </button>

          </div>
        )}

        {/* 2. WAITING USSD STATE */}
        {viewState === 'WAITING_USSD' && activeTxn && (
          <div className="p-6 text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="w-16 h-16 rounded-full border-4 border-sky-100 border-t-sky-600 animate-spin" />
              <Smartphone className="w-7 h-7 text-sky-600 absolute inset-0 m-auto" />
            </div>

            <h3 className="text-lg font-black text-slate-900 mb-1">
              Payment Request Sent
            </h3>
            
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Payment request sent to your phone (<strong>{activeTxn.phone}</strong> via <strong>{activeTxn.network}</strong>).<br />
              <strong className="text-sky-700">Please check your phone and enter your PIN to complete payment.</strong>
            </p>

            {/* Receipt Summary */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-left text-xs mb-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="font-mono font-bold text-slate-900">{activeTxn.txn_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bundle Package:</span>
                <span className="font-bold text-slate-900">{activeTxn.bundle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Network:</span>
                <span className="font-bold text-slate-900">{activeTxn.network}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-extrabold">
                <span>Amount:</span>
                <span className="text-sky-700">TSH {activeTxn.amount.toLocaleString()}</span>
              </div>
            </div>

            {/* Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 text-left mb-4 flex items-start gap-2">
              <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Do not enter your PIN into any website. Enter your mobile money PIN only in the secure USSD popup sent by your network operator to your phone screen.
              </span>
            </div>

            {/* Reopen Simulator Button */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setIsPhoneModalOpen(true)}
                className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Smartphone className="w-4 h-4" />
                <span>Open Phone USSD Prompt Screen</span>
              </button>
              
              <button
                type="button"
                onClick={() => setViewState('SELECTION')}
                className="w-full py-2 px-4 rounded-xl text-slate-500 hover:bg-slate-100 font-semibold text-xs transition"
              >
                Cancel &amp; Change Bundle
              </button>
            </div>

          </div>
        )}

        {/* 3. SUCCESS STATE (Connected to Internet) */}
        {viewState === 'SUCCESS' && activeTxn && (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>

            <h2 className="text-lg font-black text-slate-900">
              Welcome to CLASSIC NET!
            </h2>
            <p className="text-xs font-bold text-emerald-600 mb-4">
              Your internet access has been activated.
            </p>

            {/* Access Receipt Details */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-left text-xs mb-5 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="font-mono font-bold text-slate-900">{activeTxn.txn_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bundle:</span>
                <span className="font-bold text-slate-900">{activeTxn.bundle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Paid:</span>
                <span className="font-bold text-emerald-700">TSH {activeTxn.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Activation Time:</span>
                <span className="text-slate-700">{activeTxn.activated_at || 'Just now'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Expiry Time:</span>
                <span className="font-bold text-rose-600">{activeTxn.expires_at || 'In 24 hours'}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="text-slate-500">Hotspot Status:</span>
                <span className="font-extrabold text-emerald-600 flex items-center gap-1">
                  <Wifi className="w-3.5 h-3.5" /> AUTHORIZED &amp; ONLINE
                </span>
              </div>
            </div>

            {/* Start Browsing Button */}
            <a
              href="https://www.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition"
            >
              <span>START BROWSING 🚀</span>
            </a>

            <button
              type="button"
              onClick={() => setViewState('SELECTION')}
              className="w-full mt-2.5 py-2 text-slate-500 hover:text-slate-700 text-xs font-semibold"
            >
              Back to Portal
            </button>
          </div>
        )}

        {/* 4. FAILED STATE */}
        {viewState === 'FAILED' && (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-10 h-10 text-rose-600" />
            </div>

            <h2 className="text-lg font-black text-slate-900">
              Payment Failed or Cancelled
            </h2>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              We could not complete your mobile money payment. The USSD request may have timed out or was cancelled on your phone.
            </p>

            <button
              type="button"
              onClick={() => setViewState('SELECTION')}
              className="w-full py-3.5 px-6 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-sm transition"
            >
              TRY AGAIN
            </button>

            <button
              type="button"
              onClick={() => setViewState('VOUCHER')}
              className="w-full mt-2 py-2.5 px-4 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition"
            >
              USE VOUCHER INSTEAD
            </button>
          </div>
        )}

        {/* 5. VOUCHER REDEMPTION STATE */}
        {viewState === 'VOUCHER' && (
          <form onSubmit={handleRedeemVoucherSubmit} className="p-6">
            <div className="text-center mb-5">
              <h2 className="text-base font-extrabold text-slate-900">
                Redeem Prepaid Voucher
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Enter code from your physical voucher or scratch card
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Voucher Code:
              </label>
              <input
                type="text"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                placeholder="e.g. CN7K29X4P"
                className="w-full text-center font-mono text-xl font-black tracking-[4px] px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-sky-600 outline-none text-sky-700"
              />
            </div>

            <div className="mb-5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Your Phone Number:
              </label>
              <input
                type="tel"
                value={voucherPhone}
                onChange={(e) => setVoucherPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="07XXXXXXXX or 06XXXXXXXX"
                maxLength={10}
                className="w-full text-base font-bold px-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-sky-600 outline-none text-slate-900"
              />
            </div>

            {voucherError && (
              <p className="text-xs text-rose-500 mb-4 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {voucherError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-sm transition"
            >
              ACTIVATE INTERNET
            </button>

            <button
              type="button"
              onClick={() => setViewState('SELECTION')}
              className="w-full mt-2.5 py-2 text-slate-500 hover:text-slate-700 text-xs font-semibold"
            >
              ← Back to Mobile Money Bundles
            </button>
          </form>
        )}

        {/* Customer Support Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 text-center text-xs text-slate-500 space-y-1">
          <div className="flex items-center justify-center gap-1 font-semibold text-slate-700">
            <Phone className="w-3.5 h-3.5 text-sky-600" />
            <span>Customer Care: </span>
            <a href="tel:0618781830" className="text-sky-600 hover:underline font-bold">
              0618781830
            </a>
          </div>
          <div className="flex items-center justify-center gap-1 text-[11px]">
            <Mail className="w-3 h-3 text-slate-400" />
            <a href="mailto:jacksonribent53@gmail.com" className="text-slate-600 hover:underline">
              jacksonribent53@gmail.com
            </a>
          </div>
          <div className="text-[10px] text-slate-400 pt-1">
            CLASSIC NET • Automatic Hotspot Billing System
          </div>
        </div>

      </div>

      {/* Interactive Mobile USSD Prompt Modal */}
      {activeTxn && (
        <UssdPhoneModal
          isOpen={isPhoneModalOpen}
          phone={activeTxn.phone}
          network={activeTxn.network}
          bundle={selectedBundle}
          transactionUuid={activeTxn.txn_id}
          onSuccess={handleSimulatedSuccess}
          onCancel={handleSimulatedCancel}
        />
      )}

    </div>
  );
};
