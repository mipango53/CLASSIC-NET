import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Flask Settings
    SECRET_KEY = os.getenv("JWT_SECRET_KEY", "classic_net_secure_jwt_secret_key_2026")
    JWT_EXPIRY_HOURS = int(os.getenv("TOKEN_EXPIRE_HOURS", "24"))
    
    # System Info & Branding
    SYSTEM_NAME = os.getenv("SYSTEM_NAME", "CLASSIC NET")
    SUPPORT_PHONE = os.getenv("SUPPORT_PHONE", "0618781830")
    SUPPORT_EMAIL = os.getenv("SUPPORT_EMAIL", "jacksonribent53@gmail.com")
    SLOGAN = os.getenv("SLOGAN", "Fast • Simple • Reliable Internet")
    CURRENCY = os.getenv("CURRENCY", "TSH")
    
    # Database Settings (MySQL)
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = int(os.getenv("DB_PORT", "3306"))
    DB_USER = os.getenv("DB_USER", "root")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "")
    DB_NAME = os.getenv("DB_NAME", "classicnet_db")
    
    # AzamPay API Settings
    AZAMPAY_ENV = os.getenv("AZAMPAY_ENV", "sandbox").lower()  # "sandbox" or "production"
    AZAMPAY_CLIENT_ID = os.getenv("AZAMPAY_CLIENT_ID", "")
    AZAMPAY_CLIENT_SECRET = os.getenv("AZAMPAY_CLIENT_SECRET", "")
    AZAMPAY_API_KEY = os.getenv("AZAMPAY_API_KEY", "")
    AZAMPAY_APP_NAME = os.getenv("AZAMPAY_APP_NAME", "CLASSIC_NET")
    AZAMPAY_CALLBACK_URL = os.getenv("AZAMPAY_CALLBACK_URL", "https://api.classicnet.example.com/api/payments/callback")
    AZAMPAY_WEBHOOK_URL = os.getenv("AZAMPAY_WEBHOOK_URL", "https://api.classicnet.example.com/api/payments/webhook")
    
    # AzamPay Base URLs
    if AZAMPAY_ENV == "production":
        AZAMPAY_AUTH_URL = "https://authenticator.azampay.co.tz/AppRegistration/GenerateToken"
        AZAMPAY_CHECKOUT_URL = "https://checkout.azampay.co.tz/azampay/mno/checkout"
    else:
        AZAMPAY_AUTH_URL = "https://authenticator-sandbox.azampay.co.tz/AppRegistration/GenerateToken"
        AZAMPAY_CHECKOUT_URL = "https://sandbox.azampay.co.tz/azampay/mno/checkout"
        
    # MikroTik RouterOS Configuration
    MIKROTIK_HOST = os.getenv("MIKROTIK_HOST", "192.168.88.1")
    MIKROTIK_PORT = int(os.getenv("MIKROTIK_PORT", "8728"))
    MIKROTIK_USER = os.getenv("MIKROTIK_USER", "admin")
    MIKROTIK_PASSWORD = os.getenv("MIKROTIK_PASSWORD", "")
    MIKROTIK_HOTSPOT_SERVER = os.getenv("MIKROTIK_HOTSPOT_SERVER", "hotspot1")
    MIKROTIK_PROFILE_PREFIX = os.getenv("MIKROTIK_PROFILE_PREFIX", "classicnet_")
    
    # CORS
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")
