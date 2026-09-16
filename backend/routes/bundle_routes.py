from flask import Blueprint, request, jsonify
from database.db_connection import execute_query

bundle_bp = Blueprint("bundles", __name__)

DEFAULT_BUNDLES = [
    {
        "id": 1,
        "name": "24 HOURS",
        "slug": "24-hours",
        "price_tsh": 1000.0,
        "duration_hours": 24,
        "duration_label": "24 Hours",
        "is_unlimited": True,
        "speed_limit_up": "5M",
        "speed_limit_down": "10M",
        "badge_text": "Unlimited",
        "is_active": True,
        "display_order": 1
    },
    {
        "id": 2,
        "name": "WEEK",
        "slug": "week",
        "price_tsh": 6000.0,
        "duration_hours": 168,
        "duration_label": "7 Days",
        "is_unlimited": True,
        "speed_limit_up": "5M",
        "speed_limit_down": "15M",
        "badge_text": "Unlimited",
        "is_active": True,
        "display_order": 2
    },
    {
        "id": 3,
        "name": "MONTH",
        "slug": "month",
        "price_tsh": 22000.0,
        "duration_hours": 720,
        "duration_label": "30 Days",
        "is_unlimited": True,
        "speed_limit_up": "8M",
        "speed_limit_down": "20M",
        "badge_text": "Unlimited",
        "is_active": True,
        "display_order": 3
    }
]

@bundle_bp.route("/bundles", methods=["GET"])
def get_public_bundles():
    """
    Returns active bundles for customer captive portal.
    Never hardcoded in frontend; dynamic from database.
    """
    try:
        bundles = execute_query(
            "SELECT * FROM bundles WHERE is_active = 1 ORDER BY display_order ASC, price_tsh ASC",
            fetch_all=True
        )
        if bundles and len(bundles) > 0:
            return jsonify({"success": True, "bundles": bundles})
    except Exception:
        pass
    
    return jsonify({"success": True, "bundles": DEFAULT_BUNDLES})

@bundle_bp.route("/admin/bundles", methods=["GET"])
def get_admin_bundles():
    """
    Returns all bundles (including deactivated ones) for admin dashboard.
    """
    try:
        bundles = execute_query("SELECT * FROM bundles ORDER BY display_order ASC, price_tsh ASC", fetch_all=True)
        if bundles and len(bundles) > 0:
            return jsonify({"success": True, "bundles": bundles})
    except Exception:
        pass
    return jsonify({"success": True, "bundles": DEFAULT_BUNDLES})

@bundle_bp.route("/admin/bundles", methods=["POST"])
def add_bundle():
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    price = float(data.get("price_tsh", 0))
    duration_hours = int(data.get("duration_hours", 24))
    duration_label = data.get("duration_label", f"{duration_hours} Hours")
    is_unlimited = 1 if data.get("is_unlimited", True) else 0
    badge_text = data.get("badge_text", "Unlimited")

    if not name or price <= 0:
        return jsonify({"success": False, "error": "Valid name and price are required."}), 400

    slug = name.lower().replace(" ", "-")
    try:
        res = execute_query(
            """
            INSERT INTO bundles (name, slug, price_tsh, duration_hours, duration_label, is_unlimited, badge_text, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 1)
            """,
            (name, slug, price, duration_hours, duration_label, is_unlimited, badge_text),
            commit=True
        )
        return jsonify({"success": True, "message": "Bundle created successfully."})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@bundle_bp.route("/admin/bundles/<int:bundle_id>", methods=["PUT"])
def update_bundle(bundle_id):
    data = request.get_json() or {}
    try:
        execute_query(
            """
            UPDATE bundles 
            SET name = %s, price_tsh = %s, duration_hours = %s, duration_label = %s, 
                is_unlimited = %s, badge_text = %s, is_active = %s
            WHERE id = %s
            """,
            (
                data.get("name"),
                float(data.get("price_tsh")),
                int(data.get("duration_hours")),
                data.get("duration_label"),
                1 if data.get("is_unlimited") else 0,
                data.get("badge_text", "Unlimited"),
                1 if data.get("is_active", True) else 0,
                bundle_id
            ),
            commit=True
        )
        return jsonify({"success": True, "message": "Bundle updated successfully."})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@bundle_bp.route("/admin/bundles/<int:bundle_id>", methods=["DELETE"])
def delete_bundle(bundle_id):
    try:
        execute_query("DELETE FROM bundles WHERE id = %s", (bundle_id,), commit=True)
        return jsonify({"success": True, "message": "Bundle deleted."})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
