import uuid
import datetime
import logging
from config import Config
from payment.azampay_service import AzamPayService
from mikrotik.mikrotik_service import MikroTikService
from database.db_connection import execute_query

logger = logging.getLogger(__name__)

class PaymentService:
    @classmethod
    def initiate_bundle_payment(cls, phone: str, network: str, bundle_id: int, client_ip: str = None, client_mac: str = None) -> dict:
        """
        Validates bundle, normalizes phone, creates pending transaction, and triggers AzamPay USSD push.
        """
        # 1. Validate Phone
        phone_info = AzamPayService.normalize_phone(phone)
        if not phone_info["valid"]:
            return {"success": False, "error": phone_info["error"]}

        # 2. Get Bundle info
        bundle = None
        try:
            bundle = execute_query("SELECT * FROM bundles WHERE id = %s AND is_active = 1", (bundle_id,), fetch_one=True)
        except Exception as e:
            logger.warning(f"DB bundle lookup failed: {e}. Using fallback default bundles.")

        # Fallback if DB not seeded or offline
        if not bundle:
            fallback_bundles = {
                1: {"id": 1, "name": "24 HOURS", "price_tsh": 1000.0, "duration_hours": 24, "speed_limit_down": "10M"},
                2: {"id": 2, "name": "WEEK", "price_tsh": 6000.0, "duration_hours": 168, "speed_limit_down": "15M"},
                3: {"id": 3, "name": "MONTH", "price_tsh": 22000.0, "duration_hours": 720, "speed_limit_down": "20M"},
            }
            bundle = fallback_bundles.get(int(bundle_id))

        if not bundle:
            return {"success": False, "error": "Selected internet bundle is invalid or inactive."}

        # 3. Create unique transaction UUID
        txn_uuid = f"CN-{uuid.uuid4().hex[:10].upper()}"
        amount = float(bundle["price_tsh"])
        
        # 4. Record pending transaction in DB
        try:
            execute_query(
                """
                INSERT INTO transactions 
                (transaction_uuid, phone_number, network_code, bundle_id, amount_tsh, currency, payment_provider, payment_status, activation_status, client_ip, client_mac)
                VALUES (%s, %s, %s, %s, %s, 'TZS', 'AzamPay', 'PENDING', 'PENDING', %s, %s)
                """,
                (txn_uuid, phone_info["local_format"], network.upper(), bundle_id, amount, client_ip, client_mac),
                commit=True
            )
        except Exception as e:
            logger.warning(f"Could not persist pending transaction to DB: {e}")

        # 5. Initiate AzamPay USSD Push
        result = AzamPayService.initiate_ussd_push(
            phone=phone_info["international_format"],
            network=network,
            amount=amount,
            bundle_name=bundle["name"],
            transaction_uuid=txn_uuid
        )

        if not result["success"]:
            return result

        # Update transaction with AzamPay reference
        try:
            execute_query(
                "UPDATE transactions SET azampay_reference = %s WHERE transaction_uuid = %s",
                (result.get("reference"), txn_uuid),
                commit=True
            )
        except Exception as e:
            logger.warning(f"Could not update transaction reference: {e}")

        return {
            "success": True,
            "transaction_uuid": txn_uuid,
            "status": "PENDING",
            "phone": phone_info["local_format"],
            "network": network.upper(),
            "amount": amount,
            "currency": "TSH",
            "bundle_name": bundle["name"],
            "duration_hours": bundle["duration_hours"],
            "message": result["message"],
            "reference": result.get("reference"),
            "mode": result.get("mode", "SANDBOX")
        }

    @classmethod
    def get_transaction_status(cls, txn_uuid: str) -> dict:
        """
        Retrieves current transaction status and expiry time.
        """
        try:
            tx = execute_query(
                """
                SELECT t.*, b.name as bundle_name, b.duration_hours 
                FROM transactions t
                JOIN bundles b ON t.bundle_id = b.id
                WHERE t.transaction_uuid = %s
                """,
                (txn_uuid,),
                fetch_one=True
            )
            if tx:
                return {"success": True, "transaction": tx}
        except Exception as e:
            logger.warning(f"DB lookup for transaction {txn_uuid} failed: {e}")

        return {"success": True, "transaction": {"transaction_uuid": txn_uuid, "payment_status": "PENDING"}}

    @classmethod
    def process_successful_payment(cls, txn_uuid: str, azampay_ref: str = None) -> dict:
        """
        Activates user internet in MikroTik once payment is confirmed.
        """
        now = datetime.datetime.now()
        
        # 1. Fetch transaction
        tx = None
        try:
            tx = execute_query(
                """
                SELECT t.*, b.name as bundle_name, b.duration_hours, b.mikrotik_profile 
                FROM transactions t
                JOIN bundles b ON t.bundle_id = b.id
                WHERE t.transaction_uuid = %s
                """,
                (txn_uuid,),
                fetch_one=True
            )
        except Exception as e:
            logger.warning(f"DB fetch failed: {e}")

        duration_hours = 24
        phone = "07XXXXXXXX"
        profile = "default"
        client_mac = None

        if tx:
            duration_hours = tx.get("duration_hours", 24)
            phone = tx.get("phone_number")
            profile = tx.get("mikrotik_profile", "default")
            client_mac = tx.get("client_mac")

        expires_at = now + datetime.timedelta(hours=duration_hours)

        # 2. Authorize on MikroTik
        mt_result = MikroTikService.authorize_user(
            username=phone,
            password=f"cn_{txn_uuid[-6:].lower()}",
            duration_hours=duration_hours,
            profile=profile,
            mac_address=client_mac,
            comment=f"Txn: {txn_uuid}"
        )

        # 3. Update Transaction in DB
        try:
            execute_query(
                """
                UPDATE transactions 
                SET payment_status = 'SUCCESS',
                    activation_status = 'ACTIVATED',
                    azampay_reference = COALESCE(%s, azampay_reference),
                    activated_at = %s,
                    expires_at = %s
                WHERE transaction_uuid = %s
                """,
                (azampay_ref, now, expires_at, txn_uuid),
                commit=True
            )

            # Update or insert customer record
            phone_info = AzamPayService.normalize_phone(phone)
            if phone_info["valid"]:
                execute_query(
                    """
                    INSERT INTO customers (phone_number, normalized_phone, network_code, current_expiry, is_active, total_spend_tsh, total_purchases)
                    VALUES (%s, %s, 'UNKNOWN', %s, 1, 0, 1)
                    ON DUPLICATE KEY UPDATE 
                        current_expiry = VALUES(current_expiry),
                        is_active = 1,
                        total_purchases = total_purchases + 1
                    """,
                    (phone_info["local_format"], phone_info["international_format"], expires_at),
                    commit=True
                )
        except Exception as e:
            logger.warning(f"DB update for success failed: {e}")

        return {
            "success": True,
            "status": "SUCCESS",
            "activation_status": "ACTIVATED",
            "phone": phone,
            "activated_at": now.strftime("%Y-%m-%d %H:%M:%S"),
            "expires_at": expires_at.strftime("%Y-%m-%d %H:%M:%S"),
            "duration_hours": duration_hours,
            "mikrotik": mt_result
        }
