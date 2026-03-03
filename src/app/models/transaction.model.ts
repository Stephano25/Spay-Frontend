export interface Transaction {
  id: string;
  senderId: string;
  receiverId?: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'payment' | 'mobile_money';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  description?: string;
  createdAt: Date;
  mobileMoneyOperator?: string;
  mobileMoneyNumber?: string;
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
  monthlyStats: {
    month: string;
    sent: number;
    received: number;
    total: number;
  }[];
}

export interface TransactionStats {
  totalTransactions: number;
  totalVolume: number;
  averageAmount: number;
  transactionsByType: {
    type: string;
    count: number;
    volume: number;
  }[];
  dailyStats: {
    date: string;
    count: number;
    volume: number;
  }[];
}