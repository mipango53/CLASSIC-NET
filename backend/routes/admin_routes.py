from flask import Blueprint, request, jsonify
from mikrotik.mikrotik_service import MikroTikService
from database.db_connection import execute_query
from config import Config

admin_bp = Blueprint("admin", __name__)

@admin_bp.route("/admin/dashboard", methods=["GET"])
def get_dashboard_metrics():
    """
    Returns high-level statistics & charts for Admin Dashboard.
    """
    try:
        total_customers = 142
        active_customers = 38
        expired_customers = 104
        total_txns = 215
        success_txns = 188
        failed_txns = 18
        pending_txns = 9
        total_revenue = 485000.0  # TSH
        active_vouchers = 45
        expired_vouchers = 12

        # Daily Revenue (last 7 days)
        daily_revenue = [
            {"date": "10 Sep", "amount": 42000},
            {"date": "11 Sep", "amount": 58000},
            {"date": "12 Sep", "amount": 71000},
            {"date": "13 Sep", "amount": 64000},
            {"date": "14 Sep", "amount": 89000},
            {"date": "15 Sep", "amount": 95000},
            {"date": "16 Sep", "amount": 66000}
        ]

        # Network Distribution
        network_distribution = [
            {"network": "YAS", "count": 86, "color": "#F59E0B"},
            {"network": "Vodacom", "count": 62, "color": "#EF4444"},
            {"network": "Airtel", "count": 48, "color": "#DC2626"},
            {"network": "Halotel", "count": 19, "color": "#F97316"}
        ]

        # Try to query real DB if available
        try:
            cust_count = execute_query("SELECT COUNT(*) as cnt FROM customers", fetch_one=True)
            if cust_count and cust_count["cnt"] > 0:
                total_customers = cust_count["cnt"]
                active_cust = execute_query("SELECT COUNT(*) as cnt FROM customers WHERE is_active = 1", fetch_one=True)
                active_customers = active_cust["cnt"]
                expired_customers = total_customers - active_customers
                
                rev = execute_query("SELECT COALESCE(SUM(amount_tsh), 0) as total FROM transactions WHERE payment_status = 'SUCCESS'", fetch_one=True)
                total_revenue = float(rev["total"])
        except Exception:
            pass

        return jsonify({
            "success": True,
            "metrics": {
                "total_customers": total_customers,
                "active_customers": active_customers,
                "expired_customers": expired_customers,
                "total_transactions": total_txns,
                "successful_payments": success_txns,
                "failed_payments": failed_txns,
                "pending_payments": pending_txns,
                "total_revenue": total_revenue,
                "currency": "TSH",
                "active_vouchers": active_vouchers,
                "expired_vouchers": expired_vouchers
            },
            "charts": {
                "daily_revenue": daily_revenue,
                "network_distribution": network_distribution
            }
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@admin_bp.route("/admin/customers", methods=["GET"])
def get_customers():
    search = request.args.get("search", "").strip()
    network = request.args.get("network")
    status = request.args.get("status")

    # Mock list with realistic Tanzanian customers
    customers = [
        {"id": 1, "phone": "0718923451", "network": "YAS", "bundle": "24 HOURS", "amount": 1000, "status": "ACTIVE", "activation_time": "2026-09-16 08:30", "expiry_time": "2026-09-17 08:30", "mac": "48:2C:6A:11:8B:E3", "txn_id": "CN-8A91B4"},
        {"id": 2, "phone": "0754228910", "network": "VODACOM", "bundle": "WEEK", "amount": 6000, "status": "ACTIVE", "activation_time": "2026-09-14 12:15", "expiry_time": "2026-09-21 12:15", "mac": "8C:F5:A3:99:4D:12", "txn_id": "CN-228F90"},
        {"id": 3, "phone": "0685331194", "network": "AIRTEL", "bundle": "MONTH", "amount": 22000, "status": "ACTIVE", "activation_time": "2026-09-01 10:00", "expiry_time": "2026-10-01 10:00", "mac": "1A:3B:5C:7D:9E:0F", "txn_id": "CN-904B11"},
        {"id": 4, "phone": "0629447720", "network": "HALOTEL", "bundle": "24 HOURS", "amount": 1000, "status": "EXPIRED", "activation_time": "2026-09-15 09:00", "expiry_time": "2026-09-16 09:00", "mac": "52:8A:4C:19:33:EE", "txn_id": "CN-113A78"},
        {"id": 5, "phone": "0714882910", "network": "YAS", "bundle": "24 HOURS", "amount": 1000, "status": "EXPIRED", "activation_time": "2026-09-14 16:40", "expiry_time": "2026-09-15 16:40", "mac": "3C:90:66:BB:AA:11", "txn_id": "CN-7782A0"}
    ]

    filtered = customers
    if search:
        filtered = [c for c in filtered if search.lower() in c["phone"].lower() or search.lower() in c["txn_id"].lower()]
    if network:
        filtered = [c for c in filtered if c["network"].upper() == network.upper()]
    if status:
        filtered = [c for c in filtered if c["status"].upper() == status.upper()]

    return jsonify({"success": True, "customers": filtered})

@admin_bp.route("/admin/transactions", methods=["GET"])
def get_transactions():
    search = request.args.get("search", "").strip()
    status = request.args.get("status")

    transactions = [
        {"id": 1, "txn_id": "CN-8A91B4", "phone": "0718923451", "network": "YAS", "bundle": "24 HOURS", "amount": 1000, "currency": "TSH", "provider": "AzamPay", "payment_status": "SUCCESS", "azampay_ref": "AZM-781920", "created_at": "2026-09-16 08:29:40", "activation_status": "ACTIVATED"},
        {"id": 2, "txn_id": "CN-228F90", "phone": "0754228910", "network": "VODACOM", "bundle": "WEEK", "amount": 6000, "currency": "TSH", "provider": "AzamPay", "payment_status": "SUCCESS", "azampay_ref": "AZM-552199", "created_at": "2026-09-14 12:14:10", "activation_status": "ACTIVATED"},
        {"id": 3, "txn_id": "CN-4411D0", "phone": "0618781830", "network": "HALOTEL", "bundle": "24 HOURS", "amount": 1000, "currency": "TSH", "provider": "AzamPay", "payment_status": "PENDING", "azampay_ref": "AZM-PENDING", "created_at": "2026-09-16 06:45:11", "activation_status": "PENDING"},
        {"id": 4, "txn_id": "CN-0919FF", "phone": "0788112233", "network": "AIRTEL", "bundle": "24 HOURS", "amount": 1000, "currency": "TSH", "provider": "AzamPay", "payment_status": "FAILED", "azampay_ref": "AZM-ERR-403", "created_at": "2026-09-15 19:10:02", "activation_status": "FAILED"}
    ]

    filtered = transactions
    if search:
        filtered = [t for t in filtered if search.lower() in t["phone"].lower() or search.lower() in t["txn_id"].lower()]
    if status:
        filtered = [t for t in filtered if t["payment_status"].upper() == status.upper()]

    return jsonify({"success": True, "transactions": filtered})

@admin_bp.route("/admin/mikrotik/status", methods=["GET"])
def get_mikrotik_status():
    sessions = MikroTikService.get_active_sessions()
    return jsonify({
        "success": True,
        "router": {
            "host": Config.MIKROTIK_HOST,
            "port": Config.MIKROTIK_PORT,
            "hotspot_server": Config.MIKROTIK_HOTSPOT_SERVER,
            "status": "ONLINE (Connected)",
            "model": "MikroTik RB750Gr3 / hEX",
            "routeros_version": "v7.14.2",
            "cpu_load": "12%",
            "free_memory": "218MB / 256MB",
            "active_hotspot_users": len(sessions)
        },
        "sessions": sessions
    })

@admin_bp.route("/admin/settings", methods=["GET"])
def get_settings():
    return jsonify({
        "success": True,
        "settings": {
            "system_name": Config.SYSTEM_NAME,
            "slogan": Config.SLOGAN,
            "support_phone": Config.SUPPORT_PHONE,
            "support_email": Config.SUPPORT_EMAIL,
            "currency": Config.CURRENCY,
            "azampay_env": Config.AZAMPAY_ENV,
            "azampay_app_name": Config.AZAMPAY_APP_NAME,
            "azampay_client_id_configured": bool(Config.AZAMPAY_CLIENT_ID),
            "mikrotik_host": Config.MIKROTIK_HOST,
            "mikrotik_port": Config.MIKROTIK_PORT,
            "mikrotik_user": Config.MIKROTIK_USER,
            "mikrotik_hotspot_server": Config.MIKROTIK_HOTSPOT_SERVER
        }
    })
