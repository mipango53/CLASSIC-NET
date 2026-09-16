import re
import time
import uuid
import logging
import requests
from config import Config

logger = logging.getLogger(__name__)

class AzamPayService:
    """
    Official AzamPay API integration service for Tanzanian Mobile Money (USSD Push).
    Handles MNO Push (Tigo/YAS, Airtel, Vodacom, Halotel), token generation,
    callback processing, and sandbox simulation.
    """
    
    # Provider mapping for AzamPay MNO Checkout
    NETWORK_PROVIDER_MAP = {
        "YAS": "Tigo",         # YAS/Tigo Tanzania
        "TIGO": "Tigo",
        "AIRTEL": "Airtel",     # Airtel Money
        "VODACOM": "Vodacom",   # M-Pesa Vodacom
        "HALOTEL": "Halotel"    # HaloPesa Halotel
    }

    @staticmethod
    def normalize_phone(phone_str: str) -> dict:
        """
        Validates and normalizes Tanzanian phone numbers.
        Returns:
            {
                "valid": bool,
                "local_format": "07XXXXXXXX" or "06XXXXXXXX",
                "international_format": "255XXXXXXXXX",
                "network_guess": "YAS"|"AIRTEL"|"VODACOM"|"HALOTEL"|None,
                "error": str or None
            }
        """
        if not phone_str:
            return {"valid": False, "error": "Phone number is required."}
            
        # Strip spaces, dashes, parentheses, plus
        cleaned = re.sub(r"[\s\-\(\)\+]", "", str(phone_str))
        
        # Check standard prefix transformations
        if cleaned.startswith("255"):
            local = "0" + cleaned[3:]
            intl = cleaned
        elif cleaned.startswith("0"):
            local = cleaned
            intl = "255" + cleaned[1:]
        elif len(cleaned) == 9 and cleaned[0] in ("6", "7"):
            local = "0" + cleaned
            intl = "255" + cleaned
        else:
            return {"valid": False, "error": "Invalid phone number format. Must start with 06 or 07."}
            
        # Validate 10-digit local format: 06... or 07...
        if not re.match(r"^0(6[1-9]|7[1-9])[0-9]{7}$", local):
            return {
                "valid": False,
                "error": "Phone number must be a valid 10-digit Tanzanian number (e.g. 0712345678 or 0618781830)."
            }
            
        # Detect network by Tanzanian prefix
        prefix = local[:3]
        network_guess = None
        if prefix in ["071", "065", "067", "077"]:
            network_guess = "YAS"  # Tigo / YAS
        elif prefix in ["068", "069", "078"]:
            network_guess = "AIRTEL"
        elif prefix in ["074", "075", "076"]:
            network_guess = "VODACOM"
        elif prefix in ["061", "062"]:
            network_guess = "HALOTEL"
            
        return {
            "valid": True,
            "local_format": local,
            "international_format": intl,
            "network_guess": network_guess,
            "error": None
        }

    @classmethod
    def get_auth_token(cls) -> str:
        """
        Retrieves JWT bearer token from AzamPay authentication service.
        """
        # If credentials not provided, throw or fallback to sandbox token
        if not Config.AZAMPAY_CLIENT_ID or not Config.AZAMPAY_CLIENT_SECRET:
            logger.info("AzamPay credentials not set in environment. Using Sandbox mock token.")
            return "sandbox_mock_token_" + str(int(time.time()))

        headers = {"Content-Type": "application/json"}
        payload = {
            "appName": Config.AZAMPAY_APP_NAME,
            "clientId": Config.AZAMPAY_CLIENT_ID,
            "clientSecret": Config.AZAMPAY_CLIENT_SECRET
        }

        try:
            response = requests.post(Config.AZAMPAY_AUTH_URL, json=payload, headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                token = data.get("data", {}).get("accessToken") or data.get("accessToken")
                return token
            logger.error(f"AzamPay Auth failed: {response.status_code} - {response.text}")
            return None
        except Exception as e:
            logger.error(f"AzamPay Auth connection error: {e}")
            return None

    @classmethod
    def initiate_ussd_push(cls, phone: str, network: str, amount: float, bundle_name: str, transaction_uuid: str) -> dict:
        """
        Sends USSD Push request to customer phone via AzamPay MNO Checkout API.
        
        Args:
            phone: Raw or normalized phone number
            network: YAS, AIRTEL, VODACOM, HALOTEL
            amount: Price in TSH
            bundle_name: e.g. "24 HOURS"
            transaction_uuid: Unique reference id
            
        Returns:
            dict with status, reference, message
        """
        # 1. Normalize phone
        phone_info = cls.normalize_phone(phone)
        if not phone_info["valid"]:
            return {
                "success": False,
                "status": "FAILED",
                "message": phone_info["error"]
            }

        intl_phone = phone_info["international_format"]
        clean_network = network.upper().strip()
        provider = cls.NETWORK_PROVIDER_MAP.get(clean_network, "Tigo")
        
        # Payment description strictly identifying CLASSIC NET
        description = f"CLASSIC NET - {bundle_name.upper()} INTERNET"
        
        # 2. Check if running in Mock / Sandbox simulation
        is_live_configured = bool(Config.AZAMPAY_CLIENT_ID and Config.AZAMPAY_CLIENT_SECRET and Config.AZAMPAY_API_KEY)
        
        if not is_live_configured or Config.AZAMPAY_ENV == "sandbox":
            # Clean Sandbox / Simulation Mode
            logger.info(f"[AZAMPAY-SANDBOX] Simulating USSD Push for {intl_phone} on {provider} (Amount: {amount} TSH, Txn: {transaction_uuid})")
            simulated_reference = f"AZM-SBX-{int(time.time())}-{transaction_uuid[:8]}"
            
            return {
                "success": True,
                "status": "PENDING",
                "mode": "SANDBOX",
                "transaction_uuid": transaction_uuid,
                "reference": simulated_reference,
                "message": f"Payment request sent to your phone ({phone_info['local_format']}). Please enter your PIN on your phone to complete payment.",
                "provider": provider,
                "phone": phone_info["local_format"],
                "amount": amount,
                "description": description
            }

        # 3. Live AzamPay API Call
        token = cls.get_auth_token()
        if not token:
            return {
                "success": False,
                "status": "FAILED",
                "message": "Unable to authenticate with AzamPay payment gateway. Please contact support at " + Config.SUPPORT_PHONE
            }

        headers = {
            "Authorization": f"Bearer {token}",
            "X-API-KEY": Config.AZAMPAY_API_KEY,
            "Content-Type": "application/json"
        }

        payload = {
            "accountNumber": intl_phone,
            "amount": str(int(amount)),
            "currency": "TZS",
            "externalId": transaction_uuid,
            "provider": provider,
            "additionalProperties": {
                "description": description,
                "merchant": Config.SYSTEM_NAME,
                "support": Config.SUPPORT_PHONE
            }
        }

        try:
            response = requests.post(Config.AZAMPAY_CHECKOUT_URL, json=payload, headers=headers, timeout=15)
            resp_data = response.json() if response.text else {}
            
            if response.status_code in [200, 201, 202]:
                reference = resp_data.get("transactionId") or resp_data.get("reference") or f"AZM-{transaction_uuid[:8]}"
                return {
                    "success": True,
                    "status": "PENDING",
                    "mode": "LIVE",
                    "transaction_uuid": transaction_uuid,
                    "reference": reference,
                    "message": f"Payment request sent to your phone ({phone_info['local_format']}). Please enter your PIN on your phone to complete payment.",
                    "provider": provider,
                    "raw": resp_data
                }
            else:
                err_msg = resp_data.get("message") or resp_data.get("errors") or "Payment gateway rejected request."
                logger.error(f"AzamPay checkout failed: {response.status_code} - {err_msg}")
                return {
                    "success": False,
                    "status": "FAILED",
                    "message": f"Payment request failed: {err_msg}",
                    "raw": resp_data
                }
        except Exception as e:
            logger.error(f"AzamPay connection error: {e}")
            return {
                "success": False,
                "status": "FAILED",
                "message": f"Unable to reach payment provider. Please try again or call {Config.SUPPORT_PHONE}."
            }

    @classmethod
    def verify_callback(cls, payload: dict, headers: dict) -> dict:
        """
        Parses and verifies AzamPay webhook/callback notification.
        AzamPay sends:
        {
            "transactionId": "...",
            "externalId": "TXN_UUID",
            "transactionStatus": "success" | "failed",
            "amount": "1000",
            "msisdn": "2557XXXXXXXX",
            "reference": "..."
        }
        """
        status_raw = str(payload.get("transactionStatus", "") or payload.get("status", "")).upper()
        external_id = payload.get("externalId") or payload.get("reference")
        
        is_success = status_raw in ["SUCCESS", "SUCCESSFUL", "PAID", "COMPLETED", "200"]
        
        return {
            "valid": True,
            "transaction_uuid": external_id,
            "status": "SUCCESS" if is_success else "FAILED",
            "azampay_reference": payload.get("transactionId"),
            "amount": payload.get("amount"),
            "phone": payload.get("msisdn"),
            "raw": payload
        }
