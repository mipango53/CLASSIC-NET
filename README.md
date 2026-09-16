# CLASSIC NET — Automatic Hotspot Billing & Captive Portal System

**Fast • Simple • Reliable Internet**  
Customer Support: `0618781830` | Email: `jacksonribent53@gmail.com`

---

## 1. System Overview

**CLASSIC NET** is an automated hotspot billing and captive portal solution designed specifically for Tanzanian Internet Service Providers (ISPs), cafes, campuses, and hotels. It integrates with **MikroTik RouterOS** for bandwidth/user access management and **AzamPay** for instant mobile money collection via **USSD Push** across all major Tanzanian Mobile Network Operators (**YAS, Airtel, Vodacom, Halotel**).

### High-Level Customer Workflow:
```
Customer connects to Hotspot Wi-Fi
      │
      ▼
MikroTik intercepts unauthenticated traffic & redirects to CLASSIC NET Captive Portal
      │
      ▼
Customer views dynamic bundles (24 Hours, 1 Week, 1 Month) & enters phone number
      │
      ▼
AzamPay initiates real-time USSD Push to customer's mobile device
      │
      ▼
Customer enters mobile-money secret PIN on their phone
      │
      ▼
AzamPay webhook notifies CLASSIC NET backend
      │
      ▼
Backend validates transaction & executes MikroTik RouterOS API command
      │
      ▼
Hotspot user account is activated & MAC address is authorized for instant internet!
```

---

## 2. Technologies Used

| Tier | Technology | Purpose |
|---|---|---|
| **Frontend** | HTML5, CSS3, JavaScript (Vanilla ES6) | Zero-dependency, lightweight, mobile-first responsive captive portal |
| **Backend** | Python 3.10+ (Flask / FastAPI) | RESTful API, AzamPay client, MikroTik daemon, JWT security |
| **Database** | MySQL 8.0+ / MariaDB | ACID-compliant storage for transactions, customers, bundles, vouchers |
| **Router Hardware** | MikroTik RouterOS v6 / v7 | Bandwidth queuing, Hotspot gateway, IP/MAC binding |
| **Mobile Money** | AzamPay API (USSD Push) | YAS/Tigo, Airtel Money, Vodacom M-Pesa, HaloPesa |
| **Live Simulator** | Node.js Express + React 19 | Full interactive preview & hardware simulation environment |

---

## 3. Project Directory Structure

```
CLASSIC-NET/
│
├── frontend/                     # Completely decoupled frontend (static hosting)
│   ├── index.html                # Captive portal landing page
│   ├── payment.html              # Real-time USSD Push waiting & polling screen
│   ├── success.html              # Internet activated confirmation with countdown
│   ├── failed.html               # Payment failed / cancelled retry screen
│   ├── voucher.html              # Voucher code redemption screen
│   ├── admin/                    # Admin management panel
│   │   ├── index.html            # Dashboard with stats, charts, bundles, customers
│   │   └── login.html            # Secure admin sign-in
│   ├── css/
│   │   └── style.css             # Mobile-first clean styling
│   ├── js/
│   │   ├── app.js                # Customer captive portal logic
│   │   └── admin.js              # Admin dashboard data fetcher & charts
│   ├── assets/                   # SVG brand logos (CLASSIC NET, YAS, Airtel, Vodacom, Halotel)
│   └── .env.example              # Frontend API URL configuration
│
├── backend/                      # Decoupled Python REST API backend
│   ├── app.py                    # Flask application entry point
│   ├── config.py                 # System configuration and environment loader
│   ├── requirements.txt          # Python dependencies
│   ├── .env.example              # Backend secrets template
│   ├── routes/
│   │   ├── auth_routes.py        # Admin login & JWT verification
│   │   ├── bundle_routes.py      # Dynamic bundle pricing & CRUD
│   │   ├── payment_routes.py     # AzamPay USSD push initiation & webhooks
│   │   ├── voucher_routes.py     # Single & batch voucher generator/redemption
│   │   └── admin_routes.py       # Metrics, customer search, transactions, settings
│   ├── services/
│   │   ├── payment_service.py    # Payment orchestration & post-payment activation
│   │   └── voucher_service.py    # Random code generator & voucher lifecycle
│   ├── payment/
│   │   └── azampay_service.py    # Official AzamPay MNO checkout & token generation
│   ├── mikrotik/
│   │   └── mikrotik_service.py   # RouterOS API client for hotspot user management
│   └── database/
│       └── db_connection.py      # MySQL connection pool and query helpers
│
├── database/
│   └── schema.sql                # Complete MySQL DDL, indexes, and initial seeds
│
└── README.md                     # Comprehensive documentation
```

---

## 4. MySQL Setup

1. Create a MySQL database and user:
```sql
CREATE DATABASE classicnet_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'classicnet_user'@'localhost' IDENTIFIED BY 'StrongPassword2026!';
GRANT ALL PRIVILEGES ON classicnet_db.* TO 'classicnet_user'@'localhost';
FLUSH PRIVILEGES;
```

2. Import the schema and initial seed data:
```bash
mysql -u classicnet_user -p classicnet_db < database/schema.sql
```

