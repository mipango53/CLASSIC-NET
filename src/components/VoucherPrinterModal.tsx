import React from 'react';
import { Printer, X, Wifi, Shield, Phone } from 'lucide-react';
import { Voucher } from '../types';

interface VoucherPrinterModalProps {
  isOpen: boolean;
  vouchers: Voucher[];
  onClose: () => void;
}

export const VoucherPrinterModal: React.FC<VoucherPrinterModalProps> = ({
  isOpen,
  vouchers,
  onClose,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Printer className="w-5 h-5 text-sky-600" />
              <span>Printable Voucher Cards Sheet</span>
            </h2>
            <p className="text-xs text-slate-500">
              Showing {vouchers.length} prepaid voucher(s) ready for over-the-counter sales
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
            >
              <Printer className="w-4 h-4" /> Print Vouchers
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-xl text-slate-500 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Grid */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-100 print:bg-white print:p-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 print:grid-cols-2 print:gap-3">
            {vouchers.map((v) => (
              <div
                key={v.id}
                className="bg-white border-2 border-dashed border-sky-300 rounded-xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between"
              >
                {/* Brand Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-lg bg-sky-600 text-white flex items-center justify-center font-black text-xs">
                      CN
                    </div>
                    <span className="font-extrabold text-xs tracking-wider text-slate-900">
                      CLASSIC NET
                    </span>
                  </div>
                  <span className="text-[10px] font-bold bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full border border-sky-100">
                    {v.bundle_name}
                  </span>
                </div>

                {/* Voucher Code Box */}
                <div className="my-3 text-center bg-slate-50 py-3 px-2 rounded-lg border border-slate-200/80">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">
                    VOUCHER CODE
                  </div>
                  <div className="font-mono text-lg font-black text-sky-700 tracking-[3px]">
                    {v.code}
                  </div>
                  <div className="text-[11px] font-bold text-slate-700 mt-1">
                    Value: TSH {v.price_tsh.toLocaleString()} ({v.duration_label})
                  </div>
                </div>

                {/* Instructions & Support */}
                <div className="text-[10px] text-slate-500 space-y-1">
                  <div className="flex items-center gap-1">
                    <Wifi className="w-3 h-3 text-sky-500 shrink-0" />
                    <span>Connect to Wi-Fi: <strong>CLASSIC NET</strong></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span>Redeem on portal at: <strong>portal.classicnet.tz</strong></span>
                  </div>
                  <div className="flex items-center gap-1 pt-1 text-slate-600 border-t border-slate-100 font-medium">
                    <Phone className="w-2.5 h-2.5 text-slate-400" />
                    <span>Support: 0618781830</span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
