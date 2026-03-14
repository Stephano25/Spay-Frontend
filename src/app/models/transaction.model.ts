export interface Transaction {
  id: string;
  senderId: string;
  receiverId?: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'payment' | 'mobile_money';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  description?: string;
  createdAt: Date;
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