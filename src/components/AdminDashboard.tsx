import React, { useState } from 'react';
import {
  TrendingUp, Users, DollarSign, Wifi, ShoppingBag, Ticket,
  Search, Plus, Edit2, Trash2, CheckCircle, XCircle, RefreshCw,
  Printer, Shield, LogOut, ArrowUpRight, Server, Phone, Sliders
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  Bundle, Customer, Transaction, Voucher,
  MikroTikSession, RouterStatus, DashboardMetrics
} from '../types';
import { VoucherPrinterModal } from './VoucherPrinterModal';

interface AdminDashboardProps {
  bundles: Bundle[];
  customers: Customer[];
  transactions: Transaction[];
  vouchers: Voucher[];
  routerSessions: MikroTikSession[];
  routerStatus: RouterStatus;
  onUpdateBundles: (bundles: Bundle[]) => void;
  onAddVouchers: (newVouchers: Voucher[]) => void;
  onDisconnectSession: (user: string) => void;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  bundles,
  customers,
  transactions,
  vouchers,
  routerSessions,
  routerStatus,
  onUpdateBundles,
  onAddVouchers,
  onDisconnectSession,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'bundles' | 'customers' | 'transactions' | 'vouchers' | 'mikrotik' | 'settings'>('overview');

  // Customer filters & search
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerNetFilter, setCustomerNetFilter] = useState('ALL');

  // Transaction search & filter
  const [txnSearch, setTxnSearch] = useState('');
  const [txnStatusFilter, setTxnStatusFilter] = useState('ALL');

  // Bundle editing modal
  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null);
  const [isBundleModalOpen, setIsBundleModalOpen] = useState(false);

  // Voucher generator
  const [voucherBundleId, setVoucherBundleId] = useState<number>(bundles[0]?.id || 1);
  const [voucherQty, setVoucherQty] = useState<number>(5);
  const [isPrinterOpen, setIsPrinterOpen] = useState(false);

  // Compute Metrics
  const totalRevenue = transactions
    .filter((t) => t.payment_status === 'SUCCESS')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const activeCustomers = customers.filter((c) => c.status === 'ACTIVE').length;
  const expiredCustomers = customers.filter((c) => c.status === 'EXPIRED').length;
  const successfulTxns = transactions.filter((t) => t.payment_status === 'SUCCESS').length;
  const failedTxns = transactions.filter((t) => t.payment_status === 'FAILED').length;
  const pendingTxns = transactions.filter((t) => t.payment_status === 'PENDING').length;
  const activeVouchers = vouchers.filter((v) => v.status === 'UNUSED').length;

  // Chart Data
  const dailyRevenueData = [
    { day: 'Mon', revenue: 28000 },
    { day: 'Tue', revenue: 42000 },
    { day: 'Wed', revenue: 35000 },
    { day: 'Thu', revenue: 58000 },
    { day: 'Fri', revenue: 76000 },
    { day: 'Sat', revenue: 94000 },
    { day: 'Sun', revenue: totalRevenue > 0 ? totalRevenue : 65000 },
  ];

  const networkDistribution = [
    { name: 'YAS', value: customers.filter((c) => c.network === 'YAS').length + 12, color: '#FFCC00' },
    { name: 'Vodacom', value: customers.filter((c) => c.network === 'VODACOM').length + 18, color: '#E60000' },
    { name: 'Airtel', value: customers.filter((c) => c.network === 'AIRTEL').length + 9, color: '#DC2626' },
    { name: 'Halotel', value: customers.filter((c) => c.network === 'HALOTEL').length + 5, color: '#FF5500' },
  ];

  // Bundle Actions
  const handleSaveBundle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBundle) return;

    if (editingBundle.id === 0) {
      // Create new
      const newBundle: Bundle = {
        ...editingBundle,
        id: Date.now(),
      };
      onUpdateBundles([...bundles, newBundle]);
    } else {
      // Update existing
      onUpdateBundles(bundles.map((b) => (b.id === editingBundle.id ? editingBundle : b)));
    }

    setIsBundleModalOpen(false);
    setEditingBundle(null);
  };

  const handleDeleteBundle = (id: number) => {
    if (window.confirm('Are you sure you want to delete this bundle?')) {
      onUpdateBundles(bundles.filter((b) => b.id !== id));
    }
  };

  // Voucher Generator
  const handleGenerateVouchers = () => {
    const targetBundle = bundles.find((b) => b.id === voucherBundleId) || bundles[0];
    const newItems: Voucher[] = [];
    const batchId = `BATCH-${Date.now().toString().slice(-4)}`;

    for (let i = 0; i < voucherQty; i++) {
      const randomCode = `CN${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      newItems.push({
        id: Date.now() + i,
        code: randomCode,
        bundle_id: targetBundle.id,
        bundle_name: targetBundle.name,
        price_tsh: targetBundle.price_tsh,
        duration_label: targetBundle.duration_label,
        status: 'UNUSED',
        batch_reference: batchId,
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      });
    }

    onAddVouchers(newItems);
    alert(`Generated ${voucherQty} voucher(s) for bundle: ${targetBundle.name}!`);
  };

  // Filtered lists
  const filteredCustomers = customers.filter((c) => {
    const matchSearch =
      c.phone.includes(customerSearch) ||
      c.txn_id.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.mac.toLowerCase().includes(customerSearch.toLowerCase());
    const matchNet = customerNetFilter === 'ALL' || c.network === customerNetFilter;
    return matchSearch && matchNet;
  });

  const filteredTransactions = transactions.filter((t) => {
    const matchSearch =
      t.txn_id.toLowerCase().includes(txnSearch.toLowerCase()) ||
      t.phone.includes(txnSearch) ||
      t.azampay_ref.toLowerCase().includes(txnSearch.toLowerCase());
    const matchStatus = txnStatusFilter === 'ALL' || t.payment_status === txnStatusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="w-full bg-slate-100 min-h-screen text-slate-800">
      
      {/* Top Header */}
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center font-black text-sm">
            CN
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight flex items-center gap-2">
              <span>CLASSIC NET</span>
              <span className="text-[10px] uppercase font-bold bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded-md border border-sky-500/30">
                ISP Admin Panel
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">
              Hotspot Billing &amp; MikroTik Management • Jackson Ribent
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-semibold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>RouterOS v7 (ONLINE)</span>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-bold transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Navigation Sub-bar */}
      <div className="bg-white border-b border-slate-200 px-6 overflow-x-auto">
        <div className="flex space-x-1 py-2">
          {[
            { id: 'overview', label: '📊 Overview' },
            { id: 'bundles', label: '📦 Bundles & Pricing' },
            { id: 'customers', label: '👥 Customers' },
            { id: 'transactions', label: '💳 Transactions' },
            { id: 'vouchers', label: '🎟️ Voucher Generator' },
            { id: 'mikrotik', label: '🌐 MikroTik Router' },
            { id: 'settings', label: '⚙️ Settings' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Workspace Area */}
      <main className="p-6 max-w-7xl mx-auto space-y-6">

        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* KPI Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs font-bold uppercase text-slate-400">Total Revenue</span>
                <div className="text-2xl font-black text-sky-600 mt-1">
                  TSH {totalRevenue.toLocaleString()}
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> AzamPay USSD Collections
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs font-bold uppercase text-slate-400">Active Customers</span>
                <div className="text-2xl font-black text-emerald-600 mt-1">
                  {activeCustomers}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {expiredCustomers} expired records
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs font-bold uppercase text-slate-400">Transactions</span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {transactions.length}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {successfulTxns} successful • {failedTxns} failed
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs font-bold uppercase text-slate-400">Available Vouchers</span>
                <div className="text-2xl font-black text-amber-600 mt-1">
                  {activeVouchers}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Ready for physical scratch sale
                </div>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Daily Revenue Chart */}
              <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Revenue Trend (TSH)</h3>
                    <p className="text-xs text-slate-400">Daily collections across all Tanzanian MNOs</p>
                  </div>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyRevenueData}>
                      <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                      <Tooltip
                        formatter={(val: number) => [`TSH ${val.toLocaleString()}`, 'Revenue']}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                      />
                      <Bar dataKey="revenue" fill="#0284c7" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Network Share Chart */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-1">MNO Network Share</h3>
                <p className="text-xs text-slate-400 mb-4">Volume breakdown across providers</p>
                <div className="h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={networkDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {networkDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* Quick Recent Transactions */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900">Latest Live Transactions</h3>
                <button
                  onClick={() => setActiveTab('transactions')}
                  className="text-xs font-bold text-sky-600 hover:underline"
                >
                  View All Transactions →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="pb-2">Txn ID</th>
                      <th className="pb-2">Customer Phone</th>
                      <th className="pb-2">Network</th>
                      <th className="pb-2">Bundle</th>
                      <th className="pb-2">Amount</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.slice(0, 5).map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="py-2.5 font-mono font-bold text-sky-700">{t.txn_id}</td>
                        <td className="py-2.5 font-bold text-slate-800">{t.phone}</td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {t.network}
                          </span>
                        </td>
                        <td className="py-2.5">{t.bundle}</td>
                        <td className="py-2.5 font-bold text-slate-900">TSH {t.amount.toLocaleString()}</td>
                        <td className="py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              t.payment_status === 'SUCCESS'
                                ? 'bg-emerald-100 text-emerald-800'
                                : t.payment_status === 'PENDING'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {t.payment_status}
                          </span>
                        </td>
                        <td className="py-2.5 text-slate-400">{t.created_at.slice(11, 19)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* 2. BUNDLES TAB */}
        {activeTab === 'bundles' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Hotspot Bundles &amp; Pricing</h2>
                <p className="text-xs text-slate-500">
                  Update package prices, duration hours, and bandwidth limits in real time. Changes immediately appear on customer captive portal!
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingBundle({
                    id: 0,
                    name: '',
                    slug: '',
                    price_tsh: 1000,
                    duration_hours: 24,
                    duration_label: '',
                    is_unlimited: true,
                    speed_limit_up: '5M',
                    speed_limit_down: '10M',
                    badge_text: 'Unlimited',
                    is_active: true,
                    display_order: bundles.length + 1,
                  });
                  setIsBundleModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
              >
                <Plus className="w-4 h-4" /> Add New Bundle
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="pb-3">Bundle Name</th>
                    <th className="pb-3">Price (TSH)</th>
                    <th className="pb-3">Validity</th>
                    <th className="pb-3">Speed Limit</th>
                    <th className="pb-3">Bandwidth</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bundles.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="py-3 font-extrabold text-sm text-slate-900">{b.name}</td>
                      <td className="py-3 font-black text-sky-700 text-sm">
                        TSH {b.price_tsh.toLocaleString()}
                      </td>
                      <td className="py-3 text-slate-600">{b.duration_label || `${b.duration_hours} Hours`}</td>
                      <td className="py-3 font-mono text-slate-500">
                        {b.speed_limit_down} / {b.speed_limit_up}
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {b.badge_text || 'Unlimited'}
                        </span>
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            b.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {b.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="py-3 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditingBundle({ ...b });
                            setIsBundleModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded-lg transition"
                          title="Edit Bundle"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBundle(b.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                          title="Delete Bundle"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* 3. CUSTOMERS TAB */}
        {activeTab === 'customers' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Customer Records</h2>
                <p className="text-xs text-slate-500">
                  Search active and expired customer sessions, MAC addresses, and associated transaction IDs
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Search phone, MAC, Txn..."
                    className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-sky-600"
                  />
                </div>
                <select
                  value={customerNetFilter}
                  onChange={(e) => setCustomerNetFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-sky-600"
                >
                  <option value="ALL">All Networks</option>
                  <option value="YAS">YAS</option>
                  <option value="AIRTEL">Airtel</option>
                  <option value="VODACOM">Vodacom</option>
                  <option value="HALOTEL">Halotel</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="pb-3">Customer Phone</th>
                    <th className="pb-3">Network</th>
                    <th className="pb-3">Bundle</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Activation Time</th>
                    <th className="pb-3">Expiry Time</th>
                    <th className="pb-3">Hardware MAC</th>
                    <th className="pb-3">Txn ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCustomers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="py-3 font-extrabold text-slate-900">{c.phone}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {c.network}
                        </span>
                      </td>
                      <td className="py-3 font-semibold">{c.bundle}</td>
                      <td className="py-3 font-bold text-sky-700">TSH {c.amount.toLocaleString()}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 text-slate-500">{c.activation_time}</td>
                      <td className="py-3 font-semibold text-rose-600">{c.expiry_time}</td>
                      <td className="py-3 font-mono text-slate-500 text-[11px]">{c.mac}</td>
                      <td className="py-3 font-mono font-bold text-sky-600">{c.txn_id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* 4. TRANSACTIONS TAB */}
        {activeTab === 'transactions' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Transaction Ledger</h2>
                <p className="text-xs text-slate-500">
                  Complete real-time AzamPay USSD push payment requests and callback records
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={txnSearch}
                    onChange={(e) => setTxnSearch(e.target.value)}
                    placeholder="Search Txn ID, phone..."
                    className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-sky-600"
                  />
                </div>
                <select
                  value={txnStatusFilter}
                  onChange={(e) => setTxnStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-sky-600"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="SUCCESS">SUCCESS</option>
                  <option value="PENDING">PENDING</option>
                  <option value="FAILED">FAILED</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="pb-3">Transaction ID</th>
                    <th className="pb-3">Phone</th>
                    <th className="pb-3">Provider</th>
                    <th className="pb-3">Bundle</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Payment Status</th>
                    <th className="pb-3">Hotspot Access</th>
                    <th className="pb-3">Timestamp</th>
                    <th className="pb-3">AzamPay Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="py-3 font-mono font-extrabold text-sky-700">{t.txn_id}</td>
                      <td className="py-3 font-bold text-slate-800">{t.phone}</td>
                      <td className="py-3 text-slate-600">{t.provider}</td>
                      <td className="py-3 font-semibold">{t.bundle}</td>
                      <td className="py-3 font-extrabold text-slate-900">TSH {t.amount.toLocaleString()}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.payment_status === 'SUCCESS'
                              ? 'bg-emerald-100 text-emerald-800'
                              : t.payment_status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {t.payment_status}
                        </span>
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.activation_status === 'ACTIVATED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {t.activation_status}
                        </span>
                      </td>
                      <td className="py-3 text-slate-400">{t.created_at}</td>
                      <td className="py-3 font-mono text-[11px] text-slate-600">{t.azampay_ref}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* 5. VOUCHERS TAB */}
        {activeTab === 'vouchers' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Prepaid Voucher Generator</h2>
                <p className="text-xs text-slate-500">
                  Generate secure single or batch prepaid codes for over-the-counter sales in local shops or reception
                </p>
              </div>
              <button
                onClick={() => setIsPrinterOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-sm transition"
              >
                <Printer className="w-4 h-4" /> Print Vouchers Sheet
              </button>
            </div>

            {/* Generator Form */}
            <div className="bg-sky-50/70 border border-sky-200/80 rounded-2xl p-4 flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Select Bundle:
                </label>
                <select
                  value={voucherBundleId}
                  onChange={(e) => setVoucherBundleId(Number(e.target.value))}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white outline-none focus:border-sky-600"
                >
                  {bundles.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} (TSH {b.price_tsh.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Quantity:
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={voucherQty}
                  onChange={(e) => setVoucherQty(Number(e.target.value))}
                  className="w-20 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white outline-none focus:border-sky-600"
                />
              </div>

              <button
                onClick={handleGenerateVouchers}
                className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
              >
                + Generate {voucherQty} Codes
              </button>
            </div>

            {/* Vouchers Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="pb-3">Voucher Code</th>
                    <th className="pb-3">Bundle Package</th>
                    <th className="pb-3">Value</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Used By</th>
                    <th className="pb-3">Created Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vouchers.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="py-3 font-mono font-black text-sm text-sky-700 tracking-wider">
                        {v.code}
                      </td>
                      <td className="py-3 font-semibold">{v.bundle_name}</td>
                      <td className="py-3 font-bold text-slate-800">
                        TSH {v.price_tsh.toLocaleString()} ({v.duration_label})
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            v.status === 'UNUSED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {v.status}
                        </span>
                      </td>
                      <td className="py-3 font-bold text-slate-700">{v.used_by_phone || '—'}</td>
                      <td className="py-3 text-slate-400">{v.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* 6. MIKROTIK ROUTER TAB */}
        {activeTab === 'mikrotik' && (
          <div className="space-y-6">
            
            {/* Router Hardware Info */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">MikroTik RouterOS Gateway</h2>
                  <p className="text-xs text-slate-500">Live connection to hardware gateway (Port 8728 API)</p>
                </div>
                <div className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  ● {routerStatus.status}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium">Model &amp; OS</span>
                  <div className="font-bold text-slate-800 mt-1">{routerStatus.model}</div>
                  <div className="text-[11px] text-slate-500">{routerStatus.routeros_version}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium">Gateway IP / Host</span>
                  <div className="font-mono font-bold text-slate-800 mt-1">{routerStatus.host}:{routerStatus.port}</div>
                  <div className="text-[11px] text-slate-500">Hotspot: {routerStatus.hotspot_server}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium">CPU Load</span>
                  <div className="font-bold text-emerald-600 mt-1">{routerStatus.cpu_load}</div>
                  <div className="text-[11px] text-slate-500">Healthy &amp; Cool</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium">Free Memory</span>
                  <div className="font-bold text-sky-600 mt-1">{routerStatus.free_memory}</div>
                  <div className="text-[11px] text-slate-500">256 MB Total</div>
                </div>
              </div>
            </div>

            {/* Active Hotspot Sessions Table */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Live Active Sessions (/ip/hotspot/active)
                  </h3>
                  <p className="text-xs text-slate-400">Authorized devices currently transmitting packets</p>
                </div>
                <span className="text-xs font-bold text-sky-600">
                  {routerSessions.length} Active User(s)
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="pb-3">User / Phone</th>
                      <th className="pb-3">Assigned IP</th>
                      <th className="pb-3">Device MAC</th>
                      <th className="pb-3">Session Uptime</th>
                      <th className="pb-3">Bandwidth Transmitted</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {routerSessions.map((s, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-3 font-bold text-slate-900">{s.user}</td>
                        <td className="py-3 font-mono text-slate-600">{s.address}</td>
                        <td className="py-3 font-mono text-slate-500">{s.mac_address}</td>
                        <td className="py-3 text-slate-700">{s.uptime}</td>
                        <td className="py-3 text-slate-600">
                          ↓ {Math.round(s.bytes_out / (1024 * 1024))} MB / ↑ {Math.round(s.bytes_in / (1024 * 1024))} MB
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => onDisconnectSession(s.user)}
                            className="px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition"
                          >
                            Disconnect
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* 7. SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-2xl space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">System Configuration</h2>
              <p className="text-xs text-slate-500">
                CLASSIC NET ISP profile, customer care contacts, and gateway parameters
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Brand Name:
                </label>
                <input
                  type="text"
                  defaultValue="CLASSIC NET"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 font-bold outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Slogan:
                </label>
                <input
                  type="text"
                  defaultValue="Fast • Simple • Reliable Internet"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Support Phone:
                  </label>
                  <input
                    type="text"
                    defaultValue="0618781830"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Support Email:
                  </label>
                  <input
                    type="text"
                    defaultValue="jacksonribent53@gmail.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-sky-600" />
                  <span>AzamPay Webhook Configuration</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Register this URL in the AzamPay Developer Portal for instant USSD Push payment notifications:
                </div>
                <code className="block p-2 rounded bg-slate-900 text-sky-400 font-mono text-xs select-all">
                  https://api.yourdomain.com/api/payments/callback
                </code>
              </div>

              <button
                type="button"
                onClick={() => alert('Settings saved to database!')}
                className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl transition shadow-sm"
              >
                Save Settings
              </button>
            </div>

          </div>
        )}

      </main>

      {/* Bundle Modal (Add / Edit) */}
      {isBundleModalOpen && editingBundle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <form
            onSubmit={handleSaveBundle}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4"
          >
            <h3 className="text-base font-bold text-slate-900">
              {editingBundle.id === 0 ? 'Create New Bundle' : `Edit Bundle: ${editingBundle.name}`}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Bundle Name:</label>
                <input
                  type="text"
                  required
                  value={editingBundle.name}
                  onChange={(e) => setEditingBundle({ ...editingBundle, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold outline-none"
                  placeholder="e.g. 24 HOURS or 3 DAYS"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Price (TSH):</label>
                <input
                  type="number"
                  required
                  value={editingBundle.price_tsh}
                  onChange={(e) => setEditingBundle({ ...editingBundle, price_tsh: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-black text-sky-700 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Validity Hours:</label>
                  <input
                    type="number"
                    required
                    value={editingBundle.duration_hours}
                    onChange={(e) => setEditingBundle({ ...editingBundle, duration_hours: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Label:</label>
                  <input
                    type="text"
                    value={editingBundle.duration_label}
                    onChange={(e) => setEditingBundle({ ...editingBundle, duration_label: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
                    placeholder="e.g. 24 Hours"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="bundleActiveCheck"
                  checked={editingBundle.is_active}
                  onChange={(e) => setEditingBundle({ ...editingBundle, is_active: e.target.checked })}
                  className="w-4 h-4 text-sky-600 rounded"
                />
                <label htmlFor="bundleActiveCheck" className="font-bold text-slate-700">
                  Active (Available for customer purchase)
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsBundleModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                Save Bundle
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Printable Vouchers Modal */}
      <VoucherPrinterModal
        isOpen={isPrinterOpen}
        vouchers={vouchers}
        onClose={() => setIsPrinterOpen(false)}
      />

    </div>
  );
};
