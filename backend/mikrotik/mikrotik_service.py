import datetime
import logging
from config import Config

logger = logging.getLogger(__name__)

# Try importing routeros_api if installed
try:
    import routeros_api
    ROUTEROS_API_AVAILABLE = True
except ImportError:
    ROUTEROS_API_AVAILABLE = False

class MikroTikService:
    """
    Communicates with the MikroTik RouterOS device via API (port 8728)
    or RouterOS v7 REST API.
    
    Responsibilities:
    1. Creating/updating Hotspot users (/ip/hotspot/user)
    2. Setting validity, uptime limits and profile
    3. Querying active hotspot sessions (/ip/hotspot/active)
    4. Auto-bypassing MAC address in /ip/hotspot/ip-binding for zero-click instant connection
    5. Disconnecting expired users
    """

    @classmethod
    def get_api_connection(cls):
        """
        Creates a RouterOS API connection instance.
        """
        if not ROUTEROS_API_AVAILABLE:
            logger.warning("routeros_api library not installed. Running in mock/simulation mode.")
            return None
            
        try:
            connection = routeros_api.RouterOsApiPool(
                Config.MIKROTIK_HOST,
                username=Config.MIKROTIK_USER,
                password=Config.MIKROTIK_PASSWORD,
                port=Config.MIKROTIK_PORT,
                plaintext_login=True
            )
            api = connection.get_api()
            return api
        except Exception as e:
            logger.error(f"Failed to connect to MikroTik Router at {Config.MIKROTIK_HOST}:{Config.MIKROTIK_PORT}: {e}")
            return None

    @classmethod
    def authorize_user(cls, username: str, password: str, duration_hours: int, profile: str = "default", mac_address: str = None, comment: str = "") -> dict:
        """
        Creates/updates hotspot user in MikroTik and optionally binds MAC for instant pass-through.
        """
        now = datetime.datetime.now()
        expires_at = now + datetime.timedelta(hours=duration_hours)
        uptime_seconds = duration_hours * 3600
        
        full_comment = f"CLASSIC NET | Exp: {expires_at.strftime('%Y-%m-%d %H:%M')} | {comment}"
        
        api = cls.get_api_connection()
        
        if not api:
            # Fallback simulator mode
            logger.info(f"[MIKROTIK-SIMULATOR] Created hotspot user '{username}' (profile: {profile}, limit: {duration_hours}h, exp: {expires_at})")
            return {
                "success": True,
                "mode": "SIMULATED",
                "username": username,
                "password": password,
                "duration_hours": duration_hours,
                "uptime_limit_seconds": uptime_seconds,
                "expires_at": expires_at.isoformat(),
                "profile": profile,
                "mac_address": mac_address,
                "message": "MikroTik user successfully provisioned in router simulator."
            }

        try:
            hotspot_users = api.get_resource('/ip/hotspot/user')
            
            # Check if user already exists
            existing = hotspot_users.get(name=username)
            if existing:
                hotspot_users.set(
                    id=existing[0]['id'],
                    password=password,
                    profile=profile,
                    limit_uptime=str(uptime_seconds),
                    comment=full_comment,
                    disabled='no'
                )
                logger.info(f"Updated existing MikroTik hotspot user '{username}'.")
            else:
                hotspot_users.add(
                    name=username,
                    password=password,
                    profile=profile,
                    limit_uptime=str(uptime_seconds),
                    comment=full_comment,
                    disabled='no'
                )
                logger.info(f"Added new MikroTik hotspot user '{username}'.")

            # If client MAC address is provided, add IP-Binding bypass for instant internet
            if mac_address and len(mac_address) >= 12:
                try:
                    ip_bindings = api.get_resource('/ip/hotspot/ip-binding')
                    existing_binding = ip_bindings.get(mac_address=mac_address)
                    if existing_binding:
                        ip_bindings.set(
                            id=existing_binding[0]['id'],
                            type='bypassed',
                            comment=full_comment,
                            disabled='no'
                        )
                    else:
                        ip_bindings.add(
                            mac_address=mac_address,
                            type='bypassed',
                            comment=full_comment,
                            disabled='no'
                        )
                    logger.info(f"Bound MAC {mac_address} to bypassed mode in MikroTik.")
                except Exception as mac_err:
                    logger.warning(f"Could not bind MAC {mac_address}: {mac_err}")

            return {
                "success": True,
                "mode": "LIVE_ROUTER",
                "username": username,
                "password": password,
                "duration_hours": duration_hours,
                "uptime_limit_seconds": uptime_seconds,
                "expires_at": expires_at.isoformat(),
                "profile": profile,
                "message": "Hotspot user authorized on live MikroTik router."
            }

        except Exception as e:
            logger.error(f"Error authorizing user in MikroTik: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": f"Failed to authorize on MikroTik: {e}"
            }

    @classmethod
    def get_active_sessions(cls) -> list:
        """
        Fetches active connected users on the MikroTik hotspot.
        """
        api = cls.get_api_connection()
        if not api:
            # Return realistic mock active sessions for testing
            return [
                {
                    "user": "0712345678",
                    "address": "192.168.88.24",
                    "mac_address": "48:2C:6A:11:8B:E3",
                    "uptime": "2h14m",
                    "bytes_in": 142058490,
                    "bytes_out": 482910382,
                    "comment": "CLASSIC NET | Exp: 24h"
                },
                {
                    "user": "0618781830",
                    "address": "192.168.88.35",
                    "mac_address": "8C:F5:A3:99:4D:12",
                    "uptime": "5h42m",
                    "bytes_in": 398102910,
                    "bytes_out": 982019482,
                    "comment": "CLASSIC NET | Exp: 7 Days"
                }
            ]

        try:
            active_resource = api.get_resource('/ip/hotspot/active')
            sessions = active_resource.get()
            return sessions
        except Exception as e:
            logger.error(f"Failed to fetch active MikroTik sessions: {e}")
            return []

    @classmethod
    def disconnect_user(cls, username: str) -> bool:
        """
        Disconnects an active user session.
        """
        api = cls.get_api_connection()
        if not api:
            logger.info(f"[MIKROTIK-SIMULATOR] Disconnected user '{username}'.")
            return True

        try:
            active_resource = api.get_resource('/ip/hotspot/active')
            matches = active_resource.get(user=username)
            for m in matches:
                active_resource.remove(id=m['id'])
            return True
        except Exception as e:
            logger.error(f"Failed to disconnect user '{username}': {e}")
            return False
