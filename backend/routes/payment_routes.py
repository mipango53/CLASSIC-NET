from flask import Blueprint, request, jsonify
from services.payment_service import PaymentService
from payment.azampay_service import AzamPayService

payment_bp = Blueprint("payments", __name__)

@payment_bp.route("/payments/initiate", methods=["POST"])
def initiate_payment():
    """
    POST /api/payments/initiate
    Body:
    {
        "phone": "07XXXXXXXX",
        "network": "YAS",
        "bundle_id": 1,
        "mac": "optional"
    }
    """
    data = request.get_json() or {}
    phone = data.get("phone", "").strip()
    network = data.get("network", "").strip()
    bundle_id = data.get("bundle_id")
    client_mac = data.get("mac")
    client_ip = request.remote_addr

    if not phone or not network or not bundle_id:
        return jsonify({"success": False, "error": "Phone number, network, and bundle selection are required."}), 400

    result = PaymentService.initiate_bundle_payment(
        phone=phone,
        network=network,
        bundle_id=int(bundle_id),
        client_ip=client_ip,
        client_mac=client_mac
    )

    status_code = 200 if result.get("success") else 400
    return jsonify(result), status_code

@payment_bp.route("/payments/status/<transaction_uuid>", methods=["GET"])
def get_payment_status(transaction_uuid):
    """
    GET /api/payments/status/<transaction_uuid>
    Polling endpoint used by customer payment status page.
    """
    res = PaymentService.get_transaction_status(transaction_uuid)
    return jsonify(res)

@payment_bp.route("/payments/callback", methods=["POST"])
def azampay_callback():
    """
    Official AzamPay Webhook / Callback receiver.
    Triggered when customer enters PIN and payment succeeds or fails.
    """
    payload = request.get_json() or {}
    headers = dict(request.headers)

    verified = AzamPayService.verify_callback(payload, headers)
    txn_uuid = verified.get("transaction_uuid")

    if verified.get("status") == "SUCCESS" and txn_uuid:
        # Automatically authorize user in MikroTik Router
        activation = PaymentService.process_successful_payment(
            txn_uuid=txn_uuid,
            azampay_ref=verified.get("azampay_reference")
        )
        return jsonify({"success": True, "message": "Payment verified and internet activated.", "activation": activation}), 200
    else:
        return jsonify({"success": False, "message": "Payment rejected or cancelled by customer."}), 200

@payment_bp.route("/payments/mock-simulate", methods=["POST"])
def mock_simulate():
    """
    Simulates customer entering PIN on their phone in Sandbox/Demo mode.
    Allows testing full flow without deducting real money.
    """
    data = request.get_json() or {}
    txn_uuid = data.get("transaction_uuid")
    action = data.get("action", "PIN_ENTERED") # PIN_ENTERED or CANCELLED

    if not txn_uuid:
        return jsonify({"success": False, "error": "transaction_uuid is required."}), 400

    if action == "CANCELLED":
        return jsonify({"success": False, "status": "CANCELLED", "message": "Customer cancelled USSD payment prompt."}), 200

    # Process successful payment
    res = PaymentService.process_successful_payment(
        txn_uuid=txn_uuid,
        azampay_ref=f"AZM-SIM-{txn_uuid[-6:]}"
    )
    return jsonify(res), 200
