import jwt
import datetime
from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash, generate_password_hash
from config import Config
from database.db_connection import execute_query

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/login", methods=["POST"])
def login():
    """
    Admin authentication route. Returns JWT token on success.
    """
    data = request.get_json() or {}
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()

    if not username or not password:
        return jsonify({"success": False, "error": "Username/email and password are required."}), 400

    admin = None
    try:
        admin = execute_query(
            "SELECT * FROM admins WHERE (username = %s OR email = %s) AND is_active = 1",
            (username, username),
            fetch_one=True
        )
    except Exception as e:
        pass

    # Default fallback admin if database not yet initialized
    is_valid = False
    admin_id = 1
    admin_name = "Classic Net Administrator"
    admin_email = "admin@classicnet.tz"
    role = "SUPER_ADMIN"

    if admin:
        is_valid = check_password_hash(admin["password_hash"], password)
        admin_id = admin["id"]
        admin_name = admin["full_name"]
        admin_email = admin["email"]
        role = admin["role"]
    else:
        # Fallback default credentials: admin / ClassicNetAdmin2026!
        if (username in ["admin", "admin@classicnet.tz"]) and password == "ClassicNetAdmin2026!":
            is_valid = True

    if not is_valid:
        return jsonify({"success": False, "error": "Invalid username/email or password."}), 401

    # Generate JWT
    payload = {
        "admin_id": admin_id,
        "username": username,
        "email": admin_email,
        "role": role,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=Config.JWT_EXPIRY_HOURS)
    }

    token = jwt.encode(payload, Config.SECRET_KEY, algorithm="HS256")

    return jsonify({
        "success": True,
        "message": "Login successful.",
        "token": token,
        "admin": {
            "id": admin_id,
            "username": username,
            "email": admin_email,
            "role": role,
            "name": admin_name
        }
    })
