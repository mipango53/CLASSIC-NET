export type NetworkCode = 'YAS' | 'AIRTEL' | 'VODACOM' | 'HALOTEL';

export interface Bundle {
  id: number;
  name: string;
  slug: string;
  price_tsh: number;
  duration_hours: number;
  duration_label: string;
  is_unlimited: boolean;
  speed_limit_up: string;
  speed_limit_down: string;
  badge_text: string;
  is_active: boolean;
  display_order: number;
}

export interface Customer {
  id: number;
  phone: string;
  network: NetworkCode;
  bundle: string;
  amount: number;
  status: 'ACTIVE' | 'EXPIRED';
  activation_time: string;
  expiry_time: string;
  mac: string;
  ip: string;
  txn_id: string;
}

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'EXPIRED';
export type ActivationStatus = 'PENDING' | 'ACTIVATED' | 'FAILED';

export interface Transaction {
  id: number;
  txn_id: string;
  phone: string;
  network: NetworkCode;
  bundle: string;
  amount: number;
  currency: string;
  provider: string;
  payment_status: PaymentStatus;
  azampay_ref: string;
  created_at: string;
  activation_status: ActivationStatus;
  activated_at?: string;
  expires_at?: string;
  failure_reason?: string;
}

export type VoucherStatus = 'UNUSED' | 'USED' | 'EXPIRED' | 'DISABLED';

export interface Voucher {
  id: number;
  code: string;
  bundle_id: number;
  bundle_name: string;
  price_tsh: number;
  duration_label: string;
  status: VoucherStatus;
  batch_reference: string;
  used_by_phone?: string;
  used_at?: string;
  expires_at?: string;
  created_at: string;
}

export interface MikroTikSession {
  user: string;
  address: string;
  mac_address: string;
  uptime: string;
  bytes_in: number;
  bytes_out: number;
  comment: string;
}

export interface RouterStatus {
  host: string;
  port: number;
  hotspot_server: string;
  status: string;
  model: string;
  routeros_version: string;
  cpu_load: string;
  free_memory: string;
  active_hotspot_users: number;
}

export interface DashboardMetrics {
  total_customers: number;
  active_customers: number;
  expired_customers: number;
  total_transactions: number;
  successful_payments: number;
  failed_payments: number;
  pending_payments: number;
  total_revenue: number;
  currency: string;
  active_vouchers: number;
  expired_vouchers: number;
}
