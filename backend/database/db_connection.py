import mysql.connector
from mysql.connector import pooling
import logging
from config import Config

logger = logging.getLogger(__name__)

db_pool = None

def init_db_pool():
    global db_pool
    try:
        db_pool = mysql.connector.pooling.MySQLConnectionPool(
            pool_name="classicnet_pool",
            pool_size=10,
            pool_reset_session=True,
            host=Config.DB_HOST,
            port=Config.DB_PORT,
            user=Config.DB_USER,
            password=Config.DB_PASSWORD,
            database=Config.DB_NAME
        )
        logger.info("MySQL connection pool initialized successfully.")
    except Exception as e:
        logger.warning(f"Failed to connect to MySQL database at {Config.DB_HOST}:{Config.DB_PORT}. (Running in mock/fallback mode): {e}")
        db_pool = None

def get_db_connection():
    global db_pool
    if db_pool is None:
        init_db_pool()
    if db_pool:
        return db_pool.get_connection()
    return None

def execute_query(query, params=None, fetch_one=False, fetch_all=False, commit=False):
    """
    Utility helper to execute queries with automatic connection handling
    """
    conn = get_db_connection()
    if not conn:
        return None
        
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(query, params or ())
        if commit:
            conn.commit()
            last_id = cursor.lastrowid
            affected = cursor.rowcount
            return {"last_id": last_id, "affected_rows": affected}
        if fetch_one:
            return cursor.fetchone()
        if fetch_all:
            return cursor.fetchall()
        return None
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"Database query error: {e} | Query: {query}")
        raise e
    finally:
        cursor.close()
        conn.close()
