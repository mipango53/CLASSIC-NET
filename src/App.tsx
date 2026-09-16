import React, { useState, useEffect } from 'react';
import {
  Wifi, Shield, Smartphone, LayoutDashboard, Terminal,
  RefreshCw, CheckCircle, Phone, Lock, ArrowRight
} from 'lucide-react';
import { Bundle, Customer, Transaction, Voucher, MikroTikSession, RouterStatus } from './types';
import {
  INITIAL_BUNDLES, INITIAL_CUSTOMERS, INITIAL_TRANSACTIONS,
  INITIAL_VOUCHERS, INITIAL_MIKROTIK_SESSIONS, INITIAL_ROUTER_STATUS
} from './data/initialData';
import { CustomerPortal } from './components/CustomerPortal';
import { AdminDashboard } from './components/AdminDashboard';
import { ArchitectureViewer } from './components/ArchitectureViewer';

export default function App() {
  // Navigation Mode
  const [activeMode, setActiveMode] = useState<'portal' | 'admin' | 'architecture'>('portal');

  // Admin Auth State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('ClassicNetAdmin2026!');
  const [authError, setAuthError] = useState<string | null>(null);

  // Persistent System State
  const [bundles, setBundles] = useState<Bundle[]>(() => {
    const saved = localStorage.getItem('classicnet_bundles');
    return saved ? JSON.parse(saved) : INITIAL_BUNDLES;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('classicnet_customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('classicnet_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [vouchers, setVouchers] = useState<Voucher[]>(() => {
    const saved = localStorage.getItem('classicnet_vouchers');
    return saved ? JSON.parse(saved) : INITIAL_VOUCHERS;
  });

  const [routerSessions, setRouterSessions] = useState<MikroTikSession[]>(() => {
    const saved = localStorage.getItem('classicnet_sessions');
    return saved ? JSON.parse(saved) : INITIAL_MIKROTIK_SESSIONS;
  });

  const [routerStatus, setRouterStatus] = useState<RouterStatus>(INITIAL_ROUTER_STATUS);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('classicnet_bundles', JSON.stringify(bundles));
  }, [bundles]);

  useEffect(() => {
    localStorage.setItem('classicnet_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('classicnet_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('classicnet_vouchers', JSON.stringify(vouchers));
  }, [vouchers]);

  useEffect(() => {
    localStorage.setItem('classicnet_sessions', JSON.stringify(routerSessions));
  }, [routerSessions]);

  // Handle Successful Mobile Money Payment from Captive Portal
  const handlePaymentSuccess = (txn: Transaction) => {
    // 1. Record transaction
    setTransactions((prev) => [txn, ...prev]);

    // 2. Add Customer record
    const targetBundle = bundles.find((b) => b.name === txn.bundle) || bundles[0];
    const newCustomer: Customer = {
      id: Date.now(),
      phone: txn.phone,
      network: txn.network,
      bundle: txn.bundle,
      amount: txn.amount,
      status: 'ACTIVE',
      activation_time: txn.activated_at || new Date().toISOString().replace('T', ' ').substring(0, 19),
      expiry_time: txn.expires_at || '',
      mac: `48:2C:6A:${Math.floor(10 + Math.random() * 89)}:${Math.floor(10 + Math.random() * 89)}:E3`,
      ip: `192.168.88.${Math.floor(60 + Math.random() * 150)}`,
      txn_id: txn.txn_id,
    };
    setCustomers((prev) => [newCustomer, ...prev]);

    // 3. Add to live MikroTik active session
    const newSession: MikroTikSession = {
      user: txn.phone,
      address: newCustomer.ip,
      mac_address: newCustomer.mac,
      uptime: '1m',
      bytes_in: 254100,
      bytes_out: 981200,
      comment: `CLASSIC NET | Exp: ${newCustomer.expiry_time}`,
    };
    setRouterSessions((prev) => [newSession, ...prev]);

    // 4. Update router active user count
    setRouterStatus((prev) => ({
      ...prev,
      active_hotspot_users: prev.active_hotspot_users + 1,
    }));
  };

  // Handle Voucher Redemption from Captive Portal
  const handleVoucherRedeem = (code: string, customerPhone: string) => {
    const targetVoucher = vouchers.find(
      (v) => v.code.toUpperCase() === code.toUpperCase() && v.status === 'UNUSED'
    );

    if (!targetVoucher) {
      return { success: false, message: 'Invalid or already used voucher code.' };
    }

    const targetBundle = bundles.find((b) => b.id === targetVoucher.bundle_id) || bundles[0];
    const now = new Date();
    const expiry = new Date(now.getTime() + (targetBundle.duration_hours || 24) * 60 * 60 * 1000);

    // Update voucher status
    setVouchers((prev) =>
      prev.map((v) =>
        v.id === targetVoucher.id
          ? {
              ...v,
              status: 'USED',
              used_by_phone: customerPhone,
              used_at: now.toISOString().replace('T', ' ').substring(0, 19),
              expires_at: expiry.toISOString().replace('T', ' ').substring(0, 19),
            }
          : v
      )
    );

    // Add Customer
    const newCustomer: Customer = {
      id: Date.now(),
      phone: customerPhone,
      network: 'YAS',
      bundle: targetBundle.name,
      amount: targetVoucher.price_tsh,
      status: 'ACTIVE',
      activation_time: now.toISOString().replace('T', ' ').substring(0, 19),
      expiry_time: expiry.toISOString().replace('T', ' ').substring(0, 19),
      mac: `5A:88:C1:${Math.floor(10 + Math.random() * 89)}:${Math.floor(10 + Math.random() * 89)}:22`,
      ip: `192.168.88.${Math.floor(60 + Math.random() * 150)}`,
      txn_id: `VCH-${code}`,
    };
    setCustomers((prev) => [newCustomer, ...prev]);

    // Add Session
    const newSession: MikroTikSession = {
      user: customerPhone,
      address: newCustomer.ip,
      mac_address: newCustomer.mac,
      uptime: '1m',
      bytes_in: 104200,
      bytes_out: 412900,
      comment: `CLASSIC NET | Voucher: ${code}`,
    };
    setRouterSessions((prev) => [newSession, ...prev]);

    return {
      success: true,
      message: 'Voucher redeemed successfully!',
      bundle: targetBundle,
    };
  };

  // Disconnect MikroTik Session
  const handleDisconnectSession = (user: string) => {
    setRouterSessions((prev) => prev.filter((s) => s.user !== user));
    setRouterStatus((prev) => ({
      ...prev,
      active_hotspot_users: Math.max(0, prev.active_hotspot_users - 1),
    }));
  };

  // Handle Admin Login
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminUsername === 'admin' && adminPassword === 'ClassicNetAdmin2026!') {
      setIsAdminLoggedIn(true);
      setAuthError(null);
    } else {
      setAuthError('Invalid credentials. Use admin / ClassicNetAdmin2026!');
    }
  };

  // Reset demo data to defaults
  const handleResetData = () => {
    if (window.confirm('Reset all demo data (bundles, customers, vouchers, sessions) to initial defaults?')) {
      setBundles(INITIAL_BUNDLES);
      setCustomers(INITIAL_CUSTOMERS);
      setTransactions(INITIAL_TRANSACTIONS);
      setVouchers(INITIAL_VOUCHERS);
      setRouterSessions(INITIAL_MIKROTIK_SESSIONS);
      setRouterStatus(INITIAL_ROUTER_STATUS);
      localStorage.clear();
      alert('Data reset to defaults!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-800 flex flex-col">
      
      {/* Top System Switcher Banner */}
      <nav className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* Brand Identity */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center font-black text-xs shadow-md shadow-sky-600/30">
              CN
            </div>
            <div>
              <div className="font-black text-sm tracking-tight flex items-center gap-1.5">
                <span>CLASSIC NET</span>
                <span className="text-[10px] uppercase font-bold text-sky-400 bg-sky-950 px-1.5 py-0.5 rounded border border-sky-800/60">
                  Hotspot Billing
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium">
                Tanzania ISP System • 0618781830
              </div>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveMode('portal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeMode === 'portal'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Captive Portal</span>
            </button>

            <button
              onClick={() => setActiveMode('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeMode === 'admin'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Admin Panel</span>
            </button>

            <button
              onClick={() => setActiveMode('architecture')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeMode === 'architecture'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Architecture &amp; Docs</span>
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetData}
              title="Reset Demo Data"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition text-xs flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reset Data</span>
            </button>
          </div>

        </div>
      </nav>

      {/* Main Content Body */}
      <div className="flex-1 flex flex-col">
        
        {/* MODE 1: CUSTOMER CAPTIVE PORTAL */}
        {activeMode === 'portal' && (
          <div className="flex-1 bg-slate-100 flex flex-col items-center justify-center p-4 py-8">
            <CustomerPortal
              bundles={bundles}
              onPaymentSuccess={handlePaymentSuccess}
              onVoucherRedeem={handleVoucherRedeem}
            />
          </div>
        )}

        {/* MODE 2: ADMIN DASHBOARD */}
        {activeMode === 'admin' && (
          <div className="flex-1 bg-slate-100">
            {!isAdminLoggedIn ? (
              <div className="min-h-[80vh] flex items-center justify-center p-4">
                <div className="bg-white max-w-sm w-full p-8 rounded-3xl shadow-xl border border-slate-200">
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center mx-auto mb-3 font-black text-lg shadow-md shadow-sky-600/20">
                      CN
                    </div>
                    <h2 className="text-lg font-black text-slate-900">CLASSIC NET Admin</h2>
                    <p className="text-xs text-slate-500 mt-1">Sign in to manage ISP billing &amp; router</p>
                  </div>

                  {authError && (
                    <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                      {authError}
                    </div>
                  )}

                  <form onSubmit={handleAdminLogin} className="space-y-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1">
                        Username:
                      </label>
                      <input
                        type="text"
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-semibold outline-none focus:border-sky-600"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1">
                        Password:
                      </label>
                      <input
                        type="password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-semibold outline-none focus:border-sky-600"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs shadow-md shadow-sky-600/25 transition"
                    >
                      SIGN IN TO DASHBOARD
                    </button>
                  </form>

                  <div className="mt-5 pt-4 border-t border-slate-100 text-center text-[11px] text-slate-400">
                    Default: <code>admin</code> / <code>ClassicNetAdmin2026!</code>
                  </div>
                </div>
              </div>
            ) : (
              <AdminDashboard
                bundles={bundles}
                customers={customers}
                transactions={transactions}
                vouchers={vouchers}
                routerSessions={routerSessions}
                routerStatus={routerStatus}
                onUpdateBundles={setBundles}
                onAddVouchers={(newItems) => setVouchers((prev) => [...newItems, ...prev])}
                onDisconnectSession={handleDisconnectSession}
                onLogout={() => setIsAdminLoggedIn(false)}
              />
            )}
          </div>
        )}

        {/* MODE 3: ARCHITECTURE & MIKROTIK GUIDE */}
        {activeMode === 'architecture' && (
          <div className="flex-1 bg-slate-100 p-6">
            <ArchitectureViewer />
          </div>
        )}

      </div>

      {/* Global Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 px-6 py-3 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>CLASSIC NET</strong> • Fast • Simple • Reliable Internet • Support: <a href="tel:0618781830" className="text-sky-400 hover:underline">0618781830</a>
          </div>
          <div className="text-[11px]">
            Owner: Jackson Ribent (<a href="mailto:jacksonribent53@gmail.com" className="text-slate-400 hover:underline">jacksonribent53@gmail.com</a>)
          </div>
        </div>
      </footer>

    </div>
  );
}
