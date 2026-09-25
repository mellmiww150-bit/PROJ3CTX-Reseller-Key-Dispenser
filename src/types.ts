export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'SENIOR_RESELLER' | 'RESELLER' | 'MEMBER';

export interface UserAccount {
  id: string;
  username: string;
  passwordHash: string; // Plain/hashed for demo
  securityPin: string; // 6-digit confirmation PIN
  displayName: string;
  role: UserRole;
  sellerKey: string;
  balanceThb: number;
  totalDepositedThb: number;
  totalSpentThb: number;
  keysCreatedCount: number;
  isVerified: boolean;
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  secretToken: string;
  createdAt: string;
  lastLoginAt: string;
  avatarColor: string;
}

export type PlanDuration = '12HR' | '1DAY' | '3DAYS' | '7DAYS' | '14DAYS' | '15DAYS' | '30DAYS';

export interface ProductTier {
  id: string;
  name: string;
  code: string;
  duration: string;
  durationCategory: '1 Day' | '7 Days' | '15 Days' | '30 Days' | 'Special';
  priceThb: number;
  priceUsd: number;
  stock: number;
  description: string;
  badge?: string;
}

export interface LicenseKey {
  id: string;
  key: string;
  planName: string;
  durationLabel: string;
  status: 'ACTIVE' | 'BANNED';
  createdAt: string;
  expiresAt: string;
  hwid: string;
  hwidResetCount: number;
  lastIp: string;
  orderId?: string;
  dispensedByUserId: string; // User who generated the key
  dispensedByUsername: string; // Username
  clientCustomNote?: string;
}

export interface OrderRecord {
  id: string;
  orderNo: string;
  productName: string;
  quantity: number;
  totalPriceThb: number;
  keys: string[];
  status: 'สำเร็จ' | 'รอดำเนินการ' | 'ยกเลิก';
  createdAt: string;
  userId: string;
  username: string;
}

export interface TopUpTransaction {
  id: string;
  userId: string;
  username: string;
  method: 'truemoney' | 'promptpay_slip' | 'bank_transfer' | 'admin_adjustment';
  amountThb: number;
  reference: string;
  status: 'สำเร็จ' | 'รอดำเนินการ' | 'ปฏิเสธ';
  createdAt: string;
  details?: string;
  senderName?: string;
}

export interface ResellerProfile {
  username: string;
  sellerKey: string;
  isVerified: boolean;
  status: string;
  balanceThb: number;
  totalDepositedThb: number;
  totalSpentThb: number;
  keysCreatedCount: number;
  secretToken: string;
  pinConfigured: boolean;
  twoFactorEnabled: boolean;
}

export interface SlipVerificationResult {
  isValid: boolean;
  bankName: string;
  transferDateTime: string;
  senderName: string;
  receiverName: string;
  amount: number;
  transRef: string;
  qrDetected: boolean;
  confidence: number;
  message: string;
}

export interface BankAccountConfig {
  id: string;
  bankName: string;
  bankShortCode: 'KBANK' | 'SCB' | 'KTB' | 'BBL' | 'GSB' | 'TTB';
  accountName: string;
  accountNumber: string;
  badgeColor: string;
  isActive: boolean;
  type: string;
}

export interface SystemPaymentConfig {
  promptPayId: string;
  promptPayName: string;
  truemoneyMobile: string;
  truemoneyBotEnabled: boolean;
  slipBotEnabled: boolean;
  minDepositThb: number;
  antiDuplicateSlip: boolean;
  slipProvider?: 'AUTO_QR' | 'SLIPOK' | 'OPENSLIPVERIFY';
  slipOkApiKey?: string;
  slipOkBranchId?: string;
  truemoneyMode?: 'SMART_AUTO' | 'LIVE_DIRECT' | 'RELAY_PROXY';
  truemoneyProxyUrl?: string;
}
