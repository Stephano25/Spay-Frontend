// frontend/src/app/models/transaction.model.ts
export interface Transaction {
  id: string;
  senderId: string;
  receiverId?: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'payment' | 'mobile_money' | 'receive' | 'send' | 'admin_withdrawal' | 'admin_deposit';
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
  
  // ✅ CHAMPS DE COMMISSION COMPLETS
  commission?: {
    total: number;
    superAdminCommission: number;
    adminCommission: number;
    superAdminId: string;
    adminId: string | null;
    type: 'user_transfer' | 'admin_withdrawal' | 'admin_deposit' | 'user_deposit';
    rate: number;
    breakdown: string;
  };
  commissionAmount?: number;
  commissionRate?: number;
  commissionReceiverId?: string;
  commissionReceiver?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  
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

// ✅ MODÈLE COMMISSION COMPLET
export interface Commission {
  id: string;
  transactionId: string;
  adminId: string;
  amount: number;
  rate: number;
  type: 'super_admin' | 'admin';
  sourceType: 'user_transfer' | 'admin_withdrawal' | 'admin_deposit' | 'user_deposit';
  sourceUserId?: string;
  sourceAdminId?: string;
  transactionAmount: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt?: Date;
  transaction?: Transaction;
  admin?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  userName?: string;
}

export interface CommissionStats {
  totalSuperAdminCommission: number;
  totalAdminCommission: number;
  totalCommissionTransactions: number;
  recentCommissions: Commission[];
  adminCommissions: {
    adminId: string;
    adminName: string;
    totalCommission: number;
    transactionCount: number;
    commissions: Commission[];
  }[];
  superAdminTotalCommission: number;
  myCommission?: number;
  myCommissionTransactions?: number;
  commissionRate?: number;
  userRole?: string;
}

export interface DashboardStats {
  totalBalance: number;
  totalTransactions: number;
  lastThreeTransactions: Transaction[];
  lastDeposit?: Transaction;
  largestTransaction?: Transaction;
  monthlyStats: { month: string; sent: number; received: number; total: number }[];
}