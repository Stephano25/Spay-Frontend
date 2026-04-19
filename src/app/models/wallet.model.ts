// src/app/models/wallet.model.ts - Version simplifiée
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

// Ne pas redéfinir WalletStats ici - utiliser celui du service

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

export interface WalletStats {
  totalBalance: number;
  totalTransactions: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalTransfers: number;
  monthlyStats: {
    month: string;
    deposits: number;
    withdrawals: number;
    transfers: number;
    total: number;
  }[];
  recentTransactions: Transaction[];
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
}