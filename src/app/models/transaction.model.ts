// src/app/models/transaction.model.ts
export interface Transaction {
  id: string;
  senderId: string;
  receiverId?: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'payment' | 'mobile_money' | 'receive' | 'send';
  amount: number;
  fee?: number;
  totalAmount?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  description?: string;
  reference?: string;
  mobileMoneyOperator?: string;
  mobileMoneyNumber?: string;
  paymentMethod?: string;
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

export interface DashboardStats {
  totalBalance: number;
  totalTransactions: number;
  lastThreeTransactions: Transaction[];
  lastDeposit?: Transaction;
  largestTransaction?: Transaction;
  monthlyStats: { month: string; sent: number; received: number; total: number }[];
}