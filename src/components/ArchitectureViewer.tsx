import React, { useState } from 'react';
import { Server, Database, Globe, Smartphone, ShieldCheck, Copy, Check, Terminal, FileCode } from 'lucide-react';

export const ArchitectureViewer: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const mikrotikCommands = `# 1. Enable RouterOS API Service
/ip service enable api
/ip service set api port=8728

# 2. Add Billing Group & User
/user group add name=billing_group policy=api,read,write,test
/user add name=classicnet_api group=billing_group password="RouterSecretPassword2026!"

# 3. Create Hotspot User Profile for Unlimited Bundles
/ip hotspot user profile add name="classicnet_unlimited" rate-limit="10M/5M" shared-users=1 keepalive-timeout=2m

# 4. Walled Garden (Allow Portal & AzamPay before login)
/ip hotspot walled-garden ip
add action=accept dst-host="*.azampay.co.tz" comment="AzamPay API"
add action=accept dst-host="*.classicnet.tz" comment="CLASSIC NET Portal"
add action=accept dst-address="YOUR_BACKEND_SERVER_IP" comment="CLASSIC NET Backend"`;

  const azampayPayload = `POST https://authenticator.azampay.co.tz/AppRegistration/GenerateToken
{
  "appName": "CLASSIC NET",
  "clientId": "your-azampay-client-id",
  "clientSecret": "your-azampay-client-secret"
}

POST https://checkout.azampay.co.tz/azampay/mno/checkout
{
  "accountNumber": "0718923451",
  "amount": "1000",
  "currency": "TZS",
  "externalId": "CN-8A91B4",
  "provider": "Tigo"
}`;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Overview Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-1">
          Decoupled Production Architecture
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          The CLASSIC NET system is split into independent tiers for high availability, security, and scalability.
        </p>

        {/* Visual Architecture Diagram */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          
          {/* Node 1: Customer & Hotspot */}
          <div className="p-4 bg-sky-50 rounded-2xl border border-sky-200 flex flex-col items-center">
            <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center mb-2 shadow-sm">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="font-extrabold text-xs text-slate-900">1. Customer Phone</div>
            <div className="text-[11px] text-slate-600 mt-1">Connects to Wi-Fi SSID: CLASSIC NET</div>
            <div className="mt-2 text-[10px] bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded-full">
              Walled Garden
            </div>
          </div>

          {/* Node 2: Frontend Portal */}
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex flex-col items-center">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-2 shadow-sm">
              <Globe className="w-5 h-5" />
            </div>
            <div className="font-extrabold text-xs text-slate-900">2. Captive Portal</div>
            <div className="text-[11px] text-slate-600 mt-1">Standalone HTML/CSS/JS (Static / CDN)</div>
            <div className="mt-2 text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              portal.classicnet.tz
            </div>
          </div>

          {/* Node 3: Backend REST API */}
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex flex-col items-center">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center mb-2 shadow-sm">
              <Server className="w-5 h-5" />
            </div>
            <div className="font-extrabold text-xs text-slate-900">3. Backend REST API</div>
            <div className="text-[11px] text-slate-600 mt-1">Python Flask / MySQL Database</div>
            <div className="mt-2 text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
              api.classicnet.tz
            </div>
          </div>

          {/* Node 4: MikroTik Router */}
          <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-200 flex flex-col items-center">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-2 shadow-sm">
              <Terminal className="w-5 h-5" />
            </div>
            <div className="font-extrabold text-xs text-slate-900">4. MikroTik RouterOS</div>
            <div className="text-[11px] text-slate-600 mt-1">Hotspot Users &amp; IP Bindings</div>
            <div className="mt-2 text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
              Port 8728 API
            </div>
          </div>

        </div>
      </div>

      {/* Code Snippets & Scripts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* MikroTik RouterOS Script */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-900">MikroTik RouterOS Setup Script</h3>
            </div>
            <button
              onClick={() => handleCopy(mikrotikCommands, 'mt')}
              className="flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:text-sky-700"
            >
              {copiedKey === 'mt' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copiedKey === 'mt' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-3 bg-slate-900 text-sky-300 rounded-xl text-[11px] font-mono overflow-x-auto leading-relaxed max-h-72">
            {mikrotikCommands}
          </pre>
        </div>

        {/* AzamPay API Flow */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-900">AzamPay USSD Push API Integration</h3>
            </div>
            <button
              onClick={() => handleCopy(azampayPayload, 'azm')}
              className="flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:text-sky-700"
            >
              {copiedKey === 'azm' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copiedKey === 'azm' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-3 bg-slate-900 text-amber-300 rounded-xl text-[11px] font-mono overflow-x-auto leading-relaxed max-h-72">
            {azampayPayload}
          </pre>
        </div>

      </div>

    </div>
  );
};
