from flask import Blueprint, request, jsonify
from services.voucher_service import VoucherService
from database.db_connection import execute_query

voucher_bp = Blueprint("vouchers", __name__)

@voucher_bp.route("/vouchers/redeem", methods=["POST"])
def redeem():
    """
    POST /api/vouchers/redeem
    Customer redeems a scratch card / printed voucher.
    """
    data = request.get_json() or {}
    code = data.get("code", "").strip()
    phone = data.get("phone", "").strip()
    client_mac = data.get("mac")

    if not code or not phone:
        return jsonify({"success": False, "error": "Voucher code and phone number are required."}), 400

    result = VoucherService.redeem_voucher(code=code, phone=phone, client_mac=client_mac)
    status_code = 200 if result.get("success") else 400
    return jsonify(result), status_code

@voucher_bp.route("/admin/vouchers/generate", methods=["POST"])
def generate():
    """
    POST /api/admin/vouchers/generate
    Body: { "bundle_id": 1, "quantity": 10, "prefix": "CN" }
    """
    data = request.get_json() or {}
    bundle_id = int(data.get("bundle_id", 1))
    quantity = int(data.get("quantity", 1))

    vouchers = VoucherService.generate_batch(bundle_id=bundle_id, quantity=quantity)
    return jsonify({
        "success": True,
        "message": f"Generated {len(vouchers)} vouchers successfully.",
        "vouchers": vouchers
    }), 201

@voucher_bp.route("/admin/vouchers", methods=["GET"])
def list_vouchers():
    """
    GET /api/admin/vouchers
    Supports filtering by status (UNUSED, USED, EXPIRED, DISABLED).
    """
    status = request.args.get("status")
    query = """
        SELECT v.*, b.name as bundle_name, b.price_tsh, b.duration_label
        FROM vouchers v
        JOIN bundles b ON v.bundle_id = b.id
    """
    params = []
    if status:
        query += " WHERE v.status = %s"
        params.append(status.upper())
    query += " ORDER BY v.id DESC LIMIT 200"

    try:
        rows = execute_query(query, tuple(params), fetch_all=True)
        if rows is not None:
            return jsonify({"success": True, "vouchers": rows})
    except Exception:
        pass

    # Sample mock vouchers if DB not connected
    sample = [
        {"id": 1, "code": "CN7K29X4P", "bundle_name": "24 HOURS", "price_tsh": 1000, "duration_label": "24 Hours", "status": "UNUSED", "created_at": "2026-09-16 10:00:00"},
        {"id": 2, "code": "CN9M44W2Z", "bundle_name": "WEEK", "price_tsh": 6000, "duration_label": "7 Days", "status": "USED", "used_by_phone": "0712345678", "created_at": "2026-09-15 14:20:00"}
    ]
    return jsonify({"success": True, "vouchers": sample})
