import React, { useState } from 'react';
import { Smartphone, CheckCircle, XCircle, ShieldCheck, Lock } from 'lucide-react';
import { Bundle, NetworkCode } from '../types';

interface UssdPhoneModalProps {
  isOpen: boolean;
  phone: string;
  network: NetworkCode;
  bundle: Bundle;
  transactionUuid: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const UssdPhoneModal: React.FC<UssdPhoneModalProps> = ({
  isOpen,
  phone,
  network,
  bundle,
  transactionUuid,
  onSuccess,
  onCancel,
}) => {
  const [pin, setPin] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [ussdError, setUssdError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      setPin((prev) => prev + num);
      setUssdError(null);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleSubmitPin = () => {
    if (pin.length !== 4) {
      setUssdError('Please enter a 4-digit mobile money PIN.');
      return;
    }

    setIsProcessing(true);
    setUssdError(null);

    // Simulate carrier network authorization delay (1.5 seconds)
    setTimeout(() => {
      setIsProcessing(false);
      onSuccess();
    }, 1500);
  };

  const networkColors: Record<NetworkCode, { name: string; bg: string; text: string }> = {
    YAS: { name: 'YAS / Tigo Pesa', bg: 'bg-amber-400', text: 'text-amber-950' },
    AIRTEL: { name: 'Airtel Money', bg: 'bg-red-600', text: 'text-white' },
    VODACOM: { name: 'M-Pesa (Vodacom)', bg: 'bg-red-600', text: 'text-white' },
    HALOTEL: { name: 'HaloPesa (Halotel)', bg: 'bg-orange-500', text: 'text-white' },
  };

  const currNet = networkColors[network] || networkColors.YAS;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="relative w-full max-w-sm bg-slate-900 rounded-[38px] p-4 shadow-2xl border-4 border-slate-700 text-white">
        
        {/* Smartphone Speaker & Camera Notch */}
        <div className="flex justify-center items-center gap-2 mb-3">
          <div className="w-12 h-1.5 bg-slate-700 rounded-full" />
          <div className="w-3 h-3 bg-slate-800 rounded-full border border-slate-600" />
        </div>

        {/* Screen Bezel Area */}
        <div className="bg-slate-950 rounded-[28px] p-4 border border-slate-800 min-h-[520px] flex flex-col justify-between">
          
          {/* Status Bar */}
          <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800/80">
            <span className="font-semibold">{currNet.name}</span>
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <span>4G+</span>
              <span>100%</span>
            </div>
          </div>

          {/* USSD Dialog Popup (Native Mobile Money Prompt) */}
          <div className="my-auto bg-slate-900 rounded-2xl p-5 border border-slate-700/80 shadow-lg text-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${currNet.bg} ${currNet.text}`}>
                {network} USSD PUSH
              </span>
              <span className="text-[11px] text-slate-400 font-mono ml-auto">
                Ref: {transactionUuid.slice(0, 10)}
              </span>
            </div>

            <h3 className="font-bold text-base text-sky-400 mb-1">
              CLASSIC NET
            </h3>
            
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Authorize payment of <strong className="text-white">TSH {bundle.price_tsh.toLocaleString()}</strong> for{' '}
              <strong className="text-emerald-400">{bundle.name} Unlimited Internet</strong> to Merchant <strong className="text-white">CLASSIC NET</strong>.
            </p>

            {/* PIN Entry Box */}
            <div className="mb-4">
              <label className="block text-[11px] font-bold text-slate-300 mb-1.5 flex items-center gap-1">
                <Lock className="w-3 h-3 text-sky-400" /> Enter 4-digit PIN:
              </label>
              <div className="w-full bg-slate-950 border-2 border-slate-700 rounded-xl py-3 px-4 text-center tracking-[12px] text-2xl font-mono text-sky-400 min-h-[54px] flex items-center justify-center">
                {pin ? '•'.repeat(pin.length) : <span className="text-slate-600 text-sm tracking-normal">Enter PIN</span>}
              </div>
              {ussdError && (
                <p className="text-[11px] text-rose-400 mt-1.5 font-medium flex items-center gap-1">
                  <XCircle className="w-3 h-3 shrink-0" /> {ussdError}
                </p>
              )}
            </div>

            {/* USSD Action Buttons */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={isProcessing}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitPin}
                disabled={isProcessing || pin.length < 4}
                className="py-2.5 px-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition"
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Send / OK</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k, i) => {
              if (k === '') return <div key={i} />;
              if (k === '⌫') {
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={handleBackspace}
                    className="h-11 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 active:bg-slate-600 text-sm font-bold text-slate-300 flex items-center justify-center transition"
                  >
                    Delete
                  </button>
                );
              }
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleKeyPress(k)}
                  className="h-11 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:bg-slate-600 text-base font-bold text-white flex items-center justify-center transition"
                >
                  {k}
                </button>
              );
            })}
          </div>

          <div className="text-center text-[10px] text-slate-400 mt-2 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Interactive Tanzanian MNO USSD Push Simulator</span>
          </div>

        </div>

      </div>
    </div>
  );
};
