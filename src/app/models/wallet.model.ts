// src/app/models/wallet.model.ts
export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  qrCode: string;
  dailyLimit: number;
  monthlyLimit: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WalletStats {
  balance: number;
  totalBalance: number;
  totalReceived: number;
  totalSent: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalTransactions: number;
  totalFees: number;
  pendingBalance: number;
  currency: string;
  dailyLimit: number;
  monthlyLimit: number;
  todaySpent: number;
  monthSpent: number;
  remainingDailyLimit: number;
  remainingMonthlyLimit: number;
  recentTransactions: any[];
}

export interface Transaction {
  id: string;
  walletId?: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'payment' | 'mobile_money';
  amount: number;
  fee: number;
  totalAmount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description?: string;
  reference?: string;
  senderId?: string;
  receiverId?: string;
  senderWalletId?: string;
  receiverWalletId?: string;
  mobileMoneyOperator?: 'airtel' | 'orange' | 'mvola';
  mobileMoneyNumber?: string;
  paymentMethod?: 'wallet' | 'mobile_money' | 'bank_card';
  metadata?: any;
  createdAt: Date;
  updatedAt?: Date;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  receiver?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface SendMoneyRequest {
  receiverId: string;
  amount: number;
  description?: string;
  pin?: string;
}

export interface MobileMoneyRequest {
  operator: 'airtel' | 'orange' | 'mvola';
  phoneNumber: string;
  amount: number;
  pin?: string;
}

export interface ScanPayRequest {
  receiverQrCode: string;
  amount: number;
  description?: string;
  pin?: string;
}

export interface QRCodeResponse {
  qrCode: string;
  expiresAt: Date;
  data: any;
}