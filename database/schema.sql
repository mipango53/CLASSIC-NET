-- ==========================================================
-- CLASSIC NET - Hotspot Billing System Database Schema
-- Database: MySQL 8.0+ / MariaDB 10.5+
-- ==========================================================

CREATE DATABASE IF NOT EXISTS `classicnet_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `classicnet_db`;

-- 1. Admins Table
CREATE TABLE IF NOT EXISTS `admins` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(60) NOT NULL UNIQUE,
    `email` VARCHAR(120) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(100) NOT NULL DEFAULT 'Classic Net Admin',
    `role` ENUM('SUPER_ADMIN', 'ADMIN', 'OPERATOR') NOT NULL DEFAULT 'ADMIN',
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `last_login` DATETIME NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_admin_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Networks Table (Tanzanian MNOs)
CREATE TABLE IF NOT EXISTS `networks` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(20) NOT NULL UNIQUE, -- YAS, AIRTEL, VODACOM, HALOTEL
    `name` VARCHAR(50) NOT NULL,
    `mno_provider` VARCHAR(50) NOT NULL, -- Provider name passed to AzamPay (e.g., Tigo, Airtel, Vodacom, Halotel)
    `ussd_channel` VARCHAR(50) NOT NULL DEFAULT 'MNO_PUSH',
    `brand_color` VARCHAR(20) NOT NULL DEFAULT '#0052cc',
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `display_order` INT NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bundles Table
CREATE TABLE IF NOT EXISTS `bundles` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL UNIQUE,
    `price_tsh` DECIMAL(12, 2) NOT NULL,
    `duration_hours` INT UNSIGNED NOT NULL,
    `duration_label` VARCHAR(50) NOT NULL, -- e.g. "24 Hours", "7 Days", "30 Days"
    `is_unlimited` TINYINT(1) NOT NULL DEFAULT 1,
    `speed_limit_up` VARCHAR(20) NOT NULL DEFAULT '5M',
    `speed_limit_down` VARCHAR(20) NOT NULL DEFAULT '10M',
    `mikrotik_profile` VARCHAR(60) NOT NULL DEFAULT 'classicnet_unlimited',
    `badge_text` VARCHAR(50) NOT NULL DEFAULT 'Unlimited',
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `display_order` INT NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_bundle_active` (`is_active`, `display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Customers Table
CREATE TABLE IF NOT EXISTS `customers` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `phone_number` VARCHAR(20) NOT NULL, -- 07XXXXXXXX or 06XXXXXXXX
    `normalized_phone` VARCHAR(20) NOT NULL UNIQUE, -- 255XXXXXXXXX
    `network_code` VARCHAR(20) NOT NULL,
    `total_spend_tsh` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `total_purchases` INT UNSIGNED NOT NULL DEFAULT 0,
    `last_mac_address` VARCHAR(30) NULL,
    `last_ip_address` VARCHAR(45) NULL,
    `current_expiry` DATETIME NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_cust_normalized` (`normalized_phone`),
    INDEX `idx_cust_phone` (`phone_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Transactions Table
CREATE TABLE IF NOT EXISTS `transactions` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `transaction_uuid` VARCHAR(64) NOT NULL UNIQUE,
    `customer_id` INT UNSIGNED NULL,
    `phone_number` VARCHAR(20) NOT NULL,
    `network_code` VARCHAR(20) NOT NULL,
    `bundle_id` INT UNSIGNED NOT NULL,
    `amount_tsh` DECIMAL(12, 2) NOT NULL,
    `currency` VARCHAR(5) NOT NULL DEFAULT 'TZS',
    `payment_provider` VARCHAR(50) NOT NULL DEFAULT 'AzamPay',
    `payment_status` ENUM('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `azampay_reference` VARCHAR(100) NULL,
    `external_id` VARCHAR(100) NULL,
    `activation_status` ENUM('PENDING', 'ACTIVATED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `activated_at` DATETIME NULL,
    `expires_at` DATETIME NULL,
    `failure_reason` TEXT NULL,
    `client_ip` VARCHAR(45) NULL,
    `client_mac` VARCHAR(30) NULL,
    `raw_payload` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_tx_uuid` (`transaction_uuid`),
    INDEX `idx_tx_status` (`payment_status`),
    INDEX `idx_tx_phone` (`phone_number`),
    INDEX `idx_tx_created` (`created_at`),
    CONSTRAINT `fk_tx_bundle` FOREIGN KEY (`bundle_id`) REFERENCES `bundles` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_tx_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Vouchers Table
CREATE TABLE IF NOT EXISTS `vouchers` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(30) NOT NULL UNIQUE,
    `bundle_id` INT UNSIGNED NOT NULL,
    `status` ENUM('UNUSED', 'USED', 'EXPIRED', 'DISABLED') NOT NULL DEFAULT 'UNUSED',
    `batch_reference` VARCHAR(50) NOT NULL DEFAULT 'MANUAL',
    `generated_by_admin_id` INT UNSIGNED NULL,
    `used_by_phone` VARCHAR(20) NULL,
    `used_by_customer_id` INT UNSIGNED NULL,
    `used_at` DATETIME NULL,
    `expires_at` DATETIME NULL,
    `notes` VARCHAR(255) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_voucher_code` (`code`),
    INDEX `idx_voucher_status` (`status`),
    CONSTRAINT `fk_voucher_bundle` FOREIGN KEY (`bundle_id`) REFERENCES `bundles` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. MikroTik Users & Sessions Table
CREATE TABLE IF NOT EXISTS `mikrotik_users` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(60) NOT NULL UNIQUE,
    `password` VARCHAR(60) NOT NULL,
    `customer_phone` VARCHAR(20) NOT NULL,
    `transaction_id` INT UNSIGNED NULL,
    `voucher_id` INT UNSIGNED NULL,
    `profile` VARCHAR(60) NOT NULL DEFAULT 'classicnet_default',
    `mac_address` VARCHAR(30) NULL,
    `ip_address` VARCHAR(45) NULL,
    `uptime_limit_seconds` INT UNSIGNED NOT NULL,
    `activated_at` DATETIME NOT NULL,
    `expires_at` DATETIME NOT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `bytes_in` BIGINT UNSIGNED NOT NULL DEFAULT 0,
    `bytes_out` BIGINT UNSIGNED NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_mt_user` (`username`),
    INDEX `idx_mt_expiry` (`expires_at`),
    INDEX `idx_mt_phone` (`customer_phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Payment Callbacks & Webhook Logs
CREATE TABLE IF NOT EXISTS `payment_callbacks` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `transaction_uuid` VARCHAR(64) NULL,
    `provider` VARCHAR(50) NOT NULL DEFAULT 'AzamPay',
    `headers` TEXT NULL,
    `payload` LONGTEXT NOT NULL,
    `status_code` INT NOT NULL DEFAULT 200,
    `is_verified` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_cb_uuid` (`transaction_uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. System Settings Table
CREATE TABLE IF NOT EXISTS `settings` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `setting_key` VARCHAR(80) NOT NULL UNIQUE,
    `setting_value` TEXT NOT NULL,
    `category` VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    `description` VARCHAR(255) NULL,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- SEED DATA
-- ==========================================================

-- Default Super Admin (Password: ClassicNetAdmin2026!)
-- Argon2id/Bcrypt hash for "ClassicNetAdmin2026!"
INSERT INTO `admins` (`username`, `email`, `password_hash`, `full_name`, `role`) VALUES
('admin', 'admin@classicnet.tz', '$2b$12$e0lK4f5kL4620f3UvF6tC.l66YVwN8jH8dY3ZqG1u5W4GZfM5r6zS', 'Classic Net Administrator', 'SUPER_ADMIN')
ON DUPLICATE KEY UPDATE `email` = VALUES(`email`);

-- Tanzanian Networks
INSERT INTO `networks` (`code`, `name`, `mno_provider`, `brand_color`, `is_active`, `display_order`) VALUES
('YAS', 'YAS', 'Tigo', '#FFD100', 1, 1),
('AIRTEL', 'Airtel Money', 'Airtel', '#E60000', 1, 2),
('VODACOM', 'M-Pesa (Vodacom)', 'Vodacom', '#E60000', 1, 3),
('HALOTEL', 'HaloPesa', 'Halotel', '#FF6600', 1, 4)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Initial Hotspot Bundles
INSERT INTO `bundles` (`name`, `slug`, `price_tsh`, `duration_hours`, `duration_label`, `is_unlimited`, `speed_limit_up`, `speed_limit_down`, `badge_text`, `is_active`, `display_order`) VALUES
('24 HOURS', '24-hours', 1000.00, 24, '24 Hours', 1, '5M', '10M', 'Unlimited', 1, 1),
('WEEK', 'week', 6000.00, 168, '7 Days', 1, '5M', '15M', 'Unlimited', 1, 2),
('MONTH', 'month', 22000.00, 720, '30 Days', 1, '8M', '20M', 'Unlimited', 1, 3)
ON DUPLICATE KEY UPDATE `price_tsh` = VALUES(`price_tsh`);

-- System Settings
INSERT INTO `settings` (`setting_key`, `setting_value`, `category`, `description`) VALUES
('system_name', 'CLASSIC NET', 'GENERAL', 'System Branding Name'),
('slogan', 'Fast • Simple • Reliable Internet', 'GENERAL', 'Service Tagline'),
('support_phone', '0618781830', 'SUPPORT', 'Hotspot Customer Care Phone'),
('support_email', 'jacksonribent53@gmail.com', 'SUPPORT', 'Hotspot Customer Care Email'),
('currency', 'TSH', 'BILLING', 'Currency symbol or abbreviation'),
('azampay_mode', 'sandbox', 'PAYMENT', 'AzamPay Environment: sandbox or production'),
('mikrotik_host', '192.168.88.1', 'MIKROTIK', 'MikroTik Router IP Address'),
('mikrotik_port', '8728', 'MIKROTIK', 'MikroTik RouterOS API Port'),
('mikrotik_user', 'admin', 'MIKROTIK', 'MikroTik API Username'),
('sms_sender_name', 'CLASSIC NET', 'SMS', 'SMS Brand Identifier')
ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`);