The schema automatically creates:
- `admins` (Default user: `admin` / Password: `ClassicNetAdmin2026!`)
- `networks` (YAS, Airtel, Vodacom, Halotel)
- `bundles` (24 Hours @ TSH 1,000, Week @ TSH 6,000, Month @ TSH 22,000)
- `customers`, `transactions`, `vouchers`, `mikrotik_users`, `settings`

---

## 5. Backend Setup (Python)

1. Clone or navigate to the `backend/` directory:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

2. Copy `.env.example` to `.env` and fill in credentials:
```bash
cp .env.example .env
nano .env
```

3. Run the development server:
```bash
python app.py
```
For production:
```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

---

## 6. Frontend Setup

Because the frontend is 100% decoupled:
1. You can host it on any static web server (Nginx, Apache, Netlify, Cloudflare Pages, or on the MikroTik router's USB storage!).
2. In `frontend/.env.example` (or `window.API_BASE_URL` in `frontend/js/app.js`), set your backend API URL:
```javascript
window.API_BASE_URL = "https://api.yourdomain.com/api";
```

---

## 7. AzamPay Integration & USSD Push

### Obtaining Credentials:
1. Register on [AzamPay Developer Portal](https://developer.azampay.co.tz).
2. Obtain:
   - `AZAMPAY_CLIENT_ID`
   - `AZAMPAY_CLIENT_SECRET`
   - `AZAMPAY_API_KEY`
   - `AZAMPAY_APP_NAME`
3. Configure your Webhook URL in AzamPay portal:
   `https://api.yourdomain.com/api/payments/callback`

### Supported MNOs in Tanzania:
- **YAS / Tigo Pesa** (MNO Provider code: `Tigo`)
- **Airtel Money** (MNO Provider code: `Airtel`)
- **Vodacom M-Pesa** (MNO Provider code: `Vodacom`)
- **HaloPesa** (MNO Provider code: `Halotel`)

### SMS / Description Branding:
Where supported, transactions sent to AzamPay are labeled:
`CLASSIC NET - 24 HOURS INTERNET`

---

## 8. MikroTik RouterOS Configuration

### Step 1: Enable RouterOS API
Log into your MikroTik router via Winbox or SSH and run:
```routeros
# Enable API service on default port 8728
/ip service enable api
/ip service set api port=8728

# Create a dedicated API user with hotspot management rights
/user group add name=billing_group policy=api,read,write,test
/user add name=classicnet_api group=billing_group password="RouterSecretPassword2026!"
```

### Step 2: Configure Hotspot Server Profiles
```routeros
# Add Hotspot User Profile for Unlimited Bundles
/ip hotspot user profile add name="classicnet_unlimited" rate-limit="10M/5M" shared-users=1 keepalive-timeout=2m
/ip hotspot user profile add name="classicnet_week" rate-limit="15M/5M" shared-users=1 keepalive-timeout=2m
/ip hotspot user profile add name="classicnet_month" rate-limit="20M/8M" shared-users=1 keepalive-timeout=2m
```

### Step 3: Walled Garden (Allow Portal & Payment Gateway before Login)
To ensure customers can load the portal and AzamPay can process transactions without internet access, add the walled garden entries:
```routeros
/ip hotspot walled-garden ip
add action=accept dst-host="*.azampay.co.tz" comment="AzamPay API"
add action=accept dst-host="*.classicnet.tz" comment="CLASSIC NET Portal"
add action=accept dst-address="YOUR_BACKEND_SERVER_IP" comment="CLASSIC NET Backend API"
```

### Step 4: Connecting the Captive Portal to MikroTik
On your MikroTik router, edit `hotspot/login.html` to auto-redirect unauthenticated users to the CLASSIC NET portal:
```html
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0; url=https://portal.classicnet.tz/?mac=$(mac)&ip=$(ip)&link-login-only=$(link-login-only)" />
</head>
<body>
  <p>Redirecting to CLASSIC NET Hotspot Portal...</p>
</body>
</html>
```

When payment succeeds, the backend either:
1. Adds the user to `/ip/hotspot/user` and the portal auto-logs in via HTTP PAP POST to `$(link-login-only)`.
2. OR sets `/ip/hotspot/ip-binding` with `type=bypassed` matching the customer's MAC address, granting instant zero-click internet access!

---

## 9. Admin Bundle & Voucher Management

- **Bundles:** Admin can change the price of `24 HOURS` from TSH 1,000 to TSH 1,500 via the Admin Dashboard. The customer interface dynamically reflects the change immediately.
- **Vouchers:** Admin can generate single or batch voucher codes (e.g. `CN7K29X4P`). When a customer inputs the code on `voucher.html`, the voucher is marked as `USED` and internet is authorized for the duration.

---

## 10. Security Highlights

1. **No Mobile Money PINs:** The customer NEVER enters their mobile-money PIN on the website. The PIN is solely entered on the phone's native USSD prompt.
2. **Double Verification:** Internet access is NEVER granted on button click. The backend waits for the signed AzamPay callback / webhook.
3. **Password Hashing:** Admin passwords use Argon2id / bcrypt hashing with secure salt rounds.
4. **JWT Protected:** Admin endpoints require Bearer JWT tokens with expiry checks.
5. **Separated Secrets:** AzamPay credentials and MikroTik router credentials exist strictly server-side.
"# CLASSIC-NET" 
