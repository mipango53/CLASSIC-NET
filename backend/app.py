import os
import logging
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from database.db_connection import init_db_pool

# Import route blueprints
from routes.auth_routes import auth_bp
from routes.bundle_routes import bundle_bp
from routes.payment_routes import payment_bp
from routes.voucher_routes import voucher_bp
from routes.admin_routes import admin_bp

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("classicnet")

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS for separated frontend hosting
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Initialize Database Connection Pool
    init_db_pool()

    # Register blueprints under /api prefix
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(bundle_bp, url_prefix="/api")
    app.register_blueprint(payment_bp, url_prefix="/api")
    app.register_blueprint(voucher_bp, url_prefix="/api")
    app.register_blueprint(admin_bp, url_prefix="/api")

    @app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({
            "status": "healthy",
            "service": "CLASSIC NET Hotspot Billing API",
            "version": "1.0.0",
            "support": Config.SUPPORT_PHONE,
            "email": Config.SUPPORT_EMAIL
        })

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"success": False, "error": "Endpoint not found"}), 404

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"success": False, "error": "Internal server error"}), 500

    return app

app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    logger.info(f"Starting CLASSIC NET Backend on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=False)
